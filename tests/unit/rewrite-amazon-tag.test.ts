import { describe, expect, it } from "vitest";
import { rewriteAmazonTag } from "@/features/affiliate/rewrite-amazon-tag";

describe("rewriteAmazonTag", () => {
  it("replaces tag and preserves other query parameters", () => {
    expect(
      rewriteAmazonTag(
        "https://www.amazon.com/dp/B0TEST?tag=old-20&th=1",
        "fan-demo-20",
      ),
    ).toBe("https://www.amazon.com/dp/B0TEST?tag=fan-demo-20&th=1");
  });

  it("rejects non-Amazon destinations", () => {
    expect(() =>
      rewriteAmazonTag("https://example.com/item", "fan-demo-20"),
    ).toThrow("Unsupported Amazon host");
  });

  it.each([
    "amazon.com",
    "www.amazon.com",
    "smile.amazon.com",
    "www.amazon.co.uk",
    "www.amazon.ca",
    "www.amazon.de",
    "www.amazon.fr",
    "www.amazon.it",
    "www.amazon.es",
    "www.amazon.co.jp",
    "www.amazon.com.au",
  ])("accepts the exact supported retail host %s", (host) => {
    expect(rewriteAmazonTag(`https://${host}/dp/B0TEST`, "fan-demo-20")).toBe(
      `https://${host}/dp/B0TEST?tag=fan-demo-20`,
    );
  });

  it("normalizes hostname case while preserving path and fragment", () => {
    expect(
      rewriteAmazonTag("https://WWW.AMAZON.COM/dp/B0TEST#reviews", "fan-demo-20"),
    ).toBe("https://www.amazon.com/dp/B0TEST?tag=fan-demo-20#reviews");
  });

  it("removes duplicate tag parameters and preserves every other query parameter", () => {
    expect(
      rewriteAmazonTag(
        "https://amazon.com/dp/B0TEST?tag=old-20&th=1&tag=evil-20&psc=1",
        "fan-demo-20",
      ),
    ).toBe("https://amazon.com/dp/B0TEST?tag=fan-demo-20&th=1&psc=1");
  });

  it.each([
    ["plaintext protocol", "http://www.amazon.com/dp/B0TEST"],
    ["embedded credentials", "https://user:pass@www.amazon.com/dp/B0TEST"],
    ["nonstandard port", "https://www.amazon.com:444/dp/B0TEST"],
    ["suffix trick", "https://amazon.com.evil/dp/B0TEST"],
    ["prefix trick", "https://evilamazon.com/dp/B0TEST"],
    ["malformed URL", "not a url"],
  ])("rejects %s", (_caseName, rawUrl) => {
    expect(() => rewriteAmazonTag(rawUrl, "fan-demo-20")).toThrow();
  });

  it.each(["", "   ", "fan demo 20", "fan?demo=20", "fan\ndemo-20"]) (
    "rejects unsafe affiliate tag %j",
    (unsafeTag) => {
      expect(() => rewriteAmazonTag("https://www.amazon.com/dp/B0TEST", unsafeTag)).toThrow(
        "Invalid affiliate tag",
      );
    },
  );
});
