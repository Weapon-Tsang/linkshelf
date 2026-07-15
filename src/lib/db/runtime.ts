import { isAbsolute } from "node:path";
import type { DatabaseSync } from "node:sqlite";
import { createDatabase } from "@/lib/db/client";
import { migrate } from "@/lib/db/migrate";
import { seed } from "@/lib/db/seed";

export interface DatabaseRuntimeEnvironment {
  readonly NODE_ENV?: string;
  readonly LINKSHELF_DB_PATH?: string;
}

export function shouldSeedDemoData(
  environment: Pick<DatabaseRuntimeEnvironment, "NODE_ENV"> = process.env,
): boolean {
  return environment.NODE_ENV !== "production";
}

export function resolveApplicationDatabasePath(
  environment: DatabaseRuntimeEnvironment = process.env,
): string {
  const configuredPath = environment.LINKSHELF_DB_PATH?.trim();

  if (environment.NODE_ENV !== "production") {
    return configuredPath || "data/linkshelf.db";
  }

  if (!configuredPath) {
    throw new Error("LINKSHELF_DB_PATH is required in production");
  }
  if (configuredPath === ":memory:") {
    throw new Error("LINKSHELF_DB_PATH must be file-backed in production");
  }
  if (!isAbsolute(configuredPath)) {
    throw new Error("LINKSHELF_DB_PATH must be an absolute path in production");
  }

  return configuredPath;
}

export function openApplicationDatabase(
  environment: DatabaseRuntimeEnvironment = process.env,
): DatabaseSync {
  const database = createDatabase(resolveApplicationDatabasePath(environment));
  migrate(database);
  if (shouldSeedDemoData(environment)) {
    seed(database);
  }
  return database;
}
