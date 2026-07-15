# Sprint 27 Deployment Design

Last updated: 2026-07-15 Asia/Shanghai

## Goal

Make LinkShelf deployable and operable from Git with a production-like runtime
that matches the Sprint 25 Google OAuth hardening and Sprint 26 persistent
SQLite decisions.

## Context

The repository currently builds a Next.js 16 application with Node.js 24 and
pnpm 11.7.0. Production auth requires `AUTH_SECRET`, `NEXTAUTH_URL`,
`AUTH_GOOGLE_ID`, and `AUTH_GOOGLE_SECRET`. Production persistence requires an
absolute `LINKSHELF_DB_PATH` on durable storage. No deployment descriptors are
present before Sprint 27.

## Approaches Considered

1. **Managed platform-specific descriptor**
   - Examples: Fly.io, Render, Railway, or Vercel plus external persistence.
   - Benefit: closer to a future hosted preview.
   - Cost: needs account, credentials, and platform-specific assumptions not
     available in this workspace.

2. **Generic Docker and Compose baseline**
   - Benefit: reproducible from Git, compatible with any host that can run a
     container and persistent volume, and testable without live credentials.
   - Cost: does not create a real public URL by itself.

3. **Documentation-only deployment runbook**
   - Benefit: lowest code risk.
   - Cost: not enough operational proof; it leaves build/start details
     implicit.

Chosen approach: generic Docker and Compose baseline. It gives LinkShelf a real
production-like artifact, a persistent database mount, and a health check without
inventing cloud-account state.

## Architecture

Next.js will emit standalone server output so the Docker runtime image can copy
only `.next/standalone`, `.next/static`, and `public`. The runtime image will run
as a non-root user, expose port 3000, and keep SQLite under
`/data/linkshelf/linkshelf.db`.

`compose.yml` will define a single `linkshelf` service with required production
environment variables, a named persistent volume at `/data/linkshelf`, and a
container health check against `/api/health`. The Compose file is the local and
staging-compatible production-like target.

The application will expose `GET /api/health` as a dynamic Node route. It will
open the same application database runtime used by auth and public routes, run
migrations through that path, and return `200` only when the database can be
opened. It will return `503` without leaking secrets or filesystem details.

## Environment Model

Preview, staging, and production use the same variable names:

- `NODE_ENV=production`
- `PORT=3000`
- `HOSTNAME=0.0.0.0`
- `AUTH_SECRET`
- `NEXTAUTH_URL`
- `AUTH_GOOGLE_ID`
- `AUTH_GOOGLE_SECRET`
- `LINKSHELF_DB_PATH=/data/linkshelf/linkshelf.db`

Preview can use throwaway OAuth credentials and a disposable persistent volume.
Staging should use a separate Google OAuth client and database volume.
Production must use the public HTTPS origin in `NEXTAUTH_URL` and a production
volume with backups handled by the operator.

## Error Handling

The health route will return:

- `200` with `{ "ok": true, "database": "ok" }` when the runtime database opens.
- `503` with `{ "ok": false, "database": "error" }` when database configuration
  or access fails.

Detailed exception messages stay out of the response body to avoid exposing
paths, credentials, or deployment topology.

## Documentation

Add `docs/deployment.md` with:

- Deployment target and artifact explanation.
- Required environment variables.
- Build, run, and smoke-test commands.
- Preview/staging/production environment model.
- SQLite volume, backup, and restore links.
- Release and rollback checklist.
- Known limitation that this workspace cannot produce live preview/production
  URLs without an external host.

Update `.env.example` so local operators see the deployment-oriented values.

## Tests

Automated coverage will assert:

- Next standalone output is enabled.
- Dockerfile uses Node 24, pnpm with a frozen lockfile, standalone output, a
  non-root runtime user, and `node server.js`.
- Compose uses the Docker build, port 3000, required production variables,
  `LINKSHELF_DB_PATH=/data/linkshelf/linkshelf.db`, a persistent volume, and
  `/api/health` in the health check.
- `.dockerignore` excludes heavyweight and secret-bearing local files.
- `docs/deployment.md` documents build/start, envs, health checks, and rollback.
- `/api/health` returns success for a valid production database path and `503`
  for missing production database configuration.

## Scope

In scope:

- Dockerfile, `.dockerignore`, `compose.yml`.
- Next standalone output configuration.
- Minimal health route.
- Deployment runbook and environment documentation.
- Automated tests for deployment descriptors and health behavior.

Out of scope:

- Creating a live cloud account, public URL, or DNS record.
- Replacing SQLite with a managed database.
- Monitoring, alerting, or automated backup retention beyond documented manual
  runbooks.
- Amazon live API integration or visual polish.

## Self-Review

- No placeholders remain.
- The design uses the Sprint 25 and Sprint 26 production constraints directly.
- The chosen Docker/Compose target satisfies a deployable-from-Git baseline
  without requiring unavailable credentials.
- Health checks prove runtime compatibility with the same database initializer
  used by production routes.
