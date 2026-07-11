# LinkShelf Project Status

Last updated: 2026-07-11 Asia/Shanghai

## Project Health Report

Current development phase:

- Feature Freeze / Production Readiness.

Current sprint:

- Sprint 24: Production Readiness Baseline.

Current completion level:

- MVP product surface: functionally complete.
- Visual QA: broad 15-screen evidence loop exists; remaining issues are P2
  fidelity drift unless otherwise noted.
- Production readiness: not complete. Core production foundations need dedicated
  sprints.

Current blockers:

- P0: none known.
- P1: production Google OAuth is not fully configured for a real environment.
- P1: persistent production database strategy is not selected or deployed.
- P1: deployment target, environment contract, and release runbook are absent.
- P1: monitoring/observability baseline is absent.
- P2: remaining Stitch visual drift and share-modal reference-state mismatch.

Current risks:

- The app has production-oriented auth code, but credentials, callback URLs,
  account provisioning, and production role mapping have not been exercised in a
  real deployed environment.
- The app uses local `node:sqlite` with WAL and seed behavior; this is not yet a
  production persistence plan.
- Environment variables are consumed directly by runtime code without a committed
  `.env.example` or startup validation contract.
- The build passes with an existing non-fatal Turbopack NFT tracing warning
  around SQLite imports; deployment platform compatibility still needs proof.
- Affiliate redirect logic is tested locally, but real Amazon API/compliance,
  reporting, and payout reconciliation are not complete.
- Monitoring is not present, so production failures would be hard to diagnose.

Highest priority:

- Finish Sprint 24 documentation baseline, then start Sprint 25 for Production
  Google OAuth only after explicit user confirmation.

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

Production gaps:

- No real OAuth client credentials or callback URLs are documented.
- No production account provisioning workflow is documented for mapping Google
  subjects to local users.
- No explicit environment matrix exists for local, preview, staging, and
  production.
- Session/cookie behavior needs deployed HTTPS verification.
- Admin access policy needs final release sign-off.

Backlog:

- Sprint 25 should harden and verify production Google OAuth end to end.

### Database

Current state:

- `src/lib/db/client.ts` opens `node:sqlite` through `DatabaseSync`.
- `LINKSHELF_DB_PATH` can override the local DB path.
- Migrations and deterministic seed data exist.
- Non-production database open paths seed demo data.
- WAL, foreign keys, and busy timeout are enabled for file-backed SQLite.

Production gaps:

- No production database provider is selected.
- No migration runbook is committed.
- No backup/restore strategy is committed.
- No data retention, seed exclusion, or production data bootstrap process is
  defined.
- Hosting compatibility with `node:sqlite` and persistent disk is not proven.

Backlog:

- Sprint 26 should decide and implement the persistent database strategy.

### Environment And Secrets

Current state:

- Runtime code directly reads `AUTH_SECRET`, `AUTH_GOOGLE_ID`,
  `AUTH_GOOGLE_SECRET`, `LINKSHELF_DB_PATH`, `NODE_ENV`, and `CI`.
- `siteConfig.defaultPlatformTag` contains the current platform affiliate tag.
- No `.env.example` was found during the Sprint 24 audit.

Production gaps:

- Required environment variables are not documented in a single committed
  contract.
- There is no environment validation module or startup check.
- Secret ownership, rotation, and preview/prod separation are undefined.
- Affiliate/platform configuration is partly code-level rather than fully
  environment-specific.

Backlog:

- Add env contract and validation in the relevant OAuth/DB/deployment sprints.

### Deployment

Current state:

- `next.config.ts` is empty.
- `package.json` provides `dev`, `build`, `start`, `lint`, `typecheck`, `test`,
  and `test:e2e` scripts.
- Playwright can launch `next dev` for local E2E.
- No deployment descriptor was found for Vercel, Fly, Render, Railway, Docker, or
  similar.

Production gaps:

- No target platform selected.
- No production build/start/runtime runbook.
- No preview/staging/prod environment model.
- No persistent storage story tied to deployment.
- No release rollback procedure.

Backlog:

- Sprint 27 should establish deployment and release operations after DB is
  decided.

### Monitoring

Current state:

- No Sentry, OpenTelemetry, instrumentation file, uptime checks, or structured
  production logging baseline was found.
- Analytics screens in the product are app mock/derived views, not operational
  monitoring.

Production gaps:

- No error reporting.
- No request/performance telemetry.
- No uptime or health check.
- No alerting or incident triage runbook.
- No privacy posture for analytics/telemetry.

Backlog:

- Sprint 28 should add the monitoring baseline after deployment exists.

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

- Production Google OAuth sprint.
- Persistent production database sprint.
- Deployment and release runbook sprint.
- Monitoring baseline sprint.
- Amazon Integration sprint.

P2:

- Release Candidate visual QA polish listed above.
- Environment example and validation, scheduled with OAuth/DB/deployment work.
- Release notes template.
- Operational incident checklist.
