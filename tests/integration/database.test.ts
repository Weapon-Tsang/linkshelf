import { afterEach, describe, expect, it } from "vitest";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createDatabase } from "@/lib/db/client";
import { migrate } from "@/lib/db/migrate";
import { seed } from "@/lib/db/seed";

describe("local database", () => {
  const databases: ReturnType<typeof createDatabase>[] = [];
  const temporaryDirectories: string[] = [];

  afterEach(() => {
    databases.splice(0).forEach((db) => db.close());
    temporaryDirectories.splice(0).forEach((directory) =>
      rmSync(directory, { force: true, recursive: true }),
    );
  });

  function createMigratedDatabase() {
    const db = createDatabase(":memory:");
    databases.push(db);
    migrate(db);
    return db;
  }

  it("migrates and seeds idempotently", () => {
    const db = createDatabase(":memory:");
    databases.push(db);
    migrate(db);
    seed(db);
    seed(db);
    const count = db.prepare("SELECT COUNT(*) AS count FROM users").get() as { count: number };
    expect(count.count).toBe(3);
  });

  it("creates file databases with production-safe pragmas", () => {
    const temporaryDirectory = mkdtempSync(join(tmpdir(), "linkshelf-database-"));
    temporaryDirectories.push(temporaryDirectory);
    const databasePath = join(temporaryDirectory, "nested", "linkshelf.db");

    const db = createDatabase(databasePath);
    databases.push(db);

    expect(existsSync(databasePath)).toBe(true);
    expect((db.prepare("PRAGMA foreign_keys").get() as { foreign_keys: number }).foreign_keys).toBe(1);
    expect((db.prepare("PRAGMA busy_timeout").get() as { timeout: number }).timeout).toBe(5_000);
    expect((db.prepare("PRAGMA journal_mode").get() as { journal_mode: string }).journal_mode).toBe(
      "wal",
    );
  });

  it("runs each schema migration once", () => {
    const db = createMigratedDatabase();
    migrate(db);

    const migrations = db
      .prepare("SELECT version, name FROM schema_migrations ORDER BY version")
      .all() as Array<{ version: number; name: string }>;
    const tables = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
      )
      .all()
      .map((row) => (row as { name: string }).name);

    expect(migrations).toEqual([{ version: 1, name: "initial_schema" }]);
    expect(tables).toEqual([
      "click_events",
      "comments",
      "creator_profiles",
      "products",
      "saves",
      "schema_migrations",
      "shares",
      "shelves",
      "social_channels",
      "users",
      "wallet_entries",
      "withdrawals",
    ]);
  });

  it("enables foreign keys and rejects orphaned relations", () => {
    const db = createMigratedDatabase();

    expect((db.prepare("PRAGMA foreign_keys").get() as { foreign_keys: number }).foreign_keys).toBe(1);
    expect(() =>
      db
        .prepare(
          `INSERT INTO shelves
            (id, creator_id, slug, title, description, category, status, theme, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          "shelf-orphan",
          "creator-missing",
          "orphan",
          "Orphan",
          "No creator",
          "Test",
          "DRAFT",
          "minimal",
          "2026-06-24T00:00:00.000Z",
          "2026-06-24T00:00:00.000Z",
        ),
    ).toThrow(/FOREIGN KEY constraint failed/);
  });

  it("enforces stable identity and public-link uniqueness", () => {
    const db = createMigratedDatabase();
    seed(db);

    expect(() =>
      db
        .prepare(
          `INSERT INTO users
            (id, google_subject, email, display_name, role, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          "user-duplicate-email",
          "google-new",
          "creator@linkshelf.local",
          "Duplicate",
          "FAN",
          "2026-06-24T00:00:00.000Z",
          "2026-06-24T00:00:00.000Z",
        ),
    ).toThrow(/UNIQUE constraint failed/);

    expect(() =>
      db
        .prepare(
          `INSERT INTO users
            (id, google_subject, email, display_name, role, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          "user-duplicate-subject",
          "google-fan",
          "new@linkshelf.local",
          "Duplicate",
          "FAN",
          "2026-06-24T00:00:00.000Z",
          "2026-06-24T00:00:00.000Z",
        ),
    ).toThrow(/UNIQUE constraint failed/);

    expect(() =>
      db
        .prepare(
          `INSERT INTO shelves
            (id, creator_id, slug, title, description, category, status, theme, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          "shelf-duplicate-slug",
          "creator-liam",
          "photography-kit",
          "Duplicate",
          "Duplicate slug",
          "Photography",
          "DRAFT",
          "minimal",
          "2026-06-24T00:00:00.000Z",
          "2026-06-24T00:00:00.000Z",
        ),
    ).toThrow(/UNIQUE constraint failed/);

    expect(() =>
      db
        .prepare(
          `INSERT INTO shares (id, shelf_id, fan_user_id, short_code, channel, created_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
        )
        .run(
          "share-duplicate-code",
          "shelf-photography",
          "user-fan",
          "jamie-photo",
          "COPY",
          "2026-06-24T00:00:00.000Z",
        ),
    ).toThrow(/UNIQUE constraint failed/);
  });

  it("seeds the approved shelf and engagement fixtures", () => {
    const db = createMigratedDatabase();
    seed(db);

    const shelves = db
      .prepare("SELECT id, title, status FROM shelves ORDER BY id")
      .all() as Array<{ id: string; title: string; status: string }>;
    const profile = db
      .prepare("SELECT handle, affiliate_tag, avatar_url, cover_url FROM creator_profiles")
      .get() as {
      handle: string;
      affiliate_tag: string;
      avatar_url: string;
      cover_url: string;
    };
    const channelCounts = db
      .prepare("SELECT enabled, COUNT(*) AS count FROM social_channels GROUP BY enabled ORDER BY enabled")
      .all() as Array<{ enabled: number; count: number }>;

    expect(shelves).toEqual([
      { id: "shelf-desk", title: "Desk Setup 2024", status: "DRAFT" },
      { id: "shelf-photography", title: "Photography Kit", status: "PUBLISHED" },
      { id: "shelf-travel", title: "Travel Essentials", status: "PUBLISHED" },
    ]);
    expect(profile).toMatchObject({
      handle: "liamroberts.photo",
      affiliate_tag: "liamcreator-20",
    });
    expect(profile.avatar_url).toMatch(/^\/stitch\/assets\//);
    expect(profile.cover_url).toMatch(/^\/stitch\/assets\//);
    expect(channelCounts).toEqual([
      { enabled: 0, count: 1 },
      { enabled: 1, count: 3 },
    ]);
    expect((db.prepare("SELECT COUNT(*) AS count FROM products").get() as { count: number }).count).toBe(
      7,
    );
    expect(
      (
        db
          .prepare(
            "SELECT COUNT(*) AS count FROM products WHERE destination_url NOT LIKE 'https://www.amazon.com/dp/%'",
          )
          .get() as { count: number }
      ).count,
    ).toBe(0);
  });

  it("seeds connected comments, attribution, wallet, and withdrawal records", () => {
    const db = createMigratedDatabase();
    seed(db);

    const relatedShelves = db
      .prepare(
        `SELECT shelves.title
         FROM shelves
         JOIN creator_profiles ON creator_profiles.id = shelves.creator_id
         WHERE creator_profiles.handle = ?
         ORDER BY shelves.title`,
      )
      .all("liamroberts.photo")
      .map((row) => (row as { title: string }).title);
    const reply = db
      .prepare(
        `SELECT reply.body, parent.body AS parent_body
         FROM comments AS reply
         JOIN comments AS parent ON parent.id = reply.parent_id
         WHERE reply.id = ?`,
      )
      .get("comment-creator-reply") as { body: string; parent_body: string };
    const beneficiaries = db
      .prepare("SELECT DISTINCT beneficiary FROM click_events ORDER BY beneficiary")
      .all()
      .map((row) => (row as { beneficiary: string }).beneficiary);
    const walletStatuses = db
      .prepare("SELECT DISTINCT status FROM wallet_entries ORDER BY status")
      .all()
      .map((row) => (row as { status: string }).status);

    expect(relatedShelves).toEqual(["Desk Setup 2024", "Photography Kit", "Travel Essentials"]);
    expect(reply.parent_body).toContain("camera");
    expect(reply.body).toContain("Jamie");
    expect(beneficiaries).toEqual(["CREATOR", "FAN", "PLATFORM"]);
    expect(walletStatuses).toEqual(["CLEARED", "PENDING"]);
    expect(
      (
        db
          .prepare("SELECT COUNT(*) AS count FROM withdrawals WHERE status = 'PENDING'")
          .get() as { count: number }
      ).count,
    ).toBeGreaterThanOrEqual(1);
    expect(
      (
        db
          .prepare(
            `SELECT COUNT(*) AS count
             FROM saves
             JOIN shares ON shares.fan_user_id = saves.user_id
             WHERE saves.user_id = 'user-fan'`,
          )
          .get() as { count: number }
      ).count,
    ).toBe(1);
  });

  it("rejects invalid roles, prices, and hotspot coordinates", () => {
    const db = createMigratedDatabase();
    seed(db);

    expect(() =>
      db
        .prepare(
          `INSERT INTO users
            (id, google_subject, email, display_name, role, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          "user-invalid-role",
          "google-invalid-role",
          "invalid@linkshelf.local",
          "Invalid",
          "OWNER",
          "2026-06-24T00:00:00.000Z",
          "2026-06-24T00:00:00.000Z",
        ),
    ).toThrow(/CHECK constraint failed/);

    expect(() =>
      db
        .prepare(
          `INSERT INTO products
            (id, shelf_id, title, description, price_cents, currency, merchant, destination_url,
             image_url, sort_position, hotspot_x, hotspot_y, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          "product-invalid",
          "shelf-photography",
          "Invalid",
          "Invalid price and hotspot",
          -1,
          "USD",
          "Amazon",
          "https://www.amazon.com/dp/B09JZT6YK5",
          "/stitch/assets/invalid.jpg",
          99,
          101,
          50,
          "2026-06-24T00:00:00.000Z",
          "2026-06-24T00:00:00.000Z",
        ),
    ).toThrow(/CHECK constraint failed/);
  });

  it("preserves audit and ledger records when content is soft-deleted", () => {
    const db = createMigratedDatabase();
    seed(db);

    db.prepare("UPDATE shelves SET deleted_at = ? WHERE id = ?").run(
      "2026-06-24T00:00:00.000Z",
      "shelf-photography",
    );

    expect((db.prepare("SELECT COUNT(*) AS count FROM click_events").get() as { count: number }).count).toBe(
      3,
    );
    expect((db.prepare("SELECT COUNT(*) AS count FROM wallet_entries").get() as { count: number }).count).toBe(
      4,
    );
    expect(() => db.prepare("DELETE FROM products WHERE id = ?").run("product-sony-a7iv")).toThrow(
      /FOREIGN KEY constraint failed/,
    );
  });
});
