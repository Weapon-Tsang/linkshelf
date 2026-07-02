# LinkShelf MVP Handoff

Last updated: 2026-07-03 Asia/Shanghai

## Workspace

- Repo worktree: `/Users/weapon_tsang/Documents/linkshelf/.worktrees/linkshelf-mvp`
- Branch: `codex/linkshelf-mvp`
- Remote: `origin https://github.com/Weapon-Tsang/linkshelf.git`
- Purpose: continue LinkShelf MVP implementation and Stitch visual QA alignment.

## Current State

The MVP is a working Next.js app covering:

- Public landing page
- Public creator profile and public shelf pages
- Creator Studio dashboard, shelf management, create shelf, analytics, comments, settings
- Fan Hub dashboard, rewards, wallet, saved/shared shelves
- Super Admin dashboard and admin auth gate
- Google-only development auth flows
- SQLite schema, deterministic seed data, seed refreshes for existing demo DBs
- Affiliate redirect route and share/fan auth resume flow
- 15-screen Stitch visual QA capture via `scripts/capture-design-qa.mjs`

Current QA evidence is recorded in `design-qa.md`. Latest visual capture notes timestamp:

- `2026-07-02T16:48:53.440Z`
- 15 captured states

## Latest Work Completed

Creator Profile / Public Shelf fidelity:

- Updated Liam profile avatar source to the Stitch AP1 Liam image and mapped it to a local asset.
- Added local avatar asset:
  - `public/stitch/assets/ad1d703ce47007644bd179897f9dd7b9bd7f4442104efbd165e9b66df5175b02.png`
- Updated `public/stitch/asset-manifest.json` for that avatar source.
- Added idempotent seed refreshes for old avatar assets.
- Updated seeded featured gear to Stitch titles/descriptions/prices/merchant labels:
  - `Sony a7 IV Mirrorless Camera`
  - `Sony FE 35mm f/1.4 GM Lens`
  - `Peak Design Travel Tripod`
- Updated Photography Kit public shelf description to the Stitch "My daily driver setup..." copy.
- Updated Creator Profile social display to show Instagram / TikTok / YouTube labels/icons from seeded platform URLs while preserving existing channel types used by share dialog compatibility.

Studio management fidelity:

- Tightened grid card density, rounded corners, padding, active card border, title width, and action alignment.
- Converted shelf filters to a single segmented rail.
- Updated sidebar account summary to Stitch `Alex River` with localized avatar.
- Mapped the first management card category chip to Stitch `Tech` / `Gear` display without changing underlying shelf category data.
- Kept `/studio/shelves?layout=list` behavior and filter/search layout state.

Documentation and QA:

- Updated `design-qa.md` with RED/GREEN records, latest verification, and latest visual capture timestamp.
- Re-captured the 15 Stitch comparison states after the latest Studio management pass.

## Verification Already Run

Fresh verification before the handoff/commit:

```bash
git diff --check
```

Passed.

```bash
PATH=/Users/weapon_tsang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/tsc --noEmit
```

Passed.

```bash
PATH=/Users/weapon_tsang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/eslint .
```

Passed.

```bash
PATH=/Users/weapon_tsang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/vitest run
```

Passed: 35 files / 236 tests.

```bash
PATH=/Users/weapon_tsang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH ./node_modules/.bin/next build
```

Passed with the existing non-fatal Turbopack NFT tracing warning:

- `next.config.ts` -> `src/lib/db/seed.ts` -> `src/app/api/out/[productId]/route.ts`

```bash
PATH=/Users/weapon_tsang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH PW_TEST_HTML_REPORT_OPEN=never ./node_modules/.bin/playwright test
```

Passed: 12/12.

```bash
PATH=/Users/weapon_tsang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH node scripts/capture-design-qa.mjs
```

Passed: 15 captured visual states.

Note: `next build`, Playwright, and visual capture need local process/port access and may require sandbox escalation in Codex Desktop.

## Remaining Work

No known P0/P1 functional blocker remains. Most remaining work is P2 visual/data fidelity:

- Landing page: hero proportions, supporting sections, carousel exposure, footer/nav spacing.
- Creator Profile: layout density, card proportions, public profile draft shelf visibility decision.
- Public shelf/share modal: confirm whether Stitch `share-modal.png` is the correct modal-open state; current app opens a real bottom sheet.
- Studio pages: shell width, card proportions, spacing, and remaining micro fidelity.
- Fan Hub: module width, density, and micro spacing.
- Super Admin: typography scale, horizontal proportions, and icon/photo fidelity.
- Production readiness: production Google OAuth credentials, persistent DB strategy, secrets, deployment, real Amazon affiliate integration, monitoring.

## Guardrails

- Do not revert user changes.
- Do not remove the worktree unless the user explicitly asks.
- Preserve Google-only auth unless the user changes product direction.
- Preserve `/studio/shelves?layout=list` and filter/search state behavior.
- Preserve share/fan auth resume behavior with `shareModal=1`.
- When changing seed data, add/update deterministic refresh paths for existing local demo DBs.
- Use TDD for code/behavior changes.
- Re-run `scripts/capture-design-qa.mjs` and update `design-qa.md` after visual changes.

## Suggested Next Window Prompt

```text
这是 Linkshelf MVP 项目的延续开发窗口。请先读取：

- HANDOFF.md
- design-qa.md
- package.json
- 当前 git status
- 最近 3 个 commit

工作目录是 /Users/weapon_tsang/Documents/linkshelf/.worktrees/linkshelf-mvp，分支是 codex/linkshelf-mvp。请总结当前项目状态、最新提交、已完成内容、验证结果、剩余 P2 问题，然后继续按 TDD + visual QA 的节奏推进下一处可测试的小收敛点。优先从 design-qa.md 里剩余的 Stitch visual drift 选择低风险任务；不要重做已完成的 Creator Profile avatar/featured gear/social label 或 Studio management segmented filter/category-tag/account-name 工作。继续开发直至本轮额度用完。
```
