import type { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { AuthSession } from "@/features/auth/adapter";
import { addComment, createShare, toggleSave } from "@/features/engagement/actions";
import { resumeCreatorEngagement, resumeShelfEngagement } from "@/features/engagement/resume";
import { createDatabase } from "@/lib/db/client";
import { migrate } from "@/lib/db/migrate";
import { seed } from "@/lib/db/seed";

const NOW = new Date("2026-06-24T12:00:00.000Z");

const fanSession: AuthSession = {
  user: {
    id: "user-fan",
    googleSubject: "google-fan",
    email: "fan@linkshelf.local",
    displayName: "Jamie Chen",
    role: "FAN",
    avatarUrl: null,
  },
  issuedAt: NOW.getTime(),
  expiresAt: NOW.getTime() + 60_000,
};

describe("engagement actions", () => {
  let database: DatabaseSync;

  beforeEach(() => {
    database = createDatabase(":memory:");
    migrate(database);
    seed(database, { publicRoot: "/definitely/missing" });
  });

  afterEach(() => {
    database.close();
  });

  it("creates a fan share only for enabled creator channels", () => {
    const result = createShare(
      database,
      {
        shelfId: "shelf-photography",
        channel: "X",
      },
      fanSession,
      {
        createId: () => "share-test",
        createShortCode: () => "fan-photo",
        now: () => NOW,
      },
    );

    expect(result).toEqual({
      ok: true,
      share: {
        id: "share-test",
        shelfId: "shelf-photography",
        fanUserId: "user-fan",
        shortCode: "fan-photo",
        channel: "X",
        shareUrl: "/liamroberts.photo/photography-kit?share=fan-photo",
      },
    });
    expect(
      (
        database
          .prepare("SELECT COUNT(*) AS count FROM shares WHERE id = ?")
          .get("share-test") as { count: number }
      ).count,
    ).toBe(1);

    expect(
      createShare(database, { shelfId: "shelf-photography", channel: "FACEBOOK" }, fanSession),
    ).toEqual({
      ok: false,
      reason: "CHANNEL_DISABLED",
    });
  });

  it("requires a typed session for share, save, and comment actions", () => {
    expect(createShare(database, { shelfId: "shelf-photography", channel: "X" }, null)).toEqual({
      ok: false,
      reason: "UNAUTHENTICATED",
    });
    expect(
      toggleSave(database, { targetType: "SHELF", targetId: "shelf-photography" }, null),
    ).toEqual({
      ok: false,
      reason: "UNAUTHENTICATED",
    });
    expect(addComment(database, { shelfId: "shelf-photography", body: "Love this" }, null)).toEqual({
      ok: false,
      reason: "UNAUTHENTICATED",
    });
  });

  it("saves shelves idempotently and can remove the save", () => {
    const saved = toggleSave(
      database,
      {
        targetType: "SHELF",
        targetId: "shelf-travel",
        saved: true,
      },
      fanSession,
      { createId: () => "save-travel", now: () => NOW },
    );
    const savedAgain = toggleSave(
      database,
      {
        targetType: "SHELF",
        targetId: "shelf-travel",
        saved: true,
      },
      fanSession,
      { createId: () => "save-travel-again", now: () => NOW },
    );

    expect(saved).toEqual({ ok: true, saved: true });
    expect(savedAgain).toEqual({ ok: true, saved: true });
    expect(
      (
        database
          .prepare(
            "SELECT COUNT(*) AS count FROM saves WHERE user_id = ? AND target_type = ? AND target_id = ?",
          )
          .get("user-fan", "SHELF", "shelf-travel") as { count: number }
      ).count,
    ).toBe(1);

    expect(
      toggleSave(
        database,
        {
          targetType: "SHELF",
          targetId: "shelf-travel",
          saved: false,
        },
        fanSession,
      ),
    ).toEqual({ ok: true, saved: false });
  });

  it("adds visible comments with trimmed bodies and validates public shelves", () => {
    expect(
      addComment(
        database,
        {
          shelfId: "shelf-photography",
          body: "  This helped my kit a lot.  ",
        },
        fanSession,
        {
          createId: () => "comment-test",
          now: () => NOW,
        },
      ),
    ).toEqual({
      ok: true,
      comment: {
        id: "comment-test",
        shelfId: "shelf-photography",
        userId: "user-fan",
        parentId: null,
        body: "This helped my kit a lot.",
        status: "VISIBLE",
      },
    });
    expect(
      addComment(database, { shelfId: "shelf-desk", body: "Draft?" }, fanSession),
    ).toEqual({
      ok: false,
      reason: "NOT_FOUND",
    });
    expect(addComment(database, { shelfId: "shelf-photography", body: " " }, fanSession)).toEqual({
      ok: false,
      reason: "INVALID_INPUT",
    });
  });

  it("executes resumable shelf share and save actions after Google login", () => {
    const shared = resumeShelfEngagement(
      database,
      {
        resume: "share",
        channel: "X",
        shelfId: "shelf-photography",
        session: fanSession,
      },
      {
        createId: () => "share-resume",
        createShortCode: () => "resume-photo",
        now: () => NOW,
      },
    );

    expect(shared).toEqual({
      completed: true,
      kind: "share",
      shareCode: "resume-photo",
    });
    expect(
      (
        database
          .prepare("SELECT channel FROM shares WHERE id = ?")
          .get("share-resume") as { channel: string }
      ).channel,
    ).toBe("X");

    expect(
      resumeShelfEngagement(database, {
        resume: "save",
        shelfId: "shelf-travel",
        session: fanSession,
      }),
    ).toEqual({
      completed: true,
      kind: "save",
    });
  });

  it("executes creator save resume and ignores ambiguous resume params", () => {
    expect(
      resumeCreatorEngagement(database, {
        resume: "save",
        creatorId: "creator-liam",
        session: fanSession,
      }),
    ).toEqual({
      completed: true,
      kind: "save",
    });
    expect(
      resumeShelfEngagement(database, {
        resume: ["share", "save"],
        shelfId: "shelf-photography",
        session: fanSession,
      }),
    ).toEqual({
      completed: false,
      kind: "none",
    });
    expect(
      resumeShelfEngagement(database, {
        resume: "share",
        channel: "FACEBOOK",
        shelfId: "shelf-photography",
        session: fanSession,
      }),
    ).toEqual({
      completed: false,
      kind: "none",
    });
  });
});
