# LinkShelf Handoff

Last updated: 2026-07-15 Asia/Shanghai

## Current Sprint

Sprint 26: Persistent Database.

Goal:

- Replace local-demo persistence assumptions with an explicit production
  database contract.

Status:

- Sprint 26 implementation complete for local file-backed SQLite and explicit
  persistent path contract.
- Deployment target persistent disk behavior remains for Sprint 27.

## Workspace

- Repo worktree: `/Users/weapon_tsang/Documents/linkshelf/.worktrees/linkshelf-mvp`
- Branch: `codex/linkshelf-mvp`
- Remote: `origin https://github.com/Weapon-Tsang/linkshelf.git`
- Baseline source commit at Sprint 26 start:
  `2b2241a feat: harden production google oauth`

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
- Affiliate redirect route with Amazon tag rewriting and click-event recording.
- Share/fan auth resume flow.
- 15-screen Stitch visual QA capture script.

Latest visual QA evidence:

- `2026-07-11T08:25:23.631Z`
- 15 captured states under `test-results/design-qa/latest/`

Latest Sprint 26 verification:

- `git diff --check`: passed.
- `pnpm typecheck`: passed.
- `pnpm lint`: passed.
- `pnpm test`: passed, 317 tests.
- `pnpm test tests/integration/database.test.ts tests/integration/auth-production.test.ts tests/integration/affiliate-route.test.ts`:
  passed, 42 tests.
- `pnpm build`: passed with the existing non-fatal Turbopack NFT tracing
  warning.
- `pnpm test:e2e`: passed, 12 tests.

## Sprint 26 Changes

Code and documents created or updated:

- `src/lib/db/runtime.ts`
- `src/features/auth/adapter.ts`
- `src/features/shelves/service.ts`
- `src/app/api/out/[productId]/route.ts`
- `tests/integration/database.test.ts`
- `.env.example`
- `docs/persistent-database.md`
- `docs/superpowers/specs/2026-07-15-persistent-database-design.md`
- `docs/superpowers/plans/2026-07-15-persistent-database.md`
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
- Real OAuth credentials and deployed HTTPS callback verification remain blocked
  by external setup.

Database:

- File-backed SQLite on an explicit persistent volume path is selected as the
  MVP production database strategy.
- Production requires absolute `LINKSHELF_DB_PATH`.
- Production app open paths run migrations and do not seed demo data.
- Migration, seed-safety, backup, restore, and provisioning runbooks are in
  `docs/persistent-database.md`.
- Deployment target persistent disk behavior remains for Sprint 27.

Environment:

- `.env.example`, `docs/production-google-oauth.md`, and
  `docs/persistent-database.md` document current production env contracts.
- Broader startup validation remains for a later production readiness pass.

Deployment:

- Build/test scripts exist.
- No deployment target, descriptor, or release runbook was found.
- Sprint 27 should prove `node:sqlite` and persistent disk compatibility.

Monitoring:

- No production observability baseline was found.

Affiliate:

- Local redirect and Amazon tag rewrite are tested.
- Real Amazon API, compliance, reporting, and reconciliation remain future work.

## Remaining P1 Work

Recommended sprint sequence:

1. Sprint 27: Deployment.
2. Sprint 28: Monitoring.
3. Sprint 29: Amazon Integration.
4. Sprint 30: Release Candidate, Visual QA, and final release validation.

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
- Deployment platform compatibility with `node:sqlite` and persistent disk is
  not proven.
- Backup automation and retention are not implemented.
- Monitoring is absent.
- Amazon integration is fixture/local-redirect based, not production-complete.
- Long-lived project state now exists in docs, but future windows must keep
  those docs updated instead of relying on chat history.

## Definition Of Done For Sprint 26

- Production DB provider/path is documented.
- Production runtime requires explicit absolute `LINKSHELF_DB_PATH`.
- Migrations are reproducible.
- Production app open paths do not seed demo data.
- Data survives close/reopen assumptions for the selected local SQLite strategy.
- Backup/restore runbook exists.
- Tests cover selected production DB boundaries.
- No product features were added.

## Next Recommended Sprint

Sprint 27: Deployment.
