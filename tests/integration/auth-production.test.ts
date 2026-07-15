// @vitest-environment node

import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { encode } from "next-auth/jwt";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createDatabase } from "@/lib/db/client";
import { migrate } from "@/lib/db/migrate";
import { seed } from "@/lib/db/seed";

const PRODUCTION_SECRET = "p".repeat(32);
let temporaryDirectory: string;

function prepareUsers(): void {
  const database = createDatabase(process.env.LINKSHELF_DB_PATH);
  migrate(database);
  seed(database, { publicRoot: "/definitely/missing" });
  database.close();
}

function googleCallbackInput(
  subject: string,
  options: { email?: string; verified?: boolean; profileSubject?: string } = {},
) {
  const email = options.email ?? "creator@linkshelf.local";
  return {
    user: { id: "oauth-user", name: "Creator", email },
    account: { provider: "google", type: "oauth", providerAccountId: subject },
    profile: {
      sub: options.profileSubject ?? subject,
      email,
      email_verified: options.verified ?? true,
    },
    email: { verificationRequest: false },
    credentials: undefined,
  };
}

beforeEach(() => {
  temporaryDirectory = mkdtempSync(join(tmpdir(), "linkshelf-auth-production-"));
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("AUTH_SECRET", PRODUCTION_SECRET);
  vi.stubEnv("AUTH_GOOGLE_ID", "configured-google-id");
  vi.stubEnv("AUTH_GOOGLE_SECRET", "configured-google-secret");
  vi.stubEnv("LINKSHELF_DB_PATH", join(temporaryDirectory, "auth.db"));
  vi.resetModules();
  prepareUsers();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
  rmSync(temporaryDirectory, { recursive: true, force: true });
});

describe("configured production Auth.js", () => {
  it("instantiates Google only after production env setup", async () => {
    const { authOptions } = await import("@/auth");

    expect(authOptions.providers).toHaveLength(1);
    expect(authOptions.providers[0]).toMatchObject({ id: "google", type: "oauth" });
    expect(authOptions.secret).toBe(PRODUCTION_SECRET);
  });

  it("refuses configured Google initialization with a weak secret", async () => {
    vi.stubEnv("AUTH_SECRET", "too-short");
    vi.resetModules();

    await expect(import("@/auth")).rejects.toThrow(/32 bytes/);
  });

  it("imports safely without credentials and exposes no provider", async () => {
    vi.stubEnv("AUTH_SECRET", "");
    vi.stubEnv("AUTH_GOOGLE_ID", "");
    vi.stubEnv("AUTH_GOOGLE_SECRET", "");
    vi.resetModules();

    const { authOptions } = await import("@/auth");
    expect(authOptions.providers).toEqual([]);
    expect(authOptions.secret).toBeUndefined();
  });

  it("accepts only a verified exact subject and rejects email takeover", async () => {
    const { authOptions } = await import("@/auth");
    const signIn = authOptions.callbacks?.signIn as (input: unknown) => Promise<boolean>;

    await expect(signIn(googleCallbackInput("google-creator"))).resolves.toBe(true);
    await expect(
      signIn(googleCallbackInput("unknown-subject", { email: "creator@linkshelf.local" })),
    ).resolves.toBe(false);
    await expect(
      signIn(googleCallbackInput("google-creator", { verified: false })),
    ).resolves.toBe(false);
    await expect(
      signIn(
        googleCallbackInput("google-creator", {
          profileSubject: "different-subject",
        }),
      ),
    ).resolves.toBe(false);
  });

  it("persists only the exact local user ID in the JWT", async () => {
    const { authOptions } = await import("@/auth");
    const jwt = authOptions.callbacks?.jwt as (input: unknown) => Promise<{
      localUserId?: string;
      role?: string;
    }>;

    const mapped = await jwt({
      token: {},
      ...googleCallbackInput("google-creator"),
      trigger: "signIn",
    });
    const takeover = await jwt({
      token: {},
      ...googleCallbackInput("unknown-subject", {
        email: "creator@linkshelf.local",
      }),
      trigger: "signIn",
    });

    expect(mapped.localUserId).toBe("user-creator");
    expect(mapped.role).toBeUndefined();
    expect(takeover.localUserId).toBeUndefined();
  });

  it("rehydrates the current role and denies a soft-deleted user", async () => {
    const { authOptions } = await import("@/auth");
    const session = authOptions.callbacks?.session as unknown as (
      input: unknown,
    ) => Promise<{
      localUserId?: string;
      role?: string;
    }>;
    const input = {
      session: { expires: new Date(Date.now() + 60_000).toISOString(), user: {} },
      token: { localUserId: "user-creator" },
      user: undefined,
      newSession: undefined,
      trigger: undefined,
    };

    await expect(session(input)).resolves.toMatchObject({
      localUserId: "user-creator",
      role: "CREATOR",
    });

    const database = createDatabase(process.env.LINKSHELF_DB_PATH);
    database.exec(
      "UPDATE users SET role = 'FAN', deleted_at = NULL WHERE id = 'user-creator'",
    );
    database.close();
    await expect(session(input)).resolves.toMatchObject({
      localUserId: "user-creator",
      role: "FAN",
    });

    const deletedDatabase = createDatabase(process.env.LINKSHELF_DB_PATH);
    deletedDatabase.exec(
      "UPDATE users SET deleted_at = '2026-06-25T00:00:00.000Z' WHERE id = 'user-creator'",
    );
    deletedDatabase.close();
    const denied = await session(input);
    expect(denied.localUserId).toBeUndefined();
    expect(denied.role).toBeUndefined();
  });

  it("resolves an encrypted Auth.js cookie through the current SQLite user", async () => {
    const { resolveAuthSession } = await import("@/auth");
    const token = await encode({
      token: { localUserId: "user-creator" },
      secret: PRODUCTION_SECRET,
    });
    const request = new Request("https://linkshelf.test/admin/dashboard", {
      headers: { cookie: `__Secure-next-auth.session-token=${token}` },
    });

    await expect(resolveAuthSession(request)).resolves.toMatchObject({
      user: { id: "user-creator", role: "CREATOR" },
    });

    const database = createDatabase(process.env.LINKSHELF_DB_PATH);
    database.exec(
      "UPDATE users SET role = 'FAN', deleted_at = NULL WHERE id = 'user-creator'",
    );
    database.close();
    await expect(resolveAuthSession(request)).resolves.toMatchObject({
      user: { role: "FAN" },
    });

    const deletedDatabase = createDatabase(process.env.LINKSHELF_DB_PATH);
    deletedDatabase.exec(
      "UPDATE users SET deleted_at = '2026-06-25T00:00:00.000Z' WHERE id = 'user-creator'",
    );
    deletedDatabase.close();
    await expect(resolveAuthSession(request)).resolves.toBeNull();
  });

  it("resolves a production Auth.js cookie from server component headers", async () => {
    const { resolveServerAuthSession } = await import("@/features/auth/server");
    const token = await encode({
      token: { localUserId: "user-creator" },
      secret: PRODUCTION_SECRET,
    });
    const headers = new Headers({
      cookie: `__Secure-next-auth.session-token=${token}`,
      host: "linkshelf.test",
      "x-forwarded-proto": "https",
    });

    await expect(
      resolveServerAuthSession(headers, "/studio/dashboard"),
    ).resolves.toMatchObject({
      user: { id: "user-creator", role: "CREATOR" },
    });
  });

  it("resolves role-aware production server sessions for protected surfaces", async () => {
    const { resolveServerAuthSession } = await import("@/features/auth/server");
    const cases = [
      ["user-creator", "/studio/dashboard", "CREATOR"],
      ["user-fan", "/hub/dashboard", "FAN"],
      ["user-admin", "/admin/dashboard", "ADMIN"],
    ] as const;

    for (const [localUserId, pathname, role] of cases) {
      const token = await encode({
        token: { localUserId },
        secret: PRODUCTION_SECRET,
      });
      const headers = new Headers({
        cookie: `__Secure-next-auth.session-token=${token}`,
        host: "linkshelf.test",
        "x-forwarded-proto": "https",
      });

      await expect(resolveServerAuthSession(headers, pathname)).resolves.toMatchObject({
        user: { id: localUserId, role },
      });
    }
  });

  it("treats partial production Google configuration as disabled", async () => {
    const { createAuthOptions, hasGoogleAuthConfiguration } = await import("@/auth");

    for (const environment of [
      {
        NODE_ENV: "production",
        AUTH_SECRET: PRODUCTION_SECRET,
        AUTH_GOOGLE_ID: "configured-google-id",
        AUTH_GOOGLE_SECRET: "",
      },
      {
        NODE_ENV: "production",
        AUTH_SECRET: PRODUCTION_SECRET,
        AUTH_GOOGLE_ID: "",
        AUTH_GOOGLE_SECRET: "configured-google-secret",
      },
    ]) {
      expect(hasGoogleAuthConfiguration(environment)).toBe(false);
      const options = createAuthOptions(environment);
      expect(options.providers).toEqual([]);
      expect(options.secret).toBeUndefined();
    }
  });
});
