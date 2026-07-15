# Sprint 28 Monitoring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add structured production monitoring events, critical-flow coverage, and a monitoring runbook.

**Architecture:** A small server-side monitoring module emits privacy-safe JSON events to stdout in production or when explicitly enabled. Health, Google auth, Auth.js production sign-in, and affiliate redirects call the module at critical outcomes. Documentation tells operators how to collect, inspect, and act on those events.

**Tech Stack:** Next.js 16 App Router, Node.js 24, TypeScript, Vitest, container stdout logs.

## Global Constraints

- Do not add hosted monitoring dependencies or secrets in Sprint 28.
- Emit events to stdout in production by default.
- Allow non-production event verification with `LINKSHELF_MONITORING_STDOUT=1`.
- Do not log OAuth tokens, cookies, secrets, authorization headers, raw Google subjects, email addresses, or raw query strings.
- Keep instrumentation limited to health, auth, and affiliate redirect paths.

---

## File Structure

- Create `src/lib/monitoring/events.ts` for event schema, redaction, env gating, and console sink routing.
- Create `tests/unit/monitoring-events.test.ts` for event JSON, gating, and redaction.
- Modify `src/app/api/health/route.ts` and `tests/integration/health-route.test.ts`.
- Modify `src/app/api/auth/google/route.ts`, `src/auth.ts`, `tests/integration/auth-route.test.ts`, and `tests/integration/auth-production.test.ts`.
- Modify `src/app/api/out/[productId]/route.ts` and `tests/integration/affiliate-route.test.ts`.
- Create `docs/monitoring.md`.
- Modify `.env.example`, `PROJECT_STATE.md`, `docs/project-status.md`, `docs/roadmap.md`, `HANDOFF.md`, and `NEXT_SESSION_PROMPT.md`.

## Task 1: Monitoring Event Module

**Files:**
- Create: `src/lib/monitoring/events.ts`
- Create: `tests/unit/monitoring-events.test.ts`

**Interfaces:**
- Produces: `recordOperationalEvent(event: OperationalEventInput, options?: RecordOperationalEventOptions): void`
- Produces: `operationalEventEnabled(environment?: MonitoringEnvironment): boolean`

- [ ] **Step 1: Write failing tests for JSON output, env gating, and redaction.**
- [ ] **Step 2: Run `pnpm vitest run tests/unit/monitoring-events.test.ts` and verify failure.**
- [ ] **Step 3: Implement `src/lib/monitoring/events.ts`.**
- [ ] **Step 4: Re-run the test and verify pass.**

## Task 2: Health And Affiliate Instrumentation

**Files:**
- Modify: `src/app/api/health/route.ts`
- Modify: `tests/integration/health-route.test.ts`
- Modify: `src/app/api/out/[productId]/route.ts`
- Modify: `tests/integration/affiliate-route.test.ts`

**Interfaces:**
- Consumes: `recordOperationalEvent`.
- Produces: `health.check` and `affiliate.redirect` events.

- [ ] **Step 1: Add failing route tests that enable monitoring stdout and spy on emitted events.**
- [ ] **Step 2: Run the two integration test files and verify failure.**
- [ ] **Step 3: Instrument health and affiliate outcomes.**
- [ ] **Step 4: Re-run the two integration test files and verify pass.**

## Task 3: Auth Instrumentation

**Files:**
- Modify: `src/app/api/auth/google/route.ts`
- Modify: `src/auth.ts`
- Modify: `tests/integration/auth-route.test.ts`
- Modify: `tests/integration/auth-production.test.ts`

**Interfaces:**
- Consumes: `recordOperationalEvent`.
- Produces: `auth.google.request` and `auth.google.sign_in` events.

- [ ] **Step 1: Add failing tests for auth route rejections/config redirects and Auth.js accepted/rejected sign-in mapping.**
- [ ] **Step 2: Run auth integration tests and verify failure.**
- [ ] **Step 3: Instrument auth route and Auth.js callbacks.**
- [ ] **Step 4: Re-run auth integration tests and verify pass.**

## Task 4: Monitoring Runbook And Handoff

**Files:**
- Create: `docs/monitoring.md`
- Modify: `.env.example`
- Modify: `PROJECT_STATE.md`
- Modify: `docs/project-status.md`
- Modify: `docs/roadmap.md`
- Modify: `HANDOFF.md`
- Modify: `NEXT_SESSION_PROMPT.md`

**Interfaces:**
- Produces: operator-facing monitoring documentation and current project state.

- [ ] **Step 1: Add failing documentation assertions to a focused test.**
- [ ] **Step 2: Create the runbook and env example updates.**
- [ ] **Step 3: Update handoff and project status to mark Sprint 28 complete and recommend Sprint 29.**
- [ ] **Step 4: Run full verification, commit, and push.**

## Self-Review

- The plan covers every in-scope requirement from the design.
- No placeholder steps remain.
- Event names match between the spec and implementation tasks.
- Verification includes focused tests, full tests, build, and e2e.
