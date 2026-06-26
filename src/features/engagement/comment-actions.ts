import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import type { AuthSession } from "@/features/auth/adapter";
import type { SocialChannelType } from "@/features/shelves/types";

type StudioFailureReason =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "INVALID_INPUT"
  | "CONFIRMATION_REQUIRED";

export type StudioActionResult<T extends object = object> =
  | ({ readonly ok: true } & T)
  | {
      readonly ok: false;
      readonly reason: StudioFailureReason;
    };

export interface StudioComment {
  readonly id: string;
  readonly shelfId: string;
  readonly shelfTitle: string;
  readonly authorName: string;
  readonly body: string;
  readonly status: "VISIBLE" | "HIDDEN";
  readonly createdAt: string;
  readonly parentId: string | null;
}

export interface StudioSettings {
  readonly creator: {
    readonly id: string;
    readonly displayName: string;
    readonly bio: string;
    readonly category: string;
    readonly affiliateTag: string;
  };
  readonly channels: readonly {
    readonly type: SocialChannelType;
    readonly value: string;
    readonly enabled: boolean;
  }[];
}

interface CreatorRow {
  readonly id: string;
  readonly displayName: string;
  readonly bio: string;
  readonly category: string;
  readonly affiliateTag: string;
}

interface CommentTargetRow {
  readonly shelfId: string;
}

interface StudioCommentRow {
  readonly id: string;
  readonly shelfId: string;
  readonly shelfTitle: string;
  readonly authorName: string;
  readonly body: string;
  readonly status: "VISIBLE" | "HIDDEN";
  readonly createdAt: string;
  readonly parentId: string | null;
}

export interface StudioActionOptions {
  readonly createId?: () => string;
  readonly now?: () => Date;
}

function requireCreator(
  database: DatabaseSync,
  session: AuthSession | null,
): { readonly ok: true; readonly creator: CreatorRow } | { readonly ok: false; readonly reason: StudioFailureReason } {
  if (!session) return { ok: false, reason: "UNAUTHENTICATED" };
  if (session.user.role !== "CREATOR") return { ok: false, reason: "FORBIDDEN" };

  const creator = database
    .prepare(
      `SELECT
         id,
         display_name AS displayName,
         bio,
         category,
         affiliate_tag AS affiliateTag
       FROM creator_profiles
       WHERE user_id = ?
       LIMIT 1`,
    )
    .get(session.user.id) as CreatorRow | undefined;

  return creator ? { ok: true, creator } : { ok: false, reason: "FORBIDDEN" };
}

function nowIso(options: StudioActionOptions = {}) {
  return (options.now ?? (() => new Date()))().toISOString();
}

function trimmed(value: string | undefined) {
  return value?.trim() ?? "";
}

function commentTargetForCreator(
  database: DatabaseSync,
  input: {
    readonly commentId: string;
    readonly creatorId: string;
  },
): CommentTargetRow | null {
  const row = database
    .prepare(
      `SELECT comments.shelf_id AS shelfId
       FROM comments
       INNER JOIN shelves ON shelves.id = comments.shelf_id
       WHERE comments.id = ?
         AND shelves.creator_id = ?
         AND shelves.deleted_at IS NULL
         AND comments.deleted_at IS NULL
       LIMIT 1`,
    )
    .get(input.commentId, input.creatorId) as CommentTargetRow | undefined;
  return row ?? null;
}

export function listStudioComments(
  database: DatabaseSync,
  session: AuthSession | null,
  input: {
    readonly shelfId?: string;
    readonly sort?: "newest" | "oldest";
  } = {},
): StudioActionResult<{ readonly comments: readonly StudioComment[] }> {
  const creator = requireCreator(database, session);
  if (!creator.ok) return creator;

  const params: string[] = [creator.creator.id];
  const filters = ["shelves.creator_id = ?", "comments.deleted_at IS NULL"];
  if (input.shelfId) {
    filters.push("shelves.id = ?");
    params.push(input.shelfId);
  }

  const rows = database
    .prepare(
      `SELECT
         comments.id AS id,
         comments.shelf_id AS shelfId,
         shelves.title AS shelfTitle,
         users.display_name AS authorName,
         comments.body AS body,
         comments.status AS status,
         comments.created_at AS createdAt,
         comments.parent_id AS parentId
       FROM comments
       INNER JOIN shelves ON shelves.id = comments.shelf_id
       INNER JOIN users ON users.id = comments.user_id
       WHERE ${filters.join(" AND ")}
       ORDER BY comments.created_at ${input.sort === "oldest" ? "ASC" : "DESC"}`,
    )
    .all(...params) as unknown as StudioCommentRow[];

  return { ok: true, comments: rows };
}

export function replyToComment(
  database: DatabaseSync,
  input: {
    readonly commentId: string;
    readonly body: string;
  },
  session: AuthSession | null,
  options: StudioActionOptions = {},
): StudioActionResult<{ readonly commentId: string }> {
  const creator = requireCreator(database, session);
  if (!creator.ok) return creator;
  if (!session) return { ok: false, reason: "UNAUTHENTICATED" };
  const body = trimmed(input.body);
  if (!body) return { ok: false, reason: "INVALID_INPUT" };

  const target = commentTargetForCreator(database, {
    commentId: input.commentId,
    creatorId: creator.creator.id,
  });
  if (!target) return { ok: false, reason: "NOT_FOUND" };

  const id = options.createId?.() ?? `comment-${randomUUID()}`;
  const createdAt = nowIso(options);
  database
    .prepare(
      `INSERT INTO comments
         (id, shelf_id, user_id, parent_id, body, status, created_at, updated_at, deleted_at)
       VALUES (?, ?, ?, ?, ?, 'VISIBLE', ?, ?, NULL)`,
    )
    .run(id, target.shelfId, session.user.id, input.commentId, body, createdAt, createdAt);
  return { ok: true, commentId: id };
}

export function softDeleteComment(
  database: DatabaseSync,
  input: {
    readonly commentId: string;
  },
  session: AuthSession | null,
  options: StudioActionOptions = {},
): StudioActionResult {
  const creator = requireCreator(database, session);
  if (!creator.ok) return creator;
  const target = commentTargetForCreator(database, {
    commentId: input.commentId,
    creatorId: creator.creator.id,
  });
  if (!target) return { ok: false, reason: "NOT_FOUND" };

  const deletedAt = nowIso(options);
  database
    .prepare(
      `UPDATE comments
       SET status = 'HIDDEN',
           deleted_at = ?,
           updated_at = ?
       WHERE id = ?`,
    )
    .run(deletedAt, deletedAt, input.commentId);
  return { ok: true };
}

export function saveCreatorProfile(
  database: DatabaseSync,
  input: {
    readonly displayName: string;
    readonly bio: string;
    readonly category: string;
  },
  session: AuthSession | null,
  options: StudioActionOptions = {},
): StudioActionResult {
  const creator = requireCreator(database, session);
  if (!creator.ok) return creator;
  if (!session) return { ok: false, reason: "UNAUTHENTICATED" };
  const displayName = trimmed(input.displayName);
  const bio = trimmed(input.bio);
  const category = trimmed(input.category);
  if (!displayName || !bio || !category) return { ok: false, reason: "INVALID_INPUT" };

  const updatedAt = nowIso(options);
  database
    .prepare(
      `UPDATE creator_profiles
       SET display_name = ?,
           bio = ?,
           category = ?,
           updated_at = ?
       WHERE id = ?`,
    )
    .run(displayName, bio, category, updatedAt, creator.creator.id);
  database
    .prepare("UPDATE users SET display_name = ?, updated_at = ? WHERE id = ?")
    .run(displayName, updatedAt, session.user.id);
  return { ok: true };
}

export function saveCreatorTrackingId(
  database: DatabaseSync,
  input: {
    readonly affiliateTag: string;
  },
  session: AuthSession | null,
  options: StudioActionOptions = {},
): StudioActionResult {
  const creator = requireCreator(database, session);
  if (!creator.ok) return creator;
  if (!session) return { ok: false, reason: "UNAUTHENTICATED" };
  const affiliateTag = trimmed(input.affiliateTag);
  if (!/^[a-z0-9][a-z0-9-]{2,63}$/i.test(affiliateTag)) {
    return { ok: false, reason: "INVALID_INPUT" };
  }

  const updatedAt = nowIso(options);
  database
    .prepare("UPDATE creator_profiles SET affiliate_tag = ?, updated_at = ? WHERE id = ?")
    .run(affiliateTag, updatedAt, creator.creator.id);
  database
    .prepare("UPDATE users SET affiliate_tag = ?, updated_at = ? WHERE id = ?")
    .run(affiliateTag, updatedAt, session.user.id);
  return { ok: true };
}

export function setShareChannelEnabled(
  database: DatabaseSync,
  input: {
    readonly type: SocialChannelType;
    readonly enabled: boolean;
  },
  session: AuthSession | null,
  options: StudioActionOptions = {},
): StudioActionResult {
  const creator = requireCreator(database, session);
  if (!creator.ok) return creator;
  const updatedAt = nowIso(options);
  const result = database
    .prepare(
      `UPDATE social_channels
       SET enabled = ?,
           updated_at = ?
       WHERE creator_id = ?
         AND type = ?`,
    )
    .run(input.enabled ? BigInt(1) : BigInt(0), updatedAt, creator.creator.id, input.type);
  return result.changes > 0 ? { ok: true } : { ok: false, reason: "NOT_FOUND" };
}

export function getStudioSettings(
  database: DatabaseSync,
  session: AuthSession | null,
): StudioActionResult<StudioSettings> {
  const creator = requireCreator(database, session);
  if (!creator.ok) return creator;
  const channels = database
    .prepare(
      `SELECT type, value, enabled
       FROM social_channels
       WHERE creator_id = ?
       ORDER BY sort_position`,
    )
    .all(creator.creator.id) as Array<{
      type: SocialChannelType;
      value: string;
      enabled: number | bigint;
    }>;

  return {
    ok: true,
    creator: creator.creator,
    channels: channels.map((channel) => ({
      type: channel.type,
      value: channel.value,
      enabled: channel.enabled === 1 || channel.enabled === BigInt(1),
    })),
  };
}

export function deleteCreatorAccount(
  database: DatabaseSync,
  input: {
    readonly confirmation: string;
  },
  session: AuthSession | null,
  options: StudioActionOptions = {},
): StudioActionResult {
  const creator = requireCreator(database, session);
  if (!creator.ok) return creator;
  if (!session) return { ok: false, reason: "UNAUTHENTICATED" };
  if (input.confirmation !== "DELETE") {
    return { ok: false, reason: "CONFIRMATION_REQUIRED" };
  }

  const deletedAt = nowIso(options);
  database.exec("BEGIN IMMEDIATE TRANSACTION");
  try {
    database
      .prepare("UPDATE users SET deleted_at = ?, updated_at = ? WHERE id = ?")
      .run(deletedAt, deletedAt, session.user.id);
    database
      .prepare(
        `UPDATE shelves
         SET deleted_at = COALESCE(deleted_at, ?),
             updated_at = ?
         WHERE creator_id = ?`,
      )
      .run(deletedAt, deletedAt, creator.creator.id);
    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }

  return { ok: true };
}
