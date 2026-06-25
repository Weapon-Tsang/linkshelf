import type { DatabaseSync } from "node:sqlite";
import type { ClickBeneficiary, AffiliateFallbackReason } from "./types";

export interface AffiliateProductContext {
  readonly id: string;
  readonly shelfId: string;
  readonly destinationUrl: string;
  readonly creatorAffiliateTag: string | null;
}

export interface AffiliateShareContext {
  readonly id: string;
  readonly fanAffiliateTag: string | null;
}

export interface FindAffiliateShareInput {
  readonly shelfId: string;
  readonly shortCode: string;
}

export interface InsertClickEventInput {
  readonly id: string;
  readonly productId: string;
  readonly shelfId: string;
  readonly shareId: string | null;
  readonly beneficiary: ClickBeneficiary;
  readonly affiliateTag: string;
  readonly destinationUrl: string;
  readonly fallbackReason: AffiliateFallbackReason | null;
  readonly createdAt: string;
}

interface AffiliateProductRow {
  readonly id: string;
  readonly shelfId: string;
  readonly destinationUrl: string;
  readonly creatorAffiliateTag: string | null;
}

interface AffiliateShareRow {
  readonly id: string;
  readonly fanAffiliateTag: string | null;
}

export function findAffiliateProduct(
  database: DatabaseSync,
  productId: string,
): AffiliateProductContext | null {
  const row = database
    .prepare(
      `SELECT
         products.id AS id,
         products.shelf_id AS shelfId,
         products.destination_url AS destinationUrl,
         creator_profiles.affiliate_tag AS creatorAffiliateTag
       FROM products
       INNER JOIN shelves ON shelves.id = products.shelf_id
       INNER JOIN creator_profiles ON creator_profiles.id = shelves.creator_id
       WHERE products.id = ?
         AND shelves.status = 'PUBLISHED'
         AND shelves.deleted_at IS NULL
       LIMIT 1`,
    )
    .get(productId) as AffiliateProductRow | undefined;

  return row
    ? {
        id: row.id,
        shelfId: row.shelfId,
        destinationUrl: row.destinationUrl,
        creatorAffiliateTag: row.creatorAffiliateTag,
      }
    : null;
}

export function findAffiliateShare(
  database: DatabaseSync,
  input: FindAffiliateShareInput,
): AffiliateShareContext | null {
  const row = database
    .prepare(
      `SELECT
         shares.id AS id,
         users.affiliate_tag AS fanAffiliateTag
       FROM shares
       INNER JOIN users ON users.id = shares.fan_user_id
       WHERE shares.shelf_id = ?
         AND shares.short_code = ?
       LIMIT 1`,
    )
    .get(input.shelfId, input.shortCode) as AffiliateShareRow | undefined;

  return row
    ? {
        id: row.id,
        fanAffiliateTag: row.fanAffiliateTag,
      }
    : null;
}

export function insertClickEvent(
  database: DatabaseSync,
  input: InsertClickEventInput,
): void {
  database
    .prepare(
      `INSERT INTO click_events
        (id, product_id, shelf_id, share_id, beneficiary, affiliate_tag, destination_url,
         fallback_reason, created_at)
       VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      input.id,
      input.productId,
      input.shelfId,
      input.shareId,
      input.beneficiary,
      input.affiliateTag,
      input.destinationUrl,
      input.fallbackReason,
      input.createdAt,
    );
}
