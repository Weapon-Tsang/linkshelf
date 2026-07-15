export type AmazonIntegrationMode = "fixtures" | "disabled" | "creators-api";

export interface AmazonIntegrationEnvironment {
  readonly NODE_ENV?: string;
  readonly AMAZON_INTEGRATION_MODE?: string;
  readonly AMAZON_CREATORS_API_BASE_URL?: string;
  readonly AMAZON_CREATORS_API_KEY?: string;
  readonly AMAZON_PARTNER_TAG?: string;
}

export type AmazonIntegrationConfig =
  | {
      readonly mode: "fixtures" | "disabled";
      readonly partnerTag: string | null;
    }
  | {
      readonly mode: "creators-api";
      readonly baseUrl: string;
      readonly apiKey: string;
      readonly partnerTag: string | null;
    };

function normalizeOptional(value: string | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed || null;
}

function defaultMode(environment: AmazonIntegrationEnvironment): AmazonIntegrationMode {
  return environment.NODE_ENV === "production" ? "disabled" : "fixtures";
}

function normalizeMode(
  value: string | undefined,
  environment: AmazonIntegrationEnvironment,
): AmazonIntegrationMode {
  const mode = normalizeOptional(value)?.toLowerCase() ?? defaultMode(environment);
  if (mode === "fixtures" || mode === "disabled" || mode === "creators-api") {
    return mode;
  }
  if (mode === "pa-api" || mode === "paapi" || mode === "product-advertising-api") {
    throw new Error(
      "Amazon PA-API mode is not supported because PA-API was deprecated on 2026-05-15; use Creators API migration settings instead.",
    );
  }
  throw new Error(`Unsupported Amazon integration mode: ${mode}`);
}

function normalizeHttpsBaseUrl(value: string | undefined): string {
  const trimmed = normalizeOptional(value);
  if (!trimmed) {
    throw new Error("AMAZON_CREATORS_API_BASE_URL is required for creators-api mode");
  }

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new Error("AMAZON_CREATORS_API_BASE_URL must be a valid HTTPS URL");
  }
  if (url.protocol !== "https:") {
    throw new Error("AMAZON_CREATORS_API_BASE_URL must use HTTPS");
  }
  url.pathname = url.pathname.replace(/\/+$/, "");
  url.search = "";
  url.hash = "";
  return url.toString().replace(/\/$/, "");
}

export function resolveAmazonIntegrationConfig(
  environment: AmazonIntegrationEnvironment = process.env,
): AmazonIntegrationConfig {
  const mode = normalizeMode(environment.AMAZON_INTEGRATION_MODE, environment);
  const partnerTag = normalizeOptional(environment.AMAZON_PARTNER_TAG);

  if (mode !== "creators-api") {
    return { mode, partnerTag };
  }

  const baseUrl = normalizeHttpsBaseUrl(environment.AMAZON_CREATORS_API_BASE_URL);
  const apiKey = normalizeOptional(environment.AMAZON_CREATORS_API_KEY);
  if (!apiKey) {
    throw new Error("AMAZON_CREATORS_API_KEY is required for creators-api mode");
  }

  return {
    mode,
    baseUrl,
    apiKey,
    partnerTag,
  };
}
