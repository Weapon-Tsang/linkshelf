import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST as googleLogin } from "@/app/api/auth/google/route";
import { POST as logout } from "@/app/api/auth/logout/route";
import { authOptions } from "@/auth";
import { createDatabase } from "@/lib/db/client";
import { migrate } from "@/lib/db/migrate";
import { seed } from "@/lib/db/seed";
import {
  SESSION_COOKIE_NAME,
  createAdminEntryToken,
  readSessionFromRequest,
} from "@/features/auth/session";

const SECRET = "integration-auth-secret";
let temporaryDirectory: string;

function post(path: string, fields: Record<string, string>, cookie?: string): Request {
  return new Request(`http://linkshelf.test${path}`, {
    method: "POST",
    headers: cookie ? { cookie } : undefined,
    body: new URLSearchParams(fields),
  });
}

beforeEach(() => {
  temporaryDirectory = mkdtempSync(join(tmpdir(), "linkshelf-auth-"));
  vi.stubEnv("NODE_ENV", "development");
  vi.stubEnv("AUTH_SECRET", SECRET);
  vi.stubEnv("LINKSHELF_DB_PATH", join(temporaryDirectory, "auth.db"));
});

afterEach(() => {
  vi.unstubAllEnvs();
  rmSync(temporaryDirectory, { recursive: true, force: true });
});

describe("development Google auth route", () => {
  it("sets a signed session cookie and returns 303", async () => {
    const response = await googleLogin(
      post("/api/auth/google", {
        role: "creator",
        returnTo: "/studio/dashboard",
      }),
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "http://linkshelf.test/studio/dashboard",
    );
    const setCookie = response.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain(`${SESSION_COOKIE_NAME}=`);
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("SameSite=lax");

    const cookiePair = setCookie.split(";", 1)[0];
    const sessionRequest = new Request("http://linkshelf.test/studio/dashboard", {
      headers: { cookie: cookiePair },
    });
    expect(readSessionFromRequest(sessionRequest, SECRET)?.userId).toBe(
      "user-creator",
    );
  });

  it("rejects an admin role posted without the secret-entry signature", async () => {
    const response = await googleLogin(
      post("/api/auth/google", {
        role: "admin",
        returnTo: "/admin/dashboard",
      }),
    );

    expect(response.status).toBe(403);
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("accepts admin only with the signed secret-entry contract", async () => {
    const response = await googleLogin(
      post("/api/auth/google", {
        role: "admin",
        entry: createAdminEntryToken(SECRET),
        returnTo: "/admin/dashboard",
      }),
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "http://linkshelf.test/admin/dashboard",
    );
  });

  it("falls back instead of following an open redirect", async () => {
    const response = await googleLogin(
      post("/api/auth/google", {
        role: "fan",
        returnTo: "//evil.example/steal",
      }),
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "http://linkshelf.test/hub/dashboard",
    );
  });
});

describe("production Google auth handoff", () => {
  it("redirects configured production requests to Auth.js", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("AUTH_GOOGLE_ID", "google-id");
    vi.stubEnv("AUTH_GOOGLE_SECRET", "google-secret");

    const response = await googleLogin(
      post("/api/auth/google", {
        role: "admin",
        returnTo: "/studio/dashboard",
      }),
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "http://linkshelf.test/api/auth/signin/google?callbackUrl=%2Fstudio%2Fdashboard",
    );
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("allows only Google identities already mapped to local users", async () => {
    const database = createDatabase(process.env.LINKSHELF_DB_PATH);
    migrate(database);
    seed(database, { publicRoot: "/definitely/missing" });
    database.close();

    const signIn = authOptions.callbacks?.signIn;
    expect(signIn).toBeTypeOf("function");
    const invokeSignIn = signIn as NonNullable<typeof signIn>;

    const existing = await invokeSignIn({
      user: {
        id: "google-oauth-user",
        name: "Creator",
        email: "creator@linkshelf.local",
      },
      account: {
        provider: "google",
        type: "oauth",
        providerAccountId: "google-creator",
      },
      profile: {
        sub: "google-creator",
        email: "creator@linkshelf.local",
      },
      email: { verificationRequest: false },
      credentials: undefined,
    });
    const missing = await invokeSignIn({
      user: {
        id: "unknown-google-user",
        name: "Unknown",
        email: "unknown@example.test",
      },
      account: {
        provider: "google",
        type: "oauth",
        providerAccountId: "unknown-subject",
      },
      profile: { sub: "unknown-subject", email: "unknown@example.test" },
      email: { verificationRequest: false },
      credentials: undefined,
    });

    expect(existing).toBe(true);
    expect(missing).toBe(false);
    const verificationDatabase = createDatabase(process.env.LINKSHELF_DB_PATH);
    const count = verificationDatabase
      .prepare("SELECT COUNT(*) AS count FROM users")
      .get() as { count: number };
    verificationDatabase.close();
    expect(count.count).toBe(3);
  });
});

describe("logout route", () => {
  it("clears the cookie and redirects only to a safe destination", async () => {
    const response = await logout(
      post(
        "/api/auth/logout",
        { returnTo: "https://evil.example/steal" },
        `${SESSION_COOKIE_NAME}=old-token`,
      ),
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("http://linkshelf.test/");
    expect(response.headers.get("set-cookie")).toContain(
      `${SESSION_COOKIE_NAME}=`,
    );
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
  });
});
