import { NextResponse } from "next/server";
import { hasGoogleAuthConfiguration } from "@/auth";
import {
  openAuthDatabase,
  resolveDevelopmentUser,
  type DevelopmentRoleHint,
} from "@/features/auth/adapter";
import { hasSameOrigin, safeReturnTo } from "@/features/auth/guards";
import {
  ADMIN_ENTRY_COOKIE_NAME,
  consumeAdminEntryChallenge,
  createSessionCookie,
  readAdminEntryCookie,
} from "@/features/auth/session";

const DEFAULT_DESTINATIONS: Record<DevelopmentRoleHint, string> = {
  creator: "/studio/dashboard",
  fan: "/hub/dashboard",
  admin: "/admin/dashboard",
};

function isRoleHint(value: unknown): value is DevelopmentRoleHint {
  return value === "creator" || value === "fan" || value === "admin";
}

function redirect(request: Request, pathname: string): NextResponse {
  return NextResponse.redirect(new URL(pathname, request.url), 303);
}

export async function POST(request: Request): Promise<Response> {
  if (!hasSameOrigin(request)) {
    return new Response("Cross-origin authentication request rejected", {
      status: 403,
    });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return new Response("Invalid form submission", { status: 400 });
  }

  const requestedReturnTo = form.get("returnTo");

  if (process.env.NODE_ENV === "production") {
    if (!hasGoogleAuthConfiguration()) {
      return new Response("Google authentication is not configured", { status: 503 });
    }
    const returnTo = safeReturnTo(requestedReturnTo, "/");
    const authUrl = new URL("/api/auth/signin/google", request.url);
    authUrl.searchParams.set("callbackUrl", returnTo);
    return NextResponse.redirect(authUrl, 303);
  }

  const role = form.get("role");
  if (!isRoleHint(role)) {
    return new Response("Invalid development role", { status: 400 });
  }
  if (
    role === "admin" &&
    !consumeAdminEntryChallenge(
      form.get("entry"),
      readAdminEntryCookie(request),
      safeReturnTo(requestedReturnTo, DEFAULT_DESTINATIONS.admin),
    )
  ) {
    return new Response("Admin entry verification failed", { status: 403 });
  }

  const database = openAuthDatabase();
  try {
    const user = resolveDevelopmentUser(database, role);
    if (!user) return new Response("Development identity unavailable", { status: 403 });

    const destination = safeReturnTo(
      requestedReturnTo,
      DEFAULT_DESTINATIONS[role],
    );
    const response = redirect(request, destination);
    const cookie = createSessionCookie(user.id);
    response.cookies.set(cookie.name, cookie.value, cookie.options);
    if (role === "admin") {
      response.cookies.set(ADMIN_ENTRY_COOKIE_NAME, "", {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: false,
        expires: new Date(0),
        maxAge: 0,
      });
    }
    return response;
  } finally {
    database.close();
  }
}
