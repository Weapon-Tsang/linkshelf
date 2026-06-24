import type { DefaultSession } from "next-auth";
import type { UserRole } from "@/features/auth/types";

declare module "next-auth" {
  interface Session {
    localUserId?: string;
    role?: UserRole;
    user?: DefaultSession["user"] & {
      id?: string;
      role?: UserRole;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    localUserId?: string;
  }
}
