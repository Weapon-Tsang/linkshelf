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

    const appliedMigrations = database
      .prepare("SELECT version, name FROM schema_migrations ORDER BY version")
      .all() as Array<{ version: number; name: string }>;
    const migrationsByVersion = new Map(
      schemaMigrations.map((migration) => [migration.version, migration]),
    );

    for (const appliedMigration of appliedMigrations) {
      const expectedMigration = migrationsByVersion.get(appliedMigration.version);
      if (!expectedMigration) {
        throw new Error(`Recorded migration ${appliedMigration.version} is not defined`);
      }
      if (expectedMigration.name !== appliedMigration.name) {
        throw new Error(
          `Recorded migration ${appliedMigration.version} is named "${appliedMigration.name}"; ` +
            `expected "${expectedMigration.name}"`,
        );
      }
    }

    const appliedVersions = new Set(appliedMigrations.map((migration) => migration.version));
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

    const foreignKeyViolations = database.prepare("PRAGMA foreign_key_check").all();
    if (foreignKeyViolations.length > 0) {
      throw new Error(
        `Migration left ${foreignKeyViolations.length} foreign key violation(s): ` +
          JSON.stringify(foreignKeyViolations),
      );
    }

    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}
