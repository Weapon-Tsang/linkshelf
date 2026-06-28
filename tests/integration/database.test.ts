import { afterEach, describe, expect, it } from "vitest";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createDatabase } from "@/lib/db/client";
import { migrate } from "@/lib/db/migrate";
import { schemaMigrations } from "@/lib/db/schema";
import { seed, STITCH_ASSET_SOURCES } from "@/lib/db/seed";

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

  function createTemporaryPublicRoot() {
    const root = mkdtempSync(join(tmpdir(), "linkshelf-public-"));
    temporaryDirectories.push(root);
    return root;
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

  it("refreshes deterministic Fan Hub seed values in existing local databases", () => {
    const db = createDatabase(":memory:");
    databases.push(db);
    migrate(db);
    seed(db);

    db.prepare("UPDATE wallet_entries SET amount_cents = 1599 WHERE id = ?").run("wallet-fan-pending");
    db.prepare("UPDATE wallet_entries SET created_at = ?, cleared_at = ? WHERE id = ?").run(
      "2026-06-24T10:00:01.000Z",
      "2026-06-24T10:00:01.000Z",
      "wallet-fan-tech",
    );

    seed(db);

    expect(
      (
        db
          .prepare("SELECT amount_cents AS amountCents FROM wallet_entries WHERE id = ?")
          .get("wallet-fan-pending") as { amountCents: number }
      ).amountCents,
    ).toBe(1_230);
    expect(
      (
        db
          .prepare("SELECT created_at AS createdAt, cleared_at AS clearedAt FROM wallet_entries WHERE id = ?")
          .get("wallet-fan-tech") as { createdAt: string; clearedAt: string }
      ),
    ).toEqual({
      createdAt: "2023-10-24T10:00:01.000Z",
      clearedAt: "2023-10-24T10:00:01.000Z",
    });
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

    expect(migrations).toEqual([
      { version: 1, name: "initial_schema" },
      { version: 2, name: "enforce_data_invariants" },
      { version: 3, name: "soft_delete_users" },
      { version: 4, name: "soft_delete_products" },
      { version: 5, name: "admin_settings" },
    ]);
    expect(tables).toEqual([
      "admin_settings",
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
    seed(db, { publicRoot: createTemporaryPublicRoot() });

    const shelves = db
      .prepare("SELECT id, title, status FROM shelves ORDER BY id")
      .all() as Array<{ id: string; title: string; status: string }>;
    const profile = db
      .prepare("SELECT handle, affiliate_tag, avatar_url, cover_url FROM creator_profiles")
      .get() as {
      handle: string;
      affiliate_tag: string;
      avatar_url: string | null;
      cover_url: string | null;
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
    expect(profile.avatar_url).toBeNull();
    expect(profile.cover_url).toBeNull();
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
            `SELECT
               COUNT(DISTINCT saves.id) AS save_count,
               COUNT(DISTINCT shares.id) AS share_count
             FROM saves
             JOIN shares ON shares.fan_user_id = saves.user_id
             WHERE saves.user_id = 'user-fan'`,
          )
          .get() as { save_count: number; share_count: number }
      ),
    ).toEqual({ save_count: 2, share_count: 2 });
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
      8,
    );
    expect(() => db.prepare("DELETE FROM products WHERE id = ?").run("product-sony-a7iv")).toThrow(
      /FOREIGN KEY constraint failed/,
    );
  });

  it("stores every domain table in strict mode with non-null text IDs", () => {
    const db = createMigratedDatabase();
    const domainTables = [
      "users",
      "creator_profiles",
      "shelves",
      "products",
      "social_channels",
      "saves",
      "comments",
      "shares",
      "click_events",
      "wallet_entries",
      "withdrawals",
    ];
    const strictTables = new Map(
      (db.prepare("PRAGMA table_list").all() as Array<{ name: string; strict: number }>).map((row) => [
        row.name,
        row.strict,
      ]),
    );

    for (const table of domainTables) {
      const id = db
        .prepare(`PRAGMA table_info(${table})`)
        .all()
        .find((row) => (row as { name: string }).name === "id") as {
        notnull: number;
        type: string;
      };
      expect(strictTables.get(table), table).toBe(1);
      expect(id, table).toMatchObject({ notnull: 1, type: "TEXT" });
    }

    expect(() =>
      db
        .prepare(
          `INSERT INTO users
            (id, google_subject, email, display_name, role, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          null,
          "google-null-id",
          "null-id@linkshelf.local",
          "Null ID",
          "FAN",
          "2026-06-24T00:00:00.000Z",
          "2026-06-24T00:00:00.000Z",
        ),
    ).toThrow(/NOT NULL constraint failed/);
  });

  it("rejects fractional and text money values plus non-integer positions", () => {
    const db = createMigratedDatabase();
    seed(db);
    const insertProduct = db.prepare(
      `INSERT INTO products
        (id, shelf_id, title, description, price_cents, currency, merchant, destination_url,
         image_url, sort_position, hotspot_x, hotspot_y, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );

    expect(() =>
      insertProduct.run(
        "product-fractional-cents",
        "shelf-travel",
        "Fractional cents",
        "Invalid fractional cents",
        10.5,
        "USD",
        "Amazon",
        "https://www.amazon.com/dp/B09XS7JWHH",
        null,
        10,
        null,
        null,
        "2026-06-24T00:00:00.000Z",
        "2026-06-24T00:00:00.000Z",
      ),
    ).toThrow(/CHECK constraint failed/);

    expect(() =>
      insertProduct.run(
        "product-text-cents",
        "shelf-travel",
        "Text cents",
        "Invalid text cents",
        "100",
        "USD",
        "Amazon",
        "https://www.amazon.com/dp/B09XS7JWHH",
        null,
        10,
        null,
        null,
        "2026-06-24T00:00:00.000Z",
        "2026-06-24T00:00:00.000Z",
      ),
    ).toThrow(/CHECK constraint failed/);

    expect(() =>
      insertProduct.run(
        "product-fractional-position",
        "shelf-travel",
        "Fractional position",
        "Invalid position and hotspot",
        100,
        "USD",
        "Amazon",
        "https://www.amazon.com/dp/B09XS7JWHH",
        null,
        10.5,
        null,
        null,
        "2026-06-24T00:00:00.000Z",
        "2026-06-24T00:00:00.000Z",
      ),
    ).toThrow(/CHECK constraint failed/);

    insertProduct.run(
      "product-fractional-hotspot",
      "shelf-travel",
      "Fractional hotspot",
      "Valid fractional coordinates",
      BigInt(100),
      "USD",
      "Amazon",
      "https://www.amazon.com/dp/B09XS7JWHH",
      null,
      BigInt(10),
      10.5,
      20.25,
      "2026-06-24T00:00:00.000Z",
      "2026-06-24T00:00:00.000Z",
    );
    expect(
      db
        .prepare("SELECT hotspot_x, hotspot_y FROM products WHERE id = ?")
        .get("product-fractional-hotspot"),
    ).toEqual({ hotspot_x: 10.5, hotspot_y: 20.25 });

    expect(() =>
      db
        .prepare(
          `INSERT INTO wallet_entries
            (id, user_id, click_event_id, amount_cents, type, status, description, created_at,
             cleared_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          "wallet-text-cents",
          "user-fan",
          null,
          "500",
          "ADJUSTMENT",
          "PENDING",
          "Text money",
          "2026-06-24T00:00:00.000Z",
          null,
        ),
    ).toThrow(/CHECK constraint failed/);
  });

  it("enforces click product, shelf, share, and fan attribution consistency", () => {
    const db = createMigratedDatabase();
    seed(db);
    const insertClick = db.prepare(
      `INSERT INTO click_events
        (id, product_id, shelf_id, share_id, beneficiary, affiliate_tag, destination_url, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    );

    expect(() =>
      insertClick.run(
        "click-wrong-product-shelf",
        "product-sony-a7iv",
        "shelf-travel",
        null,
        "CREATOR",
        "liamcreator-20",
        "https://www.amazon.com/dp/B09JZT6YK5?tag=liamcreator-20",
        "2026-06-24T00:00:00.000Z",
      ),
    ).toThrow(/product must belong to click shelf/);

    expect(() =>
      insertClick.run(
        "click-wrong-share-shelf",
        "product-headphones",
        "shelf-travel",
        "share-jamie-photography",
        "FAN",
        "fan-demo-20",
        "https://www.amazon.com/dp/B09XS7JWHH?tag=fan-demo-20",
        "2026-06-24T00:00:00.000Z",
      ),
    ).toThrow(/share must belong to click shelf/);

    expect(() =>
      insertClick.run(
        "click-fan-without-share",
        "product-headphones",
        "shelf-travel",
        null,
        "FAN",
        "fan-demo-20",
        "https://www.amazon.com/dp/B09XS7JWHH?tag=fan-demo-20",
        "2026-06-24T00:00:00.000Z",
      ),
    ).toThrow(/fan beneficiary requires a share/);

    expect(() =>
      db.prepare("UPDATE click_events SET shelf_id = ? WHERE id = ?").run(
        "shelf-travel",
        "click-fan",
      ),
    ).toThrow(/product must belong to click shelf/);
  });

  it("enforces wallet and withdrawal state timestamps on insert and update", () => {
    const db = createMigratedDatabase();
    seed(db);

    expect(() =>
      db
        .prepare(
          `INSERT INTO wallet_entries
            (id, user_id, amount_cents, type, status, description, created_at, cleared_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          "wallet-cleared-without-time",
          "user-fan",
          100,
          "ADJUSTMENT",
          "CLEARED",
          "Invalid cleared state",
          "2026-06-24T00:00:00.000Z",
          null,
        ),
    ).toThrow(/CHECK constraint failed/);
    expect(() =>
      db.prepare("UPDATE wallet_entries SET cleared_at = ? WHERE id = ?").run(
        "2026-06-24T00:00:00.000Z",
        "wallet-fan-pending",
      ),
    ).toThrow(/CHECK constraint failed/);

    expect(() =>
      db
        .prepare(
          `INSERT INTO withdrawals
            (id, user_id, amount_cents, destination_label, status, reviewer_id, created_at,
             updated_at, reviewed_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          "withdrawal-approved-without-review",
          "user-fan",
          100,
          "Test destination",
          "APPROVED",
          null,
          "2026-06-24T00:00:00.000Z",
          "2026-06-24T00:00:00.000Z",
          null,
        ),
    ).toThrow(/CHECK constraint failed/);
    expect(() =>
      db.prepare("UPDATE withdrawals SET reviewer_id = ? WHERE id = ?").run(
        "user-admin",
        "withdrawal-jamie-pending",
      ),
    ).toThrow(/CHECK constraint failed/);
  });

  it("uses only localized manifest assets that exist and fills them on a later seed", () => {
    const db = createMigratedDatabase();
    const publicRoot = createTemporaryPublicRoot();
    seed(db, { publicRoot });
    db.exec(`
      UPDATE creator_profiles
        SET avatar_url = 'https://cdn.example.com/custom-avatar.png'
        WHERE id = 'creator-liam';
      UPDATE shelves
        SET cover_url = 'https://cdn.example.com/custom-shelf.png'
        WHERE id = 'shelf-photography';
      UPDATE products
        SET image_url = 'https://cdn.example.com/custom-product.png'
        WHERE id = 'product-sony-a7iv';
    `);
    const manifestDirectory = join(publicRoot, "stitch");
    const assetsDirectory = join(manifestDirectory, "assets");
    mkdirSync(assetsDirectory, { recursive: true });
    const manifest = Object.fromEntries(
      Object.values(STITCH_ASSET_SOURCES).map((source, index) => {
        const publicPath = `/stitch/assets/${index.toString(16).padStart(64, "0")}.png`;
        writeFileSync(join(publicRoot, publicPath), Buffer.from([index]));
        return [source, publicPath];
      }),
    );
    writeFileSync(join(manifestDirectory, "asset-manifest.json"), JSON.stringify(manifest));

    seed(db, { publicRoot });

    const mediaPaths = [
      ...(db.prepare("SELECT avatar_url, cover_url FROM creator_profiles").all() as Array<{
        avatar_url: string | null;
        cover_url: string | null;
      }>).flatMap((row) => [row.avatar_url, row.cover_url]),
      ...(db.prepare("SELECT cover_url FROM shelves").all() as Array<{ cover_url: string | null }>).map(
        (row) => row.cover_url,
      ),
      ...(db.prepare("SELECT image_url FROM products").all() as Array<{ image_url: string | null }>).map(
        (row) => row.image_url,
      ),
    ].filter((path): path is string => path !== null);

    const localizedPaths = mediaPaths.filter((path) => path.startsWith("/stitch/assets/"));
    expect(mediaPaths).toEqual(
      expect.arrayContaining([
        "https://cdn.example.com/custom-avatar.png",
        "https://cdn.example.com/custom-shelf.png",
        "https://cdn.example.com/custom-product.png",
      ]),
    );
    expect(localizedPaths).toHaveLength(9);
    expect(localizedPaths.every((path) => Object.values(manifest).includes(path))).toBe(true);
    expect(localizedPaths.every((path) => existsSync(join(publicRoot, path)))).toBe(true);
  });

  it("stores null media when the asset manifest is unavailable", () => {
    const db = createMigratedDatabase();
    seed(db, { publicRoot: createTemporaryPublicRoot() });

    expect(
      (
        db
          .prepare(
            `SELECT
               (SELECT COUNT(*) FROM users WHERE avatar_url IS NOT NULL) +
               (SELECT COUNT(*) FROM creator_profiles WHERE avatar_url IS NOT NULL OR cover_url IS NOT NULL) +
               (SELECT COUNT(*) FROM shelves WHERE cover_url IS NOT NULL) +
               (SELECT COUNT(*) FROM products WHERE image_url IS NOT NULL) AS count`,
          )
          .get() as { count: number }
      ).count,
    ).toBe(0);
  });

  it("does not clear custom media when the asset manifest is unavailable", () => {
    const db = createMigratedDatabase();
    const publicRoot = createTemporaryPublicRoot();
    seed(db, { publicRoot });
    db.exec(`
      UPDATE users SET avatar_url = 'https://cdn.example.com/user.png' WHERE id = 'user-creator';
      UPDATE creator_profiles
        SET avatar_url = 'https://cdn.example.com/profile.png',
            cover_url = 'https://cdn.example.com/profile-cover.png'
        WHERE id = 'creator-liam';
      UPDATE shelves
        SET cover_url = 'https://cdn.example.com/shelf.png'
        WHERE id = 'shelf-photography';
      UPDATE products
        SET image_url = 'https://cdn.example.com/product.png'
        WHERE id = 'product-sony-a7iv';
    `);

    seed(db, { publicRoot });

    expect(db.prepare("SELECT avatar_url FROM users WHERE id = 'user-creator'").get()).toEqual({
      avatar_url: "https://cdn.example.com/user.png",
    });
    expect(
      db.prepare("SELECT avatar_url, cover_url FROM creator_profiles WHERE id = 'creator-liam'").get(),
    ).toEqual({
      avatar_url: "https://cdn.example.com/profile.png",
      cover_url: "https://cdn.example.com/profile-cover.png",
    });
    expect(db.prepare("SELECT cover_url FROM shelves WHERE id = 'shelf-photography'").get()).toEqual({
      cover_url: "https://cdn.example.com/shelf.png",
    });
    expect(db.prepare("SELECT image_url FROM products WHERE id = 'product-sony-a7iv'").get()).toEqual({
      image_url: "https://cdn.example.com/product.png",
    });
  });

  it("rolls back a failed migration without recording or leaking partial schema", () => {
    const db = createDatabase(":memory:");
    databases.push(db);
    db.exec(`
      CREATE TABLE schema_migrations (
        version INTEGER PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        applied_at TEXT NOT NULL
      );
      ${schemaMigrations[0].sql}
      INSERT INTO schema_migrations VALUES (1, 'initial_schema', '2026-06-24T00:00:00.000Z');
      INSERT INTO users VALUES
        ('user-legacy', 'google-legacy', 'legacy@linkshelf.local', 'Legacy', 'CREATOR', NULL, NULL,
         '2026-06-24T00:00:00.000Z', '2026-06-24T00:00:00.000Z');
      INSERT INTO creator_profiles VALUES
        ('creator-legacy', 'user-legacy', 'legacy', 'Legacy', 'Legacy profile', 'Test',
         '/broken-avatar.jpg', '/broken-cover.jpg', 'legacy-20',
         '2026-06-24T00:00:00.000Z', '2026-06-24T00:00:00.000Z');
      INSERT INTO shelves VALUES
        ('shelf-legacy', 'creator-legacy', 'legacy', 'Legacy', 'Legacy shelf', 'Test', 'DRAFT',
         'minimal', NULL, '/broken-shelf.jpg', '2026-06-24T00:00:00.000Z',
         '2026-06-24T00:00:00.000Z', NULL);
      INSERT INTO products VALUES
        ('product-legacy', 'shelf-legacy', 'Legacy', 'Legacy product', 10.5, 'USD', 'Amazon',
         'https://www.amazon.com/dp/B09JZT6YK5', '/broken-product.jpg', 0, NULL, NULL,
         '2026-06-24T00:00:00.000Z', '2026-06-24T00:00:00.000Z');
    `);

    expect(() => migrate(db)).toThrow(/CHECK constraint failed/);
    expect(
      db.prepare("SELECT version, name FROM schema_migrations").all(),
    ).toEqual([{ version: 1, name: "initial_schema" }]);
    expect(
      (db.prepare("SELECT price_cents FROM products WHERE id = 'product-legacy'").get() as {
        price_cents: number;
      }).price_cents,
    ).toBe(10.5);
    expect(
      (
        db
          .prepare("SELECT COUNT(*) AS count FROM sqlite_master WHERE name LIKE '%_v2'")
          .get() as { count: number }
      ).count,
    ).toBe(0);
  });

  it("upgrades populated v1 audit records without losing relationships", () => {
    const db = createDatabase(":memory:");
    databases.push(db);
    db.exec(`
      CREATE TABLE schema_migrations (
        version INTEGER PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        applied_at TEXT NOT NULL
      );
      ${schemaMigrations[0].sql}
      INSERT INTO schema_migrations VALUES (1, 'initial_schema', '2026-06-24T00:00:00.000Z');
      INSERT INTO users VALUES
        ('user-v1-creator', 'google-v1-creator', 'v1-creator@linkshelf.local', 'Creator', 'CREATOR',
         NULL, NULL, '2026-06-24T00:00:00.000Z', '2026-06-24T00:00:00.000Z'),
        ('user-v1-fan', 'google-v1-fan', 'v1-fan@linkshelf.local', 'Fan', 'FAN', NULL,
         'fan-20', '2026-06-24T00:00:00.000Z', '2026-06-24T00:00:00.000Z'),
        ('user-v1-admin', 'google-v1-admin', 'v1-admin@linkshelf.local', 'Admin', 'ADMIN',
         NULL, NULL, '2026-06-24T00:00:00.000Z', '2026-06-24T00:00:00.000Z');
      INSERT INTO creator_profiles VALUES
        ('creator-v1', 'user-v1-creator', 'v1creator', 'Creator', 'Bio', 'Test',
         '/legacy-avatar.jpg', '/legacy-cover.jpg', 'creator-20',
         '2026-06-24T00:00:00.000Z', '2026-06-24T00:00:00.000Z');
      INSERT INTO shelves VALUES
        ('shelf-v1', 'creator-v1', 'v1', 'V1', 'V1 shelf', 'Test', 'PUBLISHED', 'minimal',
         NULL, '/legacy-shelf.jpg', '2026-06-24T00:00:00.000Z',
         '2026-06-24T00:00:00.000Z', NULL);
      INSERT INTO products VALUES
        ('product-v1', 'shelf-v1', 'V1 product', 'Product', 100, 'USD', 'Amazon',
         'https://www.amazon.com/dp/B09JZT6YK5', '/legacy-product.jpg', 0, 10.5, 20.25,
         '2026-06-24T00:00:00.000Z', '2026-06-24T00:00:00.000Z');
      INSERT INTO social_channels VALUES
        ('channel-v1', 'creator-v1', 'X', '@v1', 1, 0, '2026-06-24T00:00:00.000Z',
         '2026-06-24T00:00:00.000Z');
      INSERT INTO saves VALUES
        ('save-v1', 'user-v1-fan', 'SHELF', 'shelf-v1', '2026-06-24T00:00:00.000Z');
      INSERT INTO comments VALUES
        ('comment-v1', 'shelf-v1', 'user-v1-fan', NULL, 'V1 comment', 'VISIBLE',
         '2026-06-24T00:00:00.000Z', '2026-06-24T00:00:00.000Z', NULL);
      INSERT INTO shares VALUES
        ('share-v1', 'shelf-v1', 'user-v1-fan', 'v1-share', 'X',
         '2026-06-24T00:00:00.000Z');
      INSERT INTO click_events VALUES
        ('click-v1', 'product-v1', 'shelf-v1', 'share-v1', 'FAN', 'fan-20',
         'https://www.amazon.com/dp/B09JZT6YK5?tag=fan-20', NULL,
         '2026-06-24T00:00:00.000Z');
      INSERT INTO wallet_entries VALUES
        ('wallet-v1', 'user-v1-fan', 'click-v1', 80, 'AFFILIATE_EARNING', 'CLEARED',
         'V1 earning', '2026-06-24T00:00:00.000Z', '2026-06-24T01:00:00.000Z');
      INSERT INTO withdrawals VALUES
        ('withdrawal-v1', 'user-v1-fan', 50, 'Test', 'APPROVED', 'user-v1-admin',
         '2026-06-24T00:00:00.000Z', '2026-06-24T01:00:00.000Z',
         '2026-06-24T01:00:00.000Z');
    `);

    migrate(db);

    expect(db.prepare("PRAGMA foreign_key_check").all()).toEqual([]);
    expect(db.prepare("SELECT id FROM click_events").all()).toEqual([{ id: "click-v1" }]);
    expect(db.prepare("SELECT click_event_id FROM wallet_entries").all()).toEqual([
      { click_event_id: "click-v1" },
    ]);
    expect(db.prepare("SELECT reviewer_id FROM withdrawals").all()).toEqual([
      { reviewer_id: "user-v1-admin" },
    ]);
    expect(db.prepare("SELECT hotspot_x, hotspot_y FROM products WHERE id = 'product-v1'").get()).toEqual({
      hotspot_x: 10.5,
      hotspot_y: 20.25,
    });
  });

  it.each([
    {
      beneficiary: "CREATOR",
      expected: /product must belong to click shelf/,
      label: "a product from another shelf",
      productId: "product-v1-a",
      shareId: null,
      shelfId: "shelf-v1-b",
    },
    {
      beneficiary: "CREATOR",
      expected: /share must belong to click shelf/,
      label: "a share from another shelf",
      productId: "product-v1-b",
      shareId: "share-v1-a",
      shelfId: "shelf-v1-b",
    },
    {
      beneficiary: "FAN",
      expected: /fan beneficiary requires a share/,
      label: "a fan beneficiary without a share",
      productId: "product-v1-b",
      shareId: null,
      shelfId: "shelf-v1-b",
    },
  ])("rolls back v2 when v1 attribution contains $label", (invalidClick) => {
    const db = createDatabase(":memory:");
    databases.push(db);
    db.exec(`
      CREATE TABLE schema_migrations (
        version INTEGER PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        applied_at TEXT NOT NULL
      );
      ${schemaMigrations[0].sql}
      INSERT INTO schema_migrations VALUES (1, 'initial_schema', '2026-06-24T00:00:00.000Z');
      INSERT INTO users VALUES
        ('user-v1-creator', 'google-v1-creator', 'v1-creator@linkshelf.local', 'Creator', 'CREATOR',
         NULL, NULL, '2026-06-24T00:00:00.000Z', '2026-06-24T00:00:00.000Z'),
        ('user-v1-fan', 'google-v1-fan', 'v1-fan@linkshelf.local', 'Fan', 'FAN', NULL,
         'fan-20', '2026-06-24T00:00:00.000Z', '2026-06-24T00:00:00.000Z');
      INSERT INTO creator_profiles VALUES
        ('creator-v1', 'user-v1-creator', 'v1creator', 'Creator', 'Bio', 'Test',
         '/legacy-avatar.jpg', '/legacy-cover.jpg', 'creator-20',
         '2026-06-24T00:00:00.000Z', '2026-06-24T00:00:00.000Z');
      INSERT INTO shelves VALUES
        ('shelf-v1-a', 'creator-v1', 'a', 'A', 'Shelf A', 'Test', 'PUBLISHED', 'minimal',
         NULL, '/legacy-a.jpg', '2026-06-24T00:00:00.000Z',
         '2026-06-24T00:00:00.000Z', NULL),
        ('shelf-v1-b', 'creator-v1', 'b', 'B', 'Shelf B', 'Test', 'PUBLISHED', 'minimal',
         NULL, '/legacy-b.jpg', '2026-06-24T00:00:00.000Z',
         '2026-06-24T00:00:00.000Z', NULL);
      INSERT INTO products VALUES
        ('product-v1-a', 'shelf-v1-a', 'A', 'Product A', 100, 'USD', 'Amazon',
         'https://www.amazon.com/dp/B09JZT6YK5', '/legacy-a.jpg', 0, NULL, NULL,
         '2026-06-24T00:00:00.000Z', '2026-06-24T00:00:00.000Z'),
        ('product-v1-b', 'shelf-v1-b', 'B', 'Product B', 100, 'USD', 'Amazon',
         'https://www.amazon.com/dp/B09XS7JWHH', '/legacy-b.jpg', 0, NULL, NULL,
         '2026-06-24T00:00:00.000Z', '2026-06-24T00:00:00.000Z');
      INSERT INTO shares VALUES
        ('share-v1-a', 'shelf-v1-a', 'user-v1-fan', 'share-a', 'X',
         '2026-06-24T00:00:00.000Z');
    `);
    db.prepare(
      `INSERT INTO click_events
        (id, product_id, shelf_id, share_id, beneficiary, affiliate_tag, destination_url, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      "click-invalid-v1",
      invalidClick.productId,
      invalidClick.shelfId,
      invalidClick.shareId,
      invalidClick.beneficiary,
      "fixture-20",
      "https://www.amazon.com/dp/B09JZT6YK5?tag=fixture-20",
      "2026-06-24T00:00:00.000Z",
    );
    db.prepare(
      `INSERT INTO wallet_entries
        (id, user_id, click_event_id, amount_cents, type, status, description, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      "wallet-invalid-v1",
      "user-v1-fan",
      "click-invalid-v1",
      80,
      "AFFILIATE_EARNING",
      "PENDING",
      "Legacy ledger entry",
      "2026-06-24T00:00:00.000Z",
    );

    expect(() => migrate(db)).toThrow(invalidClick.expected);
    expect(db.prepare("SELECT version, name FROM schema_migrations").all()).toEqual([
      { version: 1, name: "initial_schema" },
    ]);
    expect(db.prepare("SELECT id FROM click_events").all()).toEqual([{ id: "click-invalid-v1" }]);
    expect(db.prepare("SELECT id FROM wallet_entries").all()).toEqual([{ id: "wallet-invalid-v1" }]);
    expect(
      (
        db
          .prepare("SELECT COUNT(*) AS count FROM sqlite_master WHERE name LIKE '%_v2'")
          .get() as { count: number }
      ).count,
    ).toBe(0);
  });

  it("rejects a recorded migration whose name no longer matches its version", () => {
    const db = createMigratedDatabase();
    db.prepare("UPDATE schema_migrations SET name = ? WHERE version = ?").run("tampered", 2);

    expect(() => migrate(db)).toThrow(/migration 2.*tampered.*enforce_data_invariants/i);
  });
});
