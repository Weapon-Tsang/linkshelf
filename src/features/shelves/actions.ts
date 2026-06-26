import type { DatabaseSync } from "node:sqlite";
import type { AuthSession } from "@/features/auth/adapter";
import type { ShelfStatus } from "./types";

export type ShelfManagementFilter = "ALL" | ShelfStatus;
export type ShelfManagementFailureReason =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND";

export interface ManagedShelf {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly category: string;
  readonly status: ShelfStatus;
  readonly coverUrl: string | null;
  readonly productCount: number;
  readonly updatedAt: string;
}

export type ShelfListResult =
  | {
      readonly ok: true;
      readonly creator: {
        readonly id: string;
        readonly handle: string;
        readonly displayName: string;
      };
      readonly shelves: readonly ManagedShelf[];
      readonly totals: {
        readonly all: number;
        readonly published: number;
        readonly drafts: number;
      };
    }
  | {
      readonly ok: false;
      readonly reason: ShelfManagementFailureReason;
    };

export type ShelfMutationResult =
  | {
      readonly ok: true;
    }
  | {
      readonly ok: false;
      readonly reason: ShelfManagementFailureReason;
    };

interface CreatorRow {
  readonly id: string;
  readonly handle: string;
  readonly displayName: string;
}

interface ManagedShelfRow {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly category: string;
  readonly status: ShelfStatus;
  readonly coverUrl: string | null;
  readonly productCount: number;
  readonly updatedAt: string;
}

interface CountRow {
  readonly status: ShelfStatus;
  readonly count: number;
}

export interface ShelfMutationOptions {
  readonly now?: () => Date;
}

function requireCreator(
  database: DatabaseSync,
  session: AuthSession | null,
): { readonly ok: true; readonly creator: CreatorRow } | { readonly ok: false; readonly reason: ShelfManagementFailureReason } {
  if (!session) {
    return { ok: false, reason: "UNAUTHENTICATED" };
  }
  if (session.user.role !== "CREATOR") {
    return { ok: false, reason: "FORBIDDEN" };
  }

  const creator = database
    .prepare(
      `SELECT
         id,
         handle,
         display_name AS displayName
       FROM creator_profiles
       WHERE user_id = ?
       LIMIT 1`,
    )
    .get(session.user.id) as CreatorRow | undefined;

  return creator
    ? { ok: true, creator }
    : { ok: false, reason: "FORBIDDEN" };
}

function normalizeFilter(status: ShelfManagementFilter | undefined): ShelfManagementFilter {
  return status === "PUBLISHED" || status === "DRAFT" ? status : "ALL";
}

function normalizeSearch(query: string | undefined): string | null {
  const trimmed = query?.trim().toLowerCase() ?? "";
  return trimmed ? `%${trimmed}%` : null;
}

function getShelfOwnership(
  database: DatabaseSync,
  input: {
    readonly creatorId: string;
    readonly shelfId: string;
  },
): { readonly id: string } | null {
  const row = database
    .prepare(
      `SELECT id
       FROM shelves
       WHERE creator_id = ?
         AND id = ?
         AND deleted_at IS NULL
       LIMIT 1`,
    )
    .get(input.creatorId, input.shelfId) as { id: string } | undefined;
  return row ?? null;
}

export function listCreatorShelves(
  database: DatabaseSync,
  session: AuthSession | null,
  input: {
    readonly status?: ShelfManagementFilter;
    readonly query?: string;
  } = {},
): ShelfListResult {
  const creator = requireCreator(database, session);
  if (!creator.ok) return creator;

  const status = normalizeFilter(input.status);
  const search = normalizeSearch(input.query);
  const filters: string[] = ["shelves.creator_id = ?", "shelves.deleted_at IS NULL"];
  const params: Array<string> = [creator.creator.id];

  if (status !== "ALL") {
    filters.push("shelves.status = ?");
    params.push(status);
  }

  if (search) {
    filters.push(
      `(LOWER(shelves.title) LIKE ? OR LOWER(shelves.description) LIKE ? OR LOWER(shelves.category) LIKE ? OR LOWER(shelves.slug) LIKE ?)`,
    );
    params.push(search, search, search, search);
  }

  const shelves = database
    .prepare(
      `SELECT
         shelves.id AS id,
         shelves.slug AS slug,
         shelves.title AS title,
         shelves.description AS description,
         shelves.category AS category,
         shelves.status AS status,
         shelves.cover_url AS coverUrl,
         COUNT(products.id) AS productCount,
         shelves.updated_at AS updatedAt
       FROM shelves
       LEFT JOIN products ON products.shelf_id = shelves.id
       WHERE ${filters.join(" AND ")}
       GROUP BY shelves.id
       ORDER BY shelves._rowid_`,
    )
    .all(...params) as unknown as ManagedShelfRow[];

  const counts = database
    .prepare(
      `SELECT status, COUNT(*) AS count
       FROM shelves
       WHERE creator_id = ?
         AND deleted_at IS NULL
       GROUP BY status`,
    )
    .all(creator.creator.id) as unknown as CountRow[];
  const totals = {
    all: 0,
    published: 0,
    drafts: 0,
  };
  for (const row of counts) {
    totals.all += row.count;
    if (row.status === "PUBLISHED") totals.published = row.count;
    if (row.status === "DRAFT") totals.drafts = row.count;
  }

  return {
    ok: true,
    creator: creator.creator,
    shelves,
    totals,
  };
}

export function publishShelf(
  database: DatabaseSync,
  input: {
    readonly shelfId: string;
  },
  session: AuthSession | null,
  options: ShelfMutationOptions = {},
): ShelfMutationResult {
  const creator = requireCreator(database, session);
  if (!creator.ok) return creator;
  if (!getShelfOwnership(database, { creatorId: creator.creator.id, shelfId: input.shelfId })) {
    return { ok: false, reason: "NOT_FOUND" };
  }

  database
    .prepare(
      `UPDATE shelves
       SET status = 'PUBLISHED',
           updated_at = ?
       WHERE id = ?
         AND creator_id = ?
         AND deleted_at IS NULL`,
    )
    .run((options.now ?? (() => new Date()))().toISOString(), input.shelfId, creator.creator.id);
  return { ok: true };
}

export function softDeleteShelf(
  database: DatabaseSync,
  input: {
    readonly shelfId: string;
  },
  session: AuthSession | null,
  options: ShelfMutationOptions = {},
): ShelfMutationResult {
  const creator = requireCreator(database, session);
  if (!creator.ok) return creator;
  if (!getShelfOwnership(database, { creatorId: creator.creator.id, shelfId: input.shelfId })) {
    return { ok: false, reason: "NOT_FOUND" };
  }

  const deletedAt = (options.now ?? (() => new Date()))().toISOString();
  database
    .prepare(
      `UPDATE shelves
       SET deleted_at = ?,
           updated_at = ?
       WHERE id = ?
         AND creator_id = ?
         AND deleted_at IS NULL`,
    )
    .run(deletedAt, deletedAt, input.shelfId, creator.creator.id);
  return { ok: true };
}
