import type { NextAuthOptions } from "next-auth";
import { getToken, type JWT } from "next-auth/jwt";
import GoogleProvider from "next-auth/providers/google";
import { NextRequest } from "next/server";
import {
  findAuthUserByGoogle,
  findAuthUserById,
  getAuthSession,
  openAuthDatabase,
  type AuthSession,
  type AuthUser,
} from "@/features/auth/adapter";
import { resolveSessionSecret } from "@/features/auth/session";
import { recordOperationalEvent } from "@/lib/monitoring/events";

export interface GoogleAuthEnvironment {
  readonly NODE_ENV?: string;
  readonly AUTH_GOOGLE_ID?: string;
  readonly AUTH_GOOGLE_SECRET?: string;
  readonly AUTH_SECRET?: string;
}

interface GoogleProfile {
  readonly sub?: string;
  readonly email_verified?: unknown;
}

function configuredGoogleSubject(
  account: { readonly provider?: string; readonly providerAccountId?: string } | null,
  profile: GoogleProfile | undefined,
): string | null {
  if (
    account?.provider !== "google" ||
    !account.providerAccountId ||
    (profile?.sub !== undefined && profile.sub !== account.providerAccountId) ||
    (profile &&
      Object.hasOwn(profile, "email_verified") &&
      profile.email_verified !== true)
  ) {
    return null;
  }
  return account.providerAccountId;
}

function findCurrentGoogleUser(
  account: { readonly provider?: string; readonly providerAccountId?: string } | null,
  profile: GoogleProfile | undefined,
): AuthUser | null {
  const subject = configuredGoogleSubject(account, profile);
  if (!subject) return null;

  const database = openAuthDatabase("production");
  try {
    return findAuthUserByGoogle(database, { subject });
  } finally {
    database.close();
  }
}

function completeGoogleConfiguration(environment: GoogleAuthEnvironment): boolean {
  return Boolean(
    environment.AUTH_GOOGLE_ID &&
      environment.AUTH_GOOGLE_SECRET &&
      environment.AUTH_SECRET,
  );
}

export function hasGoogleAuthConfiguration(
  environment: GoogleAuthEnvironment = process.env,
): boolean {
  if (!completeGoogleConfiguration(environment)) return false;
  try {
    resolveSessionSecret({
      nodeEnv: environment.NODE_ENV ?? process.env.NODE_ENV,
      authSecret: environment.AUTH_SECRET,
    });
    return true;
  } catch {
    return false;
  }
}

export function createAuthOptions(
  environment: GoogleAuthEnvironment = process.env,
): NextAuthOptions {
  const hasGoogle = completeGoogleConfiguration(environment);
  const secret = hasGoogle
    ? resolveSessionSecret({
        nodeEnv: environment.NODE_ENV ?? process.env.NODE_ENV,
        authSecret: environment.AUTH_SECRET,
      })
    : undefined;
  const providers = hasGoogle
    ? [
        GoogleProvider({
          clientId: environment.AUTH_GOOGLE_ID!,
          clientSecret: environment.AUTH_GOOGLE_SECRET!,
        }),
      ]
    : [];

  return {
    providers,
    secret,
    session: { strategy: "jwt" },
    callbacks: {
      async signIn({ account, profile }) {
        const user = findCurrentGoogleUser(
          account,
          profile as GoogleProfile | undefined,
        );
        recordOperationalEvent({
          level: user ? "info" : "warn",
          name: "auth.google.sign_in",
          outcome: user ? "accepted" : "rejected",
          metadata: {
            provider: account?.provider ?? "unknown",
            mapped: Boolean(user),
          },
        });
        return Boolean(user);
      },
      async jwt({ token, account, profile }) {
        if (!account) return token;

        delete token.localUserId;
        const user = findCurrentGoogleUser(
          account,
          profile as GoogleProfile | undefined,
        );
        if (user) token.localUserId = user.id;
        return token;
      },
      async session({ session, token }) {
        delete session.localUserId;
        delete session.role;
        if (typeof token.localUserId !== "string") {
          session.user = undefined;
          return session;
        }

        const database = openAuthDatabase("production");
        try {
          const user = findAuthUserById(database, token.localUserId);
          if (!user) {
            session.user = undefined;
            return session;
          }
          session.localUserId = user.id;
          session.role = user.role;
          session.user = {
            id: user.id,
            role: user.role,
            name: user.displayName,
            email: user.email,
            image: user.avatarUrl,
          };
          return session;
        } finally {
          database.close();
        }
      },
    },
  };
}

export const authOptions = createAuthOptions();

export async function resolveAuthSession(request: Request): Promise<AuthSession | null> {
  if (process.env.NODE_ENV !== "production") {
    const database = openAuthDatabase();
    try {
      return getAuthSession(database, request);
    } finally {
      database.close();
    }
  }

  if (!hasGoogleAuthConfiguration()) return null;
  const secret = resolveSessionSecret();
  const nextRequest =
    request instanceof NextRequest ? request : new NextRequest(request);
  const token = (await getToken({
    req: nextRequest,
    secret,
    secureCookie: new URL(request.url).protocol === "https:",
  })) as JWT | null;
  if (!token || typeof token.localUserId !== "string") return null;

  const database = openAuthDatabase("production");
  try {
    const user = findAuthUserById(database, token.localUserId);
    if (!user) return null;
    return {
      user,
      issuedAt: typeof token.iat === "number" ? token.iat * 1000 : 0,
      expiresAt: typeof token.exp === "number" ? token.exp * 1000 : 0,
    };
  } finally {
    database.close();
  }
}
