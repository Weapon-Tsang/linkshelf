# Deployment Runbook

Last updated: 2026-07-15 Asia/Shanghai

## Status

Sprint 27 adds a generic Docker and Compose deployment baseline. It is designed
for any host that can build a Node 24 container and attach a persistent volume.
This workspace does not include live hosting credentials, so no preview or
production URL was created here.

## Deployment Target

The supported MVP artifact is the Docker image built from `Dockerfile`.

- Builder: installs dependencies with pnpm 11.7.0 and runs `pnpm build`.
- Runtime: copies Next.js standalone output and runs `node server.js`.
- App port: `3000`.
- SQLite path in the container: `/data/linkshelf/linkshelf.db`.
- Persistent storage: named Compose volume `linkshelf-data`.

The same image can be run on a VPS, Fly.io-style machine, Render Docker service,
Railway Docker service, or another container host with durable storage mounted at
`/data/linkshelf`.

## Required Environment

Production-like deployments require:

| Variable | Required | Example | Notes |
| --- | --- | --- | --- |
| `NODE_ENV` | yes | `production` | Compose sets this. |
| `PORT` | yes | `3000` | Compose and Dockerfile set this. |
| `HOSTNAME` | yes | `0.0.0.0` | Required for the standalone server inside a container. |
| `NEXTAUTH_URL` | yes | `https://linkshelf.example.com` | Must match the public HTTPS origin. |
| `AUTH_SECRET` | yes | generated 32+ byte secret | Used by Auth.js JWTs and app challenges. |
| `AUTH_GOOGLE_ID` | yes | Google OAuth client ID | Use the client for the deployed origin. |
| `AUTH_GOOGLE_SECRET` | yes | Google OAuth client secret | Store as a platform secret. |
| `LINKSHELF_DB_PATH` | yes | `/data/linkshelf/linkshelf.db` | Must be absolute and file-backed in production. |

## Environment Model

### Preview

Use the same Docker image from the feature branch, a disposable persistent
volume, a throwaway Google OAuth client, and `NEXTAUTH_URL` set to the preview
HTTPS origin. Preview data can be reset by removing its volume.

### Staging

Use the release candidate image, a long-lived staging volume, and a separate
Google OAuth client. Staging should mirror production variables but never share
the production database or OAuth secret.

### Production

Use the tagged release image, the production persistent volume, production
Google OAuth credentials, and the public HTTPS origin in `NEXTAUTH_URL`.
Provision production users by Google subject as described in
`docs/production-google-oauth.md`.

## Build And Start

Create a local env file or export the required values in your shell. Then run:

```bash
docker compose build
docker compose up -d
```

Follow logs:

```bash
docker compose logs -f linkshelf
```

Stop the service:

```bash
docker compose down
```

Stop and remove the local persistent volume only when intentionally resetting
data:

```bash
docker compose down -v
```

## Smoke Test

After startup, check the health route:

```bash
curl -fsS http://127.0.0.1:3000/api/health
```

Expected response:

```json
{"ok":true,"database":"ok"}
```

Then verify auth callback configuration:

1. Confirm Google Cloud has `<NEXTAUTH_URL>/api/auth/callback/google`.
2. Visit `/login`.
3. Continue with a provisioned creator, fan, or admin Google account.
4. Confirm role-aware redirects match `docs/production-google-oauth.md`.

## Database Operations

The app runs migrations when production routes open the database. Demo seed data
does not run in production. Backup and restore steps remain in
`docs/persistent-database.md`.

Before backup, checkpoint WAL:

```bash
sqlite3 "$LINKSHELF_DB_PATH" "PRAGMA wal_checkpoint(TRUNCATE);"
```

Copy `linkshelf.db` plus any needed backup metadata according to the host's
retention policy.

## Release Checklist

1. Build the image from a clean Git commit.
2. Set all required environment variables.
3. Attach persistent storage at `/data/linkshelf`.
4. Start the service.
5. Confirm `/api/health` returns `200`.
6. Confirm Google OAuth callback settings match `NEXTAUTH_URL`.
7. Provision required users by Google subject.
8. Run the role-specific login smoke tests.
9. Record the deployed commit, image tag, origin URL, and database volume name.

## Rollback

Rollback uses the previous known-good image and the same persistent volume:

```bash
docker compose down
git checkout <previous-release-commit>
docker compose build
docker compose up -d
curl -fsS http://127.0.0.1:3000/api/health
```

If a release included a schema migration that must be reversed, stop and restore
the most recent database backup using `docs/persistent-database.md` before
starting the previous image. Never edit an already-shipped migration in place.

## Known Limits

- No live preview or production URL exists from this workspace.
- The health route proves the app can open and migrate SQLite, but it is not a
  monitoring or alerting system.
- Backup retention remains an operator responsibility until a later operations
  sprint automates it.
