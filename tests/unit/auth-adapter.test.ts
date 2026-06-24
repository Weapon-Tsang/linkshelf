import { afterEach, describe, expect, it } from "vitest";
import type { DatabaseSync } from "node:sqlite";
import { createDatabase } from "@/lib/db/client";
import { migrate } from "@/lib/db/migrate";
import { seed } from "@/lib/db/seed";
import {
  findAuthUserByGoogle,
  getAuthSession,
  resolveDevelopmentUser,
} from "@/features/auth/adapter";
import { createSessionCookie } from "@/features/auth/session";

const SECRET = "adapter-test-secret";
const NOW = Date.UTC(2026, 5, 24, 12, 0, 0);
const databases: DatabaseSync[] = [];

function fixture(): DatabaseSync {
  const database = createDatabase(":memory:");
  migrate(database);
  seed(database, { publicRoot: "/definitely/missing" });
  databases.push(database);
  return database;
}

afterEach(() => {
  while (databases.length) databases.pop()?.close();
});

describe("development Google identity aliases", () => {
  it.each([
    ["creator", "user-creator", "CREATOR"],
    ["fan", "user-fan", "FAN"],
    ["admin", "user-admin", "ADMIN"],
  ] as const)("maps %s to its seeded identity", (hint, id, role) => {
    expect(resolveDevelopmentUser(fixture(), hint, "development")).toMatchObject({
      id,
      role,
    });
  });

  it("rejects missing users and role drift", () => {
    const missing = fixture();
    missing.exec("UPDATE users SET id = 'removed-admin' WHERE id = 'user-admin'");
    expect(resolveDevelopmentUser(missing, "admin", "development")).toBeNull();

    const mismatched = fixture();
    mismatched.exec("UPDATE users SET role = 'FAN' WHERE id = 'user-creator'");
    expect(resolveDevelopmentUser(mismatched, "creator", "development")).toBeNull();
  });

  it("disables all role hints in production", () => {
    expect(resolveDevelopmentUser(fixture(), "creator", "production")).toBeNull();
  });

  it.each(["", "moderator", "__proto__"])(
    "rejects unsupported role hint %s",
    (hint) => {
      expect(resolveDevelopmentUser(fixture(), hint, "development")).toBeNull();
    },
  );
});

describe("existing-user auth lookup", () => {
  it("maps only an exact Google subject without creating a user", () => {
    const database = fixture();
    expect(
      findAuthUserByGoogle(database, {
        subject: "google-creator",
      })?.id,
    ).toBe("user-creator");
    expect(
      findAuthUserByGoogle(database, {
        subject: "unknown",
      }),
    ).toBeNull();
  });

  it("hydrates signed sessions through the current database user", () => {
    const database = fixture();
    const cookie = createSessionCookie("user-creator", {
      secret: SECRET,
      now: NOW,
    });
    const request = new Request("https://linkshelf.test/studio/dashboard", {
      headers: { cookie: `${cookie.name}=${cookie.value}` },
    });

    expect(getAuthSession(database, request, SECRET, NOW)?.user.role).toBe(
      "CREATOR",
    );
  });
});
