# Production Google OAuth Design

## Goal

Sprint 25 makes the existing Google-only production authentication path usable,
diagnosable, documented, and verified without adding product features or changing
the persistence, deployment, monitoring, Amazon, or visual-QA roadmap items.

## Project Health

- Current branch: `codex/linkshelf-mvp`.
- Current phase: Feature Freeze / Production Readiness.
- Sprint 24 is complete at `747724b docs: establish production readiness baseline`.
- Baseline auth verification passed on 2026-07-15: `vitest run
  tests/integration/auth-production.test.ts tests/unit/auth-guards.test.ts
  tests/unit/auth-adapter.test.ts`, 42 tests.
- Recommended active sprint is Sprint 25: Production Google OAuth.

## Scope

In scope:

- Define the production OAuth environment contract.
- Document Google Cloud OAuth setup, callback URLs, and local user provisioning.
- Verify configured, missing, partial, and invalid credential states.
- Ensure production Auth.js JWT sessions can authorize Studio, Fan Hub, and Super
  Admin protected surfaces.
- Document the admin policy and production-denied states.

Out of scope:

- Non-Google providers.
- New product features.
- Production database provider selection or migration.
- Deployment platform selection or rollout.
- Monitoring/observability.
- Amazon Product Advertising API integration.
- Visual polish beyond auth-blocking regressions.

## Design

### Environment Contract

Production Google OAuth requires:

- `NODE_ENV=production`
- `AUTH_SECRET` with at least 32 bytes of non-whitespace.
- `AUTH_GOOGLE_ID`
- `AUTH_GOOGLE_SECRET`
- `NEXTAUTH_URL` set to the deployed HTTPS origin.
- `LINKSHELF_DB_PATH` until Sprint 26 replaces the persistence strategy.

`AUTH_SECRET`, `AUTH_GOOGLE_ID`, and `AUTH_GOOGLE_SECRET` are the app's runtime
switch for enabling the Google provider. `NEXTAUTH_URL` is documented as
required for production callback correctness even though local tests can build
HTTPS-like requests without a deployed URL.

### OAuth Flow

The visible login buttons keep posting to `/api/auth/google`. In development,
the route continues to create deterministic local role sessions. In production,
it denies missing/invalid config with `503` and redirects configured requests to
Auth.js Google sign-in with a safe callback URL.

Auth.js sign-in accepts only Google accounts whose provider subject exactly
matches an existing local `users.google_subject` value and whose Google profile
is verified. Email is never used as the account binding key.

### Protected Route Session Resolution

Production routes must authorize from Auth.js JWT cookies, not the development
`linkshelf.session` cookie. A shared server-side auth helper will resolve the
current request headers through `resolveAuthSession()` so Studio, Fan Hub, Super
Admin, and authenticated public shelf views use the same production session
source.

Development behavior stays unchanged: local deterministic cookies continue to
work through the same helper because `resolveAuthSession()` delegates to the
development session reader outside production.

### Admin Policy

The admin entry remains Google-only. In production:

- `/admin-secret` is only an entry page.
- `/admin/*` requires an authenticated local user with role `ADMIN`.
- Authenticated non-admin users are redirected to `/forbidden`.
- Anonymous users are redirected to `/admin-secret?returnTo=/admin/dashboard`.
- Admin access is provisioned by assigning the mapped local user `ADMIN` before
  login; Google email alone does not grant admin rights.

### Documentation

Sprint 25 will add a production OAuth runbook covering:

- Google Cloud OAuth application setup.
- Authorized JavaScript origins.
- Authorized redirect URI: `<NEXTAUTH_URL>/api/auth/callback/google`.
- Required environment variables.
- Local subject provisioning.
- Verification checklist and current credential/deployed-callback status.

### Testing

Tests will prove:

- The production Google provider is enabled only with a complete valid config.
- Partial/missing production config is denied.
- Weak `AUTH_SECRET` is rejected.
- Production Auth.js cookies resolve to the current local user.
- The shared protected-route helper resolves production cookies from server
  headers.
- The admin policy denies creator/fan sessions and allows only `ADMIN`.

## Risks

- Real deployed Google callbacks cannot be fully verified without live Google
  credentials and a deployed HTTPS origin.
- Production persistence is still local SQLite until Sprint 26, so user
  provisioning remains a documented SQL/data operation rather than a managed
  production workflow.
- Deployment-specific cookie behavior must be rechecked in Sprint 27 when the
  hosting target is selected.

## Success Criteria

- Production OAuth env contract exists in docs and `.env.example`.
- Auth tests cover configured, missing, partial, invalid, and protected-route
  session states.
- Studio, Fan Hub, and Super Admin protected surfaces can consume production
  Auth.js sessions through a shared helper.
- Handoff states whether real Google credentials/deployed callbacks were
  verified or remain blocked.
