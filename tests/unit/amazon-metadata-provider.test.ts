import { describe, expect, it } from "vitest";
import { extractAmazonMetadata } from "@/features/amazon/metadata-provider";

describe("Amazon metadata provider", () => {
  it("extracts deterministic fixture metadata outside production", async () => {
    await expect(
      extractAmazonMetadata("https://www.amazon.com/dp/B0CAMERA", {
        environment: { NODE_ENV: "development" },
      }),
    ).resolves.toMatchObject({
      title: "Sony A7IV Mirrorless Camera",
      merchant: "Amazon",
      price: 2498,
      asin: "B0CAMERA",
      provider: "fixtures",
    });
  });

  it("disables metadata extraction in production unless a future live provider is configured", async () => {
    await expect(
      extractAmazonMetadata("https://www.amazon.com/dp/B0CAMERA", {
        environment: { NODE_ENV: "production" },
      }),
    ).rejects.toThrow(/Amazon metadata extraction is disabled/i);
  });

  it("rejects unsupported hosts and unknown fixture ASINs", async () => {
    await expect(
      extractAmazonMetadata("https://example.com/dp/B0CAMERA", {
        environment: { NODE_ENV: "development" },
      }),
    ).rejects.toThrow(/Unsupported Amazon product host/i);

    await expect(
      extractAmazonMetadata("https://www.amazon.com/dp/B0UNKNOWN", {
        environment: { NODE_ENV: "development" },
      }),
    ).rejects.toThrow(/Unsupported Amazon product fixture/i);
  });
});
