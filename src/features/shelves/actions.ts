import { randomUUID } from "node:crypto";
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

export interface ShelfEditorProductInput {
  readonly id?: string;
  readonly destinationUrl?: string;
  readonly title?: string;
  readonly description?: string;
  readonly merchant?: string;
  readonly price?: number;
  readonly imageUrl?: string;
  readonly hotspotX?: number | null;
  readonly hotspotY?: number | null;
}

export interface ShelfEditorInput {
  readonly shelfId?: string;
  readonly title?: string;
  readonly slug?: string;
  readonly description?: string;
  readonly category?: string;
  readonly theme?: string;
  readonly sourceContentUrl?: string | null;
  readonly coverUrl?: string | null;
  readonly products?: readonly ShelfEditorProductInput[];
}

export interface ShelfEditorProduct {
  readonly id: string;
  readonly destinationUrl: string;
  readonly title: string;
  readonly description: string;
  readonly merchant: string;
  readonly price: number;
  readonly imageUrl: string;
  readonly hotspotX: number | null;
  readonly hotspotY: number | null;
  readonly sortPosition: number;
}

export interface ShelfEditorShelf {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly category: string;
  readonly status: ShelfStatus;
  readonly theme: string;
  readonly sourceContentUrl: string | null;
  readonly coverUrl: string | null;
  readonly products: readonly ShelfEditorProduct[];
}

export type ShelfEditorDataResult =
  | {
      readonly ok: true;
      readonly shelf: ShelfEditorShelf;
    }
  | {
      readonly ok: false;
      readonly reason: ShelfManagementFailureReason;
    };

export type ShelfEditorMutationResult =
  | {
      readonly ok: true;
      readonly shelfId: string;
      readonly status: ShelfStatus;
    }
  | {
      readonly ok: false;
      readonly reason: ShelfManagementFailureReason | "VALIDATION_ERROR";
      readonly errors?: Partial<Record<keyof ShelfEditorInput | "products", string>>;
    };

export interface ShelfEditorMutationOptions extends ShelfMutationOptions {
  readonly createId?: (prefix: "shelf" | "product") => string;
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

interface ShelfEditorRow {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly category: string;
  readonly status: ShelfStatus;
  readonly theme: string;
  readonly sourceContentUrl: string | null;
  readonly coverUrl: string | null;
}

interface ShelfEditorProductRow {
  readonly id: string;
  readonly destinationUrl: string;
  readonly title: string;
  readonly description: string;
  readonly priceCents: number;
  readonly merchant: string;
  readonly imageUrl: string;
  readonly hotspotX: number | null;
  readonly hotspotY: number | null;
  readonly sortPosition: number;
}

function normalizeText(value: string | undefined, fallback = ""): string {
  const trimmed = value?.trim() ?? "";
  return trimmed || fallback;
}

function slugify(value: string | undefined): string {
  const slug = normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return slug || "untitled-shelf";
}

function isHttpUrl(value: string | undefined | null): value is string {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function normalizeHotspot(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.min(100, value))
    : null;
}

function validProducts(
  products: readonly ShelfEditorProductInput[] | undefined,
): ShelfEditorProductInput[] {
  return (products ?? []).filter(
    (product) =>
      isHttpUrl(product.destinationUrl) &&
      isHttpUrl(product.imageUrl) &&
      normalizeText(product.title) &&
      normalizeText(product.merchant) &&
      typeof product.price === "number" &&
      Number.isFinite(product.price) &&
      product.price > 0,
  );
}

function validatePublishInput(input: ShelfEditorInput) {
  const errors: Partial<Record<keyof ShelfEditorInput | "products", string>> = {};
  if (!normalizeText(input.title)) errors.title = "Title is required to publish.";
  if (!slugify(input.slug || input.title).match(/^[a-z0-9][a-z0-9-]{1,80}$/)) {
    errors.slug = "Use a readable URL slug.";
  }
  if (!isHttpUrl(input.coverUrl)) errors.coverUrl = "Cover image is required to publish.";
  if (validProducts(input.products).length === 0) {
    errors.products = "Add at least one complete product before publishing.";
  }
  return errors;
}

function createEditorId(
  prefix: "shelf" | "product",
  options: ShelfEditorMutationOptions,
): string {
  return options.createId?.(prefix) ?? `${prefix}-${randomUUID()}`;
}

function shelfValues(
  creatorId: string,
  input: ShelfEditorInput,
  status: ShelfStatus,
  now: string,
) {
  const title = normalizeText(input.title, "Untitled Shelf");
  return {
    creatorId,
    slug: slugify(input.slug || title),
    title,
    description: normalizeText(input.description, "A new LinkShelf collection."),
    category: normalizeText(input.category, "General"),
    status,
    theme: normalizeText(input.theme, "tech"),
    sourceContentUrl: isHttpUrl(input.sourceContentUrl) ? input.sourceContentUrl : null,
    coverUrl: isHttpUrl(input.coverUrl) ? input.coverUrl : null,
    updatedAt: now,
  };
}

function upsertShelfAndProducts(
  database: DatabaseSync,
  input: ShelfEditorInput,
  creatorId: string,
  status: ShelfStatus,
  options: ShelfEditorMutationOptions,
): string {
  const now = (options.now ?? (() => new Date()))().toISOString();
  const shelfId = input.shelfId ?? createEditorId("shelf", options);
  const values = shelfValues(creatorId, input, status, now);
  const products = validProducts(input.products);

  database.exec("BEGIN IMMEDIATE TRANSACTION");
  try {
    if (input.shelfId) {
      database
        .prepare(
          `UPDATE shelves
           SET slug = ?,
               title = ?,
               description = ?,
               category = ?,
               status = ?,
               theme = ?,
               source_content_url = ?,
               cover_url = ?,
               updated_at = ?
           WHERE id = ?
             AND creator_id = ?
             AND deleted_at IS NULL`,
        )
        .run(
          values.slug,
          values.title,
          values.description,
          values.category,
          values.status,
          values.theme,
          values.sourceContentUrl,
          values.coverUrl,
          values.updatedAt,
          shelfId,
          creatorId,
        );
    } else {
      database
        .prepare(
          `INSERT INTO shelves
             (id, creator_id, slug, title, description, category, status, theme,
              source_content_url, cover_url, created_at, updated_at, deleted_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
        )
        .run(
          shelfId,
          values.creatorId,
          values.slug,
          values.title,
          values.description,
          values.category,
          values.status,
          values.theme,
          values.sourceContentUrl,
          values.coverUrl,
          now,
          values.updatedAt,
        );
    }

    database.prepare("DELETE FROM products WHERE shelf_id = ?").run(shelfId);
    const insertProduct = database.prepare(
      `INSERT INTO products
         (id, shelf_id, title, description, price_cents, currency, merchant,
          destination_url, image_url, sort_position, hotspot_x, hotspot_y,
          created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'USD', ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    products.forEach((product, index) => {
      insertProduct.run(
        product.id || createEditorId("product", options),
        shelfId,
        normalizeText(product.title),
        normalizeText(product.description, "Creator-recommended product."),
        BigInt(Math.round((product.price ?? 0) * 100)),
        normalizeText(product.merchant, "Amazon"),
        normalizeText(product.destinationUrl),
        normalizeText(product.imageUrl),
        BigInt(index),
        normalizeHotspot(product.hotspotX),
        normalizeHotspot(product.hotspotY),
        now,
        now,
      );
    });

    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }

  return shelfId;
}

export function getShelfEditorData(
  database: DatabaseSync,
  shelfId: string,
  session: AuthSession | null,
): ShelfEditorDataResult {
  const creator = requireCreator(database, session);
  if (!creator.ok) return creator;

  const shelf = database
    .prepare(
      `SELECT
         id,
         slug,
         title,
         description,
         category,
         status,
         theme,
         source_content_url AS sourceContentUrl,
         cover_url AS coverUrl
       FROM shelves
       WHERE id = ?
         AND creator_id = ?
         AND deleted_at IS NULL
       LIMIT 1`,
    )
    .get(shelfId, creator.creator.id) as ShelfEditorRow | undefined;

  if (!shelf) return { ok: false, reason: "NOT_FOUND" };

  const products = database
    .prepare(
      `SELECT
         id,
         destination_url AS destinationUrl,
         title,
         description,
         price_cents AS priceCents,
         merchant,
         image_url AS imageUrl,
         hotspot_x AS hotspotX,
         hotspot_y AS hotspotY,
         sort_position AS sortPosition
       FROM products
       WHERE shelf_id = ?
       ORDER BY sort_position`,
    )
    .all(shelf.id) as unknown as ShelfEditorProductRow[];

  return {
    ok: true,
    shelf: {
      ...shelf,
      products: products.map((product) => ({
        id: product.id,
        destinationUrl: product.destinationUrl,
        title: product.title,
        description: product.description,
        merchant: product.merchant,
        price: product.priceCents / 100,
        imageUrl: product.imageUrl,
        hotspotX: product.hotspotX,
        hotspotY: product.hotspotY,
        sortPosition: product.sortPosition,
      })),
    },
  };
}

export function saveShelfDraft(
  database: DatabaseSync,
  input: ShelfEditorInput,
  session: AuthSession | null,
  options: ShelfEditorMutationOptions = {},
): ShelfEditorMutationResult {
  const creator = requireCreator(database, session);
  if (!creator.ok) return creator;
  if (
    input.shelfId &&
    !getShelfOwnership(database, { creatorId: creator.creator.id, shelfId: input.shelfId })
  ) {
    return { ok: false, reason: "NOT_FOUND" };
  }

  const shelfId = upsertShelfAndProducts(database, input, creator.creator.id, "DRAFT", options);
  return { ok: true, shelfId, status: "DRAFT" };
}

export function publishShelfFromEditor(
  database: DatabaseSync,
  input: ShelfEditorInput,
  session: AuthSession | null,
  options: ShelfEditorMutationOptions = {},
): ShelfEditorMutationResult {
  const creator = requireCreator(database, session);
  if (!creator.ok) return creator;
  if (
    input.shelfId &&
    !getShelfOwnership(database, { creatorId: creator.creator.id, shelfId: input.shelfId })
  ) {
    return { ok: false, reason: "NOT_FOUND" };
  }

  const errors = validatePublishInput(input);
  if (Object.keys(errors).length > 0) {
    return { ok: false, reason: "VALIDATION_ERROR", errors };
  }

  const shelfId = upsertShelfAndProducts(
    database,
    input,
    creator.creator.id,
    "PUBLISHED",
    options,
  );
  return { ok: true, shelfId, status: "PUBLISHED" };
}
