# Persistent Database Runbook

Last updated: 2026-07-15 Asia/Shanghai

## Status

Sprint 26 selects file-backed SQLite on an explicit persistent volume as the MVP
production database strategy. This keeps the current `node:sqlite` repository
layer while removing the unsafe local-demo assumptions:

- Production requires an explicit absolute `LINKSHELF_DB_PATH`.
- Production app open paths run migrations.
- Production app open paths do not run demo seed data.
- Development and tests may still use `data/linkshelf.db` or `:memory:`.

Deployment-platform compatibility with `node:sqlite` and persistent disks is
still a Sprint 27 responsibility.

## Required Environment

Production requires:

| Variable | Required | Notes |
| --- | --- | --- |
| `NODE_ENV` | yes | Must be `production` in production. |
| `LINKSHELF_DB_PATH` | yes | Absolute path to the SQLite database file on persistent storage. |

Examples:

```bash
LINKSHELF_DB_PATH=/var/lib/linkshelf/linkshelf.db
LINKSHELF_DB_PATH=/data/linkshelf/linkshelf.db
```

Production rejects:

- Missing `LINKSHELF_DB_PATH`.
- `LINKSHELF_DB_PATH=:memory:`.
- Relative paths such as `data/linkshelf.db`.

## Runtime Behavior

The shared runtime is `src/lib/db/runtime.ts`.

It performs this startup sequence:

1. Resolve the database path.
2. Open SQLite with foreign keys, busy timeout, and WAL mode for file databases.
3. Run all unapplied schema migrations in a transaction.
4. Run demo seed data only outside production.

The following application open paths use the shared runtime:

- Auth: `openAuthDatabase()`.
- Public shelves and Studio/Fan/Admin shared database: `openPublicShelvesDatabase()`.
- Affiliate redirects: `openAffiliateDatabase()`.

## Migration Runbook

1. Deploy the code containing the new migration.
2. Ensure `LINKSHELF_DB_PATH` points at the persistent production database file.
3. Start the app or run the first production request path; migrations run before
   repositories query the database.
4. Check `schema_migrations`:

```sql
SELECT version, name, applied_at
FROM schema_migrations
ORDER BY version;
```

5. Confirm `PRAGMA foreign_key_check;` returns no rows.

Migrations are versioned in `src/lib/db/schema.ts`. Never edit a migration after
it has shipped; add a new migration instead.

## Seed Safety

`seed()` is for development and tests only. Production runtime paths do not call
it. A production database starts with schema only, then must be provisioned with
real users and content.

User provisioning for Google OAuth still follows
`docs/production-google-oauth.md`: create or update a local `users` row with
the verified Google subject and intended role.

## Backup

Manual backup procedure:

1. Stop writes or put the app in maintenance mode.
2. Open the database with SQLite.
3. Run:

```sql
PRAGMA wal_checkpoint(TRUNCATE);
```

4. Copy the database file to a timestamped backup path.

Example:

```bash
mkdir -p /var/backups/linkshelf
sqlite3 "$LINKSHELF_DB_PATH" "PRAGMA wal_checkpoint(TRUNCATE);"
cp "$LINKSHELF_DB_PATH" "/var/backups/linkshelf/linkshelf-$(date -u +%Y%m%dT%H%M%SZ).db"
```

Retain backups according to the deployment operator's policy until Sprint 28
monitoring/operations defines automated retention.

## Restore

Manual restore procedure:

1. Stop the app.
2. Copy the selected backup over `LINKSHELF_DB_PATH`.
3. Remove stale WAL/SHM sidecar files if present:

```bash
rm -f "$LINKSHELF_DB_PATH-wal" "$LINKSHELF_DB_PATH-shm"
```

4. Start the app.
5. Confirm migrations and foreign keys:

```sql
SELECT version, name, applied_at
FROM schema_migrations
ORDER BY version;
PRAGMA foreign_key_check;
```

## Verification

Sprint 26 automated verification covers:

- Required production database path validation.
- Production rejection of memory and relative paths.
- Migration-only production database startup.
- Development demo seeding remains available.
- Production data survives close/reopen.
- Auth and affiliate database open paths share the production initializer.

Known remaining work:

- Sprint 27 must choose a deployment target and prove persistent disk behavior.
- Sprint 28 should automate or monitor backup freshness.
