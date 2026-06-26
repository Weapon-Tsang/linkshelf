import { describe, expect, it } from "vitest";
import { extractMetadata } from "@/features/shelves/metadata-adapter";

describe("extractMetadata", () => {
  it("returns deterministic camera metadata for an Amazon camera URL", async () => {
    await expect(extractMetadata("https://www.amazon.com/dp/B0CAMERA")).resolves.toMatchObject({
      title: "Sony A7IV Mirrorless Camera",
      merchant: "Amazon",
      price: 2498,
    });
  });

  it("normalizes Amazon URLs and rejects unsupported hosts", async () => {
    await expect(
      extractMetadata("https://amazon.com/gp/product/B0LENS?tag=old-tag-20"),
    ).resolves.toMatchObject({
      title: "Sony FE 24-70mm f/2.8 GM II",
      merchant: "Amazon",
      price: 2298,
    });

    await expect(extractMetadata("https://example.com/product")).rejects.toThrow(
      /unsupported/i,
    );
  });
});
