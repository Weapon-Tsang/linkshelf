import { NextResponse } from "next/server";
import { safeReturnTo } from "@/features/auth/guards";
import { createAdminEntryChallenge } from "@/features/auth/session";

export function GET(request: Request): Response {
  const requestUrl = new URL(request.url);
  const returnTo = safeReturnTo(
    requestUrl.searchParams.get("returnTo"),
    "/admin/dashboard",
  );

  if (process.env.NODE_ENV === "production") {
    const adminUrl = new URL("/admin-secret", request.url);
    adminUrl.searchParams.set("returnTo", returnTo);
    return NextResponse.redirect(adminUrl, 303);
  }

  const challenge = createAdminEntryChallenge(returnTo);
  const adminUrl = new URL("/admin-secret", request.url);
  adminUrl.searchParams.set("challenge", challenge.token);
  adminUrl.searchParams.set("returnTo", challenge.payload.returnTo);
  const response = NextResponse.redirect(adminUrl, 303);
  response.cookies.set(
    challenge.cookie.name,
    challenge.cookie.value,
    challenge.cookie.options,
  );
  return response;
}
