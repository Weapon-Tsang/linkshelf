import stitchAssetManifest from "../../public/stitch/asset-manifest.json";

type FanHubCardKind = "saved" | "shared";

const stitchAssets = stitchAssetManifest as Record<string, string>;

export const FAN_HUB_CARD_IMAGE_SOURCES = {
  savedDreamHome:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBn3XW_-dxJS-aj2sfTiFf4wknCIdo6jYnLu-MZV0-8PDQE-CxxLkhQxjQ5F2MNkByEi5viZ1wRTNPdXxpdu3qobjKpnu-whGbOoC6SOFiNlv_WiRTiHYL8ML85VZ2xcJhKmw09PB3oGDnjv0g2aGKoY5I6MFGndk8NUFc4Vk-afwAt6yCxaXrGp-PrxJPiKOzcyEYtAcV0tyDhqSToVuZ0q4q0kfAru6LLQRloHosztB2_3lFIsUfi7D4C-PaJ49_5YbwKlWoZxtQ",
  savedOutdoor:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCJZPAUG0W1xXyc-vRnkwf6ci5qupRSRn0Uu9weM0gO-GF0XqNYVpcfvqtjZjR4hbR7TIZAHf8L8M3_EWlu41lj2CNW8tdvdZUzb8rrpcqHDH1zbCA_tS2zrap6jXMoTCiFUzpno9ZGx-Qc_ZY39JY74H2211PG4uXU8iMb4OzKw_W3leBFIt1_qzwxCoUFp2xjA9RhbZyz4l9RX8cuqFCgo_KrJ6CulDk2NlJhjyjBnFWYabgD5dmMfElRjdtRLBPJVq3xZmf4ncM",
  sharedMinimalist:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDDvrAb2jD7VtsS147Vz1lwCSzKfiIX4WS48D-2qIrME2AAWlItEeJkDPwnebAS1_qf6nESgiineyZvbnbp39Yl-tCZLVyHibLCg3v_GdirMDlZDMN-HplLqFDm5VO0jLu1-kHIwmPiNrowEPiyGYH0Rcj9r8f1RppmCplamJdAYlkhIykkgGT7z73wMtQ58Vwrp59SGnpgbKUUJKSIv0CL9lfIFzTju1F626GPsgU_KEYeCD7AhhtW3UYOOGdGd4B54ISdO8HKs18",
  sharedReading:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuD3tAE6Afh6YCI1v-kTFvmG4XgggVJOodV3egaa_Osw8yUYzxT3VF2TT9to3DtSYIihWYwxQaZRmDGIt4tgUc_e9K6kUjKp0ApqHECA3pd2HIdkF5QetTQEHG5sStS8Xx3tMJ4V_xE3NquVPCacuMWgZ3DyfAUxCEa-N6uMmDsnCDmTwZmHuGmF7Gx2REwvq33jk9OpJZvQWcjNyNPaDXkhVTknS4kmBtaNnED3S_1FrzQlC8hPRHZT4ez64EtV9IAsL62e2nFmVHk",
} as const;

const fallbackCardImages: Record<FanHubCardKind, readonly string[]> = {
  saved: [
    localizedStitchAsset(FAN_HUB_CARD_IMAGE_SOURCES.savedOutdoor),
    localizedStitchAsset(FAN_HUB_CARD_IMAGE_SOURCES.savedDreamHome),
  ],
  shared: [
    localizedStitchAsset(FAN_HUB_CARD_IMAGE_SOURCES.sharedMinimalist),
    localizedStitchAsset(FAN_HUB_CARD_IMAGE_SOURCES.sharedReading),
  ],
};

function localizedStitchAsset(sourceUrl: string) {
  return stitchAssets[sourceUrl] ?? sourceUrl;
}

export function resolveFanHubCardImage(
  sourceUrl: string | null | undefined,
  kind: FanHubCardKind,
  index: number,
) {
  const normalizedSource = sourceUrl?.trim();
  if (normalizedSource) {
    return localizedStitchAsset(normalizedSource);
  }

  const fallbacks = fallbackCardImages[kind];
  return fallbacks[index % fallbacks.length];
}
