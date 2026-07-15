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
