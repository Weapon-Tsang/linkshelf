import { STITCH_ASSET_SOURCES } from "@/lib/db/seed";
import {
  resolveAmazonIntegrationConfig,
  type AmazonIntegrationEnvironment,
} from "./config";

export interface ExtractedProductMetadata {
  readonly title: string;
  readonly description: string;
  readonly merchant: string;
  readonly price: number;
  readonly imageUrl: string;
}

export interface AmazonProductMetadata extends ExtractedProductMetadata {
  readonly asin: string;
  readonly provider: "fixtures";
}

export interface ExtractAmazonMetadataOptions {
  readonly environment?: AmazonIntegrationEnvironment;
}

const amazonFixtures: Record<string, ExtractedProductMetadata> = {
  B0CAMERA: {
    title: "Sony A7IV Mirrorless Camera",
    description: "A versatile full-frame hybrid camera with reliable autofocus.",
    merchant: "Amazon",
    price: 2498,
    imageUrl: STITCH_ASSET_SOURCES.productSonyA7iv,
  },
  B0LENS: {
    title: "Sony FE 24-70mm f/2.8 GM II",
    description: "A fast standard zoom for portraits, travel, and events.",
    merchant: "Amazon",
    price: 2298,
    imageUrl: STITCH_ASSET_SOURCES.productSonyLens,
  },
  B0TRIPOD: {
    title: "Peak Design Carbon Tripod",
    description: "A compact carbon travel tripod with a fast setup.",
    merchant: "Amazon",
    price: 649.95,
    imageUrl: STITCH_ASSET_SOURCES.productPeakTripod,
  },
};

function parseAmazonUrl(productUrl: string): URL {
  try {
    return new URL(productUrl);
  } catch {
    throw new Error("Unsupported product URL");
  }
}

function extractAmazonAsin(url: URL): string | null {
  const match = url.pathname.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{6,16})/i);
  return match?.[1]?.toUpperCase() ?? null;
}

function isAmazonHost(hostname: string): boolean {
  return hostname === "amazon.com" || hostname === "www.amazon.com";
}

export async function extractAmazonMetadata(
  productUrl: string,
  options: ExtractAmazonMetadataOptions = {},
): Promise<AmazonProductMetadata> {
  const config = resolveAmazonIntegrationConfig(options.environment);
  if (config.mode === "disabled") {
    throw new Error("Amazon metadata extraction is disabled");
  }
  if (config.mode === "creators-api") {
    throw new Error(
      "Amazon Creators API metadata extraction is not implemented until official request and response documentation is available in this workspace",
    );
  }

  const url = parseAmazonUrl(productUrl);
  if (!isAmazonHost(url.hostname)) {
    throw new Error(`Unsupported Amazon product host: ${url.hostname}`);
  }

  const asin = extractAmazonAsin(url);
  const fixture = asin ? amazonFixtures[asin] : undefined;
  if (!asin || !fixture) {
    throw new Error("Unsupported Amazon product fixture");
  }

  return {
    ...fixture,
    asin,
    provider: "fixtures",
  };
}
