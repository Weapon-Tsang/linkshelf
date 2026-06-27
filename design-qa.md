# LinkShelf design QA

Status: current-run Stitch side-by-side visual QA complete with known P2 fidelity drift remaining.

This QA pass compares the implemented LinkShelf routes against the 15 Stitch source screens in `design/stitch/screens/`. Evidence was captured from the local app at `http://127.0.0.1:3000` on 2026-06-28 after the Fan Hub data polish, seed refresh fix, density pass, Google auth mark pass, create-shelf demo seed pass, create-shelf local flat-lay/compact-card pass, create-shelf field-order pass, create-shelf URL affordance pass, compact detected-card/header pass, create-shelf full-canvas shell pass, selected detected-card pass, create-shelf hotspot state pass, create-shelf dual-preview pass, create-shelf tablet-frame pass, and restored elevated verification run.

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
| `studio-create-shelf.jpg` | `/studio/create` | `1280x1024@2` | Captured after AI Workbench, local flat-lay asset, compact cards, square workbench crop, field-order pass, URL affordance pass, compact detected-card/header pass, full-canvas shell pass, selected detected-card pass, hotspot state pass, dual mobile/tablet preview pass, and tablet-frame pass; remaining spacing/proportion micro-fidelity drift |
| `studio-settings.jpg` | `/studio/settings` | `728x1024@2` | Captured after serialization fix; P2 layout/content drift remains |
| `studio-analytics.jpg` | `/studio/analytics` | `1280x1024@2` | Captured; P2 metrics/content drift remains |
| `studio-comments.jpg` | `/studio/comments` | `1280x1024@2` | Captured after serialization fix; P2 content/layout drift remains |
| `fan-dashboard.png` | `/hub/dashboard` | `1280x1024@2` | Captured after Fan Hub data/density polish; minor P2 spacing/image drift remains |
| `fan-auth-overlay.png` | public shelf + fan auth overlay | `1280x1024@2` | Captured after portal, modal-treatment, and Google mark pass; provider count/height drift is intentional |
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
  Evidence: the implementation now uses the compact Creator Management sidebar, dashboard CTA/metrics/activity feed, thumbnail shelf card grid, AI Link Workbench, detected item list, and shelf preview blocks from the Stitch IA. The create-shelf page now opens as a full-canvas editor without the Studio sidebar, with Photography Kit, Tech Pro, three detected camera products, the Stitch-exported local flat-lay cover asset, compact detected-item cards, a square workbench crop, Stitch-like details field order, full `linkshelf.page/liam/` URL prefix with copy affordance, compact detected-result cards with drag handle, numbered badge, ITEM NAME / Product URL fields, Amazon and price chips, selected first detected-card teal border, selected cover hotspot in teal, secondary cover hotspots in neutral white, top-only Save Draft / Publish Shelf actions, Theme placement in the preview area, simultaneous mobile/tablet shelf previews instead of a single switched preview, and a Stitch-like tablet preview frame with lavender canvas, floating white card, and three skeleton product tiles. Remaining differences are mostly section proportions, image/card sizing, and final spacing.
  Impact: the former core Studio IA blocker is reduced; the Studio flow is now much closer to the designed experience, but still needs a polish/content pass before it can be called visually faithful.
  Fix: tune Studio image assets, copy/data values, card sizing, and create-shelf field/card proportions against the side-by-side captures.

- [P2] Fan dashboard now matches the Stitch data story, with visual polish still remaining
  Location: `/hub/dashboard`.
  Evidence: latest `test-results/design-qa/latest/compare/fan-dashboard.png` shows the implementation now renders the Stitch “My Hub” structure and data: top utility navigation, compact Creator Economy side rail, Affiliate ID Binding, `$128.50` available balance, `$12.30` pending clearance, three rewards rows with non-wrapping type pills, two shared shelves, two saved collections, real share/saved metadata, and the existing CSV/tracking/withdrawal interactions. Remaining visible drift: dates use the 2026 seed timeline instead of the 2023 Stitch example, images are close but not exact crops, and some section spacing/card proportions still need a final pixel polish pass.
  Impact: the former Fan Hub product-state and density blockers are resolved; remaining work is visual fidelity polish rather than missing core content.
  Fix: tune final image crops, micro-spacing, and optional seed display dates against `fan-dashboard.png`.

- [P2] Public fan-auth overlay is closer to the Stitch modal treatment, with an intentional provider-count deviation
  Location: public shelf share overlay.
  Evidence: latest comparison shows the dialog is body-portaled, centered, uses a frosted card, close button, teal fan icon, glow treatment, secure-encryption pill, and a Google button with the Stitch-exported Google mark. Remaining differences: Stitch shows three providers and a taller card, while implementation intentionally keeps a single Google-only action.
  Impact: former usability and modal-scale blockers are resolved. The remaining provider-count mismatch is an accepted product deviation from the user’s Google-only direction.
  Fix: keep Google-only behavior; if the single-provider version is canonical, re-export the Stitch source or update the reference so visual QA no longer treats GitHub/X as missing.

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
- Tuned Fan Hub seed data to Stitch-like balances, pending clearance, rewards, shared shelves, saved collections, and top utility navigation.
- Added a deterministic seed refresh for the Fan Hub pending wallet fixture so existing local databases migrate from the old `$15.99` demo value to `$12.30`.
- Added regression coverage for the Fan Hub seed refresh and updated Fan Hub E2E expectations to the new Stitch-like dashboard data.
- Tightened the Fan Hub side rail from the heavier profile/sidebar treatment to a compact 188px Stitch-style rail, moved Explore back to the top utility navigation, and removed the extra desktop callout card.
- Tightened Fan Hub table/card density by fixing reward table column widths, preventing reward type pill wrapping, and reducing shared/saved card image and padding scale.
- Added Fan Hub layout-density component regressions for the compact side rail and fixed rewards table.
- Fixed the Fan Hub E2E selector to scope duplicate shelf names to the Saved Collections region.
- Fixed Fan Hub axe regressions by improving active navigation contrast and making the rewards table scroll region keyboard-focusable.
- Added the Stitch-exported Google SVG mark to the shared Google login button while preserving the accessible button name and Google-only auth behavior.
- Added focused component coverage for the shared Google mark on creator and admin login surfaces.
- Seeded the create-shelf route with Stitch-like Photography Kit demo content so the first paint matches the designed populated AI Workbench flow instead of an empty form.
- Added route-level component coverage for the create-shelf demo seed, including shelf fields, three detected products, and populated preview content.
- Downloaded the Stitch create-shelf flat-lay source image into `public/stitch/assets/create-shelf-flat-lay.png` and seeded the create route with the local asset instead of the previous remote cover image.
- Added a compact `ItemEditor` density for the create-shelf demo flow, hiding lower-priority image/description controls while preserving the full editor mode for normal shelf editing.
- Locked the AI Workbench cover to a square crop so the flat-lay image is no longer stretched by the right-side detected item list.
- Added a create-shelf presentation mode that hides the internal Cover image URL field, moves Theme into the Shelf Preview controls, and renders Shelf Details in the Stitch order: title/category, Shelf URL, description, then Original Content URL.
- Added a create-shelf URL prefix affordance that renders `linkshelf.page/liam/`, keeps the editable value as the slug-only payload, and exposes a functional copy button for the full shelf URL.
- Tightened compact detected item cards so the create flow shows ITEM NAME, Product URL, Amazon, and price chips instead of backend-style Merchant/Price/Fetched metadata controls.
- Replaced the compact product header with the Stitch-like detected-card row: drag handle, numbered badge, inline item-name field, and a single remove action instead of visible `Product #` and reorder buttons.
- Rendered `/studio/create` as a full-canvas editor without the Creator Management sidebar, while leaving the sidebar intact for Dashboard, Shelves, Analytics, Comments, and Settings.
- Hid the duplicate bottom Save/Publish action bar in the Stitch create presentation mode so the create route uses only the top action area.
- Added a selected state for the first compact detected item card, matching the Stitch teal outline treatment while keeping the remaining cards neutral.
- Matched the AI Workbench cover hotspot states so the selected first hotspot is teal while secondary hotspots remain neutral white.
- Matched the create-shelf Shelf Preview structure so Stitch presentation mode renders simultaneous mobile and tablet previews instead of device-toggle buttons.
- Matched the create-shelf tablet preview treatment so Stitch presentation mode renders a lavender tablet frame with a floating shelf card and three skeleton product tiles instead of a second full product list.

## Verification run evidence

| Gate | Command | Result |
| --- | --- | --- |
| Comment/settings serialization regressions | `PATH=/Users/weapon_tsang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/vitest run tests/integration/comment-actions.test.ts` | Passed: 5 tests |
| Google login + fan auth/share regression | `PATH=/Users/weapon_tsang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/vitest run tests/component/google-login.test.tsx tests/component/share-dialog.test.tsx tests/component/public-shelf.test.tsx` | Passed: 22 tests |
| Latest TypeScript | `PATH=/Users/weapon_tsang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/tsc --noEmit` | Passed |
| Latest lint | `PATH=/Users/weapon_tsang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/eslint .` | Passed |
| Fan Hub RED/GREEN target | `PATH=/Users/weapon_tsang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/vitest run tests/component/fan-hub.test.tsx tests/integration/wallet.test.ts` | RED confirmed missing Fan Hub structure/metadata, then passed: 10 tests |
| Fan Hub seed refresh RED/GREEN target | `PATH=/Users/weapon_tsang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/vitest run tests/integration/database.test.ts -t "refreshes deterministic Fan Hub seed values"` | RED confirmed stale `$15.99` pending fixture, then passed: 1 focused test |
| Fan Hub density RED/GREEN target | `PATH=/Users/weapon_tsang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/vitest run tests/component/fan-hub.test.tsx` | RED confirmed side rail/table density drift, then passed: 4 tests |
| Google auth mark RED/GREEN target | `PATH=/Users/weapon_tsang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/vitest run tests/component/google-login.test.tsx -t "renders the Stitch Google mark"` | RED confirmed missing source Google mark, then passed: 2 focused tests |
| Create shelf demo seed RED/GREEN target | `PATH=/Users/weapon_tsang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/vitest run tests/component/shelf-editor.test.tsx -t "opens the create page"` | RED confirmed empty create-shelf state, then passed: 1 focused test |
| Create shelf flat-lay/compact RED/GREEN target | `PATH=/Users/weapon_tsang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/vitest run tests/component/shelf-editor.test.tsx -t "opens the create page"` | RED confirmed old remote cover, full-density cards, and missing square workbench crop, then passed: 1 focused test |
| Create shelf field-order RED/GREEN target | `PATH=/Users/weapon_tsang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/vitest run tests/component/shelf-editor.test.tsx -t "opens the create page"` | RED confirmed Theme/Cover still lived in details and field order still put Shelf URL before Category, then passed: 1 focused test |
| Create shelf URL affordance RED/GREEN target | `PATH=/Users/weapon_tsang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/vitest run tests/component/shelf-editor.test.tsx -t "opens the create page"` | RED confirmed missing `linkshelf.page/liam/` prefix/copy affordance, then passed: 1 focused test |
| Create shelf detected-card RED/GREEN target | `PATH=/Users/weapon_tsang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/vitest run tests/component/shelf-editor.test.tsx -t "opens the create page"` | RED confirmed compact cards still exposed backend-style Product title/Merchant/Price/Fetch controls, then passed: 1 focused test |
| Create shelf compact header RED/GREEN target | `PATH=/Users/weapon_tsang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/vitest run tests/component/shelf-editor.test.tsx -t "opens the create page"` | RED confirmed compact cards still exposed visible `Product 1` management header, then passed: 1 focused test |
| Create shell full-canvas RED/GREEN target | `PATH=/Users/weapon_tsang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/vitest run tests/component/studio-navigation.test.tsx -t "full-canvas"` | RED confirmed `/studio/create` still rendered the Studio nav/sidebar, then passed in the full navigation suite |
| Create top-only actions RED/GREEN target | `PATH=/Users/weapon_tsang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/vitest run tests/component/shelf-editor.test.tsx -t "opens the create page"` | RED confirmed two `Save Draft` buttons, then passed: 1 focused test |
| Create selected detected-card RED/GREEN target | `PATH=/Users/weapon_tsang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/vitest run tests/component/shelf-editor.test.tsx -t "opens the create page"` | RED confirmed compact product cards had no selected state, then passed: 1 focused test |
| Create hotspot state RED/GREEN target | `PATH=/Users/weapon_tsang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/vitest run tests/component/shelf-editor.test.tsx -t "opens the create page"` | RED confirmed all cover hotspots were teal, then passed: 1 focused test |
| Create dual-preview RED/GREEN target | `PATH=/Users/weapon_tsang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/vitest run tests/component/shelf-editor.test.tsx -t "opens the create page"` | RED confirmed create mode still used device-toggle buttons and rendered only one preview, then passed: 1 focused test |
| Create tablet-frame RED/GREEN target | `PATH=/Users/weapon_tsang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/vitest run tests/component/shelf-editor.test.tsx -t "opens the create page"` | RED confirmed tablet preview still rendered a second full product list with no Stitch frame, then passed: 1 focused test |
| Shelf editor regression after tablet-frame pass | `PATH=/Users/weapon_tsang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/vitest run tests/component/shelf-editor.test.tsx` | Passed: 3 tests |
| Latest unit/integration/component suite | `PATH=/Users/weapon_tsang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/vitest run` | Passed: 230 tests across 35 files |
| Latest end-to-end suite after tablet-frame pass | `PATH=/Users/weapon_tsang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH PW_TEST_HTML_REPORT_OPEN=never ./node_modules/.bin/playwright test` | Passed: 12 tests |
| Production build after tablet-frame pass | `PATH=/Users/weapon_tsang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/next build` | Passed with one non-fatal Turbopack NFT tracing warning |
| Current-run visual capture | `PATH=/Users/weapon_tsang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/next dev --hostname 127.0.0.1 --webpack` + `node scripts/capture-design-qa.mjs` | Captured 15 states after Fan Hub data/density polish, Google auth mark pass, create-shelf local flat-lay/compact-card pass, create-shelf field-order pass, create-shelf URL affordance pass, compact detected-card/header pass, create full-canvas pass, selected detected-card pass, hotspot state pass, dual-preview pass, and tablet-frame pass |
| Share modal browser/E2E recapture | `PW_TEST_HTML_REPORT_OPEN=never ./node_modules/.bin/playwright test tests/e2e/fan-flow.spec.ts -g "post-auth share"` and `node scripts/capture-design-qa.mjs` | Passed targeted E2E; captured 15 visual states including `share-modal` |

## Implementation checklist

1. Confirm or re-export the intended Stitch state for `share-modal`, because the current reference does not show the modal while the app route does.
2. Finish Studio polish pass: exact imagery, spacing, card density, data values, and create-shelf field/card proportions.
3. Continue optional Fan Hub pixel polish: exact image crops, micro-spacing, and seed display dates against `fan-dashboard.png`.
4. Fan-auth overlay modal treatment and shared Google mark pass are complete; remaining provider-count mismatch is intentional unless the Stitch source is re-exported.
5. Do a second full visual QA pass and add focused crops for typography/card/detail fidelity.

final result: current-run QA captured; known P2 polish drift remains
