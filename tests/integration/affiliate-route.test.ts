import type { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createAffiliateRouteHandler } from "@/app/api/out/[productId]/route";
import { createDatabase } from "@/lib/db/client";
import { migrate } from "@/lib/db/migrate";
import { seed } from "@/lib/db/seed";

interface ClickEventRow {
  readonly product_id: string;
  readonly shelf_id: string;
  readonly share_id: string | null;
  readonly beneficiary: string;
  readonly affiliate_tag: string;
  readonly destination_url: string;
  readonly fallback_reason: string | null;
}

describe("affiliate redirect route", () => {
  let database: DatabaseSync;

  beforeEach(() => {
    database = createDatabase(":memory:");
    migrate(database);
    seed(database, { publicRoot: "/definitely/missing" });
  });

  afterEach(() => {
    database.close();
  });

  function handler(options: {
    readonly random?: () => number;
    readonly createId?: () => string;
  } = {}) {
    return createAffiliateRouteHandler({
      database,
      random: options.random ?? (() => 0.1),
      createId: options.createId ?? (() => "click-test"),
      now: () => new Date("2026-06-20T10:00:00.000Z"),
    });
  }

  async function requestProduct(
    productId: string,
    search = "",
    options?: {
      readonly random?: () => number;
      readonly createId?: () => string;
    },
  ) {
    const GET = handler(options);
    return GET(new Request(`https://linkshelf.local/api/out/${productId}${search}`), {
      params: { productId },
    });
  }

  function clickEvent(id = "click-test"): ClickEventRow | null {
    return (database
      .prepare(
        `SELECT product_id, shelf_id, share_id, beneficiary, affiliate_tag, destination_url,
                fallback_reason
         FROM click_events
         WHERE id = ?`,
      )
      .get(id) ?? null) as ClickEventRow | null;
  }

  it("302 redirects through the fan affiliate tag and records a click event", async () => {
    const response = await requestProduct("product-sony-a7iv", "?share=jamie-photo", {
      random: () => 0.42,
    });

    expect(response.status).toBe(302);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("location")).toBe(
      "https://www.amazon.com/dp/B09JZT6YK5?tag=fan-demo-20",
    );
    expect(clickEvent()).toEqual({
      product_id: "product-sony-a7iv",
      shelf_id: "shelf-photography",
      share_id: "share-jamie-photography",
      beneficiary: "FAN",
      affiliate_tag: "fan-demo-20",
      destination_url: "https://www.amazon.com/dp/B09JZT6YK5?tag=fan-demo-20",
      fallback_reason: null,
    });
  });

  it("uses the creator affiliate tag at the 80 percent boundary for direct clicks", async () => {
    const response = await requestProduct("product-sony-lens", "", {
      random: () => 0.8,
    });

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe(
      "https://www.amazon.com/dp/B0B1TQZ99S?tag=liamcreator-20",
    );
    expect(clickEvent()).toMatchObject({
      product_id: "product-sony-lens",
      share_id: null,
      beneficiary: "CREATOR",
      affiliate_tag: "liamcreator-20",
      fallback_reason: null,
    });
  });

  it("treats a cross-shelf share code as invalid and falls back to the platform tag", async () => {
    const response = await requestProduct("product-headphones", "?share=jamie-photo", {
      random: () => 0.2,
    });

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe(
      "https://www.amazon.com/dp/B09XS7JWHH?tag=linkshelf-platform-20",
    );
    expect(clickEvent()).toMatchObject({
      product_id: "product-headphones",
      shelf_id: "shelf-travel",
      share_id: null,
      beneficiary: "PLATFORM",
      affiliate_tag: "linkshelf-platform-20",
      fallback_reason: "MISSING_SHARE",
    });
  });

  it("returns 404 for missing products and products on unpublished shelves", async () => {
    await expect(requestProduct("missing-product")).resolves.toMatchObject({
      status: 404,
    });
    await expect(requestProduct("product-keychron")).resolves.toMatchObject({
      status: 404,
    });
  });

  it("returns 400 for unsafe destination URLs without recording a click", async () => {
    database
      .prepare("UPDATE products SET destination_url = ? WHERE id = ?")
      .run("https://example.com/not-amazon", "product-sony-a7iv");

    const response = await requestProduct("product-sony-a7iv", "?share=jamie-photo");

    expect(response.status).toBe(400);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(clickEvent()).toBeNull();
  });

  it("returns 503 when click persistence fails and does not redirect", async () => {
    const before = database
      .prepare("SELECT COUNT(*) AS count FROM click_events")
      .get() as { count: number };

    const response = await requestProduct("product-sony-a7iv", "?share=jamie-photo", {
      createId: () => "click-fan",
    });

    const after = database
      .prepare("SELECT COUNT(*) AS count FROM click_events")
      .get() as { count: number };

    expect(response.status).toBe(503);
    expect(response.headers.get("location")).toBeNull();
    expect(after.count).toBe(before.count);
  });
});
