import type { UserRole } from "./types";

export type RoleRequirement = UserRole | readonly UserRole[] | null;

function isPath(pathname: string, root: string): boolean {
  return pathname === root || pathname.startsWith(`${root}/`);
}

export function requiredRoleFor(pathname: string): RoleRequirement {
  if (isPath(pathname, "/admin")) return "ADMIN";
  if (isPath(pathname, "/studio")) return "CREATOR";
  if (isPath(pathname, "/hub")) return ["FAN", "CREATOR"];
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

export function hasSameOrigin(request: Pick<Request, "headers" | "url">): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}
