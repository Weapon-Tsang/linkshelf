import { describe, expect, it } from "vitest";
import {
  canAccess,
  hasSameOrigin,
  requiredRoleFor,
  safeReturnTo,
} from "@/features/auth/guards";

describe("role access", () => {
  it.each([
    ["CREATOR", "/studio/dashboard", true],
    ["FAN", "/studio/dashboard", false],
    ["ADMIN", "/admin/dashboard", true],
    ["CREATOR", "/admin/dashboard", false],
    ["FAN", "/hub/dashboard", true],
    ["CREATOR", "/hub/dashboard", false],
  ] as const)("checks %s for %s", (role, path, expected) => {
    expect(canAccess(role, path)).toBe(expected);
  });
});

describe("route requirements", () => {
  it("keeps the public admin entry outside the protected admin namespace", () => {
    expect(requiredRoleFor("/admin-secret")).toBeNull();
    expect(requiredRoleFor("/admin/dashboard")).toBe("ADMIN");
    expect(requiredRoleFor("/administration")).toBeNull();
  });
});

describe("safe return paths", () => {
  it.each([
    ["/studio/dashboard", "/studio/dashboard"],
    ["/hub/dashboard?tab=saves", "/hub/dashboard?tab=saves"],
    [undefined, "/fallback"],
  ] as const)("accepts %s", (value, expected) => {
    expect(safeReturnTo(value, "/fallback")).toBe(expected);
  });

  it.each([
    "https://evil.example/steal",
    "javascript:alert(1)",
    "//evil.example/steal",
    "/\\evil.example/steal",
    "/%2f%2fevil.example/steal",
    "/%5cevil.example/steal",
    "/ok\r\nSet-Cookie: stolen=yes",
    "/ok%0d%0aSet-Cookie:stolen",
    "/login",
    "/login?returnTo=/studio/dashboard",
    "/admin-secret",
    "/forbidden",
    "/api/auth/google",
  ])("rejects unsafe or looping destination %s", (value) => {
    expect(safeReturnTo(value, "/fallback")).toBe("/fallback");
  });
});

describe("same-origin auth posts", () => {
  it("accepts localhost and 127.0.0.1 as equivalent loopback origins in development", () => {
    expect(
      hasSameOrigin({
        url: "http://localhost:3000/api/auth/google",
        headers: new Headers({ origin: "http://127.0.0.1:3000" }),
      }),
    ).toBe(true);
  });

  it("keeps rejecting non-loopback cross-origin posts", () => {
    expect(
      hasSameOrigin({
        url: "http://localhost:3000/api/auth/google",
        headers: new Headers({ origin: "https://evil.example" }),
      }),
    ).toBe(false);
  });
});
