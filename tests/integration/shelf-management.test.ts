import type { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { AuthSession } from "@/features/auth/adapter";
import {
  listCreatorShelves,
  publishShelf,
  softDeleteShelf,
} from "@/features/shelves/actions";
import { createDatabase } from "@/lib/db/client";
import { migrate } from "@/lib/db/migrate";
import { seed } from "@/lib/db/seed";

const NOW = new Date("2026-06-24T13:00:00.000Z");

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

describe("creator shelf management", () => {
  let database: DatabaseSync;

  beforeEach(() => {
    database = createDatabase(":memory:");
    migrate(database);
    seed(database, { publicRoot: "/definitely/missing" });
  });

  afterEach(() => {
    database.close();
  });

  it("filters active shelves by status and searches case-insensitively", () => {
    const all = listCreatorShelves(database, creatorSession, {
      status: "ALL",
    });
    const drafts = listCreatorShelves(database, creatorSession, {
      status: "DRAFT",
    });
    const search = listCreatorShelves(database, creatorSession, {
      query: "ESSENTIALS",
      status: "ALL",
    });

    expect(all.ok && all.shelves.map((shelf) => shelf.id)).toEqual([
      "shelf-photography",
      "shelf-desk",
      "shelf-travel",
    ]);
    expect(drafts.ok && drafts.shelves.map((shelf) => shelf.id)).toEqual([
      "shelf-desk",
    ]);
    expect(search.ok && search.shelves.map((shelf) => shelf.title)).toEqual([
      "Travel Essentials",
    ]);
  });

  it("publishes drafts and soft-deletes shelves without exposing deleted records", () => {
    expect(
      publishShelf(database, { shelfId: "shelf-desk" }, creatorSession, {
        now: () => NOW,
      }),
    ).toEqual({ ok: true });
    expect(
      listCreatorShelves(database, creatorSession, { status: "DRAFT" }),
    ).toMatchObject({
      ok: true,
      shelves: [],
    });

    expect(
      softDeleteShelf(database, { shelfId: "shelf-desk" }, creatorSession, {
        now: () => NOW,
      }),
    ).toEqual({ ok: true });

    const afterDelete = listCreatorShelves(database, creatorSession, {
      status: "ALL",
    });
    expect(afterDelete.ok && afterDelete.shelves.map((shelf) => shelf.id)).not.toContain(
      "shelf-desk",
    );
    expect(
      (
        database
          .prepare("SELECT deleted_at AS deletedAt FROM shelves WHERE id = ?")
          .get("shelf-desk") as { deletedAt: string | null }
      ).deletedAt,
    ).toBe(NOW.toISOString());
  });

  it("rejects management actions for non-creator sessions", () => {
    const fanSession = {
      ...creatorSession,
      user: {
        ...creatorSession.user,
        id: "user-fan",
        role: "FAN" as const,
      },
    };

    expect(listCreatorShelves(database, fanSession, { status: "ALL" })).toEqual({
      ok: false,
      reason: "FORBIDDEN",
    });
    expect(
      publishShelf(database, { shelfId: "shelf-desk" }, fanSession),
    ).toEqual({
      ok: false,
      reason: "FORBIDDEN",
    });
  });
});
