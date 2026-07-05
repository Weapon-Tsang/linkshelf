import type { DatabaseSync } from "node:sqlite";
import { STITCH_ASSET_SOURCES } from "@/lib/db/seed";
import type {
  PublicCreator,
  PublicProfileProduct,
  PublicProfileShelf,
  PublicShelf,
  PublicShelfProduct,
  PublicSocialChannel,
  ShelfStatus,
} from "./types";

const SOURCE_DESIGN_ASSETS = {
  shelfPhotographyHero:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuAXZFtlvf8gscCWtwL4L7hX3Adtjq6B4cL5BQsioRvI1kHgcpDYJaZwjpbOBlgNtLau2F2R91F2TgDfx86gKIEq2txNFB0rQvqgPAGxftoFYp9cKrgbmquFyU6tpS8rzAviFkkwtpq4kj8ac96s1xuB12Qjqx9RPPr2ksENe92OwIcHd0q0axGpxNkhf04vy8ySz2zOrrQpr3pHXY4GxX6KfPLM27TpDFRNSbVzvfi9G0YiMRptBvpuvAKCI3OPAxd1nheAJlzlR4g",
} as const;

const creatorImageFallbacks: Record<string, Pick<PublicCreator, "avatarUrl" | "coverUrl">> = {
  "creator-liam": {
    avatarUrl: STITCH_ASSET_SOURCES.profileAvatar,
    coverUrl: STITCH_ASSET_SOURCES.profileCover,
  },
};

const shelfCoverFallbacks: Record<string, string> = {
  "shelf-photography": STITCH_ASSET_SOURCES.shelfPhotography,
  "shelf-desk": STITCH_ASSET_SOURCES.shelfDesk,
  "shelf-travel": STITCH_ASSET_SOURCES.shelfTravel,
};

const shelfHeroFallbacks: Record<string, string> = {
  "shelf-photography": SOURCE_DESIGN_ASSETS.shelfPhotographyHero,
  "shelf-desk": STITCH_ASSET_SOURCES.shelfDesk,
  "shelf-travel": STITCH_ASSET_SOURCES.shelfTravel,
};

const productImageFallbacks: Record<string, string> = {
  "product-sony-a7iv": STITCH_ASSET_SOURCES.productSonyA7iv,
  "product-sony-lens": STITCH_ASSET_SOURCES.productSonyLens,
  "product-peak-tripod": STITCH_ASSET_SOURCES.productPeakTripod,
  "product-ergotune": STITCH_ASSET_SOURCES.productErgotune,
  "product-keychron": STITCH_ASSET_SOURCES.productKeychron,
  "product-headphones": STITCH_ASSET_SOURCES.productHeadphones,
  "product-travel-backpack": STITCH_ASSET_SOURCES.productTravelBackpack,
};

interface CreatorRow {
  readonly id: string;
  readonly handle: string;
  readonly displayName: string;
  readonly bio: string;
  readonly category: string;
  readonly avatarUrl: string | null;
  readonly coverUrl: string | null;
}

interface ProfileShelfRow {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly category: string;
  readonly status: ShelfStatus;
  readonly coverUrl: string | null;
  readonly productCount: number;
}

interface ProfileProductRow {
  readonly id: string;
  readonly shelfId: string;
  readonly shelfSlug: string;
  readonly shelfTitle: string;
  readonly title: string;
  readonly description: string;
  readonly priceCents: number;
  readonly currency: string;
  readonly merchant: string;
  readonly imageUrl: string | null;
  readonly sortPosition: number;
  readonly hotspotX: number | null;
  readonly hotspotY: number | null;
}

interface PublicShelfRow {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly category: string;
  readonly theme: string;
  readonly sourceContentUrl: string | null;
  readonly coverUrl: string | null;
}

interface ShelfProductRow {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly priceCents: number;
  readonly currency: string;
  readonly merchant: string;
  readonly imageUrl: string | null;
  readonly sortPosition: number;
  readonly hotspotX: number | null;
  readonly hotspotY: number | null;
}

interface ShareCodeRow {
  readonly shortCode: string;
}

function withCreatorFallbacks(row: CreatorRow): PublicCreator {
  const fallback = creatorImageFallbacks[row.id];

  return {
    id: row.id,
    handle: row.handle,
    displayName: row.displayName,
    bio: row.bio,
    category: row.category,
    avatarUrl: row.avatarUrl ?? fallback?.avatarUrl ?? null,
    coverUrl: row.coverUrl ?? fallback?.coverUrl ?? null,
  };
}

function withShelfCoverFallback(row: ProfileShelfRow): PublicProfileShelf {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    category: row.category,
    status: row.status,
    coverUrl: row.coverUrl ?? shelfCoverFallbacks[row.id] ?? null,
    productCount: row.productCount,
  };
}

function withProfileProductFallback(row: ProfileProductRow): PublicProfileProduct {
  return {
    id: row.id,
    shelfId: row.shelfId,
    shelfSlug: row.shelfSlug,
    shelfTitle: row.shelfTitle,
    title: row.title,
    description: row.description,
    priceCents: row.priceCents,
    currency: row.currency,
    merchant: row.merchant,
    imageUrl: row.imageUrl ?? productImageFallbacks[row.id] ?? null,
    sortPosition: row.sortPosition,
    hotspotX: row.hotspotX,
    hotspotY: row.hotspotY,
  };
}

function withShelfProductFallback(row: ShelfProductRow): PublicShelfProduct {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    priceCents: row.priceCents,
    currency: row.currency,
    merchant: row.merchant,
    imageUrl: row.imageUrl ?? productImageFallbacks[row.id] ?? null,
    sortPosition: row.sortPosition,
    hotspotX: row.hotspotX,
    hotspotY: row.hotspotY,
  };
}

export function findPublicCreator(database: DatabaseSync, handle: string): PublicCreator | null {
  const row = database
    .prepare(
      `SELECT
         id,
         handle,
         display_name AS displayName,
         bio,
         category,
         avatar_url AS avatarUrl,
         cover_url AS coverUrl
       FROM creator_profiles
       WHERE handle = ?
       LIMIT 1`,
    )
    .get(handle) as CreatorRow | undefined;

  return row ? withCreatorFallbacks(row) : null;
}

export function findPublicProfileShelves(
  database: DatabaseSync,
  creatorId: string,
): readonly PublicProfileShelf[] {
  const rows = database
    .prepare(
      `SELECT
         shelves.id AS id,
         shelves.slug AS slug,
         shelves.title AS title,
         shelves.description AS description,
         shelves.category AS category,
         shelves.status AS status,
         shelves.cover_url AS coverUrl,
         COUNT(products.id) AS productCount
       FROM shelves
       LEFT JOIN products
         ON products.shelf_id = shelves.id
        AND products.deleted_at IS NULL
       WHERE shelves.creator_id = ?
         AND shelves.deleted_at IS NULL
       GROUP BY shelves.id
       ORDER BY shelves._rowid_`,
    )
    .all(creatorId) as unknown as ProfileShelfRow[];

  return rows.map(withShelfCoverFallback);
}

export function findEnabledSocialChannels(
  database: DatabaseSync,
  creatorId: string,
): readonly PublicSocialChannel[] {
  return database
    .prepare(
      `SELECT id, type, value, sort_position AS sortPosition
       FROM social_channels
       WHERE creator_id = ?
         AND enabled = 1
       ORDER BY sort_position`,
    )
    .all(creatorId) as unknown as PublicSocialChannel[];
}

export function findFeaturedPublicProducts(
  database: DatabaseSync,
  creatorId: string,
  limit = 3,
): readonly PublicProfileProduct[] {
  const rows = database
    .prepare(
      `SELECT
         products.id AS id,
         shelves.id AS shelfId,
         shelves.slug AS shelfSlug,
         shelves.title AS shelfTitle,
         products.title AS title,
         products.description AS description,
         products.price_cents AS priceCents,
         products.currency AS currency,
         products.merchant AS merchant,
         products.image_url AS imageUrl,
         products.sort_position AS sortPosition,
         products.hotspot_x AS hotspotX,
         products.hotspot_y AS hotspotY
       FROM products
       INNER JOIN shelves ON shelves.id = products.shelf_id
       WHERE shelves.creator_id = ?
         AND shelves.status = 'PUBLISHED'
         AND shelves.deleted_at IS NULL
         AND products.deleted_at IS NULL
       ORDER BY shelves._rowid_, products.sort_position
       LIMIT ?`,
    )
    .all(creatorId, limit) as unknown as ProfileProductRow[];

  return rows.map(withProfileProductFallback);
}

export function findPublicShelfByCreator(
  database: DatabaseSync,
  input: {
    readonly creatorId: string;
    readonly shelfId: string;
  },
): Omit<PublicShelf, "creator" | "socialChannels" | "products"> | null {
  const row = database
    .prepare(
      `SELECT
         id,
         slug,
         title,
         description,
         category,
         theme,
         source_content_url AS sourceContentUrl,
         cover_url AS coverUrl
       FROM shelves
       WHERE creator_id = ?
         AND (slug = ? OR id = ?)
         AND status = 'PUBLISHED'
         AND deleted_at IS NULL
       LIMIT 1`,
    )
    .get(input.creatorId, input.shelfId, input.shelfId) as PublicShelfRow | undefined;

  return row
    ? {
        id: row.id,
        slug: row.slug,
        title: row.title,
        description: row.description,
        category: row.category,
        theme: row.theme,
        sourceContentUrl: row.sourceContentUrl,
        coverUrl: row.coverUrl ?? shelfCoverFallbacks[row.id] ?? null,
        heroImageUrl: row.coverUrl ?? shelfHeroFallbacks[row.id] ?? null,
      }
    : null;
}

export function findPublicShelfProducts(
  database: DatabaseSync,
  shelfId: string,
): readonly PublicShelfProduct[] {
  const rows = database
    .prepare(
      `SELECT
         id,
         title,
         description,
         price_cents AS priceCents,
         currency,
         merchant,
         image_url AS imageUrl,
         sort_position AS sortPosition,
         hotspot_x AS hotspotX,
         hotspot_y AS hotspotY
       FROM products
       WHERE shelf_id = ?
         AND deleted_at IS NULL
       ORDER BY sort_position`,
    )
    .all(shelfId) as unknown as ShelfProductRow[];

  return rows.map(withShelfProductFallback);
}

export function findPublicShareCode(
  database: DatabaseSync,
  input: {
    readonly shelfId: string;
    readonly shareCode: string;
  },
): string | null {
  const row = database
    .prepare(
      `SELECT short_code AS shortCode
       FROM shares
       WHERE shelf_id = ?
         AND short_code = ?
       LIMIT 1`,
    )
    .get(input.shelfId, input.shareCode) as ShareCodeRow | undefined;

  return row?.shortCode ?? null;
}
