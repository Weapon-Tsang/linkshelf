import type { UserRole } from "./types";

export type RoleRequirement = UserRole | readonly UserRole[] | null;

function isPath(pathname: string, root: string): boolean {
  return pathname === root || pathname.startsWith(`${root}/`);
}

export function requiredRoleFor(pathname: string): RoleRequirement {
  if (isPath(pathname, "/admin")) return "ADMIN";
  if (isPath(pathname, "/studio")) return "CREATOR";
  if (isPath(pathname, "/hub")) return "FAN";
  return null;
}

export function canAccess(role: UserRole, pathname: string): boolean {
  const requirement = requiredRoleFor(pathname);
  if (requirement === null) return true;
  return Array.isArray(requirement)
    ? requirement.includes(role)
    : requirement === role;
}

const AUTH_LOOP_ROOTS = [
  "/login",
  "/admin-secret",
  "/forbidden",
  "/api/auth",
] as const;

function isSafeReturnPath(value: string): boolean {
  if (!value.startsWith("/") || value.startsWith("//")) return false;
  if (value.includes("\\") || /[\u0000-\u001f\u007f]/.test(value)) return false;

  let decoded: string;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    return false;
  }

  if (!decoded.startsWith("/") || decoded.startsWith("//")) return false;
  if (decoded.includes("\\") || /[\u0000-\u001f\u007f]/.test(decoded)) return false;

  const pathname = decoded.split(/[?#]/, 1)[0] ?? decoded;
  return !AUTH_LOOP_ROOTS.some((root) => isPath(pathname, root));
}

export function safeReturnTo(value: unknown, fallback = "/"): string {
  return typeof value === "string" && isSafeReturnPath(value) ? value : fallback;
}

function isLoopbackHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
}

export function hasSameOrigin(request: Pick<Request, "headers" | "url">): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    const originUrl = new URL(origin);
    const requestUrl = new URL(request.url);
    return (
      originUrl.origin === requestUrl.origin ||
      (originUrl.protocol === requestUrl.protocol &&
        originUrl.port === requestUrl.port &&
        isLoopbackHost(originUrl.hostname) &&
        isLoopbackHost(requestUrl.hostname))
    );
  } catch {
    return false;
  }
}

export function requestBaseUrl(request: Pick<Request, "headers" | "url">): URL {
  const requestUrl = new URL(request.url);
  const origin = request.headers.get("origin");
  if (origin && hasSameOrigin(request)) {
    return new URL(origin);
  }

  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost ?? request.headers.get("host");
  if (host) {
    const protocol =
      request.headers.get("x-forwarded-proto") ??
      requestUrl.protocol.replace(/:$/, "");
    try {
      return new URL(`${protocol}://${host}`);
    } catch {
      // Fall through to the framework-provided request URL.
    }
  }

  return new URL(requestUrl.origin);
}
