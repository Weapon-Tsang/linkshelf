# Sprint 27 Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a reproducible Docker/Compose deployment baseline with a health check and runbook.

**Architecture:** Next.js emits standalone output for a multi-stage Node 24 Docker image. Compose runs the standalone server with required production env vars and a persistent SQLite volume. `/api/health` verifies the same production database runtime used by auth and public routes.

**Tech Stack:** Next.js 16, React 19, Node.js 24, pnpm 11.7.0, node:sqlite, Vitest, Docker, Compose.

## Global Constraints

- Keep production `LINKSHELF_DB_PATH` absolute and file-backed.
- Keep production Google OAuth variables required for real login: `AUTH_SECRET`, `NEXTAUTH_URL`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`.
- Do not require live cloud credentials or a public URL in this workspace.
- Do not introduce a new production database engine.
- Use TDD for application behavior and descriptor assertions.

---

## File Structure

- Create `tests/unit/deployment-config.test.ts` for text-level deployment descriptor assertions.
- Create `tests/integration/health-route.test.ts` for route-level health behavior.
- Modify `next.config.ts` to enable `output: "standalone"`.
- Create `Dockerfile` for the production image.
- Create `.dockerignore` to keep local caches, secrets, and worktrees out of the image context.
- Create `compose.yml` for a production-like local/staging service.
- Create `src/app/api/health/route.ts` for the runtime health check.
- Modify `.env.example` with deployment-oriented examples.
- Create `docs/deployment.md` as the Sprint 27 runbook.

## Task 1: Deployment Descriptor Tests

**Files:**
- Create: `tests/unit/deployment-config.test.ts`
- Later modifies: `next.config.ts`, `Dockerfile`, `.dockerignore`, `compose.yml`, `docs/deployment.md`, `.env.example`

**Interfaces:**
- Consumes: repository files as text.
- Produces: assertions that deployment descriptors satisfy the Sprint 27 runtime contract.

- [ ] **Step 1: Write the failing test**

```ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(path: string): string {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("deployment configuration", () => {
  it("builds Next.js as a standalone Node server", () => {
    expect(readProjectFile("next.config.ts")).toContain('output: "standalone"');
  });

  it("defines a production Docker image for the standalone server", () => {
    const dockerfile = readProjectFile("Dockerfile");

    expect(dockerfile).toContain("FROM node:24-bookworm-slim AS deps");
    expect(dockerfile).toContain("pnpm install --frozen-lockfile");
    expect(dockerfile).toContain("RUN pnpm build");
    expect(dockerfile).toContain("/app/.next/standalone");
    expect(dockerfile).toContain("USER linkshelf");
    expect(dockerfile).toContain('CMD ["node", "server.js"]');
  });

  it("runs Compose with production env and persistent SQLite storage", () => {
    const compose = readProjectFile("compose.yml");

    expect(compose).toContain("build: .");
    expect(compose).toContain('"3000:3000"');
    expect(compose).toContain("NODE_ENV: production");
    expect(compose).toContain("NEXTAUTH_URL: ${NEXTAUTH_URL:?set NEXTAUTH_URL}");
    expect(compose).toContain("AUTH_SECRET: ${AUTH_SECRET:?set AUTH_SECRET}");
    expect(compose).toContain("AUTH_GOOGLE_ID: ${AUTH_GOOGLE_ID:?set AUTH_GOOGLE_ID}");
    expect(compose).toContain("AUTH_GOOGLE_SECRET: ${AUTH_GOOGLE_SECRET:?set AUTH_GOOGLE_SECRET}");
    expect(compose).toContain("LINKSHELF_DB_PATH: /data/linkshelf/linkshelf.db");
    expect(compose).toContain("linkshelf-data:/data/linkshelf");
    expect(compose).toContain("/api/health");
  });

  it("keeps local secrets, caches, and nested worktrees out of Docker context", () => {
    const dockerignore = readProjectFile(".dockerignore");

    expect(dockerignore).toContain(".env*");
    expect(dockerignore).toContain("node_modules");
    expect(dockerignore).toContain(".next");
    expect(dockerignore).toContain("data");
    expect(dockerignore).toContain(".worktrees");
  });

  it("documents deployment, smoke tests, environments, and rollback", () => {
    const docs = readProjectFile("docs/deployment.md");

    expect(docs).toContain("docker compose build");
    expect(docs).toContain("docker compose up -d");
    expect(docs).toContain("/api/health");
    expect(docs).toContain("Preview");
    expect(docs).toContain("Staging");
    expect(docs).toContain("Production");
    expect(docs).toContain("Rollback");
  });

  it("shows production-oriented env examples", () => {
    const env = readProjectFile(".env.example");

    expect(env).toContain("PORT=3000");
    expect(env).toContain("HOSTNAME=0.0.0.0");
    expect(env).toContain("LINKSHELF_DB_PATH=/data/linkshelf/linkshelf.db");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `PATH=/Users/weapon_tsang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH pnpm vitest run tests/unit/deployment-config.test.ts`

Expected: FAIL because `Dockerfile`, `.dockerignore`, `compose.yml`, `docs/deployment.md`, and standalone output do not exist yet.

- [ ] **Step 3: Add descriptors and docs**

Create the files and config described by the test, keeping implementation minimal and explicit.

- [ ] **Step 4: Run test to verify it passes**

Run: `PATH=/Users/weapon_tsang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH pnpm vitest run tests/unit/deployment-config.test.ts`

Expected: PASS.

## Task 2: Health Route

**Files:**
- Create: `tests/integration/health-route.test.ts`
- Create: `src/app/api/health/route.ts`

**Interfaces:**
- Consumes: `openApplicationDatabase(environment?: DatabaseRuntimeEnvironment): DatabaseSync`.
- Produces: `GET(): Promise<Response>` returning JSON `{ ok: boolean; database: "ok" | "error" }`.

- [ ] **Step 1: Write the failing test**

```ts
// @vitest-environment node

import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let temporaryDirectory: string;

beforeEach(() => {
  temporaryDirectory = mkdtempSync(join(tmpdir(), "linkshelf-health-"));
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("LINKSHELF_DB_PATH", join(temporaryDirectory, "linkshelf.db"));
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
  rmSync(temporaryDirectory, { recursive: true, force: true });
});

describe("health route", () => {
  it("reports healthy when the production database runtime opens", async () => {
    const { GET } = await import("@/app/api/health/route");

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      database: "ok",
    });
  });

  it("reports unhealthy without leaking configuration details", async () => {
    vi.stubEnv("LINKSHELF_DB_PATH", "");
    vi.resetModules();
    const { GET } = await import("@/app/api/health/route");

    const response = await GET();

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      database: "error",
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `PATH=/Users/weapon_tsang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH pnpm vitest run tests/integration/health-route.test.ts`

Expected: FAIL because `src/app/api/health/route.ts` does not exist.

- [ ] **Step 3: Implement route**

Create `src/app/api/health/route.ts` with a dynamic Node route that opens and
closes the application database, returning only the safe status payload.

- [ ] **Step 4: Run test to verify it passes**

Run: `PATH=/Users/weapon_tsang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH pnpm vitest run tests/integration/health-route.test.ts`

Expected: PASS.

## Task 3: Full Verification And Handoff

**Files:**
- Modify: `HANDOFF.md`
- Modify: `NEXT_SESSION_PROMPT.md`

**Interfaces:**
- Consumes: Sprint 27 implementation and verification output.
- Produces: current handoff state for the next session.

- [ ] **Step 1: Run formatting and automated checks**

Run these commands:

```bash
git diff --check
PATH=/Users/weapon_tsang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH pnpm typecheck
PATH=/Users/weapon_tsang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH pnpm lint
PATH=/Users/weapon_tsang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH pnpm test
PATH=/Users/weapon_tsang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH pnpm build
PATH=/Users/weapon_tsang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH pnpm test:e2e
```

Expected: all pass; `pnpm build` may continue to show the existing NFT warning
for `node:sqlite`.

- [ ] **Step 2: Update handoff docs**

Record Sprint 27 status, verification commands, known limits, and recommend the
next sprint.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add deployment baseline"
```

Expected: commit succeeds on branch `codex/linkshelf-mvp`.

## Self-Review

- The plan covers every in-scope file in the design.
- No placeholder steps remain.
- Function names and payload shapes match between tests and implementation.
- Verification includes unit, integration, build, and e2e coverage.
