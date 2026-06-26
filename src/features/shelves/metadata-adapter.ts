import { STITCH_ASSET_SOURCES } from "@/lib/db/seed";

export interface ExtractedProductMetadata {
  readonly title: string;
  readonly description: string;
  readonly merchant: string;
  readonly price: number;
  readonly imageUrl: string;
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

function extractAmazonAsin(url: URL): string | null {
  const match = url.pathname.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{6,16})/i);
  return match?.[1]?.toUpperCase() ?? null;
}

function isAmazonHost(hostname: string): boolean {
  return hostname === "amazon.com" || hostname === "www.amazon.com";
}

export async function extractMetadata(
  productUrl: string,
): Promise<ExtractedProductMetadata> {
  let url: URL;
  try {
    url = new URL(productUrl);
  } catch {
    throw new Error("Unsupported product URL");
  }

  if (!isAmazonHost(url.hostname)) {
    throw new Error(`Unsupported product host: ${url.hostname}`);
  }

  const asin = extractAmazonAsin(url);
  const fixture = asin ? amazonFixtures[asin] : undefined;
  if (!fixture) {
    throw new Error("Unsupported Amazon product fixture");
  }

  return fixture;
}
