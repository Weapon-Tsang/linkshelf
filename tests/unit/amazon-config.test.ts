import { describe, expect, it } from "vitest";
import { resolveAmazonIntegrationConfig } from "@/features/amazon/config";

describe("Amazon integration config", () => {
  it("defaults to fixtures outside production and disabled in production", () => {
    expect(resolveAmazonIntegrationConfig({ NODE_ENV: "development" })).toEqual({
      mode: "fixtures",
      partnerTag: null,
    });

    expect(resolveAmazonIntegrationConfig({ NODE_ENV: "production" })).toEqual({
      mode: "disabled",
      partnerTag: null,
    });
  });

  it("rejects deprecated PA-API mode", () => {
    expect(() =>
      resolveAmazonIntegrationConfig({
        NODE_ENV: "production",
        AMAZON_INTEGRATION_MODE: "pa-api",
      }),
    ).toThrow(/PA-API.*deprecated.*2026-05-15/i);
  });

  it("requires Creators API HTTPS base URL and API key", () => {
    expect(() =>
      resolveAmazonIntegrationConfig({
        NODE_ENV: "production",
        AMAZON_INTEGRATION_MODE: "creators-api",
      }),
    ).toThrow(/AMAZON_CREATORS_API_BASE_URL/i);

    expect(() =>
      resolveAmazonIntegrationConfig({
        NODE_ENV: "production",
        AMAZON_INTEGRATION_MODE: "creators-api",
        AMAZON_CREATORS_API_BASE_URL: "http://creators-api.example.test",
        AMAZON_CREATORS_API_KEY: "secret",
      }),
    ).toThrow(/HTTPS/i);

    expect(
      resolveAmazonIntegrationConfig({
        NODE_ENV: "production",
        AMAZON_INTEGRATION_MODE: "creators-api",
        AMAZON_CREATORS_API_BASE_URL: "https://creators-api.example.test/",
        AMAZON_CREATORS_API_KEY: "secret",
        AMAZON_PARTNER_TAG: "linkshelf-20",
      }),
    ).toEqual({
      mode: "creators-api",
      baseUrl: "https://creators-api.example.test",
      apiKey: "secret",
      partnerTag: "linkshelf-20",
    });
  });
});
