import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE_NAME = "linkshelf.session";
export const MAX_SESSION_AGE_MS = 7 * 24 * 60 * 60 * 1000;
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

function sign(value: string, secret: string): Buffer {
  return createHmac("sha256", secret).update(value).digest();
}

const ADMIN_ENTRY_CONTEXT = "linkshelf-admin-entry:v1";

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
  if (environment.authSecret) return environment.authSecret;
  if (environment.nodeEnv === "production") {
    throw new Error("AUTH_SECRET is required for production authentication");
  }
  return DEVELOPMENT_ONLY_SESSION_SECRET;
}

export function createAdminEntryToken(secret = resolveSessionSecret()): string {
  return `v1.${sign(ADMIN_ENTRY_CONTEXT, secret).toString("base64url")}`;
}

export function verifyAdminEntryToken(
  token: unknown,
  secret = resolveSessionSecret(),
): boolean {
  if (typeof token !== "string") return false;
  const [version, encodedSignature, extra] = token.split(".");
  if (
    version !== "v1" ||
    extra !== undefined ||
    !encodedSignature ||
    !isCanonicalBase64Url(encodedSignature)
  ) {
    return false;
  }

  const suppliedSignature = Buffer.from(encodedSignature, "base64url");
  const expectedSignature = sign(ADMIN_ENTRY_CONTEXT, secret);
  return (
    suppliedSignature.length === expectedSignature.length &&
    timingSafeEqual(suppliedSignature, expectedSignature)
  );
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

  const secret =
    options.secret ??
    resolveSessionSecret({
      nodeEnv: options.nodeEnv ?? process.env.NODE_ENV,
      authSecret: process.env.AUTH_SECRET,
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
      secure: (options.nodeEnv ?? process.env.NODE_ENV) === "production",
      maxAge: maxAgeMs / 1000,
      expires: new Date(expiresAt),
    },
  };
}

export function readSessionToken(request: Pick<Request, "headers">): string | null {
  const header = request.headers.get("cookie");
  if (!header) return null;

  const matches: string[] = [];
  for (const part of header.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0) continue;
    const name = part.slice(0, separator).trim();
    if (name !== SESSION_COOKIE_NAME) continue;
    matches.push(part.slice(separator + 1).trim());
  }

  return matches.length === 1 && matches[0] ? matches[0] : null;
}

export function readSessionFromRequest(
  request: Pick<Request, "headers">,
  secret?: string,
  now = Date.now(),
): SessionPayload | null {
  const token = readSessionToken(request);
  return token ? decodeSession(token, secret ?? resolveSessionSecret(), now) : null;
}
