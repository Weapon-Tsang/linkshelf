# LinkShelf Handoff

Last updated: 2026-07-15 Asia/Shanghai

## Current Sprint

Sprint 25: Production Google OAuth.

Goal:

- Make Google-only production authentication real, documented, and verified
  within local/HTTPS-like constraints.

Status:

- Sprint 25 implementation complete.
- Real Google consent/deployed callback verification remains blocked by missing
  external Google credentials and deployment.

## Workspace

- Repo worktree: `/Users/weapon_tsang/Documents/linkshelf/.worktrees/linkshelf-mvp`
- Branch: `codex/linkshelf-mvp`
- Remote: `origin https://github.com/Weapon-Tsang/linkshelf.git`
- Baseline source commit at Sprint 25 start:
  `747724b docs: establish production readiness baseline`

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
- Local SQLite schema/migrations/seeds.
- Affiliate redirect route with Amazon tag rewriting and click-event recording.
- Share/fan auth resume flow.
- 15-screen Stitch visual QA capture script.

Latest visual QA evidence:

- `2026-07-11T08:25:23.631Z`
- 15 captured states under `test-results/design-qa/latest/`

Latest Sprint 25 verification:

- `git diff --check`: passed.
- `pnpm typecheck`: passed.
- `pnpm lint`: passed.
- `pnpm test`: passed, 314 tests.
- `pnpm build`: passed with the existing non-fatal Turbopack NFT tracing
  warning.
- `pnpm test:e2e`: passed, 12 tests.

## Sprint 25 Changes

Code and documents created or updated:

- `.env.example`
- `src/features/auth/server.ts`
- protected Studio, Fan Hub, Super Admin, and authenticated public route files
- `tests/integration/auth-production.test.ts`
- `docs/production-google-oauth.md`
- `docs/superpowers/specs/2026-07-15-production-google-oauth-design.md`
- `docs/superpowers/plans/2026-07-15-production-google-oauth.md`
- `PROJECT_STATE.md`
- `docs/project-status.md`
- `docs/roadmap.md`
- `HANDOFF.md`
- `NEXT_SESSION_PROMPT.md`

No product features or visual polish were intentionally added.

## Production Readiness Audit Summary

Authentication:

- Production Google OAuth configuration exists and is documented.
- Production server routes now resolve Auth.js JWT cookies through
  `resolveServerAuthSession()`.
- Real OAuth credentials and deployed HTTPS callback verification remain blocked
  by external setup.

Database:

- Local SQLite works for MVP and tests.
- Production DB provider, migration runbook, backup/restore, and seed-safety
  policy remain for Sprint 26.

Environment:

- `.env.example` and `docs/production-google-oauth.md` document the OAuth env
  contract.
- Broader startup validation remains for a later production readiness pass.

Deployment:

- Build/test scripts exist.
- No deployment target, descriptor, or release runbook was found.

Monitoring:

- No production observability baseline was found.

Affiliate:

- Local redirect and Amazon tag rewrite are tested.
- Real Amazon API, compliance, reporting, and reconciliation remain future work.

## Remaining P1 Work

Recommended sprint sequence:

1. Sprint 26: Persistent Database.
2. Sprint 27: Deployment.
3. Sprint 28: Monitoring.
4. Sprint 29: Amazon Integration.
5. Sprint 30: Release Candidate, Visual QA, and final release validation.

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
- Local SQLite should not be assumed to satisfy production persistence.
- Deployment platform compatibility with `node:sqlite` is not proven.
- Monitoring is absent.
- Amazon integration is fixture/local-redirect based, not production-complete.
- Long-lived project state now exists in docs, but future windows must keep those
  docs updated instead of relying on chat history.

## Definition Of Done For Sprint 25

- Production OAuth env contract exists.
- Google Cloud callback setup is documented.
- Local Google subject provisioning is documented.
- Production Auth.js cookies authorize protected surfaces.
- Admin/creator/fan access rules are documented and tested.
- Handoff states live Google callback verification is blocked by missing
  credentials/deployment.
- No product features were added.

## Next Recommended Sprint

Sprint 26: Persistent Database.
