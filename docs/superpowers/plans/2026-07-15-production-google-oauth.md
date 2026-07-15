# Production Google OAuth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make LinkShelf's Google-only production authentication real, documented, and verified for Sprint 25.

**Architecture:** Keep the existing Google-only login UI and Auth.js provider. Add a small shared server-side auth helper so protected App Router surfaces resolve either development cookies or production Auth.js JWT cookies through one path, then document the production OAuth environment and provisioning contract.

**Tech Stack:** Next.js App Router, NextAuth v4, Vitest, local SQLite through `node:sqlite`, TypeScript.

## Global Constraints

- Feature Freeze is active.
- Do not add product features by default.
- Do not continue visual polish unless it belongs to the approved sprint.
- Sprint 25 scope is Production Google OAuth only.
- Out of scope: non-Google providers, persistent database migration, deployment rollout, monitoring, Amazon API integration, and visual polish.
- Use TDD: production code changes require a failing test first.

---

### Task 1: Production Auth Helper

**Files:**

- Create: `src/features/auth/server.ts`
- Modify: `tests/integration/auth-production.test.ts`

**Interfaces:**

- Consumes: `resolveAuthSession(request: Request): Promise<AuthSession | null>` from `src/auth.ts`.
- Produces: `resolveServerAuthSession(headers: Headers, pathname?: string): Promise<AuthSession | null>`.

- [ ] **Step 1: Write the failing test**

Add a test to `tests/integration/auth-production.test.ts` that creates an
encrypted Auth.js cookie, passes it as server headers, and expects
`resolveServerAuthSession()` to return `user-creator`.

- [ ] **Step 2: Run test to verify it fails**

Run: `PATH=/Users/weapon_tsang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH pnpm test tests/integration/auth-production.test.ts -t "server auth helper"`

Expected: FAIL because `src/features/auth/server.ts` does not exist.

- [ ] **Step 3: Implement the helper**

Create `src/features/auth/server.ts` with a function that builds an HTTPS-like
request URL from `x-forwarded-proto`, `x-forwarded-host`, `host`, and the
provided pathname, then delegates to `resolveAuthSession()`.

- [ ] **Step 4: Run test to verify it passes**

Run: `PATH=/Users/weapon_tsang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH pnpm test tests/integration/auth-production.test.ts -t "server auth helper"`

Expected: PASS.

### Task 2: Protected Surface Session Wiring

**Files:**

- Modify: `src/app/studio/layout.tsx`
- Modify: `src/app/studio/dashboard/page.tsx`
- Modify: `src/app/studio/shelves/page.tsx`
- Modify: `src/app/studio/shelves/[shelfId]/edit/page.tsx`
- Modify: `src/app/studio/create/page.tsx`
- Modify: `src/app/studio/analytics/page.tsx`
- Modify: `src/app/studio/comments/page.tsx`
- Modify: `src/app/studio/settings/page.tsx`
- Modify: `src/app/hub/layout.tsx`
- Modify: `src/app/hub/dashboard/page.tsx`
- Modify: `src/app/admin/layout.tsx`
- Modify: `src/app/admin/dashboard/page.tsx`
- Modify: `src/app/[creatorHandle]/page.tsx`
- Modify: `src/app/[creatorHandle]/[shelfId]/page.tsx`
- Test: `tests/integration/auth-production.test.ts`

**Interfaces:**

- Consumes: `resolveServerAuthSession(headers, pathname)`.
- Produces: protected surfaces that honor production Auth.js JWT cookies and
  preserve existing development cookie behavior.

- [ ] **Step 1: Write failing coverage for role policy**

Add focused tests proving a production Auth.js creator cookie resolves as a
creator session, a fan cookie resolves as fan, and an admin cookie resolves as
admin through the shared helper.

- [ ] **Step 2: Run test to verify it fails**

Run: `PATH=/Users/weapon_tsang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH pnpm test tests/integration/auth-production.test.ts -t "role-aware production server sessions"`

Expected: FAIL before helper support is complete.

- [ ] **Step 3: Replace direct page-level `getAuthSession()` calls**

Update protected App Router layouts/pages and authenticated public pages to call
`resolveServerAuthSession(await headers(), "<current pathname>")` instead of
directly reading the development session cookie.

- [ ] **Step 4: Run tests**

Run: `PATH=/Users/weapon_tsang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH pnpm test tests/integration/auth-production.test.ts tests/unit/auth-guards.test.ts tests/unit/auth-adapter.test.ts`

Expected: PASS.

### Task 3: Production OAuth Contract And Runbook

**Files:**

- Create: `.env.example`
- Create: `docs/production-google-oauth.md`
- Modify: `tests/integration/auth-production.test.ts`
- Modify: `PROJECT_STATE.md`
- Modify: `docs/project-status.md`
- Modify: `docs/roadmap.md`
- Modify: `HANDOFF.md`
- Modify: `NEXT_SESSION_PROMPT.md`

**Interfaces:**

- Consumes: Sprint 25 design in `docs/superpowers/specs/2026-07-15-production-google-oauth-design.md`.
- Produces: committed production OAuth setup and handoff documentation.

- [ ] **Step 1: Write failing env-state test**

Add tests for partial config: `AUTH_GOOGLE_ID` without `AUTH_GOOGLE_SECRET`, and
`AUTH_GOOGLE_SECRET` without `AUTH_GOOGLE_ID`, both return no provider and make
`hasGoogleAuthConfiguration()` false.

- [ ] **Step 2: Run test to verify it fails or confirms existing coverage gap**

Run: `PATH=/Users/weapon_tsang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH pnpm test tests/integration/auth-production.test.ts -t "partial production Google configuration"`

Expected: FAIL before the test exists, then PASS once behavior is confirmed or
minimal code is added.

- [ ] **Step 3: Add docs and `.env.example`**

Document required variables, Google Cloud OAuth origins, redirect URI,
provisioning SQL, admin policy, local/preview/prod matrix, and known blocker
that live credentials/deployed callback verification was not performed.

- [ ] **Step 4: Update project state docs**

Mark Sprint 25 complete if verification passes, and identify Sprint 26:
Persistent Database as the next recommended sprint.

- [ ] **Step 5: Run final verification**

Run:

```bash
git diff --check
PATH=/Users/weapon_tsang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH pnpm typecheck
PATH=/Users/weapon_tsang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH pnpm lint
PATH=/Users/weapon_tsang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH pnpm test
```

Expected: all pass, aside from the existing Node SQLite experimental warning in
test output.
