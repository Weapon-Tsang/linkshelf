import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { findAuthUserByGoogle, openAuthDatabase } from "@/features/auth/adapter";

export interface GoogleAuthEnvironment {
  readonly AUTH_GOOGLE_ID?: string;
  readonly AUTH_GOOGLE_SECRET?: string;
  readonly AUTH_SECRET?: string;
}

export function hasGoogleAuthConfiguration(
  environment: GoogleAuthEnvironment = process.env,
): boolean {
  return Boolean(
    environment.AUTH_GOOGLE_ID &&
      environment.AUTH_GOOGLE_SECRET &&
      environment.AUTH_SECRET,
  );
}

const providers = hasGoogleAuthConfiguration()
  ? [
      GoogleProvider({
        clientId: process.env.AUTH_GOOGLE_ID!,
        clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      }),
    ]
  : [];

export const authOptions: NextAuthOptions = {
  providers,
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ account, profile, user }) {
      if (account?.provider !== "google") return false;

      const googleProfile = profile as
        | { readonly sub?: string; readonly email?: string }
        | undefined;
      const database = openAuthDatabase("production");
      try {
        return Boolean(
          findAuthUserByGoogle(database, {
            subject: account.providerAccountId ?? googleProfile?.sub,
            email: user.email ?? googleProfile?.email,
          }),
        );
      } finally {
        database.close();
      }
    },
  },
};
