import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(path: string): string {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("Amazon integration documentation", () => {
  it("documents PA-API deprecation, Creators API migration, env vars, disclosures, and live limits", () => {
    const docs = readProjectFile("docs/amazon-integration.md");

    expect(docs).toContain("PA-API");
    expect(docs).toContain("2026-05-15");
    expect(docs).toContain("Creators API");
    expect(docs).toContain("AMAZON_INTEGRATION_MODE");
    expect(docs).toContain("AMAZON_CREATORS_API_BASE_URL");
    expect(docs).toContain("AMAZON_CREATORS_API_KEY");
    expect(docs).toContain("Affiliate Disclosure");
    expect(docs).toContain("Live Verification");
  });

  it("documents Amazon environment variables in the example env file", () => {
    const env = readProjectFile(".env.example");

    expect(env).toContain("AMAZON_INTEGRATION_MODE=");
    expect(env).toContain("AMAZON_CREATORS_API_BASE_URL=");
    expect(env).toContain("AMAZON_CREATORS_API_KEY=");
    expect(env).toContain("AMAZON_PARTNER_TAG=");
  });
});
