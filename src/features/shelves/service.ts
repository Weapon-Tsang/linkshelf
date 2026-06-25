import type { DatabaseSync } from "node:sqlite";
import { createDatabase } from "@/lib/db/client";
import { migrate } from "@/lib/db/migrate";
import { seed } from "@/lib/db/seed";
import {
  findEnabledSocialChannels,
  findFeaturedPublicProducts,
  findPublicCreator,
  findPublicProfileShelves,
  findPublicShelfByCreator,
  findPublicShelfProducts,
} from "./repository";
import type { CreatorProfileResult, PublicShelfResult } from "./types";

let publicShelvesDatabase: DatabaseSync | null = null;

export function openPublicShelvesDatabase(nodeEnv = process.env.NODE_ENV): DatabaseSync {
  const database = createDatabase();
  migrate(database);
  if (nodeEnv !== "production") {
    seed(database);
  }
  return database;
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
