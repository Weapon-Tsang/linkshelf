# LinkShelf Project Status

Last updated: 2026-07-15 Asia/Shanghai

## Project Health Report

Current development phase:

- Feature Freeze / Production Readiness.

Current sprint:

- Sprint 27: Deployment.

Current completion level:

- MVP product surface: functionally complete.
- Visual QA: broad 15-screen evidence loop exists; remaining issues are P2
  fidelity drift unless otherwise noted.
- Production readiness: not complete. OAuth, SQLite persistence, and the
  Docker/Compose deployment baseline are code-complete for Sprints 25-27, but
  monitoring and Amazon integration still need dedicated sprints.

Current blockers:

- P0: none known.
- P1: production Google OAuth live callback verification is blocked until real
  Google credentials and a deployed HTTPS origin exist.
- P1: live deployment on an external host is blocked until credentials and a
  target origin exist.
- P1: monitoring/observability baseline is absent beyond `/api/health`.
- P2: remaining Stitch visual drift and share-modal reference-state mismatch.

Current risks:

- Production Google OAuth code now maps Auth.js JWT sessions into protected
  Studio, Fan Hub, and Super Admin surfaces; real Google consent has not been
  exercised against a deployed callback URL.
- The app now has a file-backed SQLite production persistence contract and a
  Compose persistent volume mapping; actual host behavior still needs live
  deployment proof.
- `.env.example` and `docs/production-google-oauth.md` now document the OAuth
  environment contract; broader startup validation and deployment env ownership
  remain open.
- The build passes with an existing non-fatal Turbopack NFT tracing warning
  around SQLite/seed imports; deployment platform compatibility still needs live
  host proof.
- Affiliate redirect logic is tested locally, but real Amazon API/compliance,
  reporting, and payout reconciliation are not complete.
- Monitoring is not present, so production failures would be hard to diagnose.

Highest priority:

- Start Sprint 28: Monitoring.

## Sprint 24 Scope

Goal:

- Establish the production readiness baseline without adding product features or
  implementing the next production systems.

In scope:

- Create/update `PROJECT_STATE.md`.
- Create/update this project status document.
- Create/update `docs/roadmap.md`.
- Audit auth, DB, environment, deployment, monitoring, and affiliate readiness.
- Define Production Ready Definition of Done.
- Define follow-up sprint sequence:
  OAuth -> DB -> Deployment -> Monitoring -> Amazon Integration.
- Clarify which Visual QA work is deferred to Release Candidate.
- Update `HANDOFF.md` and `NEXT_SESSION_PROMPT.md`.

Out of scope:

- New product functionality.
- Production OAuth implementation.
- Persistent DB implementation.
- Deployment implementation.
- Monitoring implementation.
- Amazon Integration implementation.
- Opportunistic UI polish.

## Sprint 25 Scope

Goal:

- Make Google-only production authentication real, documented, and verified
  within local/HTTPS-like constraints.

Completed:

- Added `.env.example`.
- Added `docs/production-google-oauth.md` with Google Cloud callback setup,
  required variables, subject provisioning, admin policy, and live-verification
  checklist.
- Added `src/features/auth/server.ts` so protected App Router surfaces resolve
  production Auth.js JWT cookies instead of only development cookies.
- Routed Studio, Fan Hub, Super Admin, and authenticated public resume flows
  through the shared server auth helper.
- Expanded production auth tests for server-component headers, role-aware
  production sessions, and partial credential states.

Verification:

- `git diff --check`: passed.
- `pnpm typecheck`: passed.
- `pnpm lint`: passed.
- `pnpm test`: passed, 314 tests.
- `pnpm build`: passed with the existing non-fatal Turbopack NFT tracing warning.
- `pnpm test:e2e`: passed, 12 tests.

Out of scope retained:

- Non-Google providers.
- Persistent DB implementation.
- Deployment rollout.
- Monitoring.
- Amazon Integration.
- Visual polish.

## Sprint 26 Scope

Goal:

- Replace local-demo persistence assumptions with an explicit production
  database contract.

Completed:

- Selected file-backed SQLite on an explicit persistent volume path as the MVP
  production database strategy.
- Added `src/lib/db/runtime.ts` to centralize path resolution, migrations, and
  non-production seed behavior.
- Required production `LINKSHELF_DB_PATH` to be absolute and file-backed.
- Routed auth, public shelves, shared app surfaces, and affiliate redirects
  through the shared database runtime.
- Added `docs/persistent-database.md` with migration, seed-safety,
  backup/restore, and provisioning notes.
- Updated `.env.example` with the production persistent-path contract.
- Added tests for production path validation, migration-only production startup,
  non-production demo seeding, and close/reopen persistence.

Verification:

- `git diff --check`: passed.
- `pnpm typecheck`: passed.
- `pnpm lint`: passed.
- `pnpm test`: passed, 317 tests.
- `pnpm test tests/integration/database.test.ts tests/integration/auth-production.test.ts tests/integration/affiliate-route.test.ts`:
  passed, 42 tests.
- `pnpm build`: passed with the existing non-fatal Turbopack NFT tracing warning.
- `pnpm test:e2e`: passed, 12 tests.

Out of scope retained:

- Managed database provider migration.
- Deployment platform selection.
- Deployment descriptors.
- Monitoring.
- Amazon Integration.
- Visual polish.

## Sprint 27 Scope

Goal:

- Make LinkShelf deployable and operable from Git.

Completed:

- Enabled Next.js standalone output.
- Added a multi-stage Node 24 `Dockerfile`.
- Added `.dockerignore` for local caches, secrets, data, and worktrees.
- Added `compose.yml` with production env vars, port 3000, a persistent SQLite
  volume at `/data/linkshelf`, and an `/api/health` health check.
- Added `src/app/api/health/route.ts` to verify the application database runtime
  can open and migrate the production SQLite file.
- Added `docs/deployment.md` with environment model, build/start commands,
  smoke tests, release checklist, and rollback.
- Expanded `.env.example` with deployment-oriented `PORT`, `HOSTNAME`, and
  `LINKSHELF_DB_PATH` examples.
- Added automated descriptor and health-route tests.

Verification:

- `git diff --check`: passed.
- `pnpm typecheck`: passed.
- `pnpm lint`: passed.
- `pnpm test`: passed, 325 tests.
- `pnpm vitest run tests/unit/deployment-config.test.ts`: passed, 6 tests.
- `pnpm vitest run tests/integration/health-route.test.ts`: passed, 2 tests.
- `pnpm build`: passed with the existing non-fatal Turbopack NFT tracing
  warning.
- `pnpm test:e2e`: passed, 12 tests.
- `docker compose config`: not run because `docker` is not installed in this
  workspace.

Out of scope retained:

- Live cloud deployment, public preview URL, and DNS setup.
- Monitoring beyond minimal `/api/health`.
- Amazon live API integration.
- Visual polish.

## Production Readiness Audit

### Authentication

Current state:

- `src/auth.ts` contains production-oriented NextAuth Google configuration.
- Google provider is enabled only when `AUTH_GOOGLE_ID`,
  `AUTH_GOOGLE_SECRET`, and a valid `AUTH_SECRET` are present.
- Production auth maps verified Google subjects to existing local users instead
  of trusting email alone.
- Development auth uses local role hints and signed cookies for creator, fan, and
  admin flows.
- Admin entry and share/fan resume cookies have signed challenge flows.
- Production auth coverage exists in `tests/integration/auth-production.test.ts`.
- Protected App Router surfaces now resolve production Auth.js JWT cookies
  through `resolveServerAuthSession()`.
- `.env.example` and `docs/production-google-oauth.md` define the OAuth setup
  and provisioning contract.

Production gaps:

- Real OAuth client credentials were not available in this workspace.
- Deployed HTTPS callback verification remains blocked until a deployment exists.
- Production persistence for provisioned users uses file-backed SQLite; deployed
  persistent disk behavior remains unproven until Sprint 27.
- Deployment-specific cookie behavior needs recheck once Sprint 27 selects a
  host.

Backlog:

- Sprint 27 should re-run live OAuth callback checks on the selected deployment
  target after Sprint 26 persistence work.

### Database

Current state:

- `src/lib/db/client.ts` opens `node:sqlite` through `DatabaseSync`.
- `src/lib/db/runtime.ts` requires an explicit absolute `LINKSHELF_DB_PATH` in
  production and defaults to `data/linkshelf.db` outside production.
- Migrations and deterministic seed data exist.
- Non-production database open paths seed demo data.
- Production database open paths run migrations but do not seed demo data.
- WAL, foreign keys, and busy timeout are enabled for file-backed SQLite.
- `docs/persistent-database.md` documents migration, backup, restore, and
  provisioning procedures.

Production gaps:

- Hosting compatibility with `node:sqlite` and persistent disk is not proven.
- Backup automation and retention are not implemented.
- Production data bootstrap is documented, but no admin provisioning UI exists.

Backlog:

- Sprint 27 should prove the persistent volume contract on the selected
  deployment target.
- Sprint 28 should add monitoring/operations checks for backups and DB health.

### Environment And Secrets

Current state:

- Runtime code directly reads `AUTH_SECRET`, `AUTH_GOOGLE_ID`,
  `AUTH_GOOGLE_SECRET`, `NEXTAUTH_URL`, `LINKSHELF_DB_PATH`, `NODE_ENV`, and
  `CI`.
- `siteConfig.defaultPlatformTag` contains the current platform affiliate tag.
- `.env.example` documents the OAuth production contract.

Production gaps:

- There is no environment validation module or startup check.
- Secret ownership, rotation, and preview/prod separation are undefined.
- Affiliate/platform configuration is partly code-level rather than fully
  environment-specific.

Backlog:

- Add env contract and validation in the relevant OAuth/DB/deployment sprints.

### Deployment

Current state:

- `next.config.ts` enables standalone output.
- `package.json` provides `dev`, `build`, `start`, `lint`, `typecheck`, `test`,
  and `test:e2e` scripts.
- Playwright can launch `next dev` for local E2E.
- `Dockerfile` builds a production Node 24 standalone server image.
- `compose.yml` runs the app with production env, persistent SQLite storage, and
  `/api/health`.
- `docs/deployment.md` documents build/start, smoke tests, environment model,
  release checklist, and rollback.

Production gaps:

- No live external deployment target was exercised.
- No preview or production URL exists yet.
- Docker CLI is not installed in this workspace, so Compose parsing/building was
  not locally executed.

Backlog:

- A future release or ops task should exercise the committed Docker/Compose
  baseline on the selected live host.

### Monitoring

Current state:

- `/api/health` returns database runtime health for deployment smoke checks.
- No Sentry, OpenTelemetry, instrumentation file, uptime monitor, or structured
  production logging baseline was found.
- Analytics screens in the product are app mock/derived views, not operational
  monitoring.

Production gaps:

- No error reporting.
- No request/performance telemetry.
- No uptime monitor or alerting.
- No alerting or incident triage runbook.
- No privacy posture for analytics/telemetry.

Backlog:

- Sprint 28 should add the monitoring baseline on top of the deployment health
  route.

### Affiliate And Amazon Integration

Current state:

- `/api/out/[productId]` resolves products, rewrites Amazon tags, records click
  events, and redirects with `cache-control: no-store`.
- Affiliate split selection is tested.
- Amazon URL safety and tag rewriting are tested.
- Studio metadata extraction uses local Amazon fixtures, not live Amazon APIs.
- Fan and creator affiliate tags can be stored locally.

Production gaps:

- No live Amazon Product Advertising API integration.
- No Amazon API credentials or environment contract.
- No compliance review for attribution text, affiliate disclosures, or tag usage.
- No payout reconciliation/reporting pipeline.
- No fraud/rate-limit/abuse controls for redirects.

Backlog:

- Sprint 29 should productionize Amazon Integration after OAuth, DB,
  deployment, and monitoring are in place.

## Production Ready Definition Of Done

Production Ready means:

- Authentication: real Google OAuth works on production HTTPS callback URLs;
  unauthorized users are denied; admin access policy is documented and tested.
- Database: production data persists across deploys/restarts; migrations are
  repeatable; backup/restore is documented; seed data cannot overwrite prod data.
- Environment: required vars are documented, validated, and separated across
  local/preview/staging/production; secrets have owners and rotation notes.
- Deployment: production and preview deploys are reproducible from Git; rollback
  is documented; runtime compatibility is proven.
- Monitoring: errors, key request paths, auth failures, affiliate redirects, and
  deployment health are observable with alerts or an agreed manual check.
- Affiliate: Amazon redirects and tag handling are compliant, tested with real
  configuration, and have reporting/reconciliation boundaries.
- Security: auth cookies, redirects, admin gates, and secret handling have been
  reviewed against production threat assumptions.
- Quality: unit/integration/component tests pass; build passes; E2E passes on
  production-like config; visual QA captures exist for release-critical flows.
- Documentation: `PROJECT_STATE.md`, `docs/project-status.md`,
  `docs/roadmap.md`, `HANDOFF.md`, and release notes reflect the shipped state.

## Visual QA Policy For Release Candidate

Visual QA remains important, but it should not interrupt production engineering
unless it exposes a functional, accessibility, or serious brand-confidence
problem.

Deferred to Release Candidate:

- Landing hero visual/proportion drift, supporting-section proportion, carousel
  exposure, and final footer/nav spacing.
- Creator Profile broader layout scale/proportion differences outside locked
  hooks.
- Studio dashboard shell width/spacing drift.
- Studio management remaining card/content proportion drift.
- Studio create spacing/proportion micro-fidelity.
- Settings/analytics/comments shell scale, sidebar proportion, seed copy, and
  avatar drift.
- Fan dashboard remaining horizontal density, module width, and micro-spacing.
- Share modal source-state/reference mismatch.
- Super Admin remaining typography/proportion drift.

Release Candidate visual QA should include:

- Fresh 15-screen capture.
- Focused crops only for remaining release-critical mismatches.
- Accessibility checks for modal, auth, Studio, Fan Hub, and Admin flows.

## Backlog

P1:

- Monitoring baseline sprint.
- Amazon Integration sprint.

P2:

- Release Candidate visual QA polish listed above.
- Environment example and validation, scheduled with OAuth/DB/deployment work.
- Release notes template.
- Operational incident checklist.
