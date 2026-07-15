# Persistent Database Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make LinkShelf's MVP production database path explicit, persistent, migration-driven, and safe from demo seed overwrites.

**Architecture:** Keep SQLite as the Sprint 26 production persistence strategy, but require an explicit absolute `LINKSHELF_DB_PATH` in production. Add a shared app database runtime that resolves the path, opens SQLite, runs migrations, and seeds only in non-production mode; then route auth, public shelves, and affiliate redirects through it.

**Tech Stack:** Next.js App Router, Node `node:sqlite`, TypeScript, Vitest, SQLite WAL mode.

## Global Constraints

- Feature Freeze is active.
- Do not add product features by default.
- Do not continue visual polish unless it belongs to the approved sprint.
- Sprint 26 scope is Persistent Database only.
- Out of scope: managed database migration, deployment host selection, deployment descriptors, monitoring, Amazon API integration, and visual polish.
- Use TDD: production code changes require a failing test first.

---

### Task 1: Shared Database Runtime

**Files:**

- Create: `src/lib/db/runtime.ts`
- Modify: `tests/integration/database.test.ts`

**Interfaces:**

- Produces:
  - `resolveApplicationDatabasePath(environment?: DatabaseRuntimeEnvironment): string`
  - `shouldSeedDemoData(environment?: Pick<DatabaseRuntimeEnvironment, "NODE_ENV">): boolean`
  - `openApplicationDatabase(environment?: DatabaseRuntimeEnvironment): DatabaseSync`

- [ ] **Step 1: Write failing production path tests**

Add tests that call `resolveApplicationDatabasePath()` with production
environments and assert missing, `:memory:`, and relative paths throw, while an
absolute path is returned.

- [ ] **Step 2: Run test to verify it fails**

Run: `PATH=/Users/weapon_tsang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH pnpm test tests/integration/database.test.ts -t "production database path"`

Expected: FAIL because `src/lib/db/runtime.ts` does not exist.

- [ ] **Step 3: Implement the runtime**

Create `src/lib/db/runtime.ts` with path resolution, production seed decision,
and app database opening that calls `createDatabase()`, `migrate()`, and
`seed()` only when `NODE_ENV !== "production"`.

- [ ] **Step 4: Run focused tests**

Run: `PATH=/Users/weapon_tsang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH pnpm test tests/integration/database.test.ts -t "production database path"`

Expected: PASS.

### Task 2: Wire Runtime Into App Open Paths

**Files:**

- Modify: `src/features/auth/adapter.ts`
- Modify: `src/features/shelves/service.ts`
- Modify: `src/app/api/out/[productId]/route.ts`
- Modify: `tests/integration/database.test.ts`
- Modify: `tests/integration/auth-production.test.ts`
- Modify: `tests/integration/affiliate-route.test.ts`

**Interfaces:**

- Consumes: `openApplicationDatabase(environment)`.
- Produces: auth, public shelves, and affiliate redirects using identical
  production database initialization rules.

- [ ] **Step 1: Write failing production open tests**

Add tests that open an absolute-path production DB, confirm migrations exist,
confirm no demo users exist, insert a real user, close/reopen through the app
runtime, and confirm the user remains.

- [ ] **Step 2: Run test to verify it fails**

Run: `PATH=/Users/weapon_tsang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH pnpm test tests/integration/database.test.ts -t "production application database"`

Expected: FAIL until runtime and app open paths exist.

- [ ] **Step 3: Replace duplicated open logic**

Use `openApplicationDatabase({ NODE_ENV: nodeEnv, LINKSHELF_DB_PATH:
process.env.LINKSHELF_DB_PATH })` in `openAuthDatabase()`,
`openPublicShelvesDatabase()`, and `openAffiliateDatabase()`.

- [ ] **Step 4: Run focused DB/auth/affiliate tests**

Run: `PATH=/Users/weapon_tsang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH pnpm test tests/integration/database.test.ts tests/integration/auth-production.test.ts tests/integration/affiliate-route.test.ts`

Expected: PASS.

### Task 3: Persistent DB Runbook And Project State

**Files:**

- Create: `docs/persistent-database.md`
- Modify: `.env.example`
- Modify: `PROJECT_STATE.md`
- Modify: `docs/project-status.md`
- Modify: `docs/roadmap.md`
- Modify: `HANDOFF.md`
- Modify: `NEXT_SESSION_PROMPT.md`

**Interfaces:**

- Consumes: Sprint 26 design in
  `docs/superpowers/specs/2026-07-15-persistent-database-design.md`.
- Produces: production SQLite path, migration, backup, restore, and handoff
  documentation.

- [ ] **Step 1: Document the selected strategy**

Add `docs/persistent-database.md` describing the production file-backed SQLite
strategy, required absolute `LINKSHELF_DB_PATH`, migration behavior, seed
safety, backup/restore, and Sprint 27 deployment expectations.

- [ ] **Step 2: Update `.env.example`**

Clarify that production `LINKSHELF_DB_PATH` must be an absolute persistent
volume path, while the checked-in example remains a local development path.

- [ ] **Step 3: Update project state docs**

Mark Sprint 26 complete if verification passes, and identify Sprint 27:
Deployment as the next recommended sprint.

- [ ] **Step 4: Run final verification**

Run:

```bash
git diff --check
PATH=/Users/weapon_tsang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH pnpm typecheck
PATH=/Users/weapon_tsang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH pnpm lint
PATH=/Users/weapon_tsang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH pnpm test
PATH=/Users/weapon_tsang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH pnpm build
PATH=/Users/weapon_tsang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH PW_TEST_HTML_REPORT_OPEN=never pnpm test:e2e
```

Expected: all pass, aside from existing Node SQLite experimental warnings and
the existing non-fatal Turbopack NFT tracing warning during build.
