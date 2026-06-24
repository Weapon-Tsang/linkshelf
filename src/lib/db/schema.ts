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
];
