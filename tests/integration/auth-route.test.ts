import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST as googleLogin } from "@/app/api/auth/google/route";
import { POST as logout } from "@/app/api/auth/logout/route";
import { GET as createAdminEntry } from "@/app/api/auth/admin-entry/route";
import {
  ADMIN_ENTRY_COOKIE_NAME,
  RESUME_ENTRY_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  createAdminEntryChallenge,
  consumeResumeEntryCookie,
  readSessionFromRequest,
} from "@/features/auth/session";

const SECRET = "integration-auth-secret";
let temporaryDirectory: string;

function post(
  path: string,
  fields: Record<string, string>,
  cookie?: string,
  origin = "http://linkshelf.test",
): Request {
  return new Request(`http://linkshelf.test${path}`, {
    method: "POST",
    headers: { origin, ...(cookie ? { cookie } : {}) },
    body: new URLSearchParams(fields),
  });
}

function setCookies(response: Response): string[] {
  const headers = response.headers as Headers & { getSetCookie?: () => string[] };
  return headers.getSetCookie?.() ?? [response.headers.get("set-cookie") ?? ""];
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
  function lastOperationalEvent(spy: ReturnType<typeof vi.spyOn>) {
    return JSON.parse(spy.mock.calls.at(-1)?.[0] as string);
  }

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

  it("redirects browser form posts back to the submitted loopback origin", async () => {
    const response = await googleLogin(
      new Request("http://localhost:3000/api/auth/google", {
        method: "POST",
        headers: { origin: "http://127.0.0.1:3000" },
        body: new URLSearchParams({
          role: "creator",
          returnTo: "/studio/dashboard",
        }),
      }),
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "http://127.0.0.1:3000/studio/dashboard",
    );
    expect(response.headers.get("set-cookie")).toContain(`${SESSION_COOKIE_NAME}=`);
  });

  it("mints a same-origin resume marker for fan auth return targets", async () => {
    const returnTo = "/liamroberts.photo/photography-kit?channel=X&resume=share";
    const response = await googleLogin(
      post("/api/auth/google", {
        role: "fan",
        returnTo,
      }),
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "http://linkshelf.test/liamroberts.photo/photography-kit?channel=X&resume=share",
    );
    const resumeCookie = setCookies(response)
      .find((cookie) => cookie.startsWith(`${RESUME_ENTRY_COOKIE_NAME}=`))
      ?.split(";", 1)[0];
    expect(resumeCookie).toContain(`${RESUME_ENTRY_COOKIE_NAME}=`);

    const token = resumeCookie?.slice(`${RESUME_ENTRY_COOKIE_NAME}=`.length) ?? "";
    expect(
      consumeResumeEntryCookie(
        token,
        "/liamroberts.photo/photography-kit?resume=share&channel=X",
        { secret: SECRET },
      ),
    ).toMatchObject({
      returnTo: "/liamroberts.photo/photography-kit?resume=share&channel=X",
    });
  });

  it("rejects an admin role posted without the secret-entry signature", async () => {
    vi.stubEnv("LINKSHELF_MONITORING_STDOUT", "1");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const response = await googleLogin(
      post("/api/auth/google", {
        role: "admin",
        returnTo: "/admin/dashboard",
      }),
    );

    expect(response.status).toBe(403);
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(lastOperationalEvent(warn)).toMatchObject({
      type: "linkshelf.operational_event",
      level: "warn",
      name: "auth.google.request",
      outcome: "admin_entry_rejected",
      metadata: { status: 403, role: "admin" },
    });
  });

  it("emits monitoring events for cross-origin rejection and successful development login", async () => {
    vi.stubEnv("LINKSHELF_MONITORING_STDOUT", "1");
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const rejected = await googleLogin(
      post(
        "/api/auth/google",
        { role: "creator", returnTo: "/studio/dashboard" },
        undefined,
        "https://evil.example",
      ),
    );
    expect(rejected.status).toBe(403);
    expect(lastOperationalEvent(warn)).toMatchObject({
      level: "warn",
      name: "auth.google.request",
      outcome: "cross_origin_rejected",
      metadata: { status: 403 },
    });

    const accepted = await googleLogin(
      post("/api/auth/google", {
        role: "fan",
        returnTo: "/hub/dashboard",
      }),
    );
    expect(accepted.status).toBe(303);
    expect(lastOperationalEvent(info)).toMatchObject({
      level: "info",
      name: "auth.google.request",
      outcome: "development_login",
      metadata: { status: 303, role: "fan" },
    });
  });

  it("emits a production monitoring event when Google auth is not configured", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("AUTH_SECRET", "");
    vi.stubEnv("AUTH_GOOGLE_ID", "");
    vi.stubEnv("AUTH_GOOGLE_SECRET", "");
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await googleLogin(
      post("/api/auth/google", {
        role: "creator",
        returnTo: "/studio/dashboard",
      }),
    );

    expect(response.status).toBe(503);
    expect(lastOperationalEvent(error)).toMatchObject({
      level: "error",
      name: "auth.google.request",
      outcome: "google_configuration_missing",
      metadata: { status: 503, environment: "production" },
    });
  });

  it("mints and consumes a same-browser admin entry only once", async () => {
    const entryResponse = await createAdminEntry(
      new Request(
        "http://linkshelf.test/api/auth/admin-entry?returnTo=%2Fadmin%2Fdashboard",
      ),
    );
    expect(entryResponse.status).toBe(303);
    const entryUrl = new URL(entryResponse.headers.get("location") ?? "");
    const entry = entryUrl.searchParams.get("challenge") ?? "";
    const challengeCookie = setCookies(entryResponse)
      .find((cookie) => cookie.startsWith(`${ADMIN_ENTRY_COOKIE_NAME}=`))
      ?.split(";", 1)[0];
    expect(entry).toMatch(/^v1\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
    expect(challengeCookie).toContain(`${ADMIN_ENTRY_COOKIE_NAME}=`);

    const response = await googleLogin(
      post("/api/auth/google", {
        role: "admin",
        entry,
        returnTo: "/admin/dashboard",
      }, challengeCookie),
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "http://linkshelf.test/admin/dashboard",
    );
    expect(setCookies(response).join("\n")).toContain(
      `${ADMIN_ENTRY_COOKIE_NAME}=`,
    );
    expect(setCookies(response).join("\n")).toContain("Max-Age=0");

    const replay = await googleLogin(
      post(
        "/api/auth/google",
        { role: "admin", entry, returnTo: "/admin/dashboard" },
        challengeCookie,
      ),
    );
    expect(replay.status).toBe(403);
  });

  it("redirects admin-entry challenges back to the browser host header", async () => {
    const response = await createAdminEntry(
      new Request(
        "http://localhost:3000/api/auth/admin-entry?returnTo=%2Fadmin%2Fdashboard",
        { headers: { host: "127.0.0.1:3000" } },
      ),
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toMatch(
      /^http:\/\/127\.0\.0\.1:3000\/admin-secret\?/,
    );
    expect(response.headers.get("set-cookie")).toContain(`${ADMIN_ENTRY_COOKIE_NAME}=`);
  });

  it("rejects expired and return-mismatched admin challenges", async () => {
    const expired = createAdminEntryChallenge("/admin/dashboard", {
      secret: SECRET,
      now: 1,
      nonce: "e".repeat(43),
    });
    const expiredResponse = await googleLogin(
      post(
        "/api/auth/google",
        {
          role: "admin",
          entry: expired.token,
          returnTo: "/admin/dashboard",
        },
        `${expired.cookie.name}=${expired.cookie.value}`,
      ),
    );
    expect(expiredResponse.status).toBe(403);

    const mismatch = createAdminEntryChallenge("/admin/dashboard", {
      secret: SECRET,
      nonce: "m".repeat(43),
    });
    const mismatchResponse = await googleLogin(
      post(
        "/api/auth/google",
        { role: "admin", entry: mismatch.token, returnTo: "/admin/other" },
        `${mismatch.cookie.name}=${mismatch.cookie.value}`,
      ),
    );
    expect(mismatchResponse.status).toBe(403);
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

  it("rejects cross-origin custom auth posts", async () => {
    const response = await googleLogin(
      post(
        "/api/auth/google",
        { role: "creator", returnTo: "/studio/dashboard" },
        undefined,
        "https://evil.example",
      ),
    );

    expect(response.status).toBe(403);
    expect(response.headers.get("set-cookie")).toBeNull();
  });
});

describe("production Google auth handoff", () => {
  it("redirects configured production requests to Auth.js", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("AUTH_SECRET", "s".repeat(32));
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

  it("rejects cross-origin logout posts", async () => {
    const response = await logout(
      post(
        "/api/auth/logout",
        { returnTo: "/" },
        `${SESSION_COOKIE_NAME}=old-token`,
        "https://evil.example",
      ),
    );

    expect(response.status).toBe(403);
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("clears development and all present Auth.js v4 cookie chunks", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const cookie = [
      `${SESSION_COOKIE_NAME}=dev`,
      "next-auth.session-token.0=first",
      "next-auth.session-token.1=second",
      "__Secure-next-auth.session-token=secure",
      "next-auth.callback-url=callback",
      "__Host-next-auth.csrf-token=csrf",
    ].join("; ");

    const response = await logout(post("/api/auth/logout", { returnTo: "/" }, cookie));
    const cleared = setCookies(response).join("\n");

    expect(response.status).toBe(303);
    for (const name of [
      SESSION_COOKIE_NAME,
      "next-auth.session-token.0",
      "next-auth.session-token.1",
      "__Secure-next-auth.session-token",
      "next-auth.callback-url",
      "__Host-next-auth.csrf-token",
    ]) {
      expect(cleared).toContain(`${name}=`);
    }
  });
});
