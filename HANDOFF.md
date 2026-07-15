# LinkShelf Handoff

Last updated: 2026-07-15 Asia/Shanghai

## Current Sprint

Sprint 28: Monitoring.

Goal:

- Establish the minimum observability baseline for release.

Status:

- Sprint 28 implementation complete for structured stdout operational events,
  critical flow instrumentation, and a monitoring runbook.
- Hosted alert delivery remains external to this workspace.

## Workspace

- Repo worktree: `/Users/weapon_tsang/Documents/linkshelf/.worktrees/linkshelf-mvp`
- Branch: `codex/linkshelf-mvp`
- Remote: `origin https://github.com/Weapon-Tsang/linkshelf.git`
- Baseline source commit at Sprint 28 start:
  `197ea5f feat: add deployment baseline`

## Current Project State

The MVP product surface is functionally complete and in Feature Freeze. Active
work has shifted to production readiness.

Completed product areas:

- Public landing page.
- Public creator profile and public shelf pages.
- Creator Studio dashboard, shelf management, create shelf, analytics, comments,
  and settings.
- Fan Hub dashboard, rewards, wallet tracking ID controls, saved collections,
  and shared shelves.
- Super Admin dashboard and admin gate.
- Development auth flows and production Google OAuth hooks.
- Production Auth.js JWT session resolution for protected App Router surfaces.
- Production-contracted file-backed SQLite runtime, migrations, deterministic
  non-production seed data, and demo DB refresh paths.
- Docker/Compose deployment baseline with standalone Next.js output, persistent
  SQLite volume, `/api/health`, and release/rollback runbook.
- Structured operational events for health, Google auth, Auth.js sign-in, and
  affiliate redirects.
- Affiliate redirect route with Amazon tag rewriting and click-event recording.
- Share/fan auth resume flow.
- 15-screen Stitch visual QA capture script.

Latest visual QA evidence:

- `2026-07-11T08:25:23.631Z`
- 15 captured states under `test-results/design-qa/latest/`

Latest Sprint 28 verification:

- `git diff --check`: passed.
- `pnpm typecheck`: passed.
- `pnpm lint`: passed.
- `pnpm vitest run tests/unit/monitoring-events.test.ts tests/unit/monitoring-docs.test.ts`:
  passed, 4 tests.
- `pnpm vitest run tests/integration/health-route.test.ts tests/integration/affiliate-route.test.ts`:
  passed, 9 tests.
- `pnpm vitest run tests/integration/auth-route.test.ts tests/integration/auth-production.test.ts`:
  passed, 26 tests.
- `pnpm test`: passed, 333 tests.
- `pnpm build`: passed with the existing non-fatal Turbopack NFT tracing
  warning.
- `pnpm test:e2e`: passed, 12 tests.

## Sprint 28 Changes

Code and documents created or updated:

- `src/lib/monitoring/events.ts`
- `src/app/api/health/route.ts`
- `src/app/api/auth/google/route.ts`
- `src/app/api/out/[productId]/route.ts`
- `src/auth.ts`
- `tests/unit/monitoring-events.test.ts`
- `tests/unit/monitoring-docs.test.ts`
- `tests/integration/health-route.test.ts`
- `tests/integration/auth-route.test.ts`
- `tests/integration/auth-production.test.ts`
- `tests/integration/affiliate-route.test.ts`
- `.env.example`
- `docs/monitoring.md`
- `docs/superpowers/specs/2026-07-15-monitoring-design.md`
- `docs/superpowers/plans/2026-07-15-monitoring.md`
- `PROJECT_STATE.md`
- `docs/project-status.md`
- `docs/roadmap.md`
- `HANDOFF.md`
- `NEXT_SESSION_PROMPT.md`

No product features or visual polish were intentionally added.

## Production Readiness Audit Summary

Authentication:

- Production Google OAuth configuration exists and is documented.
- Production server routes resolve Auth.js JWT cookies through
  `resolveServerAuthSession()`.
- Google auth entry and Auth.js production sign-in mapping now emit structured
  operational events.
- Real OAuth credentials and deployed HTTPS callback verification remain blocked
  by external setup.

Database:

- File-backed SQLite on an explicit persistent volume path is selected as the
  MVP production database strategy.
- Production requires absolute `LINKSHELF_DB_PATH`.
- Production app open paths run migrations and do not seed demo data.
- Migration, seed-safety, backup, restore, and provisioning runbooks are in
  `docs/persistent-database.md`.
- Compose mounts persistent SQLite storage at `/data/linkshelf`.

Environment:

- `.env.example`, `docs/production-google-oauth.md`, and
  `docs/persistent-database.md` document current production env contracts.
- Broader startup validation remains for a later production readiness pass.

Deployment:

- Dockerfile builds a Next.js standalone Node 24 image.
- `compose.yml` defines required production env vars, port 3000, persistent
  SQLite volume, and `/api/health` health check.
- `docs/deployment.md` documents build/start, smoke tests, environment model,
  release checklist, and rollback.
- Live host compatibility remains unverified until external deployment
  credentials exist.

Monitoring:

- `/api/health` provides minimal deployment health proof.
- `src/lib/monitoring/events.ts` emits privacy-safe structured JSON events to
  stdout in production.
- `docs/monitoring.md` documents event schema, manual checks, alert thresholds,
  incident triage, and privacy boundaries.
- Hosted alert delivery and external monitoring SaaS setup remain future
  host-specific work.

Affiliate:

- Local redirect and Amazon tag rewrite are tested.
- Real Amazon API, compliance, reporting, and reconciliation remain future work.

## Remaining P1 Work

Recommended sprint sequence:

1. Sprint 29: Amazon Integration.
2. Sprint 30: Release Candidate, Visual QA, and final release validation.

## Remaining P2 Visual QA

Defer to Release Candidate unless a visual issue blocks usability,
accessibility, or release confidence:

- Landing page hero/supporting/carousel/footer/nav proportions.
- Creator Profile broader layout scale/proportions.
- Studio dashboard shell width/spacing.
- Studio management remaining card/content proportion drift.
- Studio create spacing/proportion micro-fidelity.
- Settings/analytics/comments shell/sidebar/copy/avatar drift.
- Fan dashboard horizontal density/module width/micro-spacing.
- Share modal reference-state mismatch.
- Super Admin typography/proportion drift.

## Current Risks

- Production auth has not been verified against real Google OAuth credentials or
  a deployed callback URL.
- Live deployment platform compatibility with `node:sqlite` and persistent disk
  is not proven because no external host was available.
- Backup automation and retention are not implemented.
- Monitoring is stdout/manual-check based; no external alert delivery is wired.
- Amazon integration is fixture/local-redirect based, not production-complete.
- Long-lived project state now exists in docs, but future windows must keep
  those docs updated instead of relying on chat history.

## Definition Of Done For Sprint 28

- Structured events emit to stdout in production.
- Health, auth, and affiliate redirect paths have observable signals.
- Secret-like metadata is redacted by the monitoring helper.
- Manual checks, alert thresholds, incident triage, and privacy boundaries are
  documented.
- Tests cover event shape, routing coverage, and monitoring docs.

## Next Recommended Sprint

Sprint 29: Amazon Integration.
