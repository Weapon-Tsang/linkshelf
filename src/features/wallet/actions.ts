import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import type { AuthSession } from "@/features/auth/adapter";
import {
  insertWithdrawal,
  PLATFORM_AFFILIATE_TAG,
  readFanAffiliateTag,
  readFanShares,
  readSavedShelves,
  readWalletEntries,
  readWithdrawalHoldCents,
  updateFanAffiliateTag,
  type SavedShelfSummary,
  type ShareSummary,
  type WalletEntry,
} from "./repository";

type WalletFailureReason =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "INVALID_INPUT"
  | "INSUFFICIENT_FUNDS";

export type WalletActionResult<T extends object = object> =
  | ({ readonly ok: true } & T)
  | {
      readonly ok: false;
      readonly reason: WalletFailureReason;
    };

export interface WalletSummary {
  readonly availableCents: number;
  readonly pendingCents: number;
  readonly lifetimeCents: number;
  readonly affiliateTag: string;
  readonly entries: readonly WalletEntry[];
  readonly shares: readonly ShareSummary[];
  readonly savedShelves: readonly SavedShelfSummary[];
}

export interface WalletActionOptions {
  readonly createId?: () => string;
  readonly now?: () => Date;
}

function requireFan(
  session: AuthSession | null,
): WalletActionResult<{ readonly userId: string }> {
  if (!session) return { ok: false, reason: "UNAUTHENTICATED" };
  if (session.user.role !== "FAN") return { ok: false, reason: "FORBIDDEN" };
  return { ok: true, userId: session.user.id };
}

function normalizeAffiliateTag(value: string) {
  const trimmed = value.trim();
  return trimmed || null;
}

function validateAffiliateTag(value: string | null) {
  return value === null || /^[a-z0-9][a-z0-9._-]{2,99}$/i.test(value);
}

function clearedCents(entries: readonly WalletEntry[]) {
  return entries
    .filter((entry) => entry.status === "CLEARED")
    .reduce((sum, entry) => sum + entry.amountCents, 0);
}

function pendingCents(entries: readonly WalletEntry[]) {
  return entries
    .filter((entry) => entry.status === "PENDING")
    .reduce((sum, entry) => sum + entry.amountCents, 0);
}

function csvCell(value: string) {
  return /[",\n\r]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

function formatCsvAmount(cents: number) {
  return (cents / 100).toFixed(2);
}

export function getFanTrackingTag(
  database: DatabaseSync,
  session: AuthSession | null,
): WalletActionResult<{
  readonly affiliateTag: string;
  readonly fallback: boolean;
}> {
  const fan = requireFan(session);
  if (!fan.ok) return fan;
  const affiliateTag = readFanAffiliateTag(database, fan.userId);
  return affiliateTag
    ? { ok: true, affiliateTag, fallback: false }
    : { ok: true, affiliateTag: PLATFORM_AFFILIATE_TAG, fallback: true };
}

export function saveFanTrackingId(
  database: DatabaseSync,
  input: {
    readonly affiliateTag: string;
  },
  session: AuthSession | null,
  options: WalletActionOptions = {},
): WalletActionResult {
  const fan = requireFan(session);
  if (!fan.ok) return fan;
  const affiliateTag = normalizeAffiliateTag(input.affiliateTag);
  if (!validateAffiliateTag(affiliateTag)) {
    return { ok: false, reason: "INVALID_INPUT" };
  }

  updateFanAffiliateTag(database, {
    userId: fan.userId,
    affiliateTag,
    updatedAt: (options.now ?? (() => new Date()))().toISOString(),
  });
  return { ok: true };
}

export function getWalletSummary(
  database: DatabaseSync,
  session: AuthSession | null,
): WalletActionResult<WalletSummary> {
  const fan = requireFan(session);
  if (!fan.ok) return fan;
  const entries = readWalletEntries(database, fan.userId);
  const holdCents = readWithdrawalHoldCents(database, fan.userId);
  const tag = getFanTrackingTag(database, session);
  if (!tag.ok) return tag;

  return {
    ok: true,
    availableCents: Math.max(0, clearedCents(entries) - holdCents),
    pendingCents: pendingCents(entries),
    lifetimeCents: entries.reduce((sum, entry) => sum + entry.amountCents, 0),
    affiliateTag: tag.affiliateTag,
    entries,
    shares: readFanShares(database, fan.userId),
    savedShelves: readSavedShelves(database, fan.userId),
  };
}

export function requestWithdrawal(
  database: DatabaseSync,
  input: {
    readonly amountCents: number;
    readonly destinationLabel: string;
  },
  session: AuthSession | null,
  options: WalletActionOptions = {},
): WalletActionResult<{ readonly withdrawalId: string }> {
  const fan = requireFan(session);
  if (!fan.ok) return fan;
  const amountCents = Math.round(input.amountCents);
  const destinationLabel = input.destinationLabel.trim();
  if (amountCents <= 0 || !destinationLabel) {
    return { ok: false, reason: "INVALID_INPUT" };
  }

  const entries = readWalletEntries(database, fan.userId);
  const availableCents = clearedCents(entries) - readWithdrawalHoldCents(database, fan.userId);
  if (amountCents > availableCents) {
    return { ok: false, reason: "INSUFFICIENT_FUNDS" };
  }

  const withdrawalId = options.createId?.() ?? `withdrawal-${randomUUID()}`;
  insertWithdrawal(database, {
    id: withdrawalId,
    userId: fan.userId,
    amountCents,
    destinationLabel,
    createdAt: (options.now ?? (() => new Date()))().toISOString(),
  });
  return { ok: true, withdrawalId };
}

export function exportWalletCsv(
  database: DatabaseSync,
  session: AuthSession | null,
): WalletActionResult<{ readonly csv: string }> {
  const fan = requireFan(session);
  if (!fan.ok) return fan;
  const rows = readWalletEntries(database, fan.userId).map((entry) =>
    [
      entry.createdAt,
      csvCell(entry.description),
      entry.type,
      formatCsvAmount(entry.amountCents),
    ].join(","),
  );
  return {
    ok: true,
    csv: ["date,source,type,amount", ...rows].join("\n"),
  };
}
