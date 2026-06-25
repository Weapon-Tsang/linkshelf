import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import { siteConfig } from "@/lib/site-config";
import {
  findAffiliateProduct,
  findAffiliateShare,
  insertClickEvent,
} from "./repository";
import { rewriteAmazonTag } from "./rewrite-amazon-tag";
import type {
  AffiliateFallbackReason,
  AffiliateSelection,
  AffiliateSelectionInput,
} from "./types";

export type AffiliateRedirectFailureReason =
  | "NOT_FOUND"
  | "INVALID_DESTINATION"
  | "PERSISTENCE_FAILED";

export type AffiliateRedirectResult =
  | {
      readonly ok: true;
      readonly clickEventId: string;
      readonly destinationUrl: string;
      readonly beneficiary: AffiliateSelection["beneficiary"];
      readonly affiliateTag: string;
      readonly fallbackReason: AffiliateFallbackReason | null;
    }
  | {
      readonly ok: false;
      readonly reason: AffiliateRedirectFailureReason;
    };

export interface ResolveAffiliateRedirectInput {
  readonly productId: string;
  readonly shareCode?: string | null;
}

export interface ResolveAffiliateRedirectOptions {
  readonly database: DatabaseSync;
  readonly platformTag?: string;
  readonly random?: () => number;
  readonly now?: () => Date;
  readonly createId?: () => string;
}

function normalizeTag(tag: string | null): string | null {
  const trimmed = tag?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeShareCode(shareCode: string | null | undefined): string | null {
  const trimmed = shareCode?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

export function selectAffiliate(
  input: AffiliateSelectionInput,
  random: () => number,
): AffiliateSelection {
  const roll = random();
  if (!Number.isFinite(roll) || roll < 0 || roll >= 1) {
    throw new Error("Affiliate random roll must be finite and inside [0, 1)");
  }

  const platformTag = normalizeTag(input.platformTag);
  if (!platformTag) {
    throw new Error("Platform affiliate tag is required");
  }

  const fanTag = normalizeTag(input.fanTag);
  const creatorTag = normalizeTag(input.creatorTag);

  if (roll < 0.8 && fanTag) {
    return {
      beneficiary: "FAN",
      selectedTag: fanTag,
      roll,
      fallbackReason: null,
    };
  }

  if (roll < 0.8) {
    return {
      beneficiary: "PLATFORM",
      selectedTag: platformTag,
      roll,
      fallbackReason: "MISSING_FAN_TAG",
    };
  }

  if (creatorTag) {
    return {
      beneficiary: "CREATOR",
      selectedTag: creatorTag,
      roll,
      fallbackReason: null,
    };
  }

  return {
    beneficiary: "PLATFORM",
    selectedTag: platformTag,
    roll,
    fallbackReason: "MISSING_CREATOR_TAG",
  };
}

export function resolveAffiliateRedirect(
  input: ResolveAffiliateRedirectInput,
  options: ResolveAffiliateRedirectOptions,
): AffiliateRedirectResult {
  const product = findAffiliateProduct(options.database, input.productId);
  if (!product) {
    return { ok: false, reason: "NOT_FOUND" };
  }

  const shareCode = normalizeShareCode(input.shareCode);
  const share = shareCode
    ? findAffiliateShare(options.database, {
        shelfId: product.shelfId,
        shortCode: shareCode,
      })
    : null;
  const hadInvalidShare = shareCode !== null && share === null;

  const selected = selectAffiliate(
    {
      fanTag: share?.fanAffiliateTag ?? null,
      creatorTag: product.creatorAffiliateTag,
      platformTag: options.platformTag ?? siteConfig.defaultPlatformTag,
    },
    options.random ?? Math.random,
  );
  const fallbackReason: AffiliateFallbackReason | null =
    hadInvalidShare && selected.fallbackReason === "MISSING_FAN_TAG"
      ? "MISSING_SHARE"
      : selected.fallbackReason;

  let destinationUrl: string;
  try {
    destinationUrl = rewriteAmazonTag(product.destinationUrl, selected.selectedTag);
  } catch {
    return { ok: false, reason: "INVALID_DESTINATION" };
  }

  const clickEventId = (options.createId ?? randomUUID)();
  const createdAt = (options.now ?? (() => new Date()))().toISOString();

  options.database.exec("BEGIN IMMEDIATE TRANSACTION");
  try {
    insertClickEvent(options.database, {
      id: clickEventId,
      productId: product.id,
      shelfId: product.shelfId,
      shareId: share?.id ?? null,
      beneficiary: selected.beneficiary,
      affiliateTag: selected.selectedTag,
      destinationUrl,
      fallbackReason,
      createdAt,
    });
    options.database.exec("COMMIT");
  } catch {
    options.database.exec("ROLLBACK");
    return { ok: false, reason: "PERSISTENCE_FAILED" };
  }

  return {
    ok: true,
    clickEventId,
    destinationUrl,
    beneficiary: selected.beneficiary,
    affiliateTag: selected.selectedTag,
    fallbackReason,
  };
}
