// @vitest-environment node

import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let temporaryDirectory: string;

function parsedConsoleCall(spy: ReturnType<typeof vi.spyOn>) {
  return JSON.parse(spy.mock.calls.at(-1)?.[0] as string);
}

beforeEach(() => {
  temporaryDirectory = mkdtempSync(join(tmpdir(), "linkshelf-health-"));
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("LINKSHELF_DB_PATH", join(temporaryDirectory, "linkshelf.db"));
  vi.resetModules();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.resetModules();
  rmSync(temporaryDirectory, { recursive: true, force: true });
});

describe("health route", () => {
  it("reports healthy when the production database runtime opens", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    const { GET } = await import("@/app/api/health/route");

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      database: "ok",
    });
    expect(parsedConsoleCall(info)).toMatchObject({
      type: "linkshelf.operational_event",
      level: "info",
      name: "health.check",
      outcome: "ok",
      metadata: { status: 200 },
    });
  });

  it("reports unhealthy without leaking configuration details", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubEnv("LINKSHELF_DB_PATH", "");
    vi.resetModules();
    const { GET } = await import("@/app/api/health/route");

    const response = await GET();

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      database: "error",
    });
    expect(parsedConsoleCall(error)).toMatchObject({
      type: "linkshelf.operational_event",
      level: "error",
      name: "health.check",
      outcome: "error",
      metadata: { status: 503 },
    });
    expect(error.mock.calls.at(-1)?.[0]).not.toContain("LINKSHELF_DB_PATH");
  });
});
