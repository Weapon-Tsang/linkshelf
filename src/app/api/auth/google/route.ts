import { NextResponse } from "next/server";
import { hasGoogleAuthConfiguration } from "@/auth";
import {
  openAuthDatabase,
  resolveDevelopmentUser,
  type DevelopmentRoleHint,
} from "@/features/auth/adapter";
import { hasSameOrigin, requestBaseUrl, safeReturnTo } from "@/features/auth/guards";
import {
  ADMIN_ENTRY_COOKIE_NAME,
  consumeAdminEntryChallenge,
  createResumeEntryCookie,
  createSessionCookie,
  readAdminEntryCookie,
} from "@/features/auth/session";
import { recordOperationalEvent } from "@/lib/monitoring/events";

const DEFAULT_DESTINATIONS: Record<DevelopmentRoleHint, string> = {
  creator: "/studio/dashboard",
  fan: "/hub/dashboard",
  admin: "/admin/dashboard",
};

function isRoleHint(value: unknown): value is DevelopmentRoleHint {
  return value === "creator" || value === "fan" || value === "admin";
}

function redirect(request: Request, pathname: string): NextResponse {
  return NextResponse.redirect(new URL(pathname, requestBaseUrl(request)), 303);
}

function setResumeEntryCookieIfNeeded(
  response: NextResponse,
  requestedReturnTo: unknown,
) {
  try {
    const resumeEntry = createResumeEntryCookie(requestedReturnTo);
    response.cookies.set(
      resumeEntry.cookie.name,
      resumeEntry.cookie.value,
      resumeEntry.cookie.options,
    );
  } catch {
    // Most auth submissions are ordinary non-resumable redirects.
  }
}

export async function POST(request: Request): Promise<Response> {
  if (!hasSameOrigin(request)) {
    recordOperationalEvent({
      level: "warn",
      name: "auth.google.request",
      outcome: "cross_origin_rejected",
      metadata: { status: 403 },
    });
    return new Response("Cross-origin authentication request rejected", {
      status: 403,
    });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    recordOperationalEvent({
      level: "warn",
      name: "auth.google.request",
      outcome: "invalid_form",
      metadata: { status: 400 },
    });
    return new Response("Invalid form submission", { status: 400 });
  }

  const requestedReturnTo = form.get("returnTo");

  if (process.env.NODE_ENV === "production") {
    if (!hasGoogleAuthConfiguration()) {
      recordOperationalEvent({
        level: "error",
        name: "auth.google.request",
        outcome: "google_configuration_missing",
        metadata: { status: 503, environment: "production" },
      });
      return new Response("Google authentication is not configured", { status: 503 });
    }
    const returnTo = safeReturnTo(requestedReturnTo, "/");
    const authUrl = new URL("/api/auth/signin/google", requestBaseUrl(request));
    authUrl.searchParams.set("callbackUrl", returnTo);
    const response = NextResponse.redirect(authUrl, 303);
    setResumeEntryCookieIfNeeded(response, requestedReturnTo);
    recordOperationalEvent({
      level: "info",
      name: "auth.google.request",
      outcome: "production_redirect",
      metadata: { status: 303, environment: "production" },
    });
    return response;
  }

  const role = form.get("role");
  if (!isRoleHint(role)) {
    recordOperationalEvent({
      level: "warn",
      name: "auth.google.request",
      outcome: "invalid_development_role",
      metadata: { status: 400 },
    });
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
    recordOperationalEvent({
      level: "warn",
      name: "auth.google.request",
      outcome: "admin_entry_rejected",
      metadata: { status: 403, role },
    });
    return new Response("Admin entry verification failed", { status: 403 });
  }

  const database = openAuthDatabase();
  try {
    const user = resolveDevelopmentUser(database, role);
    if (!user) {
      recordOperationalEvent({
        level: "error",
        name: "auth.google.request",
        outcome: "development_identity_missing",
        metadata: { status: 403, role },
      });
      return new Response("Development identity unavailable", { status: 403 });
    }

    const destination = safeReturnTo(
      requestedReturnTo,
      DEFAULT_DESTINATIONS[role],
    );
    const response = redirect(request, destination);
    const cookie = createSessionCookie(user.id);
    response.cookies.set(cookie.name, cookie.value, cookie.options);
    setResumeEntryCookieIfNeeded(response, requestedReturnTo);
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
    recordOperationalEvent({
      level: "info",
      name: "auth.google.request",
      outcome: "development_login",
      metadata: { status: 303, role },
    });
    return response;
  } finally {
    database.close();
  }
}
