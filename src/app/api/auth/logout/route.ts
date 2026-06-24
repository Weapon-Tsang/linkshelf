import { NextResponse } from "next/server";
import { hasSameOrigin, safeReturnTo } from "@/features/auth/guards";
import {
  ADMIN_ENTRY_COOKIE_NAME,
  SESSION_COOKIE_NAME,
} from "@/features/auth/session";

const NEXT_AUTH_COOKIE_NAMES = [
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
  "next-auth.callback-url",
  "__Secure-next-auth.callback-url",
  "next-auth.csrf-token",
  "__Host-next-auth.csrf-token",
  "next-auth.pkce.code_verifier",
  "__Secure-next-auth.pkce.code_verifier",
  "next-auth.state",
  "__Secure-next-auth.state",
  "next-auth.nonce",
  "__Secure-next-auth.nonce",
] as const;

function cookieNamesToClear(request: Request): string[] {
  const names = new Set<string>([
    SESSION_COOKIE_NAME,
    ADMIN_ENTRY_COOKIE_NAME,
    ...NEXT_AUTH_COOKIE_NAMES,
  ]);
  const cookieHeader = request.headers.get("cookie") ?? "";
  for (const part of cookieHeader.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0) continue;
    const name = part.slice(0, separator).trim();
    if (
      NEXT_AUTH_COOKIE_NAMES.some(
        (baseName) => name === baseName || name.startsWith(`${baseName}.`),
      )
    ) {
      names.add(name);
    }
  }
  return [...names];
}

export async function POST(request: Request): Promise<Response> {
  if (!hasSameOrigin(request)) {
    return new Response("Cross-origin logout request rejected", { status: 403 });
  }

  let returnTo: FormDataEntryValue | null = null;
  try {
    returnTo = (await request.formData()).get("returnTo");
  } catch {
    // A malformed logout request still clears the local session.
  }

  const destination = safeReturnTo(returnTo, "/");
  const response = NextResponse.redirect(new URL(destination, request.url), 303);
  for (const cookieName of cookieNamesToClear(request)) {
    response.cookies.set(cookieName, "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure:
        process.env.NODE_ENV === "production" || cookieName.startsWith("__"),
      expires: new Date(0),
      maxAge: 0,
    });
  }
  return response;
}
