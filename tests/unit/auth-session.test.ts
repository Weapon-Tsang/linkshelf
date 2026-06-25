import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DEVELOPMENT_ONLY_SESSION_SECRET,
  ADMIN_ENTRY_COOKIE_NAME,
  MAX_ADMIN_ENTRY_AGE_MS,
  MAX_RESUME_ENTRY_AGE_MS,
  RESUME_ENTRY_COOKIE_NAME,
  MAX_SESSION_AGE_MS,
  SESSION_COOKIE_NAME,
  createSessionCookie,
  createAdminEntryChallenge,
  createResumeEntryCookie,
  consumeAdminEntryChallenge,
  consumeResumeEntryCookie,
  decodeSession,
  encodeSession,
  readSessionFromRequest,
  readSessionToken,
  resolveSessionSecret,
  verifyAdminEntryChallenge,
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

  it.each([undefined, " ".repeat(40), "x".repeat(31)])(
    "rejects weak production secret %s",
    (authSecret) => {
      expect(() =>
        resolveSessionSecret({ nodeEnv: "production", authSecret }),
      ).toThrow(/32 bytes/);
    },
  );

  it("accepts a non-whitespace production secret of at least 32 bytes", () => {
    const authSecret = "s".repeat(32);
    expect(resolveSessionSecret({ nodeEnv: "production", authSecret })).toBe(
      authSecret,
    );
  });

  it("does not let explicit weak secrets bypass production enforcement", () => {
    expect(() =>
      createSessionCookie("user-creator", {
        secret: "too-short",
        now: NOW,
        nodeEnv: "production",
      }),
    ).toThrow(/32 bytes/);
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

describe("one-time admin entry challenges", () => {
  const nonce = "n".repeat(43);

  it("binds a short-lived signed payload to an HTTP-only browser cookie", () => {
    const challenge = createAdminEntryChallenge("/admin/dashboard", {
      secret: SECRET,
      now: NOW,
      nonce,
      nodeEnv: "development",
    });

    expect(challenge.cookie).toMatchObject({
      name: ADMIN_ENTRY_COOKIE_NAME,
      value: nonce,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: MAX_ADMIN_ENTRY_AGE_MS / 1000,
      },
    });
    expect(
      verifyAdminEntryChallenge(
        challenge.token,
        challenge.cookie.value,
        "/admin/dashboard",
        { secret: SECRET, now: NOW },
      ),
    ).toMatchObject({ nonce, returnTo: "/admin/dashboard" });
  });

  it("rejects expired, cookie-mismatched, and return-mismatched challenges", () => {
    const challenge = createAdminEntryChallenge("/admin/dashboard", {
      secret: SECRET,
      now: NOW,
      nonce,
    });

    expect(
      verifyAdminEntryChallenge(
        challenge.token,
        challenge.cookie.value,
        "/admin/dashboard",
        { secret: SECRET, now: NOW + MAX_ADMIN_ENTRY_AGE_MS },
      ),
    ).toBeNull();
    expect(
      verifyAdminEntryChallenge(
        challenge.token,
        "different-browser-nonce",
        "/admin/dashboard",
        { secret: SECRET, now: NOW },
      ),
    ).toBeNull();
    expect(
      verifyAdminEntryChallenge(
        challenge.token,
        challenge.cookie.value,
        "/admin/other",
        { secret: SECRET, now: NOW },
      ),
    ).toBeNull();
  });

  it("consumes each valid nonce only once", () => {
    const uniqueNonce = "r".repeat(43);
    const challenge = createAdminEntryChallenge("/admin/dashboard", {
      secret: SECRET,
      now: NOW,
      nonce: uniqueNonce,
    });
    const consume = () =>
      consumeAdminEntryChallenge(
        challenge.token,
        challenge.cookie.value,
        "/admin/dashboard",
        { secret: SECRET, now: NOW },
      );

    expect(consume()).toMatchObject({ nonce: uniqueNonce });
    expect(consume()).toBeNull();
  });

  it("normalizes unsafe return paths before signing", () => {
    const challenge = createAdminEntryChallenge("//evil.example/steal", {
      secret: SECRET,
      now: NOW,
      nonce: "s".repeat(43),
    });

    expect(challenge.payload.returnTo).toBe("/admin/dashboard");
  });
});

describe("one-time resume entry cookies", () => {
  it("binds a short-lived signed cookie to a canonical resume target", () => {
    const resume = createResumeEntryCookie(
      "/liamroberts.photo/photography-kit?channel=X&resume=share",
      {
        secret: SECRET,
        now: NOW,
        nonce: "x".repeat(43),
        nodeEnv: "development",
      },
    );

    expect(resume.cookie).toMatchObject({
      name: RESUME_ENTRY_COOKIE_NAME,
      value: resume.token,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: MAX_RESUME_ENTRY_AGE_MS / 1000,
      },
    });
    expect(resume.payload.returnTo).toBe(
      "/liamroberts.photo/photography-kit?resume=share&channel=X",
    );
    expect(
      consumeResumeEntryCookie(
        resume.token,
        "/liamroberts.photo/photography-kit?resume=share&channel=X",
        { secret: SECRET, now: NOW },
      ),
    ).toMatchObject({ nonce: "x".repeat(43) });
    expect(
      consumeResumeEntryCookie(
        resume.token,
        "/liamroberts.photo/photography-kit?resume=share&channel=X",
        { secret: SECRET, now: NOW },
      ),
    ).toBeNull();
  });

  it("rejects missing, ambiguous, expired, and return-mismatched resume entries", () => {
    expect(() =>
      createResumeEntryCookie("/liamroberts.photo/photography-kit", {
        secret: SECRET,
        now: NOW,
        nonce: "m".repeat(43),
      }),
    ).toThrow(/resume/i);

    expect(() =>
      createResumeEntryCookie(
        "/liamroberts.photo/photography-kit?resume=share&resume=save",
        {
          secret: SECRET,
          now: NOW,
          nonce: "a".repeat(43),
        },
      ),
    ).toThrow(/resume/i);

    const entry = createResumeEntryCookie("/liamroberts.photo?resume=save", {
      secret: SECRET,
      now: NOW,
      nonce: "b".repeat(43),
    });

    expect(
      consumeResumeEntryCookie(entry.token, "/liamroberts.photo?resume=save", {
        secret: SECRET,
        now: NOW + MAX_RESUME_ENTRY_AGE_MS,
      }),
    ).toBeNull();
    expect(
      consumeResumeEntryCookie(entry.token, "/other?resume=save", {
        secret: SECRET,
        now: NOW,
      }),
    ).toBeNull();
  });
});
