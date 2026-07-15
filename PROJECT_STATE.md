# LinkShelf Project State

Last updated: 2026-07-15 Asia/Shanghai

## Executive State

LinkShelf is in Feature Freeze. The MVP product surface is functionally complete
enough to shift the active work from feature delivery to production readiness.

Active sprint:

- Sprint 28: Monitoring

Current branch:

- `codex/linkshelf-mvp`

Baseline source commit at Sprint 26 start:

- `2b2241a feat: harden production google oauth`

Baseline source commit at Sprint 27 start:

- `94547bb feat: define persistent database runtime`

Baseline source commit at Sprint 28 start:

- `197ea5f feat: add deployment baseline`

Latest known remote state at Sprint 26 start:

- Worktree was clean before Sprint 26 changes.

## Completed MVP Surface

The current app includes:

- Public landing page.
- Public creator profile and public shelf pages.
- Creator Studio dashboard, shelf management, create shelf, analytics, comments,
  and settings.
- Fan Hub dashboard, rewards, wallet tracking ID controls, saved collections,
  and shared shelves.
- Super Admin dashboard and admin gate.
- Google-only development auth flows plus production Google OAuth configuration,
  Auth.js JWT session resolution, and documented provisioning runbook.
- Production-contracted file-backed SQLite runtime, migrations, deterministic
  non-production seed data, and demo DB refresh paths.
- Docker/Compose production-like deployment baseline with standalone Next.js
  output, persistent SQLite volume, `/api/health`, and release/rollback runbook.
- Structured stdout operational events for health, Google auth, Auth.js
  production sign-in mapping, and affiliate redirects.
- Affiliate redirect route with Amazon tag rewriting, click-event persistence,
  and fan/creator/platform split logic.
- Share/fan auth resume flow.
- 15-screen Stitch visual QA capture via `scripts/capture-design-qa.mjs`.

## Latest Quality Evidence

Latest visual QA evidence:

- `2026-07-11T08:25:23.631Z`
- 15 captured comparison states.
- Evidence path: `test-results/design-qa/latest/`

Latest known full verification from the prior implementation sprint:

- `git diff --check`: passed.
- `tsc --noEmit`: passed.
- `eslint .`: passed.
- `vitest run`: passed, 311 tests.
- `next build`: passed with the existing non-fatal Turbopack NFT tracing
  warning around `node:sqlite` usage.
- `playwright test`: passed, 12 tests.
- `node scripts/capture-design-qa.mjs`: passed, 15 captured states.

Latest Sprint 25 verification:

- `git diff --check`: passed.
- `pnpm typecheck`: passed.
- `pnpm lint`: passed.
- `pnpm test`: passed, 314 tests.
- `pnpm test tests/integration/auth-production.test.ts
  tests/unit/auth-guards.test.ts tests/unit/auth-adapter.test.ts`: passed, 45
  tests.
- `pnpm build`: passed with the existing non-fatal Turbopack NFT tracing warning
  around `node:sqlite` usage.
- `pnpm test:e2e`: passed, 12 tests.

Latest Sprint 26 verification:

- `git diff --check`: passed.
- `pnpm typecheck`: passed.
- `pnpm lint`: passed.
- `pnpm test`: passed, 317 tests.
- `pnpm test tests/integration/database.test.ts
  tests/integration/auth-production.test.ts tests/integration/affiliate-route.test.ts`:
  passed, 42 tests.
- `pnpm build`: passed with the existing non-fatal Turbopack NFT tracing warning
  around `node:sqlite` usage.
- `pnpm test:e2e`: passed, 12 tests.

Latest Sprint 27 verification:

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

## Production Readiness Summary

Status by area:

- Authentication: production Google OAuth is code-complete and documented for
  Sprint 25; live Google credential/deployed callback verification remains
  blocked by missing external credentials and deployment.
- Database: file-backed SQLite on an explicit persistent volume path is selected
  for MVP production; Compose mounts it at `/data/linkshelf`.
- Environment configuration: OAuth env contract exists; broader production env
  validation remains for later hardening.
- Deployment: Docker/Compose descriptor and release runbook are committed; live
  host compatibility remains unverified without external credentials.
- Monitoring: structured stdout operational events and runbook are committed;
  hosted alert delivery remains future host-specific work.
- Affiliate integration: local redirect and Amazon tag rewrite exist; real
  Amazon integration, compliance, and reporting are not productionized.
- Visual QA: ongoing P2 fidelity backlog; remaining visual drift should move to
  Release Candidate polish unless it blocks usability, accessibility, or release
  confidence.

## Operating Guardrails

- Do not add new product features during Feature Freeze unless the user changes
  the product priority.
- Do not implement Amazon API integration outside its dedicated approved sprint.
- Record newly discovered issues in `docs/project-status.md` instead of fixing
  them opportunistically.
- Keep visual QA work behind production engineering unless a visual issue is a
  real usability, accessibility, or regression blocker.
- Preserve the current MVP flows while production baselines are established.
