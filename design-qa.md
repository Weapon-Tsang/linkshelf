# LinkShelf design QA

Status: automated release gates passed; side-by-side Stitch visual comparison remains pending.

This file tracks the release-gate comparison between the implemented LinkShelf routes and the 15 Stitch source screens. Automated functional, accessibility, responsive, build, and smoke gates now pass. The final visual result remains pending until each implemented screen is placed side-by-side with its source reference in `design/stitch/screens/` at matching viewport/state.

## Source coverage

| Stitch reference | Implemented route or state | QA status |
| --- | --- | --- |
| `landing-page` | `/` | E2E screenshot captured; side-by-side visual diff pending |
| `creator-profile` | `/liamroberts.photo` | E2E route/axe covered; side-by-side visual diff pending |
| `studio-create-shelf` | `/studio/create` | E2E route covered; side-by-side visual diff pending |
| `studio-management-expanded` | `/studio/shelves` and `/studio/shelves/shelf-photography/edit` | E2E route covered; side-by-side visual diff pending |
| `studio-dashboard` | `/studio/dashboard` | E2E route/axe/responsive covered; side-by-side visual diff pending |
| `studio-settings` | `/studio/settings` | Smoke/build route covered; side-by-side visual diff pending |
| `studio-analytics` | `/studio/analytics` | Smoke/build route covered; side-by-side visual diff pending |
| `studio-management-one-column` | Responsive shelf management state | Responsive E2E covered at 390/780/1280/2560; side-by-side visual diff pending |
| `studio-comments` | `/studio/comments` | Smoke/build route covered; side-by-side visual diff pending |
| `share-modal` | Public shelf share dialog | E2E public shelf covered; modal side-by-side visual diff pending |
| `fan-dashboard` | `/hub/dashboard` | E2E route/axe covered; side-by-side visual diff pending |
| `super-admin` | `/admin/dashboard` | E2E route covered; side-by-side visual diff pending |
| `fan-auth-overlay` | Fan login continuation from public shelf | Auth/resume routes covered by integration; overlay visual diff pending |
| `admin-login` | `/admin-secret` and admin entry challenge | E2E route covered; side-by-side visual diff pending |
| `creator-login` | `/login?returnTo=/studio/dashboard` | E2E route/axe covered; side-by-side visual diff pending |

## Automated gates

| Gate | Command | Status |
| --- | --- | --- |
| Lint | `PATH=/Users/weapon_tsang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/eslint .` | Passed on 2026-06-26 |
| Typecheck | `PATH=/Users/weapon_tsang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/tsc --noEmit` | Passed on 2026-06-26 |
| Unit/integration/component tests | `PATH=/Users/weapon_tsang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/vitest run` | Passed on 2026-06-26: 33 files, 212 tests |
| End-to-end journeys | `PATH=/Users/weapon_tsang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/playwright test` | Passed on 2026-06-26: 11 tests |
| Production build | `PATH=/Users/weapon_tsang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/next build` | Passed on 2026-06-26 with one non-fatal Turbopack NFT warning |
| Route smoke test | `PATH=/Users/weapon_tsang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH node scripts/smoke-routes.mjs` | Passed on 2026-06-26: 8 checks |

## Current findings

- Fixed release-gate findings from the first browser run:
  - Development auth redirects now preserve the browser loopback origin, so session cookies survive `127.0.0.1`/`localhost` aliasing.
  - Admin entry redirects now preserve the browser host header, so challenge cookies survive the secret-entry hop.
  - SQLite-derived rows passed to Client Components are converted to plain serializable objects.
  - Landing CTA and dashboard shell helper cards meet axe color-contrast checks.
  - Playwright uses the installed Google Chrome channel because bundled Chromium download was unavailable.
- Remaining visual QA work: perform side-by-side comparison for each Stitch source screen and record any P0/P1/P2/P3 visual deltas.

final result: automated gates passed; side-by-side Stitch visual comparison pending
