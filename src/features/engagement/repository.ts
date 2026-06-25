import type { DatabaseSync } from "node:sqlite";
import type { SocialChannelType } from "@/features/shelves/types";
import type { CommentStatus, SaveTargetType } from "./types";

export interface EngagementShelfContext {
  readonly id: string;
  readonly slug: string;
  readonly creatorId: string;
  readonly creatorHandle: string;
}

export interface InsertShareInput {
  readonly id: string;
  readonly shelfId: string;
  readonly fanUserId: string;
  readonly shortCode: string;
  readonly channel: SocialChannelType;
  readonly createdAt: string;
}

export interface InsertSaveInput {
  readonly id: string;
  readonly userId: string;
  readonly targetType: SaveTargetType;
  readonly targetId: string;
  readonly createdAt: string;
}

export interface InsertCommentInput {
  readonly id: string;
  readonly shelfId: string;
  readonly userId: string;
  readonly parentId: string | null;
  readonly body: string;
  readonly status: CommentStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
}

interface SaveRow {
  readonly id: string;
}

interface CommentParentRow {
  readonly id: string;
}

export function findEngagementShelf(
  database: DatabaseSync,
  shelfId: string,
): EngagementShelfContext | null {
  const row = database
    .prepare(
      `SELECT
         shelves.id AS id,
         shelves.slug AS slug,
         creator_profiles.id AS creatorId,
         creator_profiles.handle AS creatorHandle
       FROM shelves
       INNER JOIN creator_profiles ON creator_profiles.id = shelves.creator_id
       WHERE shelves.id = ?
         AND shelves.status = 'PUBLISHED'
         AND shelves.deleted_at IS NULL
       LIMIT 1`,
    )
    .get(shelfId) as EngagementShelfContext | undefined;

  return row ?? null;
}

export function isCreatorChannelEnabled(
  database: DatabaseSync,
  input: {
    readonly creatorId: string;
    readonly channel: SocialChannelType;
  },
): boolean {
  const row = database
    .prepare(
      `SELECT 1 AS ok
       FROM social_channels
       WHERE creator_id = ?
         AND type = ?
         AND enabled = 1
       LIMIT 1`,
    )
    .get(input.creatorId, input.channel) as { ok: number } | undefined;

  return row?.ok === 1;
}

export function insertShare(database: DatabaseSync, input: InsertShareInput): void {
  database
    .prepare(
      `INSERT INTO shares (id, shelf_id, fan_user_id, short_code, channel, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(
      input.id,
      input.shelfId,
      input.fanUserId,
      input.shortCode,
      input.channel,
      input.createdAt,
    );
}

export function findSave(
  database: DatabaseSync,
  input: {
    readonly userId: string;
    readonly targetType: SaveTargetType;
    readonly targetId: string;
  },
): string | null {
  const row = database
    .prepare(
      `SELECT id
       FROM saves
       WHERE user_id = ?
         AND target_type = ?
         AND target_id = ?
       LIMIT 1`,
    )
    .get(input.userId, input.targetType, input.targetId) as SaveRow | undefined;

  return row?.id ?? null;
}

export function insertSave(database: DatabaseSync, input: InsertSaveInput): void {
  database
    .prepare(
      `INSERT OR IGNORE INTO saves (id, user_id, target_type, target_id, created_at)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .run(input.id, input.userId, input.targetType, input.targetId, input.createdAt);
}

export function deleteSave(
  database: DatabaseSync,
  input: {
    readonly userId: string;
    readonly targetType: SaveTargetType;
    readonly targetId: string;
  },
): void {
  database
    .prepare(
      `DELETE FROM saves
       WHERE user_id = ?
         AND target_type = ?
         AND target_id = ?`,
    )
    .run(input.userId, input.targetType, input.targetId);
}

export function publicSaveTargetExists(
  database: DatabaseSync,
  input: {
    readonly targetType: SaveTargetType;
    readonly targetId: string;
  },
): boolean {
  if (input.targetType === "CREATOR") {
    const row = database
      .prepare("SELECT 1 AS ok FROM creator_profiles WHERE id = ? LIMIT 1")
      .get(input.targetId) as { ok: number } | undefined;
    return row?.ok === 1;
  }

  return findEngagementShelf(database, input.targetId) !== null;
}

export function findCommentParent(
  database: DatabaseSync,
  input: {
    readonly shelfId: string;
    readonly parentId: string;
  },
): string | null {
  const row = database
    .prepare(
      `SELECT id
       FROM comments
       WHERE id = ?
         AND shelf_id = ?
         AND status = 'VISIBLE'
         AND deleted_at IS NULL
       LIMIT 1`,
    )
    .get(input.parentId, input.shelfId) as CommentParentRow | undefined;

  return row?.id ?? null;
}

export function insertComment(database: DatabaseSync, input: InsertCommentInput): void {
  database
    .prepare(
      `INSERT INTO comments
        (id, shelf_id, user_id, parent_id, body, status, created_at, updated_at, deleted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
    )
    .run(
      input.id,
      input.shelfId,
      input.userId,
      input.parentId,
      input.body,
      input.status,
      input.createdAt,
      input.updatedAt,
    );
}
