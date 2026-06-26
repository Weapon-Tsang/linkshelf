import type { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { AuthSession } from "@/features/auth/adapter";
import { findAuthUserById } from "@/features/auth/adapter";
import {
  deleteCreatorAccount,
  replyToComment,
  saveCreatorProfile,
  saveCreatorTrackingId,
  setShareChannelEnabled,
  softDeleteComment,
} from "@/features/engagement/comment-actions";
import { createDatabase } from "@/lib/db/client";
import { migrate } from "@/lib/db/migrate";
import { seed } from "@/lib/db/seed";

const NOW = new Date("2026-06-24T15:00:00.000Z");

const creatorSession: AuthSession = {
  user: {
    id: "user-creator",
    googleSubject: "google-creator",
    email: "creator@linkshelf.local",
    displayName: "Liam Roberts",
    role: "CREATOR",
    avatarUrl: null,
  },
  issuedAt: NOW.getTime(),
  expiresAt: NOW.getTime() + 60_000,
};

describe("studio comment and settings actions", () => {
  let database: DatabaseSync;

  beforeEach(() => {
    database = createDatabase(":memory:");
    migrate(database);
    seed(database, { publicRoot: "/definitely/missing" });
  });

  afterEach(() => {
    database.close();
  });

  it("persists creator replies and soft-deletes owned comments", () => {
    expect(
      replyToComment(
        database,
        { commentId: "comment-jamie-camera", body: "Glad it helped!" },
        creatorSession,
        { createId: () => "comment-reply-new", now: () => NOW },
      ),
    ).toEqual({ ok: true, commentId: "comment-reply-new" });
    expect(
      (
        database
          .prepare("SELECT body, parent_id AS parentId FROM comments WHERE id = ?")
          .get("comment-reply-new") as { body: string; parentId: string }
      ),
    ).toEqual({ body: "Glad it helped!", parentId: "comment-jamie-camera" });

    expect(
      softDeleteComment(database, { commentId: "comment-jamie-camera" }, creatorSession, {
        now: () => NOW,
      }),
    ).toEqual({ ok: true });
    expect(
      (
        database
          .prepare("SELECT status, deleted_at AS deletedAt FROM comments WHERE id = ?")
          .get("comment-jamie-camera") as { status: string; deletedAt: string | null }
      ),
    ).toEqual({ status: "HIDDEN", deletedAt: NOW.toISOString() });
  });

  it("saves profile, simulated tracking ID, and share channel toggles", () => {
    expect(
      saveCreatorProfile(
        database,
        {
          displayName: "Liam R.",
          bio: "Gear, field notes, and behind-the-scenes kits.",
          category: "Cameras",
        },
        creatorSession,
        { now: () => NOW },
      ),
    ).toEqual({ ok: true });
    expect(
      saveCreatorTrackingId(
        database,
        { affiliateTag: "liam-demo-20" },
        creatorSession,
        { now: () => NOW },
      ),
    ).toEqual({ ok: true });
    expect(
      setShareChannelEnabled(
        database,
        { type: "FACEBOOK", enabled: true },
        creatorSession,
        { now: () => NOW },
      ),
    ).toEqual({ ok: true });

    expect(
      database
        .prepare(
          `SELECT display_name AS displayName, bio, category, affiliate_tag AS affiliateTag
           FROM creator_profiles WHERE id = ?`,
        )
        .get("creator-liam"),
    ).toMatchObject({
      displayName: "Liam R.",
      bio: "Gear, field notes, and behind-the-scenes kits.",
      category: "Cameras",
      affiliateTag: "liam-demo-20",
    });
    expect(
      (
        database
          .prepare("SELECT enabled FROM social_channels WHERE type = ? AND creator_id = ?")
          .get("FACEBOOK", "creator-liam") as { enabled: number | bigint }
      ).enabled,
    ).toBe(1);
  });

  it("soft-deletes a confirmed creator account so future auth cannot resolve it", () => {
    expect(
      deleteCreatorAccount(database, { confirmation: "not yet" }, creatorSession, {
        now: () => NOW,
      }),
    ).toEqual({ ok: false, reason: "CONFIRMATION_REQUIRED" });

    expect(
      deleteCreatorAccount(database, { confirmation: "DELETE" }, creatorSession, {
        now: () => NOW,
      }),
    ).toEqual({ ok: true });
    expect(findAuthUserById(database, "user-creator")).toBeNull();
  });
});
