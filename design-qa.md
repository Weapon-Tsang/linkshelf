# LinkShelf design QA

Status: blocked after current-run Stitch side-by-side visual QA.

This QA pass compares the implemented LinkShelf routes against the 15 Stitch source screens in `design/stitch/screens/`. Evidence was captured from the local app at `http://127.0.0.1:3000` on 2026-06-26, with code-level Fan Hub alignment updates added on 2026-06-27. The Fan Hub screen needs a fresh side-by-side recapture once elevated browser/build commands are available again.

## Evidence summary

Source visual truth path: `design/stitch/screens/`

Implementation screenshot path: `test-results/design-qa/latest/impl/`

Full-view comparison evidence: `test-results/design-qa/latest/compare/`

Capture notes: `test-results/design-qa/latest/capture-notes.json`

Note: `test-results/` is intentionally git-ignored; rerun `node scripts/capture-design-qa.mjs` against a local server to regenerate the latest visual evidence.

Focused region comparison evidence: not generated in this pass because full-view comparisons already expose actionable P1/P2 blockers. Focused crops should be added after the major information-architecture/layout alignment pass.

## Screen coverage

| Stitch reference | Implemented route or state | Viewport | Current QA status |
| --- | --- | --- | --- |
| `landing-page.jpg` | `/` | `1280x1600@2` | Captured; P2 visual drift remains |
| `creator-profile.png` | `/liamroberts.photo` | `1280x1600@2` | Captured; P2 content/layout drift remains |
| `creator-login.png` | `/login?returnTo=/studio/dashboard` | `1280x1024@2` | Captured; Google-only login is intentional per product direction |
| `studio-dashboard.jpg` | `/studio/dashboard` | `1280x1024@2` | Captured after Studio IA pass; P2 spacing/data drift remains |
| `studio-management-expanded.jpg` | `/studio/shelves` | `1280x1024@2` | Captured after card-grid pass; P2 thumbnail/spacing drift remains |
| `studio-management-one-column.jpg` | `/studio/shelves` | `1280x1024@2` | Captured after card-grid pass; P2 state/content drift remains |
| `studio-create-shelf.jpg` | `/studio/create` | `1280x1024@2` | Captured after AI Workbench pass; remaining content/asset fidelity drift |
| `studio-settings.jpg` | `/studio/settings` | `728x1024@2` | Captured after serialization fix; P2 layout/content drift remains |
| `studio-analytics.jpg` | `/studio/analytics` | `1280x1024@2` | Captured; P2 metrics/content drift remains |
| `studio-comments.jpg` | `/studio/comments` | `1280x1024@2` | Captured after serialization fix; P2 content/layout drift remains |
| `fan-dashboard.png` | `/hub/dashboard` | `1280x1024@2` | Implemented after Fan Hub IA pass; needs fresh visual recapture |
| `fan-auth-overlay.png` | public shelf + fan auth overlay | `1280x1024@2` | Captured after portal fix; P2 visual/provider drift remains |
| `admin-login.png` | admin secret Google gate | `1280x1024@2` | Captured; Google-only auth is intentional per product direction |
| `super-admin.png` | `/admin/dashboard` | `1280x1024@2` | Captured; P2 data-density/layout drift remains |
| `share-modal.png` | `/liamroberts.photo/photography-kit?share=jamie-photo&shareModal=1` | `390x1405@2` | Captured after share route/portal fix; source-state/visual mismatch remains |

## Findings

- [P2] Share modal is reachable and captured, but the reference state appears mismatched
  Location: public shelf sharing flow / `src/features/engagement/share-dialog.tsx`, `src/features/public-profile/hotspot-hero.tsx`, `src/app/[creatorHandle]/[shelfId]/page.tsx`.
  Evidence: `test-results/design-qa/latest/compare/share-modal.png` now captures the real `shareModal=1` state. The implementation opens a bottom-sheet `Share Shelf` dialog with copy/channel/reward content, while the Stitch `share-modal.png` reference looks like the public shelf page without a visible modal.
  Impact: the former reachability blocker is resolved; the remaining issue is visual/source-state alignment rather than route functionality.
  Fix: confirm whether the Stitch `share-modal.png` export is the intended modal state. If yes, tune the mobile public shelf state to match it; if no, re-export the modal source and use the current `shareModal=1` route for comparison.

- [P2] Creator Studio shell and management pages are structurally aligned but still drift visually
  Location: `studio-dashboard`, `studio-management-expanded`, `studio-management-one-column`, `studio-create-shelf`.
  Evidence: the implementation now uses the compact Creator Management sidebar, dashboard CTA/metrics/activity feed, thumbnail shelf card grid, AI Link Workbench, detected item list, and shelf preview blocks from the Stitch IA. Remaining differences are mostly exact image selection, spacing, card density, and the create-shelf empty state versus Stitch’s more populated example.
  Impact: the former core Studio IA blocker is reduced; the Studio flow is now much closer to the designed experience, but still needs a polish/content pass before it can be called visually faithful.
  Fix: tune Studio image assets, copy/data values, card sizing, and prefilled create-shelf state against the side-by-side captures.

- [P2] Fan dashboard is structurally aligned but still needs visual recapture and polish
  Location: `/hub/dashboard`.
  Evidence: the implementation now renders the Stitch “My Hub” structure in one dashboard: Creator Economy navigation, Affiliate ID Binding, Available Balance, Rewards History, My Shared Shelves, Saved Collections, real share/saved card metadata, and the existing CSV/tracking/withdrawal interactions. This was verified by component and integration tests, but the side-by-side screenshot evidence could not be refreshed in this run because elevated browser/build commands were blocked by the current Codex usage limit.
  Impact: the former product-state blocker is reduced; remaining work is visual fidelity validation and polish rather than missing core content.
  Fix: rerun `scripts/capture-design-qa.mjs` after the usage-limit window clears, then tune exact spacing, image choices, navigation density, and reward table data against `fan-dashboard.png`.

- [P2] Public fan-auth overlay is now usable but still visually diverges
  Location: public shelf share overlay.
  Evidence: latest comparison shows the dialog is no longer clipped by product cards after portal rendering. Remaining differences: Stitch has three auth providers and a larger centered modal; implementation intentionally uses Google-only auth and a smaller card.
  Impact: no longer a usability blocker, but it remains visually different from the Stitch source. Provider count is an accepted product deviation from the user’s Google-only direction.
  Fix: keep Google-only behavior, but optionally tune modal size, blur strength, glow placement, and vertical position to match the source more closely.

- [P2] Several screens use the right brand direction but different copy/data density
  Location: landing, creator profile, studio analytics, studio comments, super admin.
  Evidence: teal/navy palette, rounded cards, soft shadows, and LinkShelf branding are present. However, text, metric values, card density, supporting sections, avatar/photo choices, and per-screen navigation differ across the side-by-side comparisons.
  Impact: the app feels coherent, but not yet like a faithful Stitch export implementation.
  Fix: after P1 structure gaps are closed, do a pass on copy, mock data, card density, image usage, and spacing per screen.

## Required fidelity surfaces

- Fonts and typography: broadly consistent bold rounded sans style, but hierarchy and optical sizes still need visual recapture/polish on Studio/Fan/Admin pages.
- Spacing and layout rhythm: major IA drift has been reduced in Studio and Fan Hub; pixel-level spacing drift remains, especially in create-shelf and post-recapture Fan Hub polish.
- Colors and visual tokens: teal/navy/soft surface language is consistent; beige app shell differs from several Stitch white/pink surfaces.
- Image quality and asset fidelity: localized Stitch/source assets render on public pages; several admin/studio mock sections use simplified content rather than exact reference imagery or thumbnails.
- Copy and app-specific content: product-level copy is present, but many screen headings, data values, labels, and content modules differ from the Stitch references.

## Patches made during this QA pass

- Added `scripts/capture-design-qa.mjs` to capture implementation screenshots and generate side-by-side comparison evidence.
- Fixed `/studio/comments` serialization by mapping SQLite comment rows to plain objects before passing them to a Client Component.
- Added a regression test for plain serializable comments.
- Fixed `/studio/settings` serialization by mapping the creator profile row to a plain object before passing it to a Client Component.
- Added a regression test for plain serializable settings.
- Portaled `FanAuthDialog` to `document.body` so the overlay is not clipped or overlapped by the public shelf hero container.
- Added a regression test that verifies the fan-auth overlay renders outside its trigger container.
- Added hydration guards to Admin Dashboard export controls and Fan Hub interactive controls so clicks cannot be lost before Client Components finish hydrating.
- Wired existing fan share links into the real `ShareDialog`, including post-auth `shareModal=1` route state and hero share button fallback.
- Added component coverage for existing share-link buttons and initial public shelf share modal state.
- Updated `scripts/capture-design-qa.mjs` so `share-modal` is now a real mobile capture target instead of a known blocker.
- Reworked `StudioShell` around the Stitch Creator Management sidebar, primary create CTA, and compact account summary.
- Rebuilt the Studio dashboard around the Stitch create-shelf card, `Today's Clicks` / `New Saves` metrics, and recent activity feed.
- Rebuilt shelf management as a thumbnail card grid with status pills, category tags, icon actions, and fallback Stitch cover art when local assets are unavailable.
- Reworked the create-shelf screen into `Shelf Details`, `AI Link Workbench`, detected item editing, and `Shelf Preview` sections.
- Added Studio structure component tests plus a cover-art fallback integration test.
- Reworked `HubShell` around the Stitch Creator Economy side navigation, Wallet/My Shares/Saved nav entries, mobile bottom nav, and New Link CTA.
- Rebuilt Fan Hub as a single My Hub dashboard with Affiliate ID Binding, Available Balance, Rewards History, My Shared Shelves, and Saved Collections modules.
- Extended wallet summaries with real cover art, item counts, and share counts for Fan Hub cards.
- Added Fan Hub structure/component coverage and wallet visual-metadata integration coverage.

## Verification run evidence

| Gate | Command | Result |
| --- | --- | --- |
| Comment/settings serialization regressions | `PATH=/Users/weapon_tsang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/vitest run tests/integration/comment-actions.test.ts` | Passed: 5 tests |
| Fan auth/share dialog regression | `PATH=/Users/weapon_tsang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/vitest run tests/component/share-dialog.test.tsx tests/component/public-shelf.test.tsx` | Passed: 13 tests |
| Latest TypeScript | `PATH=/Users/weapon_tsang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/tsc --noEmit` | Passed |
| Latest lint | `PATH=/Users/weapon_tsang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/eslint .` | Passed |
| Fan Hub RED/GREEN target | `PATH=/Users/weapon_tsang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/vitest run tests/component/fan-hub.test.tsx tests/integration/wallet.test.ts` | RED confirmed missing Fan Hub structure/metadata, then passed: 9 tests |
| Latest unit/integration/component suite | `PATH=/Users/weapon_tsang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/vitest run` | Passed: 224 tests across 35 files |
| Latest end-to-end suite after Fan Hub pass | `PATH=/Users/weapon_tsang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH PW_TEST_HTML_REPORT_OPEN=never ./node_modules/.bin/playwright test` | Blocked before execution: elevated command rejected by Codex usage-limit gate; prior run before Fan Hub changes passed 12 tests |
| Production build after Fan Hub pass | `PATH=/Users/weapon_tsang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/next build` | Sandboxed run hit Turbopack local process/port permission error; elevated rerun rejected by Codex usage-limit gate |
| Current-run visual capture | `PATH=/Users/weapon_tsang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH node ./node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --webpack` + `node scripts/capture-design-qa.mjs` | Captured 15 states including `share-modal` |
| Share modal browser/E2E recapture | `PW_TEST_HTML_REPORT_OPEN=never ./node_modules/.bin/playwright test tests/e2e/fan-flow.spec.ts -g "post-auth share"` and `node scripts/capture-design-qa.mjs` | Passed targeted E2E; captured 15 visual states including `share-modal` |

## Implementation checklist

1. Confirm or re-export the intended Stitch state for `share-modal`, because the current reference does not show the modal while the app route does.
2. Finish Studio polish pass: exact imagery, spacing, card density, data values, and create-shelf populated state.
3. Refresh Fan Hub visual capture and polish spacing, imagery, table density, and navigation details against `fan-dashboard.png`.
4. Tune fan-auth overlay visual treatment while preserving Google-only auth.
5. Do a second full visual QA pass and add focused crops for typography/card/detail fidelity.

final result: blocked
