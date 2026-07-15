# Persistent Database Design

## Goal

Sprint 26 replaces demo persistence assumptions with an explicit production
database contract. The selected MVP production strategy is file-backed SQLite on
an explicit persistent volume path, with repeatable migrations, no implicit
production seed data, and documented backup/restore procedures.

## Project Health

- Current branch: `codex/linkshelf-mvp`.
- Current phase: Feature Freeze / Production Readiness.
- Sprint 25 is complete at `2b2241a feat: harden production google oauth`.
- Baseline database verification passed on 2026-07-15:
  `vitest run tests/integration/database.test.ts
  tests/integration/auth-production.test.ts tests/integration/affiliate-route.test.ts`,
  39 tests.

## Scope

In scope:

- Select and document the production persistence strategy.
- Require an explicit production database path.
- Prevent implicit production seed overwrite.
- Keep migrations reproducible and transactional.
- Document migration, backup, restore, and provisioning workflows.
- Verify auth, affiliate redirects, Studio, Fan Hub, and Admin database
  boundaries against the selected persistence contract.

Out of scope:

- Switching to PostgreSQL, Turso, Neon, PlanetScale, or another managed provider.
- Selecting a deployment host.
- Deployment descriptors, release rollout, monitoring, Amazon live API work, or
  visual polish.
- Building admin UI for user provisioning or backup management.

## Alternatives Considered

### Managed SQL Provider Now

This would move production persistence to a managed database immediately. It
improves hosting flexibility but forces provider selection before Sprint 27
deployment work and requires a query adapter rewrite outside the current MVP
shape. It is deferred.

### File-Backed SQLite On Persistent Volume

This keeps the current `node:sqlite` repository layer, adds an explicit
production path contract, and relies on a mounted persistent disk in Sprint 27.
It is the selected strategy for this MVP release because it is the smallest
production-safe step from the current code.

### Documentation-Only Deferral

This would leave the app using `data/linkshelf.db` implicitly in production. It
does not satisfy seed-safety or persistence clarity, so it is rejected.

## Selected Design

### Runtime Contract

Production requires:

- `NODE_ENV=production`
- `LINKSHELF_DB_PATH` set to an absolute file path on a persistent volume.

Production rejects:

- Missing `LINKSHELF_DB_PATH`.
- `LINKSHELF_DB_PATH=:memory:`.
- Relative production database paths.

Development and tests may continue to use `:memory:` or the default
`data/linkshelf.db`.

### Central Database Opening

A shared database runtime module will resolve the app database path, open
SQLite, run migrations, and seed only outside production. Auth, public shelves,
and affiliate redirects will use this shared initializer instead of each route
duplicating migration/seed decisions.

### Seed Safety

`seed()` remains available for tests and development. Production app open paths
must not call it. Reopening a production database after data changes must leave
user data intact and must not recreate demo users, shelves, wallet entries, or
comments.

### Migration Safety

`migrate()` remains the only schema setup path. It is transactional, records
applied migrations, rejects unknown/tampered migration history, and checks
foreign keys after migration. Sprint 26 documents the runbook and adds app-level
tests for production open behavior.

### Backup And Restore

The MVP backup strategy is SQLite file backup after a WAL checkpoint:

1. Stop writes or put the app in maintenance mode.
2. Run `PRAGMA wal_checkpoint(TRUNCATE)`.
3. Copy the database file to the backup directory with a timestamped name.
4. Restore by stopping the app, replacing the database file from backup, and
   running migrations on next start.

This is documented rather than exposed through product UI.

## Testing

Tests will prove:

- Production database open requires an absolute `LINKSHELF_DB_PATH`.
- Production rejects `:memory:` and relative paths.
- Production open runs migrations but does not seed demo data.
- Production data survives close/reopen cycles and is not overwritten by seed.
- Development open still seeds demo data.
- Auth and affiliate open paths use the shared production database initializer.

## Risks

- Deployment compatibility with `node:sqlite` and persistent disks is not proven
  until Sprint 27.
- SQLite may not be the final long-term scaling story; this sprint makes it a
  deliberate MVP production contract rather than an accidental local default.
- Backups are operator-run and manual until deployment/monitoring work defines
  automation.

## Success Criteria

- Production DB provider/path is documented.
- Production app startup requires an explicit persistent SQLite file path.
- Migrations are reproducible.
- Demo seed data cannot overwrite production data.
- Backup/restore runbook exists.
- Relevant tests and final verification pass.
