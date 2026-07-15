# Sprint 30 Release Candidate Design

Date: 2026-07-15 Asia/Shanghai

## Objective

Validate LinkShelf as a release candidate after Sprints 24-29 established the
production readiness baseline, production Google OAuth contract, persistent
database runtime, deployment baseline, monitoring baseline, and Amazon
integration boundary.

## In Scope

- Run the full verification suite:
  - `git diff --check`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm test`
  - `pnpm build`
  - `pnpm test:e2e`
- Generate fresh 15-screen Visual QA evidence with
  `scripts/capture-design-qa.mjs`.
- Review the captured comparison set for release-critical usability,
  accessibility, auth, Studio, Fan Hub, Admin, and share-flow regressions.
- Document performance and accessibility confidence from the build and E2E
  suite.
- Produce release candidate notes and a Release Manager recommendation.
- Update project state, roadmap, handoff, and next-session prompt.

## Out Of Scope

- New product features.
- Cosmetic visual fidelity work unless the fresh capture reveals a
  release-critical problem.
- Live Google OAuth callback verification without external credentials and a
  deployed HTTPS origin.
- Live external host deployment without hosting credentials.
- Live Creators API metadata calls without official accessible docs and
  credentials.

## Release Candidate Policy

This sprint can recommend the current branch as a code release candidate only if
local verification, build, E2E, accessibility coverage, and fresh visual QA pass.
It must not recommend public production launch until external launch gates are
cleared.

## Expected Evidence

- `docs/release-candidate.md`
- `test-results/design-qa/latest/capture-notes.json`
- 15 implementation screenshots under `test-results/design-qa/latest/impl/`
- 15 side-by-side comparison screenshots under
  `test-results/design-qa/latest/compare/`
- Updated `PROJECT_STATE.md`, `docs/project-status.md`, `docs/roadmap.md`,
  `HANDOFF.md`, and `NEXT_SESSION_PROMPT.md`
