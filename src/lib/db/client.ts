import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

export function createDatabase(
  path = process.env.LINKSHELF_DB_PATH ?? "data/linkshelf.db",
): DatabaseSync {
  const isMemoryDatabase = path === ":memory:";

  if (!isMemoryDatabase) {
    mkdirSync(dirname(resolve(path)), { recursive: true });
  }

  const database = new DatabaseSync(path);
  database.exec("PRAGMA foreign_keys = ON");
  database.exec("PRAGMA busy_timeout = 5000");

  if (!isMemoryDatabase) {
    database.exec("PRAGMA journal_mode = WAL");
  }

  return database;
}
