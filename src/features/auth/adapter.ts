import type { DatabaseSync } from "node:sqlite";
import { createDatabase } from "@/lib/db/client";
import { migrate } from "@/lib/db/migrate";
import { seed } from "@/lib/db/seed";
import { readSessionFromRequest } from "./session";
import type { UserRole } from "./types";

export interface AuthUser {
  readonly id: string;
  readonly googleSubject: string;
  readonly email: string;
  readonly displayName: string;
  readonly role: UserRole;
  readonly avatarUrl: string | null;
}

export interface AuthSession {
  readonly user: AuthUser;
  readonly issuedAt: number;
  readonly expiresAt: number;
}

export type DevelopmentRoleHint = "creator" | "fan" | "admin";

interface UserRow {
  readonly id: string;
  readonly googleSubject: string;
  readonly email: string;
  readonly displayName: string;
  readonly role: string;
  readonly avatarUrl: string | null;
}

const DEVELOPMENT_IDENTITIES: Record<
  DevelopmentRoleHint,
  Pick<AuthUser, "id" | "googleSubject" | "email" | "role">
> = {
  creator: {
    id: "user-creator",
    googleSubject: "google-creator",
    email: "creator@linkshelf.local",
    role: "CREATOR",
  },
  fan: {
    id: "user-fan",
    googleSubject: "google-fan",
    email: "fan@linkshelf.local",
    role: "FAN",
  },
  admin: {
    id: "user-admin",
    googleSubject: "google-admin",
    email: "admin@linkshelf.local",
    role: "ADMIN",
  },
};

function isUserRole(value: string): value is UserRole {
  return value === "CREATOR" || value === "FAN" || value === "ADMIN";
}

function toAuthUser(row: UserRow | undefined): AuthUser | null {
  if (!row || !isUserRole(row.role)) return null;
  return {
    id: row.id,
    googleSubject: row.googleSubject,
    email: row.email,
    displayName: row.displayName,
    role: row.role,
    avatarUrl: row.avatarUrl,
  };
}

function supportsSoftDeletedUsers(database: DatabaseSync): boolean {
  const columns = database.prepare("PRAGMA table_info('users')").all() as Array<{
    name: string;
  }>;
  return columns.some((column) => column.name === "deleted_at");
}

function activeUserClause(database: DatabaseSync): string {
  return supportsSoftDeletedUsers(database) ? " AND deleted_at IS NULL" : "";
}

const USER_COLUMNS = `
  id,
  google_subject AS googleSubject,
  email,
  display_name AS displayName,
  role,
  avatar_url AS avatarUrl
`;

export function findAuthUserById(
  database: DatabaseSync,
  userId: string,
): AuthUser | null {
  const row = database
    .prepare(`SELECT ${USER_COLUMNS} FROM users WHERE id = ?${activeUserClause(database)}`)
    .get(userId) as UserRow | undefined;
  return toAuthUser(row);
}

export function findAuthUserByGoogle(
  database: DatabaseSync,
  identity: { readonly subject?: string | null },
): AuthUser | null {
  const subject = identity.subject?.trim() ?? "";
  if (!subject) return null;

  const row = database
    .prepare(
      `SELECT ${USER_COLUMNS}
       FROM users
       WHERE google_subject = ?${activeUserClause(database)}`,
    )
    .get(subject) as UserRow | undefined;
  return toAuthUser(row);
}

export function resolveDevelopmentUser(
  database: DatabaseSync,
  hint: string,
  nodeEnv = process.env.NODE_ENV,
): AuthUser | null {
  if (nodeEnv === "production" || !Object.hasOwn(DEVELOPMENT_IDENTITIES, hint)) {
    return null;
  }

  const expected = DEVELOPMENT_IDENTITIES[hint as DevelopmentRoleHint];
  const user = findAuthUserById(database, expected.id);
  if (
    !user ||
    user.role !== expected.role ||
    user.googleSubject !== expected.googleSubject ||
    user.email.toLowerCase() !== expected.email
  ) {
    return null;
  }
  return user;
}

export function getAuthSession(
  database: DatabaseSync,
  request: Pick<Request, "headers">,
  secret?: string,
  now = Date.now(),
): AuthSession | null {
  const payload = readSessionFromRequest(request, secret, now);
  if (!payload) return null;
  const user = findAuthUserById(database, payload.userId);
  return user
    ? { user, issuedAt: payload.issuedAt, expiresAt: payload.expiresAt }
    : null;
}

export function openAuthDatabase(nodeEnv = process.env.NODE_ENV): DatabaseSync {
  const database = createDatabase();
  migrate(database);
  if (nodeEnv !== "production") seed(database);
  return database;
}
