import { existsSync, readFileSync, statSync } from "node:fs";
import { join, posix, resolve, sep } from "node:path";
import type { DatabaseSync } from "node:sqlite";

const CREATED_AT = "2026-06-01T12:00:00.000Z";

export const STITCH_ASSET_SOURCES = {
  profileAvatar:
    "https://lh3.googleusercontent.com/aida/AP1WRLvvbbxp4lShDDkF8kPUTTc-9riZe43qCUvFG3AE9ikq3J2YOmo3CtrR-i4NGt0CTja0iX5vUlgnyL8ZRY3q0mrHfQwMVuWInAD7bDL9mC1uLyWgWsgBmj9sRAP7w-J1l2vZuHAWhl2IMrmkOYWJzv2j9jQlzjUZclz4sfFHIhsQeQ61wzy6gevJXNjisYIj8fbX6m3dPp1d2wvXIOG5RDTRg9vTu3t1hPPR_FfZpqgEePQr3Oajg87t_w",
  profileCover:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuAf8AcZsiFTBexC90V0RnnElBXCZAb_68Va1o3Jkn-K_9D-Reltc0984Fk62oCMa1iScrPSbunJd-OWi3pem1J-N86PvTxOATjNtAFHzQ8wJM6UowXAvoKHitU9HgnJpDi5Oi0ZElX3JH_b08mdFy-2kYvsr4NNsMt9LmvAJzq-NXAOdF2zfKhyMvgCma2jW7M3ahxPY3_ExRp6TF7NYywpebhFw0cQmFNhx1_lvuPm-VkU_BdaBryuYRR01AtIo1XBDY5ZAO0YzfU",
  shelfPhotography:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCo__FkVCyBuKAwyzDsvu3zUmEbMwyP27csjao_FpKVRhQiTmM0e9cfb11wNLMJP1tKvEUKRD6J58ImULIP1L3sWJgY3D7oyRyPWpO-I9gNV1vCOTfHlxbFCB2oX3wFGaBPb_mhvcayrjGbiyTzulfi7jAwytGhbWcxi2hLWFZAgFjD6cpK_GwIiq7V_T7ddJtSD62lvRRvSuKO_GX_DitaQiKWG2THlBHaZGOq4BNPIGpobk8MS7gvBEX59MGazc55OBcJbpPf6vQ",
  shelfDesk:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBos8sNijSLsLTp37l3BNO9eXA3Fmet28h7vVHT4da9DK-3IHg-4IerkJkktiqkFN-0-cio-zLZ8JbSu5eDxFgYKv0BJnEannkf7_Zgo8X7cIJ55wByVWQ0mFUCxrNa92BOMwm843Yw-Sjl1oArJ182KsD2KhvGPkNb4gt51gtG276HJsvGYJCmwwFB83nyIOZfs-lv8vcJsWmfBImaTcCOJKz0LVBmTwwUFQ6cggmmAQpXxLzVpH8al15mXFrbhIeub3LObSvPdR4",
  shelfTravel:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuC93Qt-tOMYJ3xW0zBl7PEhIy7NhUplkPvFOs-QXay-wcha1u0nDevRe3nMHgG0SwfGEcTFOzp3HMC88OP6-5AwkL6gksoHvlOabfCnD7w18Fhcsysd9xCLO4S9IsRu4-XdMh1tpT9wxgzV9_2E3_Qog9ZzffY1UvbhqpiJpDm0QIE1VAcG3zh4cwlKjr4b5pygL_lyiDojRKQoRQHEnot5Yxe1FA0wQR24aO7Fr9w4MdBmcAiwFl9dLWgI8n7Qn0vu-33hBEP4g3A",
  productSonyA7iv:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCim82jogH19rZejVSphrFEbLp4y-KAxG5V5LzjNiYTY1JP2-5oNFt_R20no6-XaZePD4jmJniS0dazB6XlnkztJ04PkvTFm_4c1_2Y0ooHavcSYmUUAYlgMfFO9G1PBO6hslT6BKsypBLt8s4gpxl-1lonQXLJ56YNVaZfqwYb60586quCx_SKKzUq2S-WufPZLz6C4AZgD6auSQA8VrkIDwHkCpFrCfzYT62qZxQH44u0oOu_phnckkaYBWKsVcIiy87duuEGXlQ",
  productSonyLens:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDKHLXHgAcM6Kkm0oQE7yHFq60yUonGuU2MtVx1IWCZ_x5SMSUgrAfVboti40ltI0ztyrw_OOIqtXzyPyQKug_uFnQxyy74PY5Lur8yH3qcaId2KBH_rrXqhCeOmxNEoEjQA1vUgjh4d9uihD_W8o92nQ_hJrKsdkV3ngCaJ-UN5ftlxjo66yBwHcJFLETn0Inn0rFyWeslhYvwvTYtWFYQlRQJXPlFQXgNDFkvdGiVZ1PZOsfQCLlC8jVc4EAty5n8wqChv7VScLs",
  productPeakTripod:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCz7-aS8rhNEvRVqjJIkePdF66jC5yN7TAn9y65hwc8GxyAZNx9SfyW71OvMx-Fn4TY9w__5h-PEeGco0vmzeJn-swwCazZrYzqKBg5HSjavKTM5WZAIbGryVSa2wSjndYmTjgJyQdAOzHPeiy3rljPNn6yQ24ZhHAHv3J4R8mXq7K-MGGi6bklxyyJp8mUA7D4b2lIt_Bem4GwI0sBBQ_1VMCnkxEsIn1k_gbvzI7KiRgPO4sQ-__TxM2bHZPPHjb-p8iKn_28wdk",
  productErgotune:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBPsyCx4GuIUqdQB9vp_F3Vdf_As_58KKKCdYJFKM4bUr1yCxfGRd0wdIzZ6_u6-TIPYfybmrcEPoqryLZn-BPvPBonF1faLa8rjBqMYi48NnphRFEbGwBf5Q0C6jsXKz2X-e1yVgv73hmfytRHfrPC-sl3OivfZ0RJpCINem_fsLMBMhW5ligDwUm0CH0XERJyve6Pjp456N-P7rnSwxCehW_77j-fLDPQSl3YyJUVIT9kgFjXZneFXcQZO5utL5NC6ycNJjpsKNE",
  productKeychron:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBXmdCPpah5NPsg0ra-apcjuWYd_2ltT2l7z_p3Wzjk-vYQyQH_M57o8SuoOHW5NF3YcbPoN7pyHlatDErkpyLrqfO6zPD_EVEECUNvlPH3kgvohu645q-UCqF7qwGGbwleMxbqMoEVgcyk60TH2bfFeZ-8C4gYRZ6dtA2Iq2eVa7E5vblNDGNkI2aTk7LBkUjCl32ZflZqBSnOOC3Nf3-bnz_ff8e-fHJcZLWIfT8Joe1Bc_KVjGfap7yIY4r1fbe3kAl0-tAkxqo",
  productHeadphones:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCBYr56VXkwly37g11dRCd0IdHIxKZFU5M25VcKilLjqdMdY_SWUni-UgJ9nWzKDcCYBMzBUtBk8v4N0S3M4-mf1s3u3gFzv1kcx7WgTELWS5xYbLQ6TfVoFQt6ox4vixkDTTVVXQ7Wirh_y6IeU0_NoEbZ_JyymWXcBXpIq8c1_wOQzzaqlvdv9arH_2WIEUZUBM-lyUFSpxWWrONHvyH8eCYv1lkn6YZVzfROMs1nU95ZRoxtUDo_gvmXnZoqQW2yUhZJgDOzEK4",
  productTravelBackpack:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCJZPAUG0W1xXyc-vRnkwf6ci5qupRSRn0Uu9weM0gO-GF0XqNYVpcfvqtjZjR4hbR7TIZAHf8L8M3_EWlu41lj2CNW8tdvdZUzb8rrpcqHDH1zbCA_tS2zrap6jXMoTCiFUzpno9ZGx-Qc_ZY39JY74H2211PG4uXU8iMb4OzKw_W3leBFIt1_qzwxCoUFp2xjA9RhbZyz4l9RX8cuqFCgo_KrJ6CulDk2NlJhjyjBnFWYabgD5dmMfElRjdtRLBPJVq3xZmf4ncM",
} as const;

export interface SeedOptions {
  readonly publicRoot?: string;
}

function readAssetManifest(publicRoot: string): Record<string, unknown> {
  try {
    const value = JSON.parse(
      readFileSync(join(publicRoot, "stitch", "asset-manifest.json"), "utf8"),
    ) as unknown;
    return value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function resolveManifestAsset(
  manifest: Record<string, unknown>,
  publicRoot: string,
  sourceUrl: string,
): string | null {
  const publicPath = manifest[sourceUrl];
  if (
    typeof publicPath !== "string" ||
    !/^\/stitch\/assets\/[a-f0-9]{64}\.(?:jpg|png|webp)$/.test(publicPath) ||
    posix.normalize(publicPath) !== publicPath
  ) {
    return null;
  }

  const assetsRoot = resolve(publicRoot, "stitch", "assets");
  const assetPath = resolve(publicRoot, `.${publicPath}`);
  if (!assetPath.startsWith(`${assetsRoot}${sep}`) || !existsSync(assetPath)) {
    return null;
  }

  try {
    return statSync(assetPath).isFile() ? publicPath : null;
  } catch {
    return null;
  }
}

function sqlText(value: string | null): string {
  return value === null ? "NULL" : `'${value.replaceAll("'", "''")}'`;
}

export function seed(database: DatabaseSync, options: SeedOptions = {}): void {
  const publicRoot = options.publicRoot ?? join(process.cwd(), "public");
  const manifest = readAssetManifest(publicRoot);
  const asset = (sourceUrl: string) =>
    sqlText(resolveManifestAsset(manifest, publicRoot, sourceUrl));

  database.exec("BEGIN IMMEDIATE TRANSACTION");

  try {
    database.exec(`
      INSERT INTO users
        (id, google_subject, email, display_name, role, avatar_url, affiliate_tag, created_at, updated_at)
      VALUES
        ('user-creator', 'google-creator', 'creator@linkshelf.local', 'Alex Rivera', 'CREATOR',
          NULL, NULL, '${CREATED_AT}', '${CREATED_AT}'),
        ('user-fan', 'google-fan', 'fan@linkshelf.local', 'Jamie Chen', 'FAN',
          NULL, 'fan-demo-20', '${CREATED_AT}', '${CREATED_AT}'),
        ('user-admin', 'google-admin', 'admin@linkshelf.local', 'Super Admin', 'ADMIN',
          NULL, NULL, '${CREATED_AT}', '${CREATED_AT}')
      ON CONFLICT(id) DO UPDATE SET
        avatar_url = COALESCE(users.avatar_url, excluded.avatar_url);

      INSERT INTO creator_profiles
        (id, user_id, handle, display_name, bio, category, avatar_url, cover_url, affiliate_tag,
         created_at, updated_at)
      VALUES
        ('creator-liam', 'user-creator', 'liamroberts.photo', 'Liam Roberts',
          'Landscape & travel photographer. I curate and share the professional gear and editing tools I trust in the field.', 'Photography',
          ${asset(STITCH_ASSET_SOURCES.profileAvatar)},
          ${asset(STITCH_ASSET_SOURCES.profileCover)}, 'liamcreator-20',
          '${CREATED_AT}', '${CREATED_AT}')
      ON CONFLICT(id) DO UPDATE SET
        bio = CASE
          WHEN creator_profiles.bio = 'Photographer and filmmaker sharing the gear behind every frame.'
          THEN excluded.bio
          ELSE creator_profiles.bio
        END,
        avatar_url = CASE
          WHEN creator_profiles.avatar_url IN (
            'https://lh3.googleusercontent.com/aida-public/AB6AXuB6yXZ9XFX1GPQAI3kFISkRWCEayI2tRpGzC3J35idZQbRoXmJy708U7hGywsG3ZNl-l-N0lraWe9zfF4WE6vn7kH6dymwzEHPKWJAWeYuVAl9gd_A1gNEjTnE-1K8PlUkCMgGE-qnmzRXKvfb9NzSPEqCOO2UMCTD08xgGK3f2paZJuW7-CvYEEHs-5Oh8Z4dokyrfYCv4PN1xae0XTaGcHMlU4gN8cy9mfaEqiNy38cJuNeltF83HC4pmC-HzzSjLVcLTL_yvuPk',
            '/stitch/assets/5828e4755aeb4cadc0e8d6ba09be3aeaafe7c320d72db26b11ae4d1b45141988.png'
          ) AND excluded.avatar_url IS NOT NULL
          THEN excluded.avatar_url
          ELSE COALESCE(creator_profiles.avatar_url, excluded.avatar_url)
        END,
        cover_url = COALESCE(creator_profiles.cover_url, excluded.cover_url);

      INSERT INTO shelves
        (id, creator_id, slug, title, description, category, status, theme, source_content_url,
         cover_url, created_at, updated_at, deleted_at)
      VALUES
        ('shelf-photography', 'creator-liam', 'photography-kit', 'Photography Kit',
          'My daily driver setup for hybrid shooting. Balancing ergonomics with top-tier image quality for long studio sessions and quick location hits.',
          'Photography', 'PUBLISHED',
          'tech', 'https://www.youtube.com/watch?v=linkshelf-photo',
          ${asset(STITCH_ASSET_SOURCES.shelfPhotography)}, '${CREATED_AT}', '${CREATED_AT}', NULL),
        ('shelf-desk', 'creator-liam', 'desk-setup-2024', 'Desk Setup 2024',
          'A calm, ergonomic workspace for editing and deep work.', 'Workspace', 'DRAFT',
          'minimal', NULL, ${asset(STITCH_ASSET_SOURCES.shelfDesk)},
          '${CREATED_AT}', '${CREATED_AT}', NULL),
        ('shelf-travel', 'creator-liam', 'travel-essentials', 'Travel Essentials',
          'Compact essentials that make location shoots easier.', 'Travel', 'PUBLISHED',
          'living', 'https://www.youtube.com/watch?v=linkshelf-travel',
          ${asset(STITCH_ASSET_SOURCES.shelfTravel)}, '${CREATED_AT}', '${CREATED_AT}', NULL)
      ON CONFLICT(id) DO UPDATE SET
        description = CASE
          WHEN shelves.id = 'shelf-photography'
            AND shelves.description = 'My go-to gear for professional shoots and travel vlogs.'
          THEN excluded.description
          ELSE shelves.description
        END,
        cover_url = COALESCE(shelves.cover_url, excluded.cover_url);

      INSERT INTO products
        (id, shelf_id, title, description, price_cents, currency, merchant, destination_url,
         image_url, sort_position, hotspot_x, hotspot_y, created_at, updated_at)
      VALUES
        ('product-sony-a7iv', 'shelf-photography', 'Sony a7 IV Mirrorless Camera',
          '33MP full-frame camera with pro performance.', 249800, 'USD', 'B&H Photo',
          'https://www.amazon.com/dp/B09JZT6YK5', ${asset(STITCH_ASSET_SOURCES.productSonyA7iv)},
          0, 55, 38, '${CREATED_AT}', '${CREATED_AT}'),
        ('product-sony-lens', 'shelf-photography', 'Sony FE 35mm f/1.4 GM Lens',
          'Stunning sharpness and beautiful bokeh.', 139800, 'USD', 'B&H Photo',
          'https://www.amazon.com/dp/B0B1TQZ99S', ${asset(STITCH_ASSET_SOURCES.productSonyLens)},
          1, 25, 20, '${CREATED_AT}', '${CREATED_AT}'),
        ('product-peak-tripod', 'shelf-photography', 'Peak Design Travel Tripod',
          'Compact, lightweight, and built to travel.', 34995, 'USD', 'Peak Design',
          'https://www.amazon.com/dp/B086YB2Y2F', ${asset(STITCH_ASSET_SOURCES.productPeakTripod)},
          2, 75, 60, '${CREATED_AT}', '${CREATED_AT}'),
        ('product-ergotune', 'shelf-desk', 'ErgoTune Supreme',
          'An adjustable mesh chair for long editing sessions.', 39900, 'USD', 'Amazon',
          'https://www.amazon.com/dp/B07Y8V14KQ', ${asset(STITCH_ASSET_SOURCES.productErgotune)},
          0, NULL, NULL, '${CREATED_AT}', '${CREATED_AT}'),
        ('product-keychron', 'shelf-desk', 'Keychron Q1 Pro',
          'A wireless aluminum mechanical keyboard with tactile switches.', 19900, 'USD', 'Amazon',
          'https://www.amazon.com/dp/B0BPXXL1DL', ${asset(STITCH_ASSET_SOURCES.productKeychron)},
          1, NULL, NULL, '${CREATED_AT}', '${CREATED_AT}'),
        ('product-headphones', 'shelf-travel', 'Sony WH-1000XM5 Headphones',
          'Noise-canceling headphones for flights and focused edits.', 34800, 'USD', 'Amazon',
          'https://www.amazon.com/dp/B09XS7JWHH', ${asset(STITCH_ASSET_SOURCES.productHeadphones)},
          0, 34, 44, '${CREATED_AT}', '${CREATED_AT}'),
        ('product-travel-backpack', 'shelf-travel', 'Peak Design Travel Backpack',
          'A durable carry-on backpack with flexible camera organization.', 27995, 'USD', 'Amazon',
          'https://www.amazon.com/dp/B07ZWFNZBK',
          ${asset(STITCH_ASSET_SOURCES.productTravelBackpack)},
          1, 68, 54, '${CREATED_AT}', '${CREATED_AT}')
      ON CONFLICT(id) DO UPDATE SET
        title = CASE
          WHEN products.id = 'product-sony-a7iv'
            AND products.title = 'Sony A7IV Mirrorless Camera'
          THEN excluded.title
          WHEN products.id = 'product-sony-lens'
            AND products.title = 'Sony FE 24-70mm f/2.8 GM II'
          THEN excluded.title
          WHEN products.id = 'product-peak-tripod'
            AND products.title = 'Peak Design Carbon Tripod'
          THEN excluded.title
          ELSE products.title
        END,
        description = CASE
          WHEN products.id = 'product-sony-a7iv'
            AND products.description = 'A versatile full-frame hybrid camera with reliable autofocus.'
          THEN excluded.description
          WHEN products.id = 'product-sony-lens'
            AND products.description = 'A fast standard zoom for portraits, travel, and events.'
          THEN excluded.description
          WHEN products.id = 'product-peak-tripod'
            AND products.description = 'A compact carbon travel tripod with a fast setup.'
          THEN excluded.description
          ELSE products.description
        END,
        price_cents = CASE
          WHEN products.id = 'product-sony-lens'
            AND products.price_cents = 229800
          THEN excluded.price_cents
          WHEN products.id = 'product-peak-tripod'
            AND products.price_cents = 64995
          THEN excluded.price_cents
          ELSE products.price_cents
        END,
        merchant = CASE
          WHEN products.id IN ('product-sony-a7iv', 'product-sony-lens', 'product-peak-tripod')
            AND products.merchant = 'Amazon'
          THEN excluded.merchant
          ELSE products.merchant
        END,
        image_url = COALESCE(products.image_url, excluded.image_url);

      INSERT INTO social_channels
        (id, creator_id, type, value, enabled, sort_position, created_at, updated_at)
      VALUES
        ('channel-x', 'creator-liam', 'X', 'https://instagram.com/liamroberts.photo', 1, 0,
          '${CREATED_AT}', '${CREATED_AT}'),
        ('channel-whatsapp', 'creator-liam', 'WHATSAPP', 'https://tiktok.com/@liamroberts.photo', 1, 1,
          '${CREATED_AT}', '${CREATED_AT}'),
        ('channel-facebook', 'creator-liam', 'FACEBOOK', 'https://facebook.com/liamshoots', 0, 2,
          '${CREATED_AT}', '${CREATED_AT}'),
        ('channel-copy', 'creator-liam', 'COPY', 'https://youtube.com/@liamrobertsphoto', 1, 3,
          '${CREATED_AT}', '${CREATED_AT}')
      ON CONFLICT(id) DO UPDATE SET
        value = CASE
          WHEN social_channels.id = 'channel-x'
            AND social_channels.value = '@liamshoots'
          THEN excluded.value
          WHEN social_channels.id = 'channel-whatsapp'
            AND social_channels.value = 'https://wa.me/15551234567'
          THEN excluded.value
          WHEN social_channels.id = 'channel-copy'
            AND social_channels.value = 'https://linkshelf.local/liamroberts.photo'
          THEN excluded.value
          ELSE social_channels.value
        END;

      INSERT OR IGNORE INTO saves (id, user_id, target_type, target_id, created_at)
      VALUES
        ('save-jamie-photography', 'user-fan', 'SHELF', 'shelf-photography',
          '2026-06-04T08:15:00.000Z'),
        ('save-jamie-travel', 'user-fan', 'SHELF', 'shelf-travel',
          '2026-06-10T08:15:00.000Z');

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
          '2026-06-05T09:45:00.000Z'),
        ('share-jamie-travel', 'shelf-travel', 'user-fan', 'jamie-travel', 'COPY',
          '2026-06-04T09:45:00.000Z');

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
          'https://www.amazon.com/dp/B086YB2Y2F?tag=linkshelf-platform-20', 'MISSING_SHARE',
          '2026-06-07T10:00:00.000Z');

      INSERT OR IGNORE INTO wallet_entries
        (id, user_id, click_event_id, amount_cents, type, status, description, created_at, cleared_at)
      VALUES
        ('wallet-fan-pending', 'user-fan', 'click-fan', 1230, 'AFFILIATE_EARNING', 'PENDING',
          'Pending fan share from Sony A7IV click', '2026-06-05T10:00:01.000Z', NULL),
        ('wallet-fan-tech', 'user-fan', NULL, 1240, 'ADJUSTMENT', 'CLEARED',
          'Tech Collection', '2023-10-24T10:00:01.000Z', '2023-10-24T10:00:01.000Z'),
        ('wallet-fan-home-office', 'user-fan', NULL, 415, 'ADJUSTMENT', 'CLEARED',
          'Home Office Gear', '2023-10-22T10:00:01.000Z', '2023-10-22T10:00:01.000Z'),
        ('wallet-fan-fall', 'user-fan', NULL, 2800, 'ADJUSTMENT', 'CLEARED',
          'Fall Essentials', '2023-10-19T10:00:01.000Z', '2023-10-19T10:00:01.000Z'),
        ('wallet-fan-opening-balance', 'user-fan', NULL, 13395, 'ADJUSTMENT', 'CLEARED',
          'Fan Hub opening balance', '2026-06-01T10:00:01.000Z',
          '2026-06-01T10:00:01.000Z'),
        ('wallet-creator-share', 'user-creator', 'click-fan', 400, 'AFFILIATE_EARNING', 'CLEARED',
          'Creator share from fan-attributed click', '2026-06-05T10:00:01.000Z',
          '2026-06-12T10:00:00.000Z'),
        ('wallet-creator-direct', 'user-creator', 'click-creator', 2498, 'AFFILIATE_EARNING', 'CLEARED',
          'Creator-attributed product click', '2026-06-06T10:00:01.000Z',
          '2026-06-13T10:00:00.000Z'),
        ('wallet-platform-adjustment', 'user-admin', 'click-platform', 1200, 'ADJUSTMENT', 'CLEARED',
          'Simulated platform attribution', '2026-06-07T10:00:01.000Z',
          '2026-06-14T10:00:00.000Z');

      UPDATE wallet_entries
      SET
        amount_cents = 1230,
        type = 'AFFILIATE_EARNING',
        status = 'PENDING',
        description = 'Pending fan share from Sony A7IV click',
        created_at = '2026-06-05T10:00:01.000Z',
        cleared_at = NULL
      WHERE id = 'wallet-fan-pending';

      UPDATE wallet_entries
      SET
        created_at = CASE id
          WHEN 'wallet-fan-tech' THEN '2023-10-24T10:00:01.000Z'
          WHEN 'wallet-fan-home-office' THEN '2023-10-22T10:00:01.000Z'
          WHEN 'wallet-fan-fall' THEN '2023-10-19T10:00:01.000Z'
          ELSE created_at
        END,
        cleared_at = CASE id
          WHEN 'wallet-fan-tech' THEN '2023-10-24T10:00:01.000Z'
          WHEN 'wallet-fan-home-office' THEN '2023-10-22T10:00:01.000Z'
          WHEN 'wallet-fan-fall' THEN '2023-10-19T10:00:01.000Z'
          ELSE cleared_at
        END
      WHERE id IN ('wallet-fan-tech', 'wallet-fan-home-office', 'wallet-fan-fall');

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
