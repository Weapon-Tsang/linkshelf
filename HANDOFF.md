# LinkShelf Handoff

Last updated: 2026-07-15 Asia/Shanghai

## Current Sprint

Sprint 30: Release Candidate.

Goal:

- Validate the whole app as a release candidate after the production readiness
  sprint sequence.

Status:

- Sprint 30 validation is complete for a code release candidate.
- Release candidate notes live in `docs/release-candidate.md`.
- Full verification and fresh 15-screen Visual QA capture passed and are
  backfilled in the release candidate notes.

## Workspace

- Repo worktree: `/Users/weapon_tsang/Documents/linkshelf/.worktrees/linkshelf-mvp`
- Branch: `codex/linkshelf-mvp`
- Remote: `origin https://github.com/Weapon-Tsang/linkshelf.git`
- Baseline source commit at Sprint 30 start:
  `ebb704e feat: harden amazon integration boundary`

## Completed Production Readiness Sequence

1. Sprint 24: Production Readiness Baseline.
2. Sprint 25: Production Google OAuth.
3. Sprint 26: Persistent Database.
4. Sprint 27: Deployment.
5. Sprint 28: Monitoring.
6. Sprint 29: Amazon Integration.
7. Sprint 30: Release Candidate.

## Current Project State

The MVP product surface is functionally complete and in Feature Freeze. Active
work is release validation, not feature delivery.

Completed product and production areas:

- Public landing page, creator profile, public shelf pages, Fan Hub, Creator
  Studio, and Super Admin dashboard.
- Google-only development auth flows and production Google OAuth configuration.
- Production Auth.js JWT session resolution for protected App Router surfaces.
- File-backed SQLite production runtime with migrations and production-safe seed
  behavior.
- Docker/Compose deployment baseline with standalone Next.js output, persistent
  SQLite volume, `/api/health`, and rollback runbook.
- Structured stdout operational events for health, Google auth, Auth.js sign-in,
  and affiliate redirects.
- Amazon integration boundary that rejects deprecated PA-API mode, documents
  Creators API migration, and disables fixture metadata by default in
  production.
- 15-screen Stitch visual QA capture script.

## Sprint 30 Evidence To Complete

Completed evidence:

- `git diff --check`: passed.
- `pnpm typecheck`: passed.
- `pnpm lint`: passed.
- `pnpm test`: passed, 345 tests.
- `pnpm build`: passed with the existing non-fatal Turbopack NFT tracing
  warning.
- `pnpm test:e2e`: passed, 12 tests.
- Fresh `node scripts/capture-design-qa.mjs`: passed, 15 captured states under
  `test-results/design-qa/latest/`.
- Release-critical visual, performance, and accessibility review is documented
  in `docs/release-candidate.md`.

## Known External Launch Gates

Public production launch remains gated by systems outside this workspace:

- Real Google OAuth credentials and deployed HTTPS callback verification.
- Live external host, URL, and persistent disk proof.
- Hosted alert delivery/log drain setup.
- Live Creators API docs, credentials, and metadata-call verification.
- External affiliate compliance review and payout reconciliation operations.

## Release Manager Recommendation

Accept `codex/linkshelf-mvp` as a code release candidate for stakeholder review
and production-environment setup.

Do not approve public production launch until the external launch gates above
are cleared.

## Guardrails

- Keep Feature Freeze active.
- Do not add product features by default.
- Do not do cosmetic visual polish unless fresh RC evidence reveals a
  release-critical issue.
- Keep project state docs synchronized with verification results.
