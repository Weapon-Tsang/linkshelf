import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DEVELOPMENT_ONLY_SESSION_SECRET,
  MAX_SESSION_AGE_MS,
  SESSION_COOKIE_NAME,
  createSessionCookie,
  decodeSession,
  encodeSession,
  readSessionFromRequest,
  readSessionToken,
  resolveSessionSecret,
} from "@/features/auth/session";

const SECRET = "test-secret-that-is-long-enough-for-hmac";
const NOW = Date.UTC(2026, 5, 24, 12, 0, 0);

afterEach(() => vi.unstubAllEnvs());

describe("signed development sessions", () => {
  it("round-trips a versioned payload", () => {
    const payload = {
      version: 1 as const,
      userId: "user-creator",
      issuedAt: NOW,
      expiresAt: NOW + 60_000,
    };

    expect(decodeSession(encodeSession(payload, SECRET), SECRET, NOW)).toEqual(
      payload,
    );
  });

  it("rejects tampered payloads and signatures", () => {
    const token = encodeSession(
      {
        version: 1,
        userId: "user-creator",
        issuedAt: NOW,
        expiresAt: NOW + 60_000,
      },
      SECRET,
    );
    const [version, payload, signature] = token.split(".");
    const tamperedPayload = Buffer.from(
      JSON.stringify({
        version: 1,
        userId: "user-admin",
        issuedAt: NOW,
        expiresAt: NOW + 60_000,
      }),
    ).toString("base64url");

    expect(
      decodeSession(`${version}.${tamperedPayload}.${signature}`, SECRET, NOW),
    ).toBeNull();
    expect(
      decodeSession(`${version}.${payload}.${signature}x`, SECRET, NOW),
    ).toBeNull();
    expect(decodeSession(token, "wrong-secret", NOW)).toBeNull();
  });

  it.each([
    "",
    "v1",
    "v1.payload.signature.extra",
    "v2.e30.signature",
    "v1.***.signature",
  ])("rejects malformed token %s", (token) => {
    expect(decodeSession(token, SECRET, NOW)).toBeNull();
  });

  it("rejects expired, future-issued, and overlong sessions", () => {
    const makeToken = (issuedAt: number, expiresAt: number) =>
      encodeSession(
        { version: 1, userId: "user-fan", issuedAt, expiresAt },
        SECRET,
      );

    expect(decodeSession(makeToken(NOW - 10_000, NOW), SECRET, NOW)).toBeNull();
    expect(decodeSession(makeToken(NOW + 1, NOW + 60_000), SECRET, NOW)).toBeNull();
    expect(
      decodeSession(
        makeToken(NOW, NOW + MAX_SESSION_AGE_MS + 1),
        SECRET,
        NOW,
      ),
    ).toBeNull();
  });
});

describe("session cookie helpers", () => {
  it("uses the development fallback only outside production", () => {
    expect(
      resolveSessionSecret({ nodeEnv: "development", authSecret: undefined }),
    ).toBe(DEVELOPMENT_ONLY_SESSION_SECRET);
    expect(() =>
      resolveSessionSecret({ nodeEnv: "production", authSecret: undefined }),
    ).toThrow(/AUTH_SECRET/);
  });

  it("creates an HTTP-only, same-site cookie with production security", () => {
    const cookie = createSessionCookie("user-creator", {
      secret: SECRET,
      now: NOW,
      nodeEnv: "production",
    });

    expect(cookie.name).toBe(SESSION_COOKIE_NAME);
    expect(cookie.options).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: true,
      maxAge: MAX_SESSION_AGE_MS / 1000,
    });
  });

  it("refuses to create a session without a stable user ID", () => {
    expect(() =>
      createSessionCookie("", { secret: SECRET, now: NOW }),
    ).toThrow(/user ID/i);
  });

  it("reads only one exact cookie name and decodes it through real helpers", () => {
    const cookie = createSessionCookie("user-fan", {
      secret: SECRET,
      now: NOW,
      nodeEnv: "development",
    });
    const request = new Request("https://linkshelf.test/hub/dashboard", {
      headers: {
        cookie: `other=abc; not-${SESSION_COOKIE_NAME}=bad; ${cookie.name}=${cookie.value}`,
      },
    });

    expect(readSessionToken(request)).toBe(cookie.value);
    expect(readSessionFromRequest(request, SECRET, NOW)?.userId).toBe("user-fan");
  });

  it("rejects ambiguous duplicate session cookies", () => {
    const request = new Request("https://linkshelf.test/", {
      headers: {
        cookie: `${SESSION_COOKIE_NAME}=one; ${SESSION_COOKIE_NAME}=two`,
      },
    });

    expect(readSessionToken(request)).toBeNull();
  });

  it("returns no session for a cookie-less production request before resolving secrets", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("AUTH_SECRET", "");

    expect(
      readSessionFromRequest(new Request("https://linkshelf.test/")),
    ).toBeNull();
  });
});
