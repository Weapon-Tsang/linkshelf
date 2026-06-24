import { NextResponse } from "next/server";
import { safeReturnTo } from "@/features/auth/guards";
import { SESSION_COOKIE_NAME } from "@/features/auth/session";

export async function POST(request: Request): Promise<Response> {
  let returnTo: FormDataEntryValue | null = null;
  try {
    returnTo = (await request.formData()).get("returnTo");
  } catch {
    // A malformed logout request still clears the local session.
  }

  const destination = safeReturnTo(returnTo, "/");
  const response = NextResponse.redirect(new URL(destination, request.url), 303);
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    expires: new Date(0),
    maxAge: 0,
  });
  return response;
}
