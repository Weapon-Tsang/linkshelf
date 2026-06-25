const AMAZON_HOSTS = new Set([
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
]);

const AFFILIATE_TAG_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/;

export function assertValidAffiliateTag(tag: string): void {
  if (!AFFILIATE_TAG_PATTERN.test(tag)) {
    throw new Error("Invalid affiliate tag");
  }
}

export function rewriteAmazonTag(rawUrl: string, tag: string): string {
  assertValidAffiliateTag(tag);

  let destination: URL;
  try {
    destination = new URL(rawUrl);
  } catch {
    throw new Error("Invalid destination URL");
  }

  if (destination.protocol !== "https:") {
    throw new Error("Amazon destination must use HTTPS");
  }

  if (destination.username !== "" || destination.password !== "") {
    throw new Error("Amazon destination must not include credentials");
  }

  if (destination.port !== "") {
    throw new Error("Amazon destination must not include a nonstandard port");
  }

  if (!AMAZON_HOSTS.has(destination.hostname.toLowerCase())) {
    throw new Error("Unsupported Amazon host");
  }

  destination.searchParams.set("tag", tag);
  return destination.toString();
}
