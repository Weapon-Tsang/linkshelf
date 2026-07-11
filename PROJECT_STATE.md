# LinkShelf Project State

Last updated: 2026-07-11 Asia/Shanghai

## Executive State

LinkShelf is in Feature Freeze. The MVP product surface is functionally complete
enough to shift the active work from feature delivery to production readiness.

Active sprint:

- Sprint 24: Production Readiness Baseline

Current branch:

- `codex/linkshelf-mvp`

Baseline source commit at Sprint 24 start:

- `d5f9532 fix: align fan hub primary module shell`

Latest known remote state at Sprint 24 start:

- Branch was clean and synchronized with `origin/codex/linkshelf-mvp`.

## Completed MVP Surface

The current app includes:

- Public landing page.
- Public creator profile and public shelf pages.
- Creator Studio dashboard, shelf management, create shelf, analytics, comments,
  and settings.
- Fan Hub dashboard, rewards, wallet tracking ID controls, saved collections,
  and shared shelves.
- Super Admin dashboard and admin gate.
- Google-only development auth flows plus production-oriented NextAuth Google
  configuration hooks.
- Local SQLite schema, migrations, deterministic seed data, and demo DB refresh
  paths.
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

Sprint 24 is documentation-only, so runtime test suites are not expected to
change unless a later verification step discovers unexpected file drift.

## Production Readiness Summary

Status by area:

- Authentication: partially prepared, not production-complete.
- Database: local SQLite is functional for MVP, not yet production persistence.
- Environment configuration: implicit, not yet documented or validated as a
  production contract.
- Deployment: no deployment target or runbook is committed.
- Monitoring: no production observability baseline is committed.
- Affiliate integration: local redirect and Amazon tag rewrite exist; real
  Amazon integration, compliance, and reporting are not productionized.
- Visual QA: ongoing P2 fidelity backlog; remaining visual drift should move to
  Release Candidate polish unless it blocks usability, accessibility, or release
  confidence.

## Operating Guardrails

- Do not add new product features during Feature Freeze unless the user changes
  the product priority.
- Do not implement OAuth, persistent DB, deployment, monitoring, or Amazon API
  integration outside their dedicated approved sprints.
- Record newly discovered issues in `docs/project-status.md` instead of fixing
  them opportunistically.
- Keep visual QA work behind production engineering unless a visual issue is a
  real usability, accessibility, or regression blocker.
- Preserve the current MVP flows while production baselines are established.
