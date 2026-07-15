import {
  extractAmazonMetadata,
  type ExtractAmazonMetadataOptions,
} from "@/features/amazon/metadata-provider";

export interface ExtractedProductMetadata {
  readonly title: string;
  readonly description: string;
  readonly merchant: string;
  readonly price: number;
  readonly imageUrl: string;
}

export async function extractMetadata(
  productUrl: string,
  options: ExtractAmazonMetadataOptions = {},
): Promise<ExtractedProductMetadata> {
  return extractAmazonMetadata(productUrl, options);
}
