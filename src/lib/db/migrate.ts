import type { DatabaseSync } from "node:sqlite";
import { schemaMigrations } from "@/lib/db/schema";

export function migrate(database: DatabaseSync): void {
  database.exec("BEGIN IMMEDIATE TRANSACTION");

  try {
    database.exec(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        applied_at TEXT NOT NULL
      )
    `);

    const appliedVersions = new Set(
      database
        .prepare("SELECT version FROM schema_migrations")
        .all()
        .map((row) => (row as { version: number }).version),
    );
    const recordMigration = database.prepare(
      `INSERT INTO schema_migrations (version, name, applied_at)
       VALUES (?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`,
    );

    for (const migration of schemaMigrations) {
      if (appliedVersions.has(migration.version)) {
        continue;
      }

      database.exec(migration.sql);
      recordMigration.run(migration.version, migration.name);
    }

    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}
