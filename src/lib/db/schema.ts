export interface SchemaMigration {
  readonly version: number;
  readonly name: string;
  readonly sql: string;
}

export const schemaMigrations: readonly SchemaMigration[] = [
  {
    version: 1,
    name: "initial_schema",
    sql: `
      CREATE TABLE users (
        id TEXT PRIMARY KEY,
        google_subject TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL COLLATE NOCASE UNIQUE,
        display_name TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('CREATOR', 'FAN', 'ADMIN')),
        avatar_url TEXT,
        affiliate_tag TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE creator_profiles (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL UNIQUE
          REFERENCES users(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        handle TEXT NOT NULL COLLATE NOCASE UNIQUE,
        display_name TEXT NOT NULL,
        bio TEXT NOT NULL,
        category TEXT NOT NULL,
        avatar_url TEXT NOT NULL,
        cover_url TEXT NOT NULL,
        affiliate_tag TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE shelves (
        id TEXT PRIMARY KEY,
        creator_id TEXT NOT NULL
          REFERENCES creator_profiles(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        slug TEXT NOT NULL COLLATE NOCASE,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('DRAFT', 'PUBLISHED')),
        theme TEXT NOT NULL,
        source_content_url TEXT,
        cover_url TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT,
        UNIQUE (creator_id, slug)
      );

      CREATE TABLE products (
        id TEXT PRIMARY KEY,
        shelf_id TEXT NOT NULL
          REFERENCES shelves(id) ON UPDATE CASCADE ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
        currency TEXT NOT NULL CHECK (length(currency) = 3),
        merchant TEXT NOT NULL,
        destination_url TEXT NOT NULL,
        image_url TEXT NOT NULL,
        sort_position INTEGER NOT NULL CHECK (sort_position >= 0),
        hotspot_x REAL CHECK (hotspot_x IS NULL OR (hotspot_x >= 0 AND hotspot_x <= 100)),
        hotspot_y REAL CHECK (hotspot_y IS NULL OR (hotspot_y >= 0 AND hotspot_y <= 100)),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        UNIQUE (shelf_id, sort_position)
      );

      CREATE TABLE social_channels (
        id TEXT PRIMARY KEY,
        creator_id TEXT NOT NULL
          REFERENCES creator_profiles(id) ON UPDATE CASCADE ON DELETE CASCADE,
        type TEXT NOT NULL CHECK (type IN ('X', 'WHATSAPP', 'FACEBOOK', 'EMAIL', 'COPY')),
        value TEXT NOT NULL,
        enabled INTEGER NOT NULL CHECK (enabled IN (0, 1)),
        sort_position INTEGER NOT NULL CHECK (sort_position >= 0),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        UNIQUE (creator_id, type),
        UNIQUE (creator_id, sort_position)
      );

      CREATE TABLE saves (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL
          REFERENCES users(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        target_type TEXT NOT NULL CHECK (target_type IN ('SHELF', 'CREATOR')),
        target_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        UNIQUE (user_id, target_type, target_id)
      );

      CREATE TABLE comments (
        id TEXT PRIMARY KEY,
        shelf_id TEXT NOT NULL
          REFERENCES shelves(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        user_id TEXT NOT NULL
          REFERENCES users(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        parent_id TEXT
          REFERENCES comments(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        body TEXT NOT NULL CHECK (length(trim(body)) > 0),
        status TEXT NOT NULL CHECK (status IN ('VISIBLE', 'HIDDEN')),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT,
        CHECK (parent_id IS NULL OR parent_id <> id)
      );

      CREATE TABLE shares (
        id TEXT PRIMARY KEY,
        shelf_id TEXT NOT NULL
          REFERENCES shelves(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        fan_user_id TEXT NOT NULL
          REFERENCES users(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        short_code TEXT NOT NULL COLLATE NOCASE UNIQUE,
        channel TEXT NOT NULL CHECK (channel IN ('X', 'WHATSAPP', 'FACEBOOK', 'EMAIL', 'COPY')),
        created_at TEXT NOT NULL
      );

      CREATE TABLE click_events (
        id TEXT PRIMARY KEY,
        product_id TEXT NOT NULL
          REFERENCES products(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        shelf_id TEXT NOT NULL
          REFERENCES shelves(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        share_id TEXT
          REFERENCES shares(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        beneficiary TEXT NOT NULL CHECK (beneficiary IN ('FAN', 'CREATOR', 'PLATFORM')),
        affiliate_tag TEXT NOT NULL,
        destination_url TEXT NOT NULL,
        fallback_reason TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE wallet_entries (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL
          REFERENCES users(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        click_event_id TEXT
          REFERENCES click_events(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
        type TEXT NOT NULL CHECK (type IN ('AFFILIATE_EARNING', 'WITHDRAWAL', 'ADJUSTMENT')),
        status TEXT NOT NULL CHECK (status IN ('PENDING', 'CLEARED')),
        description TEXT NOT NULL,
        created_at TEXT NOT NULL,
        cleared_at TEXT
      );

      CREATE TABLE withdrawals (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL
          REFERENCES users(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
        destination_label TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
        reviewer_id TEXT
          REFERENCES users(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        reviewed_at TEXT
      );

      CREATE INDEX shelves_creator_status_idx
        ON shelves (creator_id, status, deleted_at);
      CREATE INDEX products_shelf_position_idx
        ON products (shelf_id, sort_position);
      CREATE INDEX social_channels_creator_enabled_idx
        ON social_channels (creator_id, enabled, sort_position);
      CREATE INDEX saves_target_idx
        ON saves (target_type, target_id);
      CREATE INDEX comments_shelf_created_idx
        ON comments (shelf_id, created_at);
      CREATE INDEX comments_parent_idx
        ON comments (parent_id);
      CREATE INDEX shares_shelf_idx
        ON shares (shelf_id);
      CREATE INDEX shares_fan_idx
        ON shares (fan_user_id);
      CREATE INDEX click_events_product_created_idx
        ON click_events (product_id, created_at);
      CREATE INDEX click_events_shelf_created_idx
        ON click_events (shelf_id, created_at);
      CREATE INDEX click_events_share_idx
        ON click_events (share_id);
      CREATE INDEX wallet_entries_user_status_idx
        ON wallet_entries (user_id, status, created_at);
      CREATE INDEX wallet_entries_click_idx
        ON wallet_entries (click_event_id);
      CREATE INDEX withdrawals_user_created_idx
        ON withdrawals (user_id, created_at);
      CREATE INDEX withdrawals_status_created_idx
        ON withdrawals (status, created_at);
      CREATE INDEX withdrawals_reviewer_idx
        ON withdrawals (reviewer_id);
    `,
  },
  {
    version: 2,
    name: "enforce_data_invariants",
    sql: `
      PRAGMA defer_foreign_keys = ON;

      CREATE TABLE users_v2 (
        id TEXT PRIMARY KEY NOT NULL,
        google_subject TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL COLLATE NOCASE UNIQUE,
        display_name TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('CREATOR', 'FAN', 'ADMIN')),
        avatar_url TEXT,
        affiliate_tag TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      ) STRICT;

      CREATE TABLE creator_profiles_v2 (
        id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT NOT NULL UNIQUE
          REFERENCES users_v2(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        handle TEXT NOT NULL COLLATE NOCASE UNIQUE,
        display_name TEXT NOT NULL,
        bio TEXT NOT NULL,
        category TEXT NOT NULL,
        avatar_url TEXT,
        cover_url TEXT,
        affiliate_tag TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      ) STRICT;

      CREATE TABLE shelves_v2 (
        id TEXT PRIMARY KEY NOT NULL,
        creator_id TEXT NOT NULL
          REFERENCES creator_profiles_v2(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        slug TEXT NOT NULL COLLATE NOCASE,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('DRAFT', 'PUBLISHED')),
        theme TEXT NOT NULL,
        source_content_url TEXT,
        cover_url TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT,
        UNIQUE (creator_id, slug)
      ) STRICT;

      CREATE TABLE products_v2 (
        id TEXT PRIMARY KEY NOT NULL,
        shelf_id TEXT NOT NULL
          REFERENCES shelves_v2(id) ON UPDATE CASCADE ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        price_cents ANY NOT NULL
          CHECK (typeof(price_cents) = 'integer' AND price_cents >= 0),
        currency TEXT NOT NULL CHECK (length(currency) = 3),
        merchant TEXT NOT NULL,
        destination_url TEXT NOT NULL,
        image_url TEXT,
        sort_position ANY NOT NULL
          CHECK (typeof(sort_position) = 'integer' AND sort_position >= 0),
        hotspot_x ANY
          CHECK (hotspot_x IS NULL OR
            (typeof(hotspot_x) IN ('integer', 'real') AND hotspot_x >= 0 AND hotspot_x <= 100)),
        hotspot_y ANY
          CHECK (hotspot_y IS NULL OR
            (typeof(hotspot_y) IN ('integer', 'real') AND hotspot_y >= 0 AND hotspot_y <= 100)),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        UNIQUE (shelf_id, sort_position)
      ) STRICT;

      CREATE TABLE social_channels_v2 (
        id TEXT PRIMARY KEY NOT NULL,
        creator_id TEXT NOT NULL
          REFERENCES creator_profiles_v2(id) ON UPDATE CASCADE ON DELETE CASCADE,
        type TEXT NOT NULL CHECK (type IN ('X', 'WHATSAPP', 'FACEBOOK', 'EMAIL', 'COPY')),
        value TEXT NOT NULL,
        enabled ANY NOT NULL
          CHECK (typeof(enabled) = 'integer' AND enabled IN (0, 1)),
        sort_position ANY NOT NULL
          CHECK (typeof(sort_position) = 'integer' AND sort_position >= 0),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        UNIQUE (creator_id, type),
        UNIQUE (creator_id, sort_position)
      ) STRICT;

      CREATE TABLE saves_v2 (
        id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT NOT NULL
          REFERENCES users_v2(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        target_type TEXT NOT NULL CHECK (target_type IN ('SHELF', 'CREATOR')),
        target_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        UNIQUE (user_id, target_type, target_id)
      ) STRICT;

      CREATE TABLE comments_v2 (
        id TEXT PRIMARY KEY NOT NULL,
        shelf_id TEXT NOT NULL
          REFERENCES shelves_v2(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        user_id TEXT NOT NULL
          REFERENCES users_v2(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        parent_id TEXT
          REFERENCES comments_v2(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        body TEXT NOT NULL CHECK (length(trim(body)) > 0),
        status TEXT NOT NULL CHECK (status IN ('VISIBLE', 'HIDDEN')),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT,
        CHECK (parent_id IS NULL OR parent_id <> id)
      ) STRICT;

      CREATE TABLE shares_v2 (
        id TEXT PRIMARY KEY NOT NULL,
        shelf_id TEXT NOT NULL
          REFERENCES shelves_v2(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        fan_user_id TEXT NOT NULL
          REFERENCES users_v2(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        short_code TEXT NOT NULL COLLATE NOCASE UNIQUE,
        channel TEXT NOT NULL CHECK (channel IN ('X', 'WHATSAPP', 'FACEBOOK', 'EMAIL', 'COPY')),
        created_at TEXT NOT NULL
      ) STRICT;

      CREATE TABLE click_events_v2 (
        id TEXT PRIMARY KEY NOT NULL,
        product_id TEXT NOT NULL
          REFERENCES products_v2(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        shelf_id TEXT NOT NULL
          REFERENCES shelves_v2(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        share_id TEXT
          REFERENCES shares_v2(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        beneficiary TEXT NOT NULL CHECK (beneficiary IN ('FAN', 'CREATOR', 'PLATFORM')),
        affiliate_tag TEXT NOT NULL,
        destination_url TEXT NOT NULL,
        fallback_reason TEXT,
        created_at TEXT NOT NULL
      ) STRICT;

      CREATE TABLE wallet_entries_v2 (
        id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT NOT NULL
          REFERENCES users_v2(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        click_event_id TEXT
          REFERENCES click_events_v2(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        amount_cents ANY NOT NULL
          CHECK (typeof(amount_cents) = 'integer' AND amount_cents >= 0),
        type TEXT NOT NULL CHECK (type IN ('AFFILIATE_EARNING', 'WITHDRAWAL', 'ADJUSTMENT')),
        status TEXT NOT NULL CHECK (status IN ('PENDING', 'CLEARED')),
        description TEXT NOT NULL,
        created_at TEXT NOT NULL,
        cleared_at TEXT,
        CHECK (
          (status = 'PENDING' AND cleared_at IS NULL) OR
          (status = 'CLEARED' AND cleared_at IS NOT NULL)
        )
      ) STRICT;

      CREATE TABLE withdrawals_v2 (
        id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT NOT NULL
          REFERENCES users_v2(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        amount_cents ANY NOT NULL
          CHECK (typeof(amount_cents) = 'integer' AND amount_cents >= 0),
        destination_label TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
        reviewer_id TEXT
          REFERENCES users_v2(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        reviewed_at TEXT,
        CHECK (
          (status = 'PENDING' AND reviewer_id IS NULL AND reviewed_at IS NULL) OR
          (status IN ('APPROVED', 'REJECTED') AND reviewer_id IS NOT NULL AND reviewed_at IS NOT NULL)
        )
      ) STRICT;

      INSERT INTO users_v2 SELECT * FROM users;
      INSERT INTO creator_profiles_v2 SELECT * FROM creator_profiles;
      INSERT INTO shelves_v2 SELECT * FROM shelves;
      INSERT INTO products_v2
        (id, shelf_id, title, description, price_cents, currency, merchant, destination_url,
         image_url, sort_position, hotspot_x, hotspot_y, created_at, updated_at)
      SELECT
        id,
        shelf_id,
        title,
        description,
        price_cents,
        currency,
        merchant,
        destination_url,
        image_url,
        sort_position,
        CASE
          WHEN hotspot_x IS NULL THEN NULL
          WHEN typeof(hotspot_x) IN ('integer', 'real')
            AND hotspot_x = CAST(hotspot_x AS INTEGER) THEN CAST(hotspot_x AS INTEGER)
          ELSE hotspot_x
        END,
        CASE
          WHEN hotspot_y IS NULL THEN NULL
          WHEN typeof(hotspot_y) IN ('integer', 'real')
            AND hotspot_y = CAST(hotspot_y AS INTEGER) THEN CAST(hotspot_y AS INTEGER)
          ELSE hotspot_y
        END,
        created_at,
        updated_at
      FROM products;
      INSERT INTO social_channels_v2 SELECT * FROM social_channels;
      INSERT INTO saves_v2 SELECT * FROM saves;
      INSERT INTO comments_v2 SELECT * FROM comments;
      INSERT INTO shares_v2 SELECT * FROM shares;

      CREATE TRIGGER click_events_v2_attribution_validate
      BEFORE INSERT ON click_events_v2
      BEGIN
        SELECT CASE WHEN NOT EXISTS (
          SELECT 1 FROM products_v2
          WHERE products_v2.id = NEW.product_id AND products_v2.shelf_id = NEW.shelf_id
        ) THEN RAISE(ABORT, 'product must belong to click shelf') END;
        SELECT CASE WHEN NEW.share_id IS NOT NULL AND NOT EXISTS (
          SELECT 1 FROM shares_v2
          WHERE shares_v2.id = NEW.share_id AND shares_v2.shelf_id = NEW.shelf_id
        ) THEN RAISE(ABORT, 'share must belong to click shelf') END;
        SELECT CASE WHEN NEW.beneficiary = 'FAN' AND NEW.share_id IS NULL
          THEN RAISE(ABORT, 'fan beneficiary requires a share') END;
      END;

      INSERT INTO click_events_v2 SELECT * FROM click_events;
      DROP TRIGGER click_events_v2_attribution_validate;
      INSERT INTO wallet_entries_v2 SELECT * FROM wallet_entries;
      INSERT INTO withdrawals_v2 SELECT * FROM withdrawals;

      DROP TABLE withdrawals;
      DROP TABLE wallet_entries;
      DROP TABLE click_events;
      DROP TABLE shares;
      DROP TABLE comments;
      DROP TABLE saves;
      DROP TABLE social_channels;
      DROP TABLE products;
      DROP TABLE shelves;
      DROP TABLE creator_profiles;
      DROP TABLE users;

      ALTER TABLE users_v2 RENAME TO users;
      ALTER TABLE creator_profiles_v2 RENAME TO creator_profiles;
      ALTER TABLE shelves_v2 RENAME TO shelves;
      ALTER TABLE products_v2 RENAME TO products;
      ALTER TABLE social_channels_v2 RENAME TO social_channels;
      ALTER TABLE saves_v2 RENAME TO saves;
      ALTER TABLE comments_v2 RENAME TO comments;
      ALTER TABLE shares_v2 RENAME TO shares;
      ALTER TABLE click_events_v2 RENAME TO click_events;
      ALTER TABLE wallet_entries_v2 RENAME TO wallet_entries;
      ALTER TABLE withdrawals_v2 RENAME TO withdrawals;

      CREATE INDEX shelves_creator_status_idx
        ON shelves (creator_id, status, deleted_at);
      CREATE INDEX products_shelf_position_idx
        ON products (shelf_id, sort_position);
      CREATE INDEX social_channels_creator_enabled_idx
        ON social_channels (creator_id, enabled, sort_position);
      CREATE INDEX saves_target_idx
        ON saves (target_type, target_id);
      CREATE INDEX comments_shelf_created_idx
        ON comments (shelf_id, created_at);
      CREATE INDEX comments_parent_idx
        ON comments (parent_id);
      CREATE INDEX shares_shelf_idx
        ON shares (shelf_id);
      CREATE INDEX shares_fan_idx
        ON shares (fan_user_id);
      CREATE INDEX click_events_product_created_idx
        ON click_events (product_id, created_at);
      CREATE INDEX click_events_shelf_created_idx
        ON click_events (shelf_id, created_at);
      CREATE INDEX click_events_share_idx
        ON click_events (share_id);
      CREATE INDEX wallet_entries_user_status_idx
        ON wallet_entries (user_id, status, created_at);
      CREATE INDEX wallet_entries_click_idx
        ON wallet_entries (click_event_id);
      CREATE INDEX withdrawals_user_created_idx
        ON withdrawals (user_id, created_at);
      CREATE INDEX withdrawals_status_created_idx
        ON withdrawals (status, created_at);
      CREATE INDEX withdrawals_reviewer_idx
        ON withdrawals (reviewer_id);

      CREATE TRIGGER click_events_attribution_insert
      BEFORE INSERT ON click_events
      BEGIN
        SELECT CASE WHEN NOT EXISTS (
          SELECT 1 FROM products
          WHERE products.id = NEW.product_id AND products.shelf_id = NEW.shelf_id
        ) THEN RAISE(ABORT, 'product must belong to click shelf') END;
        SELECT CASE WHEN NEW.share_id IS NOT NULL AND NOT EXISTS (
          SELECT 1 FROM shares
          WHERE shares.id = NEW.share_id AND shares.shelf_id = NEW.shelf_id
        ) THEN RAISE(ABORT, 'share must belong to click shelf') END;
        SELECT CASE WHEN NEW.beneficiary = 'FAN' AND NEW.share_id IS NULL
          THEN RAISE(ABORT, 'fan beneficiary requires a share') END;
      END;

      CREATE TRIGGER click_events_attribution_update
      BEFORE UPDATE OF product_id, shelf_id, share_id, beneficiary ON click_events
      BEGIN
        SELECT CASE WHEN NOT EXISTS (
          SELECT 1 FROM products
          WHERE products.id = NEW.product_id AND products.shelf_id = NEW.shelf_id
        ) THEN RAISE(ABORT, 'product must belong to click shelf') END;
        SELECT CASE WHEN NEW.share_id IS NOT NULL AND NOT EXISTS (
          SELECT 1 FROM shares
          WHERE shares.id = NEW.share_id AND shares.shelf_id = NEW.shelf_id
        ) THEN RAISE(ABORT, 'share must belong to click shelf') END;
        SELECT CASE WHEN NEW.beneficiary = 'FAN' AND NEW.share_id IS NULL
          THEN RAISE(ABORT, 'fan beneficiary requires a share') END;
      END;
    `,
  },
  {
    version: 3,
    name: "soft_delete_users",
    sql: `
      ALTER TABLE users ADD COLUMN deleted_at TEXT;

      CREATE INDEX users_deleted_at_idx
        ON users (deleted_at);
    `,
  },
  {
    version: 4,
    name: "soft_delete_products",
    sql: `
      ALTER TABLE products ADD COLUMN deleted_at TEXT;

      CREATE INDEX products_deleted_at_idx
        ON products (deleted_at);
      CREATE INDEX products_shelf_deleted_sort_idx
        ON products (shelf_id, deleted_at, sort_position);
    `,
  },
];
