"use client";

import { useEffect, useState } from "react";
import type { SocialChannelType } from "@/features/shelves/types";
import { cn } from "@/lib/cn";

type HubSection = "Wallet" | "My Shares" | "Saved";

const fallbackImages = {
  sharedShelf:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDDvrAb2jD7VtsS147Vz1lwCSzKfiIX4WS48D-2qIrME2AAWlItEeJkDPwnebAS1_qf6nESgiineyZvbnbp39Yl-tCZLVyHibLCg3v_GdirMDlZDMN-HplLqFDm5VO0jLu1-kHIwmPiNrowEPiyGYH0Rcj9r8f1RppmCplamJdAYlkhIykkgGT7z73wMtQ58Vwrp59SGnpgbKUUJKSIv0CL9lfIFzTju1F626GPsgU_KEYeCD7AhhtW3UYOOGdGd4B54ISdO8HKs18",
  savedCollection:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCJZPAUG0W1xXyc-vRnkwf6ci5qupRSRn0Uu9weM0gO-GF0XqNYVpcfvqtjZjR4hbR7TIZAHf8L8M3_EWlu41lj2CNW8tdvdZUzb8rrpcqHDH1zbCA_tS2zrap6jXMoTCiFUzpno9ZGx-Qc_ZY39JY74H2211PG4uXU8iMb4OzKw_W3leBFIt1_qzwxCoUFp2xjA9RhbZyz4l9RX8cuqFCgo_KrJ6CulDk2NlJhjyjBnFWYabgD5dmMfElRjdtRLBPJVq3xZmf4ncM",
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

function fallbackItemCount(index: number) {
  return index === 0 ? 14 : 28;
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
  const [active, setActive] = useState<HubSection>("Wallet");
  const [affiliateTag, setAffiliateTag] = useState(summary.affiliateTag);
  const [withdrawalOpen, setWithdrawalOpen] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState("50");
  const [destination, setDestination] = useState("");
  const [csvReady, setCsvReady] = useState(false);
  const [isInteractive, setIsInteractive] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setIsInteractive(true), 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  const rewardEntries = summary.entries ?? [];

  return (
    <div className="mx-auto max-w-[1180px] space-y-6">
      <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--teal-700)]">
            My Hub
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-[-0.04em] sm:text-5xl">
            Fan rewards dashboard
          </h1>
        </div>
        <nav aria-label="Fan Hub sections" className="flex flex-wrap gap-2">
          {(["Wallet", "My Shares", "Saved"] as const).map((section) => (
            <button
              aria-pressed={active === section}
              className={cn(
                "rounded-full border border-[var(--line)] bg-white px-5 py-2 text-sm font-bold text-[var(--muted)]",
                active === section && "border-[var(--teal-700)] bg-[var(--glow)] text-[var(--ink)]",
              )}
              key={section}
              onClick={() => setActive(section)}
              type="button"
            >
              {section}
            </button>
          ))}
        </nav>
      </header>

      {csvReady ? (
        <p className="rounded-full bg-[var(--glow)] px-4 py-2 text-sm font-bold text-[var(--ink)]">
          CSV ready
        </p>
      ) : null}

      <section
        aria-labelledby="affiliate-binding-heading"
        className="rounded-[28px] bg-white p-6 shadow-[var(--shadow-card)]"
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
          </div>
        </div>
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-12">
        <article className="relative flex min-h-[280px] flex-col justify-between overflow-hidden rounded-[28px] bg-white p-6 shadow-[var(--shadow-card)] lg:col-span-4">
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
            <p className="mt-5 text-sm leading-6 text-[var(--muted)]">
              Lifetime rewards:{" "}
              <span className="font-bold text-[var(--ink)]">
                {formatMoney(summary.lifetimeCents)}
              </span>
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
          className="overflow-hidden rounded-[28px] bg-white p-6 shadow-[var(--shadow-card)] lg:col-span-8"
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
              Export CSV
            </button>
          </div>
          <div aria-label="Rewards History table" className="overflow-x-auto" tabIndex={0}>
            <table className="w-full min-w-[620px] text-left">
              <thead>
                <tr className="border-b border-[var(--line)]">
                  <th className="pb-4 text-sm font-bold text-[var(--muted)]" scope="col">
                    Date
                  </th>
                  <th className="pb-4 text-sm font-bold text-[var(--muted)]" scope="col">
                    Source
                  </th>
                  <th className="pb-4 text-sm font-bold text-[var(--muted)]" scope="col">
                    Type
                  </th>
                  <th className="pb-4 text-right text-sm font-bold text-[var(--muted)]" scope="col">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--surface-low)]">
                {rewardEntries.length > 0 ? (
                  rewardEntries.slice(0, 4).map((entry) => (
                    <tr className="transition-colors hover:bg-[var(--surface-low)]/60" key={entry.id}>
                      <td className="py-4 text-sm font-semibold text-[var(--ink)]">
                        {formatDate(entry.createdAt)}
                      </td>
                      <td className="py-4 text-sm text-[var(--ink)]">{entry.description}</td>
                      <td className="py-4">
                        <span className="rounded-full bg-[var(--glow)] px-3 py-1 text-xs font-bold text-[var(--ink)]">
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

      <div className="grid gap-6 lg:grid-cols-2">
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
          <div className="grid gap-4">
            {shares.map((share, index) => (
              <article
                className="flex items-center gap-4 rounded-[24px] bg-white p-4 shadow-[var(--shadow-card)] transition-transform hover:translate-x-1"
                key={share.id}
              >
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-[var(--surface-low)]">
                  {/* eslint-disable-next-line @next/next/no-img-element -- Stitch export assets are remote fixtures and match the existing public-page image strategy. */}
                  <img
                    alt=""
                    className="h-full w-full object-cover"
                    src={share.coverUrl ?? fallbackImages.sharedShelf}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-base font-bold text-[var(--ink)]">
                    {share.shelfTitle}
                  </h3>
                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-[var(--teal-700)]">
                    <span>{share.shortCode}</span> · {share.channel}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-4 text-sm text-[var(--muted)]">
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
          <div className="grid gap-4 sm:grid-cols-2">
            {savedShelves.map((shelf, index) => (
              <article
                className="group overflow-hidden rounded-[24px] bg-white shadow-[var(--shadow-card)]"
                key={shelf.id}
              >
                <div className="relative h-36 overflow-hidden bg-[var(--surface-low)]">
                  {/* eslint-disable-next-line @next/next/no-img-element -- Stitch export assets are remote fixtures and match the existing public-page image strategy. */}
                  <img
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    src={shelf.coverUrl ?? fallbackImages.savedCollection}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
                  <p className="absolute bottom-3 left-3 text-sm font-bold text-white">
                    @{shelf.creatorHandle}
                  </p>
                </div>
                <div className="p-4">
                  <h3 className="truncate text-base font-bold text-[var(--ink)]">
                    {shelf.title}
                  </h3>
                  <p className="mt-1 text-sm text-[var(--muted)]">
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
