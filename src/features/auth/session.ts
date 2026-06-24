import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { safeReturnTo } from "./guards";

export const SESSION_COOKIE_NAME = "linkshelf.session";
export const MAX_SESSION_AGE_MS = 7 * 24 * 60 * 60 * 1000;
export const ADMIN_ENTRY_COOKIE_NAME = "linkshelf.admin-entry";
export const MAX_ADMIN_ENTRY_AGE_MS = 5 * 60 * 1000;
export const DEVELOPMENT_ONLY_SESSION_SECRET =
  "linkshelf-development-only-never-use-in-production";

export interface SessionPayload {
  readonly version: 1;
  readonly userId: string;
  readonly issuedAt: number;
  readonly expiresAt: number;
}

export interface SessionEnvironment {
  readonly nodeEnv?: string;
  readonly authSecret?: string;
}

export interface SessionCookieOptions {
  readonly httpOnly: true;
  readonly sameSite: "lax";
  readonly path: "/";
  readonly secure: boolean;
  readonly maxAge: number;
  readonly expires: Date;
}

export interface SessionCookie {
  readonly name: typeof SESSION_COOKIE_NAME;
  readonly value: string;
  readonly options: SessionCookieOptions;
}

export interface CreateSessionCookieOptions {
  readonly secret?: string;
  readonly now?: number;
  readonly maxAgeMs?: number;
  readonly nodeEnv?: string;
}

export interface AdminEntryPayload {
  readonly version: 1;
  readonly nonce: string;
  readonly issuedAt: number;
  readonly expiresAt: number;
  readonly returnTo: string;
}

export interface CreateAdminEntryChallengeOptions {
  readonly secret?: string;
  readonly now?: number;
  readonly nonce?: string;
  readonly maxAgeMs?: number;
  readonly nodeEnv?: string;
}

export interface VerifyAdminEntryChallengeOptions {
  readonly secret?: string;
  readonly now?: number;
  readonly nodeEnv?: string;
}

export interface AdminEntryChallenge {
  readonly token: string;
  readonly payload: AdminEntryPayload;
  readonly cookie: {
    readonly name: typeof ADMIN_ENTRY_COOKIE_NAME;
    readonly value: string;
    readonly options: SessionCookieOptions;
  };
}

function sign(value: string, secret: string): Buffer {
  return createHmac("sha256", secret).update(value).digest();
}

const consumedAdminEntryNonces = new Map<string, number>();

function isCanonicalBase64Url(value: string): boolean {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) return false;
  try {
    return Buffer.from(value, "base64url").toString("base64url") === value;
  } catch {
    return false;
  }
}

function hasValidShape(value: unknown): value is SessionPayload {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const payload = value as Record<string, unknown>;
  return (
    payload.version === 1 &&
    typeof payload.userId === "string" &&
    payload.userId.length > 0 &&
    payload.userId.length <= 256 &&
    Number.isSafeInteger(payload.issuedAt) &&
    Number.isSafeInteger(payload.expiresAt)
  );
}

function hasValidAdminEntryShape(value: unknown): value is AdminEntryPayload {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const payload = value as Record<string, unknown>;
  return (
    payload.version === 1 &&
    typeof payload.nonce === "string" &&
    /^[A-Za-z0-9_-]{43}$/.test(payload.nonce) &&
    Number.isSafeInteger(payload.issuedAt) &&
    Number.isSafeInteger(payload.expiresAt) &&
    typeof payload.returnTo === "string"
  );
}

function secretsEqual(first: string, second: string): boolean {
  const firstBuffer = Buffer.from(first);
  const secondBuffer = Buffer.from(second);
  return (
    firstBuffer.length === secondBuffer.length &&
    timingSafeEqual(firstBuffer, secondBuffer)
  );
}

export function encodeSession(payload: SessionPayload, secret: string): string {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signedValue = `v1.${encodedPayload}`;
  return `${signedValue}.${sign(signedValue, secret).toString("base64url")}`;
}

export function decodeSession(
  token: string,
  secret: string,
  now = Date.now(),
): SessionPayload | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [version, encodedPayload, encodedSignature] = parts;
  if (
    version !== "v1" ||
    !encodedPayload ||
    !encodedSignature ||
    !isCanonicalBase64Url(encodedPayload) ||
    !isCanonicalBase64Url(encodedSignature)
  ) {
    return null;
  }

  const suppliedSignature = Buffer.from(encodedSignature, "base64url");
  const expectedSignature = sign(`${version}.${encodedPayload}`, secret);
  if (
    suppliedSignature.length !== expectedSignature.length ||
    !timingSafeEqual(suppliedSignature, expectedSignature)
  ) {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  if (!hasValidShape(parsed)) return null;
  if (parsed.issuedAt > now || parsed.expiresAt <= now) return null;

  const duration = parsed.expiresAt - parsed.issuedAt;
  if (duration <= 0 || duration > MAX_SESSION_AGE_MS) return null;
  return parsed;
}

export function resolveSessionSecret(
  environment: SessionEnvironment = {
    nodeEnv: process.env.NODE_ENV,
    authSecret: process.env.AUTH_SECRET,
  },
): string {
  if (environment.nodeEnv === "production") {
    if (
      !environment.authSecret ||
      Buffer.byteLength(environment.authSecret.trim(), "utf8") < 32
    ) {
      throw new Error(
        "AUTH_SECRET must contain at least 32 bytes of non-whitespace in production",
      );
    }
    return environment.authSecret;
  }
  return environment.authSecret || DEVELOPMENT_ONLY_SESSION_SECRET;
}

function adminEntrySecret(
  options: Pick<CreateAdminEntryChallengeOptions, "secret" | "nodeEnv">,
): string {
  return resolveSessionSecret({
    nodeEnv: options.nodeEnv ?? process.env.NODE_ENV,
    authSecret: options.secret ?? process.env.AUTH_SECRET,
  });
}

export function createAdminEntryChallenge(
  requestedReturnTo: unknown,
  options: CreateAdminEntryChallengeOptions = {},
): AdminEntryChallenge {
  const now = options.now ?? Date.now();
  const maxAgeMs = options.maxAgeMs ?? MAX_ADMIN_ENTRY_AGE_MS;
  if (
    !Number.isSafeInteger(maxAgeMs) ||
    maxAgeMs <= 0 ||
    maxAgeMs > MAX_ADMIN_ENTRY_AGE_MS
  ) {
    throw new Error("Admin entry max age must be between 1ms and 5 minutes");
  }

  const nonce = options.nonce ?? randomBytes(32).toString("base64url");
  if (!/^[A-Za-z0-9_-]{43}$/.test(nonce)) {
    throw new Error("Admin entry nonce must contain 32 bytes of base64url entropy");
  }

  const returnTo = safeReturnTo(requestedReturnTo, "/admin/dashboard");
  const payload: AdminEntryPayload = {
    version: 1,
    nonce,
    issuedAt: now,
    expiresAt: now + maxAgeMs,
    returnTo,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signedValue = `v1.${encodedPayload}`;
  const secret = adminEntrySecret(options);

  return {
    token: `${signedValue}.${sign(signedValue, secret).toString("base64url")}`,
    payload,
    cookie: {
      name: ADMIN_ENTRY_COOKIE_NAME,
      value: nonce,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: (options.nodeEnv ?? process.env.NODE_ENV) === "production",
        maxAge: maxAgeMs / 1000,
        expires: new Date(now + maxAgeMs),
      },
    },
  };
}

export function verifyAdminEntryChallenge(
  token: unknown,
  browserNonce: unknown,
  expectedReturnTo: unknown,
  options: VerifyAdminEntryChallengeOptions = {},
): AdminEntryPayload | null {
  if (typeof token !== "string" || typeof browserNonce !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [version, encodedPayload, encodedSignature] = parts;
  if (
    version !== "v1" ||
    !encodedPayload ||
    !encodedSignature ||
    !isCanonicalBase64Url(encodedPayload) ||
    !isCanonicalBase64Url(encodedSignature)
  ) {
    return null;
  }

  const secret = adminEntrySecret(options);
  const suppliedSignature = Buffer.from(encodedSignature, "base64url");
  const expectedSignature = sign(`${version}.${encodedPayload}`, secret);
  if (
    suppliedSignature.length !== expectedSignature.length ||
    !timingSafeEqual(suppliedSignature, expectedSignature)
  ) {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (!hasValidAdminEntryShape(parsed)) return null;

  const now = options.now ?? Date.now();
  const duration = parsed.expiresAt - parsed.issuedAt;
  if (
    parsed.issuedAt > now ||
    parsed.expiresAt <= now ||
    duration <= 0 ||
    duration > MAX_ADMIN_ENTRY_AGE_MS ||
    safeReturnTo(parsed.returnTo, "") !== parsed.returnTo ||
    safeReturnTo(expectedReturnTo, "") !== parsed.returnTo ||
    !secretsEqual(parsed.nonce, browserNonce)
  ) {
    return null;
  }
  return parsed;
}

export function consumeAdminEntryChallenge(
  token: unknown,
  browserNonce: unknown,
  expectedReturnTo: unknown,
  options: VerifyAdminEntryChallengeOptions = {},
): AdminEntryPayload | null {
  const now = options.now ?? Date.now();
  for (const [nonce, expiresAt] of consumedAdminEntryNonces) {
    if (expiresAt <= now) consumedAdminEntryNonces.delete(nonce);
  }

  const payload = verifyAdminEntryChallenge(
    token,
    browserNonce,
    expectedReturnTo,
    options,
  );
  if (!payload || consumedAdminEntryNonces.has(payload.nonce)) return null;
  consumedAdminEntryNonces.set(payload.nonce, payload.expiresAt);
  return payload;
}

export function createSessionCookie(
  userId: string,
  options: CreateSessionCookieOptions = {},
): SessionCookie {
  if (!userId || userId.length > 256) {
    throw new Error("Session user ID must be between 1 and 256 characters");
  }
  const now = options.now ?? Date.now();
  const maxAgeMs = options.maxAgeMs ?? MAX_SESSION_AGE_MS;
  if (!Number.isSafeInteger(maxAgeMs) || maxAgeMs <= 0 || maxAgeMs > MAX_SESSION_AGE_MS) {
    throw new Error("Session max age must be between 1ms and 7 days");
  }

  const nodeEnv = options.nodeEnv ?? process.env.NODE_ENV;
  const secret = resolveSessionSecret({
    nodeEnv,
    authSecret: options.secret ?? process.env.AUTH_SECRET,
  });
  const expiresAt = now + maxAgeMs;
  const value = encodeSession(
    { version: 1, userId, issuedAt: now, expiresAt },
    secret,
  );

  return {
    name: SESSION_COOKIE_NAME,
    value,
    options: {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: nodeEnv === "production",
      maxAge: maxAgeMs / 1000,
      expires: new Date(expiresAt),
    },
  };
}

export function readCookie(
  request: Pick<Request, "headers">,
  cookieName: string,
): string | null {
  const header = request.headers.get("cookie");
  if (!header) return null;

  const matches: string[] = [];
  for (const part of header.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0) continue;
    const name = part.slice(0, separator).trim();
    if (name !== cookieName) continue;
    matches.push(part.slice(separator + 1).trim());
  }

  return matches.length === 1 && matches[0] ? matches[0] : null;
}

export function readSessionToken(request: Pick<Request, "headers">): string | null {
  return readCookie(request, SESSION_COOKIE_NAME);
}

export function readAdminEntryCookie(
  request: Pick<Request, "headers">,
): string | null {
  return readCookie(request, ADMIN_ENTRY_COOKIE_NAME);
}

export function readSessionFromRequest(
  request: Pick<Request, "headers">,
  secret?: string,
  now = Date.now(),
): SessionPayload | null {
  const token = readSessionToken(request);
  return token ? decodeSession(token, secret ?? resolveSessionSecret(), now) : null;
}
