import type { DatabaseSync } from "node:sqlite";
import { describe, expect, it } from "vitest";
import { resolveAffiliateRedirect } from "@/features/affiliate/resolve-redirect";

describe("resolveAffiliateRedirect", () => {
  it("returns a persistence failure when opening the click transaction fails", () => {
    const database = {
      prepare(sql: string) {
        if (sql.includes("FROM products")) {
          return {
            get: () => ({
              id: "product-test",
              shelfId: "shelf-test",
              destinationUrl: "https://www.amazon.com/dp/B0TEST",
              creatorAffiliateTag: "creator-demo-20",
            }),
          };
        }
        throw new Error(`Unexpected SQL: ${sql}`);
      },
      exec(sql: string) {
        if (sql === "BEGIN IMMEDIATE TRANSACTION") {
          throw new Error("database is locked");
        }
        throw new Error(`Unexpected exec: ${sql}`);
      },
    } as unknown as DatabaseSync;

    expect(
      resolveAffiliateRedirect(
        { productId: "product-test" },
        {
          database,
          platformTag: "linkshelf-platform-20",
          random: () => 0.8,
          createId: () => "click-test",
          now: () => new Date("2026-06-20T10:00:00.000Z"),
        },
      ),
    ).toEqual({ ok: false, reason: "PERSISTENCE_FAILED" });
  });
});
