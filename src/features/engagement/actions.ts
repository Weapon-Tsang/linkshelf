import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import type { AuthSession } from "@/features/auth/adapter";
import type { SocialChannelType } from "@/features/shelves/types";
import {
  deleteSave,
  findCommentParent,
  findEngagementShelf,
  findSave,
  insertComment,
  insertSave,
  insertShare,
  isCreatorChannelEnabled,
  publicSaveTargetExists,
} from "./repository";
import type { EngagementActionFailureReason, SaveTargetType } from "./types";

type EngagementSession = Pick<AuthSession, "user"> | null;

export type EngagementActionResult<T> =
  | ({ readonly ok: true } & T)
  | {
      readonly ok: false;
      readonly reason: EngagementActionFailureReason;
    };

export interface CreateShareOptions {
  readonly createId?: () => string;
  readonly createShortCode?: () => string;
  readonly now?: () => Date;
}

export interface ToggleSaveOptions {
  readonly createId?: () => string;
  readonly now?: () => Date;
}

export interface AddCommentOptions {
  readonly createId?: () => string;
  readonly now?: () => Date;
}

function requireFanLikeSession(
  session: EngagementSession,
): EngagementActionResult<{ readonly userId: string }> {
  if (!session) {
    return { ok: false, reason: "UNAUTHENTICATED" };
  }

  if (session.user.role === "ADMIN") {
    return { ok: false, reason: "FORBIDDEN" };
  }

  return { ok: true, userId: session.user.id };
}

function defaultShortCode() {
  return randomUUID().slice(0, 8);
}

function isSafeShortCode(shortCode: string) {
  return /^[A-Za-z0-9][A-Za-z0-9-]{2,48}$/.test(shortCode);
}

export function createShare(
  database: DatabaseSync,
  input: {
    readonly shelfId: string;
    readonly channel: SocialChannelType;
  },
  session: EngagementSession,
  options: CreateShareOptions = {},
): EngagementActionResult<{
  readonly share: {
    readonly id: string;
    readonly shelfId: string;
    readonly fanUserId: string;
    readonly shortCode: string;
    readonly channel: SocialChannelType;
    readonly shareUrl: string;
  };
}> {
  const actor = requireFanLikeSession(session);
  if (!actor.ok) return actor;

  const shelf = findEngagementShelf(database, input.shelfId);
  if (!shelf) {
    return { ok: false, reason: "NOT_FOUND" };
  }
  if (
    !isCreatorChannelEnabled(database, {
      creatorId: shelf.creatorId,
      channel: input.channel,
    })
  ) {
    return { ok: false, reason: "CHANNEL_DISABLED" };
  }

  const shortCode = (options.createShortCode ?? defaultShortCode)();
  if (!isSafeShortCode(shortCode)) {
    return { ok: false, reason: "INVALID_INPUT" };
  }

  const id = (options.createId ?? randomUUID)();
  const createdAt = (options.now ?? (() => new Date()))().toISOString();
  try {
    insertShare(database, {
      id,
      shelfId: shelf.id,
      fanUserId: actor.userId,
      shortCode,
      channel: input.channel,
      createdAt,
    });
  } catch {
    return { ok: false, reason: "CONFLICT" };
  }

  return {
    ok: true,
    share: {
      id,
      shelfId: shelf.id,
      fanUserId: actor.userId,
      shortCode,
      channel: input.channel,
      shareUrl: `/${shelf.creatorHandle}/${shelf.slug}?share=${encodeURIComponent(shortCode)}`,
    },
  };
}

export function toggleSave(
  database: DatabaseSync,
  input: {
    readonly targetType: SaveTargetType;
    readonly targetId: string;
    readonly saved?: boolean;
  },
  session: EngagementSession,
  options: ToggleSaveOptions = {},
): EngagementActionResult<{ readonly saved: boolean }> {
  const actor = requireFanLikeSession(session);
  if (!actor.ok) return actor;

  if (
    !publicSaveTargetExists(database, {
      targetType: input.targetType,
      targetId: input.targetId,
    })
  ) {
    return { ok: false, reason: "NOT_FOUND" };
  }

  const existingSave = findSave(database, {
    userId: actor.userId,
    targetType: input.targetType,
    targetId: input.targetId,
  });
  const nextSaved = input.saved ?? existingSave === null;

  if (nextSaved) {
    insertSave(database, {
      id: existingSave ?? (options.createId ?? randomUUID)(),
      userId: actor.userId,
      targetType: input.targetType,
      targetId: input.targetId,
      createdAt: (options.now ?? (() => new Date()))().toISOString(),
    });
    return { ok: true, saved: true };
  }

  deleteSave(database, {
    userId: actor.userId,
    targetType: input.targetType,
    targetId: input.targetId,
  });
  return { ok: true, saved: false };
}

export function addComment(
  database: DatabaseSync,
  input: {
    readonly shelfId: string;
    readonly body: string;
    readonly parentId?: string | null;
  },
  session: EngagementSession,
  options: AddCommentOptions = {},
): EngagementActionResult<{
  readonly comment: {
    readonly id: string;
    readonly shelfId: string;
    readonly userId: string;
    readonly parentId: string | null;
    readonly body: string;
    readonly status: "VISIBLE";
  };
}> {
  const actor = requireFanLikeSession(session);
  if (!actor.ok) return actor;

  const body = input.body.trim();
  if (!body) {
    return { ok: false, reason: "INVALID_INPUT" };
  }

  const shelf = findEngagementShelf(database, input.shelfId);
  if (!shelf) {
    return { ok: false, reason: "NOT_FOUND" };
  }

  const parentId = input.parentId ?? null;
  if (
    parentId &&
    !findCommentParent(database, {
      shelfId: shelf.id,
      parentId,
    })
  ) {
    return { ok: false, reason: "NOT_FOUND" };
  }

  const id = (options.createId ?? randomUUID)();
  const now = (options.now ?? (() => new Date()))().toISOString();
  insertComment(database, {
    id,
    shelfId: shelf.id,
    userId: actor.userId,
    parentId,
    body,
    status: "VISIBLE",
    createdAt: now,
    updatedAt: now,
  });

  return {
    ok: true,
    comment: {
      id,
      shelfId: shelf.id,
      userId: actor.userId,
      parentId,
      body,
      status: "VISIBLE",
    },
  };
}
