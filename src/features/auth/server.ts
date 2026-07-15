import { resolveAuthSession } from "@/auth";
import type { AuthSession } from "./adapter";

function requestUrlFromHeaders(headers: Headers, pathname: string): string {
  const normalizedPathname = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const host =
    headers.get("x-forwarded-host") ??
    headers.get("host") ??
    "linkshelf.local";
  const protocol = headers.get("x-forwarded-proto") ?? "https";

  return `${protocol}://${host}${normalizedPathname}`;
}

export function resolveServerAuthSession(
  headers: Headers,
  pathname = "/",
): Promise<AuthSession | null> {
  return resolveAuthSession(
    new Request(requestUrlFromHeaders(headers, pathname), { headers }),
  );
}
