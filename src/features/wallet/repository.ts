import type { DatabaseSync } from "node:sqlite";
import { STITCH_ASSET_SOURCES } from "@/lib/db/seed";

export const PLATFORM_AFFILIATE_TAG = "linkshelf-platform-20";

const shelfCoverFallbacks: Record<string, string> = {
  "shelf-photography": STITCH_ASSET_SOURCES.shelfPhotography,
  "shelf-desk": STITCH_ASSET_SOURCES.shelfDesk,
  "shelf-travel": STITCH_ASSET_SOURCES.shelfTravel,
};

export interface WalletEntry {
  readonly id: string;
  readonly amountCents: number;
  readonly type: "AFFILIATE_EARNING" | "WITHDRAWAL" | "ADJUSTMENT";
  readonly status: "PENDING" | "CLEARED";
  readonly description: string;
  readonly createdAt: string;
  readonly clearedAt: string | null;
}

export interface ShareSummary {
  readonly id: string;
  readonly shelfId: string;
  readonly shelfTitle: string;
  readonly coverUrl: string | null;
  readonly channel: string;
  readonly shortCode: string;
  readonly clicks: number;
  readonly shareCount: number;
  readonly itemCount: number;
}

export interface SavedShelfSummary {
  readonly id: string;
  readonly title: string;
  readonly creatorHandle: string;
  readonly coverUrl: string | null;
  readonly itemCount: number;
}

function toNumber(value: number | bigint | null | undefined) {
  if (typeof value === "bigint") return Number(value);
  return Number(value ?? 0);
}

export function readFanAffiliateTag(database: DatabaseSync, userId: string): string | null {
  const row = database
    .prepare("SELECT affiliate_tag AS affiliateTag FROM users WHERE id = ? AND deleted_at IS NULL")
    .get(userId) as { affiliateTag: string | null } | undefined;
  return row?.affiliateTag?.trim() || null;
}

export function updateFanAffiliateTag(
  database: DatabaseSync,
  input: {
    readonly userId: string;
    readonly affiliateTag: string | null;
    readonly updatedAt: string;
  },
): void {
  database
    .prepare("UPDATE users SET affiliate_tag = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL")
    .run(input.affiliateTag, input.updatedAt, input.userId);
}

export function readWalletEntries(database: DatabaseSync, userId: string): readonly WalletEntry[] {
  const rows = database
    .prepare(
      `SELECT
         id,
         amount_cents AS amountCents,
         type,
         status,
         description,
         created_at AS createdAt,
         cleared_at AS clearedAt
       FROM wallet_entries
       WHERE user_id = ?
       ORDER BY created_at DESC, id DESC`,
    )
    .all(userId) as Array<{
      id: string;
      amountCents: number | bigint;
      type: WalletEntry["type"];
      status: WalletEntry["status"];
      description: string;
      createdAt: string;
      clearedAt: string | null;
    }>;

  return rows.map((row) => ({
    ...row,
    amountCents: toNumber(row.amountCents),
  }));
}

export function readWithdrawalHoldCents(database: DatabaseSync, userId: string): number {
  const row = database
    .prepare(
      `SELECT COALESCE(SUM(amount_cents), 0) AS total
       FROM withdrawals
       WHERE user_id = ?
         AND status IN ('PENDING', 'APPROVED')`,
    )
    .get(userId) as { total: number | bigint } | undefined;
  return toNumber(row?.total);
}

export function insertWithdrawal(
  database: DatabaseSync,
  input: {
    readonly id: string;
    readonly userId: string;
    readonly amountCents: number;
    readonly destinationLabel: string;
    readonly createdAt: string;
  },
): void {
  database
    .prepare(
      `INSERT INTO withdrawals
        (id, user_id, amount_cents, destination_label, status, reviewer_id, created_at,
         updated_at, reviewed_at)
       VALUES (?, ?, ?, ?, 'PENDING', NULL, ?, ?, NULL)`,
    )
    .run(
      input.id,
      input.userId,
      BigInt(input.amountCents),
      input.destinationLabel,
      input.createdAt,
      input.createdAt,
    );
}

export function readFanShares(database: DatabaseSync, userId: string): readonly ShareSummary[] {
  const rows = database
    .prepare(
      `SELECT
         shares.id AS id,
         shelves.id AS shelfId,
         shelves.title AS shelfTitle,
         shelves.cover_url AS coverUrl,
         shares.channel AS channel,
         shares.short_code AS shortCode,
         COUNT(DISTINCT click_events.id) AS clicks,
         COUNT(DISTINCT sibling_shares.id) AS shareCount,
         COUNT(DISTINCT products.id) AS itemCount
       FROM shares
       INNER JOIN shelves ON shelves.id = shares.shelf_id
       LEFT JOIN click_events ON click_events.share_id = shares.id
       LEFT JOIN shares AS sibling_shares ON sibling_shares.shelf_id = shelves.id
       LEFT JOIN products ON products.shelf_id = shelves.id
       WHERE shares.fan_user_id = ?
         AND shelves.deleted_at IS NULL
       GROUP BY shares.id
       ORDER BY shares.created_at DESC`,
    )
    .all(userId) as Array<{
      id: string;
      shelfId: string;
      shelfTitle: string;
      coverUrl: string | null;
      channel: string;
      shortCode: string;
      clicks: number | bigint;
      shareCount: number | bigint;
      itemCount: number | bigint;
    }>;

  return rows.map((row) => ({
    ...row,
    coverUrl: row.coverUrl ?? shelfCoverFallbacks[row.shelfId] ?? null,
    clicks: toNumber(row.clicks),
    shareCount: toNumber(row.shareCount),
    itemCount: toNumber(row.itemCount),
  }));
}

export function readSavedShelves(database: DatabaseSync, userId: string): readonly SavedShelfSummary[] {
  const rows = database
    .prepare(
      `SELECT
         shelves.id AS id,
         shelves.title AS title,
         shelves.cover_url AS coverUrl,
         creator_profiles.handle AS creatorHandle,
         COUNT(products.id) AS itemCount
       FROM saves
       INNER JOIN shelves ON shelves.id = saves.target_id
       INNER JOIN creator_profiles ON creator_profiles.id = shelves.creator_id
       LEFT JOIN products ON products.shelf_id = shelves.id
       WHERE saves.user_id = ?
         AND saves.target_type = 'SHELF'
         AND shelves.deleted_at IS NULL
       GROUP BY shelves.id
       ORDER BY saves.created_at DESC`,
    )
    .all(userId) as Array<{
      id: string;
      title: string;
      creatorHandle: string;
      coverUrl: string | null;
      itemCount: number | bigint;
    }>;

  return rows.map((row) => ({
    ...row,
    coverUrl: row.coverUrl ?? shelfCoverFallbacks[row.id] ?? null,
    itemCount: toNumber(row.itemCount),
  }));
}
