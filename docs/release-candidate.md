# LinkShelf Release Candidate

Date: 2026-07-15 Asia/Shanghai

Sprint: Sprint 30: Release Candidate

## Release Scope

This release candidate validates the Feature Freeze branch after the seven-step
production readiness sequence:

1. Sprint 24: Production Readiness Baseline.
2. Sprint 25: Production Google OAuth.
3. Sprint 26: Persistent Database.
4. Sprint 27: Deployment.
5. Sprint 28: Monitoring.
6. Sprint 29: Amazon Integration.
7. Sprint 30: Release Candidate.

No new product features are included in Sprint 30. The sprint is limited to
release validation, evidence capture, documentation, and release management.

## Verification Matrix

| Check | Status | Evidence |
| --- | --- | --- |
| `git diff --check` | Passed | No whitespace errors |
| `pnpm typecheck` | Passed | `tsc --noEmit` completed |
| `pnpm lint` | Passed | `eslint .` completed |
| `pnpm test` | Passed | 43 files, 345 tests |
| `pnpm build` | Passed | Production build completed; existing non-fatal Turbopack NFT tracing warning remains |
| `pnpm test:e2e` | Passed | 12 Playwright tests |
| `node scripts/capture-design-qa.mjs` | Passed | 15 captured states |

## Visual QA Evidence

Fresh release-candidate visual QA evidence was generated under
`test-results/design-qa/latest/`.

Generated at:

- `2026-07-15T10:51:39.826Z`
- `2026-07-15 18:51:39 Asia/Shanghai`

Evidence paths:

- `test-results/design-qa/latest/capture-notes.json`
- `test-results/design-qa/latest/impl/`
- `test-results/design-qa/latest/compare/`

The capture covers the 15 Stitch reference states: landing page, creator
profile, creator login, Studio dashboard, Studio management expanded, Studio
management one-column, Studio create shelf, Studio settings, Studio analytics,
Studio comments, Fan Hub dashboard, fan auth overlay, share modal, admin login,
and Super Admin.

Review summary:

- 15 implementation screenshots and 15 side-by-side comparison screenshots were
  generated.
- Anonymous fan-auth overlay is reachable again when the dev server is started
  on the same `127.0.0.1` origin used by Visual QA; a component regression test
  now covers the anonymous hero share button.
- No release-critical blank screen, broken modal, unreadable primary state,
  severe overlap, or blocked auth/admin/fan/studio flow was found in the
  reviewed comparison set.
- Remaining differences are P2 visual fidelity drift already tracked in
  `design-qa.md`, plus the accepted Google-only fan-auth provider difference and
  the known share-modal reference-state mismatch.

## Performance And Accessibility

Performance confidence is based on a successful production build and the absence
of release-blocking runtime regressions in the local E2E suite.

Accessibility confidence is based on the Playwright accessibility coverage,
which exercises key landing, auth, Studio, Fan Hub, and Admin surfaces with
axe-backed checks and responsive flow assertions.

The E2E suite passed 12 tests, including the axe-backed primary route coverage
and responsive overflow checks at 390px, 780px, 1280px, and 2560px.

## Production Ready Definition Of Done

| Area | RC status |
| --- | --- |
| Authentication | Code, tests, and docs pass; live Google OAuth callback remains externally gated |
| Database | File-backed SQLite persistent-path contract, migrations, and production seed safety are documented and tested |
| Environment | Required MVP production variables are documented; live secret ownership remains external |
| Deployment | Docker/Compose baseline and build pass; live host proof remains external |
| Monitoring | Structured stdout events and manual runbook exist; hosted alert delivery remains external |
| Affiliate | Redirect/tag handling and Amazon boundary are tested; live Creators API remains external |
| Security | Auth guards, admin gates, redirect safety, and production-denied states are covered locally |
| Quality | Typecheck, lint, unit/integration/component tests, build, E2E, and visual QA passed |
| Documentation | Project state, roadmap, handoff, release notes, and next-session prompt are updated |

## Known External Launch Gates

The codebase can be recommended as a release candidate only within local and
production-like workspace constraints. Public production launch remains gated by
external systems that are not available in this workspace:

- Real Google OAuth client credentials and deployed HTTPS callback URL
  verification.
- Live external hosting origin and persistent disk behavior proof.
- Hosted log drain or alert delivery integration for production monitoring.
- Live Creators API docs, credentials, and metadata-call verification.
- External affiliate compliance review and payout reconciliation operations.

## Release Manager Recommendation

Recommended decision: accept `codex/linkshelf-mvp` as a code release candidate
for stakeholder review and production-environment setup.

Do not approve public production launch yet. The remaining gates are external to
this workspace: live Google OAuth credentials and deployed callback
verification, live host/persistent disk proof, hosted alert delivery, live
Creators API access, and external affiliate compliance/reconciliation approval.
