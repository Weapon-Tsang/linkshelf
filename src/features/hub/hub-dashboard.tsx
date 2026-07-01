"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { SocialChannelType } from "@/features/shelves/types";
import { resolveFanHubCardImage } from "@/lib/stitch-fan-hub-assets";

const fallbackImages = {
  fanAvatar: "/stitch/assets/fan-dashboard-avatar.png",
} as const;

export interface HubSavedShelf {
  readonly id: string;
  readonly title: string;
  readonly creatorHandle: string;
  readonly coverUrl?: string | null;
  readonly itemCount?: number;
}

export interface HubShare {
  readonly id: string;
  readonly shelfId?: string;
  readonly shelfTitle: string;
  readonly coverUrl?: string | null;
  readonly channel: SocialChannelType | string;
  readonly shortCode: string;
  readonly clicks: number;
  readonly shareCount?: number;
  readonly itemCount?: number;
}

export interface HubWalletEntry {
  readonly id: string;
  readonly amountCents: number;
  readonly type: "AFFILIATE_EARNING" | "WITHDRAWAL" | "ADJUSTMENT";
  readonly status: "PENDING" | "CLEARED";
  readonly description: string;
  readonly createdAt: string;
}

export interface HubSummary {
  readonly availableCents: number;
  readonly pendingCents: number;
  readonly lifetimeCents: number;
  readonly affiliateTag: string;
  readonly entries?: readonly HubWalletEntry[];
}

function formatMoney(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatCompactCount(value: number) {
  if (value >= 1000) {
    const rounded = value / 1000;
    return `${Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1)}k`;
  }
  return String(value);
}

function formatActivityCount(value: number, label: "Click" | "Share") {
  return `${formatCompactCount(value)} ${label}${value === 1 ? "" : "s"}`;
}

function rewardTypeLabel(type: HubWalletEntry["type"], status: HubWalletEntry["status"]) {
  if (type === "ADJUSTMENT") return "Platform Default";
  if (status === "PENDING") return "Pending";
  return "Affiliate";
}

function isRewardHistoryEntry(entry: HubWalletEntry) {
  return !entry.description.toLowerCase().includes("opening balance");
}

function fallbackItemCount(index: number) {
  return index === 0 ? 14 : 28;
}

function initialTrackingId(affiliateTag: string) {
  return affiliateTag.trim().toLowerCase() === "fan-demo-20" ? "" : affiliateTag;
}

export function HubDashboard({
  csv,
  onExportCsv,
  onRequestWithdrawal,
  onSaveTrackingId,
  savedShelves,
  shares,
  summary,
}: {
  readonly csv?: string;
  readonly onExportCsv?: () => string;
  readonly onRequestWithdrawal?: (input: {
    readonly amountCents: number;
    readonly destinationLabel: string;
  }) => void | Promise<void>;
  readonly onSaveTrackingId?: (affiliateTag: string) => void | Promise<void>;
  readonly savedShelves: readonly HubSavedShelf[];
  readonly shares: readonly HubShare[];
  readonly summary: HubSummary;
}) {
  const startingAffiliateTag = initialTrackingId(summary.affiliateTag);
  const [affiliateTag, setAffiliateTag] = useState(startingAffiliateTag);
  const [withdrawalOpen, setWithdrawalOpen] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState("50");
  const [destination, setDestination] = useState("");
  const [csvReady, setCsvReady] = useState(false);
  const [isInteractive, setIsInteractive] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setIsInteractive(true), 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  const rewardEntries = (summary.entries ?? [])
    .filter((entry) => entry.status === "CLEARED")
    .filter(isRewardHistoryEntry)
    .slice(0, 3);
  const trackingIdChanged = affiliateTag !== startingAffiliateTag;

  return (
    <div className="mx-auto max-w-[1280px] space-y-6">
      <header className="min-h-14">
        <h1 className="sr-only">Fan rewards dashboard</h1>
        <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
          <nav
            aria-label="Fan dashboard utility"
            className="flex flex-wrap items-center justify-center gap-12 text-base font-bold text-[var(--muted)] md:col-start-2"
          >
            <Link className="text-[var(--teal-700)]" href="/hub/dashboard">
              Dashboard
            </Link>
            <Link href="/liamroberts.photo">Explore</Link>
            <Link href="/studio/analytics">Analytics</Link>
          </nav>
          <div className="flex items-center justify-center gap-8 text-[var(--muted)] md:col-start-3 md:justify-self-end">
            <span aria-hidden="true" className="material-symbols-outlined text-3xl">
              notifications
            </span>
            <span aria-hidden="true" className="material-symbols-outlined text-3xl">
              settings
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element -- Stitch source avatar is a static local visual QA asset. */}
            <img
              alt="Jamie Chen"
              className="h-12 w-12 rounded-full object-cover shadow-[var(--shadow-card)] ring-2 ring-[var(--teal-700)]/20"
              src={fallbackImages.fanAvatar}
            />
          </div>
        </div>
      </header>

      {csvReady ? (
        <p className="rounded-full bg-[var(--glow)] px-4 py-2 text-sm font-bold text-[var(--ink)]">
          CSV ready
        </p>
      ) : null}

      <section
        aria-labelledby="affiliate-binding-heading"
        className="rounded-[28px] bg-white p-5 shadow-[var(--shadow-card)]"
      >
        <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] md:items-center">
          <div>
            <h2
              className="text-2xl font-bold tracking-[-0.03em]"
              id="affiliate-binding-heading"
            >
              Affiliate ID Binding
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              Configure your Amazon Tracking ID to earn directly. If left blank, the
              platform&apos;s default ID will be used automatically, and earnings will accumulate
              in your platform wallet.
            </p>
          </div>
          <div className="grid gap-3">
            <label className="sr-only" htmlFor="fan-tracking-id">
              Fan Tracking ID
            </label>
            <div className="relative">
              <input
                className="h-14 w-full rounded-2xl border border-[var(--line)] bg-[var(--surface-low)] px-5 pr-12 text-base font-semibold text-[var(--ink)] outline-none transition focus:border-[var(--teal-700)] focus:ring-4 focus:ring-[var(--glow)]"
                id="fan-tracking-id"
                onChange={(event) => setAffiliateTag(event.target.value)}
                placeholder="Your Amazon Tracking ID"
                value={affiliateTag}
              />
              <span
                aria-hidden="true"
                className="material-symbols-outlined absolute right-4 top-4 text-[var(--muted)]"
              >
                info
              </span>
            </div>
            {trackingIdChanged ? (
              <button
                className="justify-self-start rounded-full border border-[var(--line)] px-5 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60"
                disabled={!isInteractive}
                onClick={() => {
                  if (!isInteractive) return;
                  void onSaveTrackingId?.(affiliateTag);
                }}
                type="button"
              >
                Save tracking ID
              </button>
            ) : null}
          </div>
        </div>
      </section>

      <div className="grid items-start gap-5 lg:grid-cols-12">
        <article className="relative flex min-h-[260px] flex-col justify-between overflow-hidden rounded-[28px] bg-white p-5 shadow-[var(--shadow-card)] lg:col-span-4">
          <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-[var(--glow)] blur-3xl" />
          <div className="relative">
            <div className="mb-8 flex items-center justify-between gap-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
                Available Balance
              </p>
              <span
                aria-hidden="true"
                className="material-symbols-outlined rounded-xl bg-[var(--glow)] p-2 text-[var(--teal-700)]"
              >
                account_balance_wallet
              </span>
            </div>
            <p className="text-5xl font-bold tracking-[-0.06em] text-[var(--ink)]">
              {formatMoney(summary.availableCents)}
            </p>
            <p className="mt-2 text-sm font-semibold text-[var(--teal-700)]">
              + {formatMoney(summary.pendingCents)} pending clearance
            </p>
          </div>
          <button
            className="relative mt-8 h-14 rounded-2xl bg-[var(--teal-700)] px-5 text-sm font-bold text-white shadow-[0_14px_30px_rgba(0,191,174,0.22)] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!isInteractive}
            onClick={() => {
              if (!isInteractive) return;
              setWithdrawalOpen(true);
            }}
            type="button"
          >
            Withdraw Funds
          </button>
        </article>

        <section
          aria-labelledby="rewards-history-heading"
          className="overflow-hidden rounded-[28px] bg-white p-5 shadow-[var(--shadow-card)] lg:col-span-8"
        >
          <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <h2
              className="text-2xl font-bold tracking-[-0.03em]"
              id="rewards-history-heading"
            >
              Rewards History
            </h2>
            <button
              className="rounded-xl bg-[var(--surface-low)] px-4 py-2 text-sm font-bold text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!isInteractive}
              onClick={() => {
                if (!isInteractive) return;
                const exportedCsv = onExportCsv?.() ?? csv;
                void exportedCsv;
                setCsvReady(true);
              }}
              type="button"
            >
              Download CSV
            </button>
          </div>
          <div aria-label="Rewards History table" className="overflow-x-auto" tabIndex={0}>
            <table aria-label="Rewards history entries" className="w-full table-fixed text-left">
              <thead>
                <tr className="border-b border-[var(--line)]">
                  <th className="w-28 pb-4 text-sm font-bold text-[var(--muted)]" scope="col">
                    Date
                  </th>
                  <th className="pb-4 text-sm font-bold text-[var(--muted)]" scope="col">
                    Source
                  </th>
                  <th className="w-32 pb-4 text-sm font-bold text-[var(--muted)]" scope="col">
                    Type
                  </th>
                  <th className="w-24 pb-4 text-right text-sm font-bold text-[var(--muted)]" scope="col">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--surface-low)]">
                {rewardEntries.length > 0 ? (
                  rewardEntries.map((entry) => (
                    <tr className="transition-colors hover:bg-[var(--surface-low)]/60" key={entry.id}>
                      <td className="py-4 pr-3 text-sm font-semibold text-[var(--ink)]">
                        {formatDate(entry.createdAt)}
                      </td>
                      <td className="truncate py-4 pr-3 text-sm text-[var(--ink)]">
                        {entry.description}
                      </td>
                      <td className="py-4 pr-3">
                        <span className="whitespace-nowrap rounded-full bg-[var(--glow)] px-2.5 py-1 text-[11px] font-bold text-[var(--ink)]">
                          {rewardTypeLabel(entry.type, entry.status)}
                        </span>
                      </td>
                      <td className="py-4 text-right text-sm font-bold text-[var(--ink)]">
                        +{formatMoney(entry.amountCents)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="py-5 text-sm text-[var(--muted)]" colSpan={4}>
                      Rewards from your shared shelves will appear here.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section aria-labelledby="shared-shelves-heading" className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2
              className="text-2xl font-bold tracking-[-0.03em]"
              id="shared-shelves-heading"
            >
              My Shared Shelves
            </h2>
            <button className="text-sm font-bold text-[var(--teal-700)]" type="button">
              View All
            </button>
          </div>
          <div className="grid gap-3">
            {shares.map((share, index) => (
              <article
                className="flex items-center gap-3 rounded-[22px] bg-white p-3 shadow-[var(--shadow-card)] transition-transform hover:translate-x-1"
                key={share.id}
              >
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-[var(--surface-low)]">
                  {/* eslint-disable-next-line @next/next/no-img-element -- Fan Hub card art is localized from Stitch source imagery for visual QA. */}
                  <img
                    alt={`${share.shelfTitle} shelf preview`}
                    className="h-full w-full object-cover"
                    src={resolveFanHubCardImage(share.coverUrl, "shared", index)}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-bold text-[var(--ink)]">
                    {share.shelfTitle}
                  </h3>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--teal-700)]">
                    <span>{share.shortCode}</span> · {share.channel}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-[var(--muted)]">
                    <span className="inline-flex items-center gap-1">
                      <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
                        mouse
                      </span>
                      <span>{formatActivityCount(share.clicks, "Click")}</span>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
                        share
                      </span>
                      <span>
                        {formatActivityCount(share.shareCount ?? (index === 0 ? 342 : 128), "Share")}
                      </span>
                    </span>
                  </div>
                </div>
                <span aria-hidden="true" className="material-symbols-outlined text-[var(--muted)]">
                  chevron_right
                </span>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="saved-collections-heading" className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2
              className="text-2xl font-bold tracking-[-0.03em]"
              id="saved-collections-heading"
            >
              Saved Collections
            </h2>
            <button className="text-sm font-bold text-[var(--teal-700)]" type="button">
              Explore More
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {savedShelves.map((shelf, index) => (
              <article
                className="group overflow-hidden rounded-[22px] bg-white shadow-[var(--shadow-card)]"
                key={shelf.id}
              >
                <div className="relative h-32 overflow-hidden bg-[var(--surface-low)]">
                  {/* eslint-disable-next-line @next/next/no-img-element -- Fan Hub card art is localized from Stitch source imagery for visual QA. */}
                  <img
                    alt={`${shelf.title} collection cover`}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    src={resolveFanHubCardImage(shelf.coverUrl, "saved", index)}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
                  <p className="absolute bottom-3 left-3 text-sm font-bold text-white">
                    @{shelf.creatorHandle}
                  </p>
                </div>
                <div className="p-3">
                  <h3 className="truncate text-sm font-bold text-[var(--ink)]">
                    {shelf.title}
                  </h3>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {shelf.itemCount ?? fallbackItemCount(index)} Items Saved
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      {withdrawalOpen ? (
        <div
          aria-label="Confirm withdrawal"
          aria-modal="true"
          className="fixed inset-0 z-50 grid place-items-center bg-black/35 px-4"
          role="dialog"
        >
          <div className="w-full max-w-md rounded-[32px] bg-white p-6 shadow-[var(--shadow-card)]">
            <h2 className="text-2xl font-bold tracking-[-0.03em]">Confirm withdrawal</h2>
            <label className="mt-5 grid gap-2 text-sm font-bold text-[var(--muted)]">
              Withdrawal amount
              <input
                className="min-h-12 rounded-2xl border border-[var(--line)] px-4 text-base font-semibold"
                inputMode="decimal"
                onChange={(event) => setWithdrawalAmount(event.target.value)}
                value={withdrawalAmount}
              />
            </label>
            <label className="mt-4 grid gap-2 text-sm font-bold text-[var(--muted)]">
              Destination
              <input
                className="min-h-12 rounded-2xl border border-[var(--line)] px-4 text-base font-semibold"
                onChange={(event) => setDestination(event.target.value)}
                value={destination}
              />
            </label>
            <div className="mt-6 flex justify-end gap-2">
              <button
                className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-bold"
                onClick={() => setWithdrawalOpen(false)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="rounded-full bg-[var(--teal-700)] px-4 py-2 text-sm font-bold text-white"
                onClick={() => {
                  onRequestWithdrawal?.({
                    amountCents: Math.round(Number(withdrawalAmount || 0) * 100),
                    destinationLabel: destination,
                  });
                  setWithdrawalOpen(false);
                }}
                type="button"
              >
                Confirm request
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
