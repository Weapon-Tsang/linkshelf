# Sprint 30 Release Candidate Plan

Date: 2026-07-15 Asia/Shanghai

## Plan

1. Add a small documentation regression test that requires release candidate
   notes, visual QA evidence, verification matrix, external launch gates, and a
   Release Manager recommendation.
2. Create the Sprint 30 release candidate spec, execution plan, and release
   candidate notes.
3. Update long-lived state documents from Sprint 29 to Sprint 30.
4. Run the full local verification suite.
5. Start the local app and generate a fresh 15-screen Visual QA capture.
6. Review capture notes and representative comparison screenshots for
   release-critical drift.
7. Backfill exact verification results, visual QA timestamp, known external
   launch gates, and the Release Manager recommendation.
8. Commit and push the completed Sprint 30 work.

## Checkpoints

- Red test: `pnpm vitest run tests/unit/release-candidate-docs.test.ts` fails
  before the release candidate docs exist.
- Green targeted test: the same test passes after docs and state updates.
- Final verification: full suite and visual capture results are recorded in
  `docs/release-candidate.md`.
