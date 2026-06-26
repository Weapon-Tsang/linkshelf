"use client";

import { useState } from "react";
import type { SocialChannelType } from "@/features/shelves/types";
import { cn } from "@/lib/cn";

type HubSection = "Wallet" | "My Shares" | "Saved";

export interface HubSavedShelf {
  readonly id: string;
  readonly title: string;
  readonly creatorHandle: string;
}

export interface HubShare {
  readonly id: string;
  readonly shelfTitle: string;
  readonly channel: SocialChannelType | string;
  readonly shortCode: string;
  readonly clicks: number;
}

export interface HubSummary {
  readonly availableCents: number;
  readonly pendingCents: number;
  readonly lifetimeCents: number;
  readonly affiliateTag: string;
}

function formatMoney(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
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

  return (
    <div>
      <header className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--teal-700)]">
            My Hub
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-[-0.04em] sm:text-5xl">
            Fan rewards dashboard
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-[var(--muted)]">
            Track shared shelf clicks, save your favorite creator kits, and manage simulated
            reward payouts.
          </p>
        </div>
        <button
          className="inline-flex min-h-12 items-center justify-center rounded-full bg-[var(--teal-700)] px-6 text-sm font-bold text-white"
          onClick={() => {
            const exportedCsv = onExportCsv?.() ?? csv;
            void exportedCsv;
            setCsvReady(true);
          }}
          type="button"
        >
          Export CSV
        </button>
      </header>

      {csvReady ? (
        <p className="mt-4 rounded-full bg-[var(--glow)] px-4 py-2 text-sm font-bold text-[var(--teal-700)]">
          CSV ready
        </p>
      ) : null}

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        {[
          ["Available", summary.availableCents],
          ["Pending", summary.pendingCents],
          ["Lifetime", summary.lifetimeCents],
        ].map(([label, value]) => (
          <article
            className="rounded-[28px] border border-white/80 bg-white/82 p-6 shadow-[var(--shadow-card)]"
            key={label}
          >
            <p className="text-sm font-bold text-[var(--muted)]">{label}</p>
            <p className="mt-4 text-4xl font-bold tracking-[-0.04em]">
              {formatMoney(value as number)}
            </p>
          </article>
        ))}
      </section>

      <nav aria-label="Fan Hub sections" className="mt-8 flex flex-wrap gap-2">
        {(["Wallet", "My Shares", "Saved"] as const).map((section) => (
          <button
            aria-pressed={active === section}
            className={cn(
              "rounded-full border border-[var(--line)] bg-white px-5 py-2 text-sm font-bold",
              active === section && "border-[var(--teal-700)] bg-[var(--teal-700)] text-white",
            )}
            key={section}
            onClick={() => setActive(section)}
            type="button"
          >
            {section}
          </button>
        ))}
      </nav>

      {active === "Wallet" ? (
        <section className="mt-6 rounded-[32px] border border-white/80 bg-white/82 p-6 shadow-[var(--shadow-card)]">
          <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
            <label className="grid gap-2 text-sm font-bold text-[var(--muted)]">
              Fan Tracking ID
              <input
                className="min-h-12 rounded-2xl border border-[var(--line)] bg-[var(--surface-low)] px-4 text-base font-semibold text-[var(--ink)]"
                onChange={(event) => setAffiliateTag(event.target.value)}
                value={affiliateTag}
              />
            </label>
            <button
              className="min-h-12 rounded-full border border-[var(--line)] px-5 text-sm font-bold"
              onClick={() => {
                void onSaveTrackingId?.(affiliateTag);
              }}
              type="button"
            >
              Save tracking ID
            </button>
            <button
              className="min-h-12 rounded-full bg-[var(--ink)] px-5 text-sm font-bold text-white"
              onClick={() => setWithdrawalOpen(true)}
              type="button"
            >
              Request withdrawal
            </button>
          </div>
        </section>
      ) : null}

      {active === "My Shares" ? (
        <section className="mt-6 grid gap-4">
          {shares.map((share) => (
            <article
              className="rounded-[28px] border border-white/80 bg-white/82 p-5 shadow-[var(--shadow-card)]"
              key={share.id}
            >
              <p className="text-sm font-bold text-[var(--teal-700)]">{share.channel}</p>
              <h2 className="mt-1 text-xl font-bold">{share.shelfTitle}</h2>
              <p className="mt-2 text-sm text-[var(--muted)]">
                <span>{share.shortCode}</span> · {share.clicks} clicks
              </p>
            </article>
          ))}
        </section>
      ) : null}

      {active === "Saved" ? (
        <section className="mt-6 grid gap-4">
          {savedShelves.map((shelf) => (
            <article
              className="rounded-[28px] border border-white/80 bg-white/82 p-5 shadow-[var(--shadow-card)]"
              key={shelf.id}
            >
              <h2 className="text-xl font-bold">{shelf.title}</h2>
              <p className="mt-2 text-sm font-semibold text-[var(--muted)]">
                @{shelf.creatorHandle}
              </p>
            </article>
          ))}
        </section>
      ) : null}

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
