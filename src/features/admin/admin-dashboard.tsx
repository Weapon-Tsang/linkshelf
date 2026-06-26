"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import type { AdminCreator, AdminWithdrawal, AdminDashboardData } from "./actions";

function formatMoney(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export function AdminDashboard({
  creators,
  csv,
  metrics,
  onApproveWithdrawal,
  onExportCsv,
  onRejectWithdrawal,
  onSaveThreshold,
  pendingWithdrawals,
  thresholds,
  trafficSplit,
}: AdminDashboardData & {
  readonly csv?: string;
  readonly onApproveWithdrawal?: (withdrawalId: string) => void | Promise<void>;
  readonly onExportCsv?: () => string;
  readonly onRejectWithdrawal?: (withdrawalId: string) => void | Promise<void>;
  readonly onSaveThreshold?: (minimumWithdrawalCents: number) => void | Promise<void>;
}) {
  const [creatorQuery, setCreatorQuery] = useState("");
  const [threshold, setThreshold] = useState(String(thresholds.minimumWithdrawalCents / 100));
  const [csvReady, setCsvReady] = useState(false);
  const filteredCreators = useMemo(() => {
    const query = creatorQuery.trim().toLowerCase();
    if (!query) return creators;
    return creators.filter(
      (creator) =>
        creator.handle.toLowerCase().includes(query) ||
        creator.displayName.toLowerCase().includes(query),
    );
  }, [creators, creatorQuery]);

  return (
    <div>
      <header className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--teal-700)]">
            Super Admin
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-[-0.04em] sm:text-5xl">
            Unified brand operations
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-[var(--muted)]">
            Monitor attribution health, withdrawal queues, creator coverage, and platform
            thresholds.
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

      <section className="mt-8 grid gap-4 md:grid-cols-4">
        {[
          ["Ledger", metrics.ledgerCents],
          ["Pending withdrawals", metrics.pendingWithdrawalCents],
          ["Creator share", metrics.creatorCents],
          ["Platform share", metrics.platformCents],
        ].map(([label, value]) => (
          <article
            className="rounded-[28px] border border-white/80 bg-white/82 p-6 shadow-[var(--shadow-card)]"
            key={label}
          >
            <p className="text-sm font-bold text-[var(--muted)]">{label}</p>
            <p className="mt-4 text-3xl font-bold tracking-[-0.04em]">
              {formatMoney(value as number)}
            </p>
          </article>
        ))}
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="grid gap-6">
          <article className="rounded-[32px] border border-white/80 bg-white/82 p-6 shadow-[var(--shadow-card)]">
            <h2 className="text-2xl font-bold tracking-[-0.03em]">Traffic split</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {(["FAN", "CREATOR", "PLATFORM"] as const).map((key) => (
                <div className="rounded-2xl bg-[var(--surface-low)] p-4" key={key}>
                  <p className="font-bold">
                    {key} {trafficSplit[key]}
                  </p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[32px] border border-white/80 bg-white/82 p-6 shadow-[var(--shadow-card)]">
            <h2 className="text-2xl font-bold tracking-[-0.03em]">Pending withdrawals</h2>
            <div className="mt-5 grid gap-3">
              {pendingWithdrawals.map((withdrawal) => (
                <WithdrawalRow
                  key={withdrawal.id}
                  onApproveWithdrawal={onApproveWithdrawal}
                  onRejectWithdrawal={onRejectWithdrawal}
                  withdrawal={withdrawal}
                />
              ))}
            </div>
          </article>
        </div>

        <aside className="grid gap-6">
          <section className="rounded-[32px] border border-white/80 bg-white/82 p-6 shadow-[var(--shadow-card)]">
            <h2 className="text-2xl font-bold tracking-[-0.03em]">Controls</h2>
            <label className="mt-5 grid gap-2 text-sm font-bold text-[var(--muted)]">
              Minimum withdrawal threshold
              <input
                className="min-h-12 rounded-2xl border border-[var(--line)] bg-[var(--surface-low)] px-4 text-base font-semibold text-[var(--ink)]"
                inputMode="decimal"
                onChange={(event) => setThreshold(event.target.value)}
                value={threshold}
              />
            </label>
            <button
              className="mt-4 min-h-12 rounded-full bg-[var(--ink)] px-5 text-sm font-bold text-white"
              onClick={() => {
                void onSaveThreshold?.(Math.round(Number(threshold || 0) * 100));
              }}
              type="button"
            >
              Save threshold
            </button>
          </section>

          <section className="rounded-[32px] border border-white/80 bg-white/82 p-6 shadow-[var(--shadow-card)]">
            <h2 className="text-2xl font-bold tracking-[-0.03em]">Creators</h2>
            <label className="mt-5 grid gap-2 text-sm font-bold text-[var(--muted)]">
              Filter creators
              <input
                className="min-h-12 rounded-2xl border border-[var(--line)] bg-[var(--surface-low)] px-4 text-base font-semibold text-[var(--ink)]"
                onChange={(event) => setCreatorQuery(event.target.value)}
                value={creatorQuery}
              />
            </label>
            <div className="mt-5 grid gap-3">
              {filteredCreators.map((creator) => (
                <CreatorRow creator={creator} key={creator.id} />
              ))}
            </div>
          </section>
        </aside>
      </section>
    </div>
  );
}

function WithdrawalRow({
  onApproveWithdrawal,
  onRejectWithdrawal,
  withdrawal,
}: {
  readonly onApproveWithdrawal?: (withdrawalId: string) => void | Promise<void>;
  readonly onRejectWithdrawal?: (withdrawalId: string) => void | Promise<void>;
  readonly withdrawal: AdminWithdrawal;
}) {
  return (
    <div className="rounded-2xl bg-[var(--surface-low)] p-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <p className="font-bold">{withdrawal.userName}</p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {formatMoney(withdrawal.amountCents)} · {withdrawal.destinationLabel}
          </p>
        </div>
        <div className="flex gap-2">
          {[
            ["Approve", onApproveWithdrawal, "bg-[var(--teal-700)] text-white"],
            ["Reject", onRejectWithdrawal, "border border-[var(--line)]"],
          ].map(([label, action, className]) => (
            <button
              className={cn("rounded-full px-4 py-2 text-sm font-bold", className as string)}
              key={label as string}
              onClick={() => {
                void (action as ((withdrawalId: string) => void | Promise<void>) | undefined)?.(
                  withdrawal.id,
                );
              }}
              type="button"
            >
              {label as string} {withdrawal.userName}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function CreatorRow({ creator }: { readonly creator: AdminCreator }) {
  return (
    <div className="rounded-2xl bg-[var(--surface-low)] p-4">
      <p className="font-bold">{creator.handle}</p>
      <p className="mt-1 text-sm text-[var(--muted)]">
        {creator.displayName} · {creator.shelfCount} shelves
      </p>
    </div>
  );
}
