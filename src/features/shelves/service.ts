import type { DatabaseSync } from "node:sqlite";
import { openApplicationDatabase } from "@/lib/db/runtime";
import {
  findEnabledSocialChannels,
  findFeaturedPublicProducts,
  findPublicCreator,
  findPublicProfileShelves,
  findPublicShareCode,
  findPublicShelfByCreator,
  findPublicShelfProducts,
} from "./repository";
import type { CreatorProfileResult, PublicShelfResult } from "./types";

let publicShelvesDatabase: DatabaseSync | null = null;

export function openPublicShelvesDatabase(nodeEnv = process.env.NODE_ENV): DatabaseSync {
  return openApplicationDatabase({
    NODE_ENV: nodeEnv,
    LINKSHELF_DB_PATH: process.env.LINKSHELF_DB_PATH,
  });
}

export function getSharedPublicShelvesDatabase(): DatabaseSync {
  publicShelvesDatabase ??= openPublicShelvesDatabase();
  return publicShelvesDatabase;
}

export function getCreatorProfile(
  database: DatabaseSync,
  handle: string,
): CreatorProfileResult {
  const creator = findPublicCreator(database, handle);
  if (!creator) {
    return {
      ok: false,
      reason: "CREATOR_NOT_FOUND",
    };
  }

  return {
    ok: true,
    profile: {
      creator,
      socialChannels: findEnabledSocialChannels(database, creator.id),
      shelves: findPublicProfileShelves(database, creator.id),
      featuredProducts: findFeaturedPublicProducts(database, creator.id),
    },
  };
}

export function getPublicShelf(
  database: DatabaseSync,
  input: {
    readonly creatorHandle: string;
    readonly shelfId: string;
  },
): PublicShelfResult {
  const creator = findPublicCreator(database, input.creatorHandle);
  if (!creator) {
    return {
      ok: false,
      reason: "CREATOR_NOT_FOUND",
    };
  }

  const shelf = findPublicShelfByCreator(database, {
    creatorId: creator.id,
    shelfId: input.shelfId,
  });
  if (!shelf) {
    return {
      ok: false,
      reason: "SHELF_NOT_FOUND",
    };
  }

  return {
    ok: true,
    shelf: {
      ...shelf,
      creator,
      socialChannels: findEnabledSocialChannels(database, creator.id),
      products: findPublicShelfProducts(database, shelf.id),
    },
  };
}

export type PublicShareCodeInput = string | readonly string[] | null | undefined;

function normalizeShareCode(shareCode: PublicShareCodeInput): string | null {
  if (typeof shareCode !== "string") {
    return null;
  }

  const trimmed = shareCode.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function validatePublicShareCode(
  database: DatabaseSync,
  input: {
    readonly shelfId: string;
    readonly shareCode: PublicShareCodeInput;
  },
): string | null {
  const shareCode = normalizeShareCode(input.shareCode);
  if (!shareCode) {
    return null;
  }

  return findPublicShareCode(database, {
    shelfId: input.shelfId,
    shareCode,
  });
}
