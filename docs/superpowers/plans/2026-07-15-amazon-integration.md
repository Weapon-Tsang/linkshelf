# Sprint 29 Amazon Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a production-safe Amazon integration boundary that blocks deprecated PA-API usage, preserves deterministic metadata fixtures, and documents the Creators API migration path.

**Architecture:** Amazon integration state is resolved from environment in a small config module. A metadata provider owns Amazon URL parsing and fixture metadata. The existing shelf metadata adapter delegates to that provider. Documentation records compliance and live verification requirements.

**Tech Stack:** Next.js 16, TypeScript, Vitest, existing Amazon affiliate redirect and metadata fixture code.

## Global Constraints

- Do not implement live PA-API because official docs mark PA-API deprecated as of 2026-05-15.
- Do not implement live Creators API calls without official accessible docs and credentials.
- Production must not silently use fixture metadata.
- Non-production must keep deterministic fixture metadata for local development and tests.
- Do not log or commit Amazon API keys.
- Do not add product UI or visual polish.

---

## File Structure

- Create `src/features/amazon/config.ts`.
- Create `src/features/amazon/metadata-provider.ts`.
- Modify `src/features/shelves/metadata-adapter.ts`.
- Create `tests/unit/amazon-config.test.ts`.
- Create `tests/unit/amazon-metadata-provider.test.ts`.
- Modify `tests/unit/metadata-adapter.test.ts`.
- Create `tests/unit/amazon-docs.test.ts`.
- Modify `.env.example`.
- Create `docs/amazon-integration.md`.
- Modify `PROJECT_STATE.md`, `docs/project-status.md`, `docs/roadmap.md`, `HANDOFF.md`, and `NEXT_SESSION_PROMPT.md`.

## Task 1: Amazon Config Boundary

**Files:**
- Create: `tests/unit/amazon-config.test.ts`
- Create: `src/features/amazon/config.ts`

**Interfaces:**
- Produces: `resolveAmazonIntegrationConfig(environment?: AmazonIntegrationEnvironment): AmazonIntegrationConfig`
- Produces: `AmazonIntegrationConfig` with `mode: "fixtures" | "disabled" | "creators-api"`

- [ ] **Step 1: Write failing tests for defaults, PA-API rejection, and Creators API validation.**
- [ ] **Step 2: Run `pnpm vitest run tests/unit/amazon-config.test.ts` and verify failure.**
- [ ] **Step 3: Implement config resolver.**
- [ ] **Step 4: Re-run the test and verify pass.**

## Task 2: Metadata Provider Boundary

**Files:**
- Create: `tests/unit/amazon-metadata-provider.test.ts`
- Create: `src/features/amazon/metadata-provider.ts`
- Modify: `src/features/shelves/metadata-adapter.ts`
- Modify: `tests/unit/metadata-adapter.test.ts`

**Interfaces:**
- Produces: `extractAmazonMetadata(productUrl: string, options?: ExtractAmazonMetadataOptions): Promise<ExtractedProductMetadata>`
- Consumes: `resolveAmazonIntegrationConfig`

- [ ] **Step 1: Write failing tests for fixture extraction and production disabled behavior.**
- [ ] **Step 2: Run metadata provider tests and verify failure.**
- [ ] **Step 3: Move fixture extraction behind provider and delegate existing adapter.**
- [ ] **Step 4: Re-run metadata tests and verify pass.**

## Task 3: Amazon Runbook And Handoff

**Files:**
- Create: `tests/unit/amazon-docs.test.ts`
- Create: `docs/amazon-integration.md`
- Modify: `.env.example`
- Modify: project handoff/status docs.

**Interfaces:**
- Produces: operator-facing Amazon integration and compliance documentation.

- [ ] **Step 1: Write failing docs/env tests.**
- [ ] **Step 2: Add docs and env examples.**
- [ ] **Step 3: Update project state for Sprint 29 completion and Sprint 30 recommendation.**
- [ ] **Step 4: Run full verification, commit, and push.**

## Self-Review

- The plan covers every in-scope requirement from the design.
- No placeholder steps remain.
- No task claims live Amazon API integration.
- Verification includes focused tests, full tests, build, and e2e.
