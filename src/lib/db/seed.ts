import type { DatabaseSync } from "node:sqlite";

const CREATED_AT = "2026-06-01T12:00:00.000Z";

export function seed(database: DatabaseSync): void {
  database.exec("BEGIN IMMEDIATE TRANSACTION");

  try {
    database.exec(`
      INSERT OR IGNORE INTO users
        (id, google_subject, email, display_name, role, avatar_url, affiliate_tag, created_at, updated_at)
      VALUES
        ('user-creator', 'google-creator', 'creator@linkshelf.local', 'Alex Rivera', 'CREATOR',
          '/stitch/assets/avatar-alex-rivera.jpg', NULL, '${CREATED_AT}', '${CREATED_AT}'),
        ('user-fan', 'google-fan', 'fan@linkshelf.local', 'Jamie Chen', 'FAN',
          '/stitch/assets/avatar-jamie-chen.jpg', 'fan-demo-20', '${CREATED_AT}', '${CREATED_AT}'),
        ('user-admin', 'google-admin', 'admin@linkshelf.local', 'Super Admin', 'ADMIN',
          '/stitch/assets/avatar-super-admin.jpg', NULL, '${CREATED_AT}', '${CREATED_AT}');

      INSERT OR IGNORE INTO creator_profiles
        (id, user_id, handle, display_name, bio, category, avatar_url, cover_url, affiliate_tag,
         created_at, updated_at)
      VALUES
        ('creator-liam', 'user-creator', 'liamroberts.photo', 'Liam Roberts',
          'Photographer and filmmaker sharing the gear behind every frame.', 'Photography',
          '/stitch/assets/avatar-liam-roberts.jpg', '/stitch/assets/cover-liam-roberts.jpg',
          'liamcreator-20', '${CREATED_AT}', '${CREATED_AT}');

      INSERT OR IGNORE INTO shelves
        (id, creator_id, slug, title, description, category, status, theme, source_content_url,
         cover_url, created_at, updated_at, deleted_at)
      VALUES
        ('shelf-photography', 'creator-liam', 'photography-kit', 'Photography Kit',
          'My go-to gear for professional shoots and travel vlogs.', 'Photography', 'PUBLISHED',
          'tech', 'https://www.youtube.com/watch?v=linkshelf-photo',
          '/stitch/assets/shelf-photography-kit.jpg', '${CREATED_AT}', '${CREATED_AT}', NULL),
        ('shelf-desk', 'creator-liam', 'desk-setup-2024', 'Desk Setup 2024',
          'A calm, ergonomic workspace for editing and deep work.', 'Workspace', 'DRAFT',
          'minimal', NULL, '/stitch/assets/shelf-desk-setup.jpg',
          '${CREATED_AT}', '${CREATED_AT}', NULL),
        ('shelf-travel', 'creator-liam', 'travel-essentials', 'Travel Essentials',
          'Compact essentials that make location shoots easier.', 'Travel', 'PUBLISHED',
          'living', 'https://www.youtube.com/watch?v=linkshelf-travel',
          '/stitch/assets/shelf-travel-essentials.jpg', '${CREATED_AT}', '${CREATED_AT}', NULL);

      INSERT OR IGNORE INTO products
        (id, shelf_id, title, description, price_cents, currency, merchant, destination_url,
         image_url, sort_position, hotspot_x, hotspot_y, created_at, updated_at)
      VALUES
        ('product-sony-a7iv', 'shelf-photography', 'Sony A7IV Mirrorless Camera',
          'A versatile full-frame hybrid camera with reliable autofocus.', 249800, 'USD', 'Amazon',
          'https://www.amazon.com/dp/B09JZT6YK5', '/stitch/assets/product-sony-a7iv.jpg',
          0, 55, 38, '${CREATED_AT}', '${CREATED_AT}'),
        ('product-sony-lens', 'shelf-photography', 'Sony FE 24-70mm f/2.8 GM II',
          'A fast standard zoom for portraits, travel, and events.', 229800, 'USD', 'Amazon',
          'https://www.amazon.com/dp/B0B1TQZ99S', '/stitch/assets/product-sony-24-70.jpg',
          1, 25, 20, '${CREATED_AT}', '${CREATED_AT}'),
        ('product-peak-tripod', 'shelf-photography', 'Peak Design Carbon Tripod',
          'A compact carbon travel tripod with a fast setup.', 64995, 'USD', 'Amazon',
          'https://www.amazon.com/dp/B086YB2Y2F', '/stitch/assets/product-peak-tripod.jpg',
          2, 75, 60, '${CREATED_AT}', '${CREATED_AT}'),
        ('product-ergotune', 'shelf-desk', 'ErgoTune Supreme',
          'An adjustable mesh chair for long editing sessions.', 39900, 'USD', 'Amazon',
          'https://www.amazon.com/dp/B07Y8V14KQ', '/stitch/assets/product-ergotune-supreme.jpg',
          0, NULL, NULL, '${CREATED_AT}', '${CREATED_AT}'),
        ('product-keychron', 'shelf-desk', 'Keychron Q1 Pro',
          'A wireless aluminum mechanical keyboard with tactile switches.', 19900, 'USD', 'Amazon',
          'https://www.amazon.com/dp/B0BPXXL1DL', '/stitch/assets/product-keychron-q1-pro.jpg',
          1, NULL, NULL, '${CREATED_AT}', '${CREATED_AT}'),
        ('product-headphones', 'shelf-travel', 'Sony WH-1000XM5 Headphones',
          'Noise-canceling headphones for flights and focused edits.', 34800, 'USD', 'Amazon',
          'https://www.amazon.com/dp/B09XS7JWHH', '/stitch/assets/product-sony-headphones.jpg',
          0, 34, 44, '${CREATED_AT}', '${CREATED_AT}'),
        ('product-travel-backpack', 'shelf-travel', 'Peak Design Travel Backpack',
          'A durable carry-on backpack with flexible camera organization.', 27995, 'USD', 'Amazon',
          'https://www.amazon.com/dp/B07ZWFNZBK', '/stitch/assets/product-travel-backpack.jpg',
          1, 68, 54, '${CREATED_AT}', '${CREATED_AT}');

      INSERT OR IGNORE INTO social_channels
        (id, creator_id, type, value, enabled, sort_position, created_at, updated_at)
      VALUES
        ('channel-x', 'creator-liam', 'X', '@liamshoots', 1, 0, '${CREATED_AT}', '${CREATED_AT}'),
        ('channel-whatsapp', 'creator-liam', 'WHATSAPP', 'https://wa.me/15551234567', 1, 1,
          '${CREATED_AT}', '${CREATED_AT}'),
        ('channel-facebook', 'creator-liam', 'FACEBOOK', 'https://facebook.com/liamshoots', 0, 2,
          '${CREATED_AT}', '${CREATED_AT}'),
        ('channel-copy', 'creator-liam', 'COPY', 'https://linkshelf.local/liamroberts.photo', 1, 3,
          '${CREATED_AT}', '${CREATED_AT}');

      INSERT OR IGNORE INTO saves (id, user_id, target_type, target_id, created_at)
      VALUES
        ('save-jamie-photography', 'user-fan', 'SHELF', 'shelf-photography',
          '2026-06-04T08:15:00.000Z');

      INSERT OR IGNORE INTO comments
        (id, shelf_id, user_id, parent_id, body, status, created_at, updated_at, deleted_at)
      VALUES
        ('comment-jamie-camera', 'shelf-photography', 'user-fan', NULL,
          'That camera setup looks perfect for travel work.', 'VISIBLE',
          '2026-06-05T09:10:00.000Z', '2026-06-05T09:10:00.000Z', NULL),
        ('comment-creator-reply', 'shelf-photography', 'user-creator', 'comment-jamie-camera',
          'Thanks, Jamie! The lighter lens makes a big difference.', 'VISIBLE',
          '2026-06-05T09:30:00.000Z', '2026-06-05T09:30:00.000Z', NULL),
        ('comment-jamie-travel', 'shelf-travel', 'user-fan', NULL,
          'The backpack organization is exactly what I needed.', 'VISIBLE',
          '2026-06-07T14:00:00.000Z', '2026-06-07T14:00:00.000Z', NULL),
        ('comment-hidden', 'shelf-photography', 'user-admin', NULL,
          'This fixture demonstrates moderation state.', 'HIDDEN',
          '2026-06-08T11:00:00.000Z', '2026-06-08T11:05:00.000Z', NULL);

      INSERT OR IGNORE INTO shares
        (id, shelf_id, fan_user_id, short_code, channel, created_at)
      VALUES
        ('share-jamie-photography', 'shelf-photography', 'user-fan', 'jamie-photo', 'X',
          '2026-06-05T09:45:00.000Z');

      INSERT OR IGNORE INTO click_events
        (id, product_id, shelf_id, share_id, beneficiary, affiliate_tag, destination_url,
         fallback_reason, created_at)
      VALUES
        ('click-fan', 'product-sony-a7iv', 'shelf-photography', 'share-jamie-photography',
          'FAN', 'fan-demo-20', 'https://www.amazon.com/dp/B09JZT6YK5?tag=fan-demo-20', NULL,
          '2026-06-05T10:00:00.000Z'),
        ('click-creator', 'product-sony-lens', 'shelf-photography', NULL,
          'CREATOR', 'liamcreator-20',
          'https://www.amazon.com/dp/B0B1TQZ99S?tag=liamcreator-20', NULL,
          '2026-06-06T10:00:00.000Z'),
        ('click-platform', 'product-peak-tripod', 'shelf-photography', NULL,
          'PLATFORM', 'linkshelf-platform-20',
          'https://www.amazon.com/dp/B086YB2Y2F?tag=linkshelf-platform-20', 'NO_VALID_SHARE',
          '2026-06-07T10:00:00.000Z');

      INSERT OR IGNORE INTO wallet_entries
        (id, user_id, click_event_id, amount_cents, type, status, description, created_at, cleared_at)
      VALUES
        ('wallet-fan-pending', 'user-fan', 'click-fan', 1599, 'AFFILIATE_EARNING', 'PENDING',
          'Pending fan share from Sony A7IV click', '2026-06-05T10:00:01.000Z', NULL),
        ('wallet-creator-share', 'user-creator', 'click-fan', 400, 'AFFILIATE_EARNING', 'CLEARED',
          'Creator share from fan-attributed click', '2026-06-05T10:00:01.000Z',
          '2026-06-12T10:00:00.000Z'),
        ('wallet-creator-direct', 'user-creator', 'click-creator', 2498, 'AFFILIATE_EARNING', 'CLEARED',
          'Creator-attributed product click', '2026-06-06T10:00:01.000Z',
          '2026-06-13T10:00:00.000Z'),
        ('wallet-platform-adjustment', 'user-admin', 'click-platform', 1200, 'ADJUSTMENT', 'CLEARED',
          'Simulated platform attribution', '2026-06-07T10:00:01.000Z',
          '2026-06-14T10:00:00.000Z');

      INSERT OR IGNORE INTO withdrawals
        (id, user_id, amount_cents, destination_label, status, reviewer_id, created_at, updated_at,
         reviewed_at)
      VALUES
        ('withdrawal-jamie-pending', 'user-fan', 5000, 'Amazon gift card ending 2048', 'PENDING', NULL,
          '2026-06-15T12:00:00.000Z', '2026-06-15T12:00:00.000Z', NULL);
    `);

    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}
