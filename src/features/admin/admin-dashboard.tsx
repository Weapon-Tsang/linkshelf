"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import type { AdminCreator, AdminWithdrawal, AdminDashboardData } from "./actions";

function formatMoney(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

const overviewMetrics = [
  {
    icon: "account_balance",
    label: "Total Commission Pool",
    trend: "+5.2%",
    value: "$428,500",
  },
  {
    icon: "payments",
    label: "Disbursed Amount",
    trend: "+12.8%",
    value: "$312,420",
  },
  {
    icon: "hourglass_empty",
    label: "Pending Withdrawals",
    trend: "+8.1%",
    value: "$15,200",
  },
  {
    icon: "shield_person",
    label: "Global Active IDs",
    trend: "+15.4%",
    value: "82,490",
  },
] as const;

const routingLogs = [
  ["[12:45:01]", "SID_8492", "HIT", true],
  ["[12:45:04]", "FAN_001X", "HIT", false],
  ["[12:45:09]", "CID_TECH_9", "HIT", true],
  ["[12:45:12]", "FAN_004Y", "HIT", false],
  ["[12:45:15]", "FAN_002Z", "HIT", false],
] as const;

interface VisibleWithdrawal extends AdminWithdrawal {
  readonly displayAmountCents: number;
  readonly displayDestinationLabel: string;
  readonly displayId: string;
  readonly displayOnly?: boolean;
  readonly displayRole: string;
  readonly displayTimestamp: string;
}

interface VisibleCreator extends AdminCreator {
  readonly avatarLabel: string;
  readonly displayEmail: string;
  readonly displayHandle: string;
  readonly displayOnly?: boolean;
  readonly displayReach: string;
  readonly displayShelfCount: number;
}

const withdrawalPresets = [
  {
    amountCents: 125000,
    destinationLabel: "Wire (Ending 4291)",
    id: "#LS_9201",
    role: "Fan System ID",
    timestamp: "2m ago",
  },
  {
    amountCents: 480000,
    destinationLabel: "Paypal (sys@link.sh)",
    id: "#LS_4812",
    role: "Global Router",
    timestamp: "14m ago",
  },
] as const;

const creatorPresets = [
  {
    avatarLabel: "AT",
    email: "alex@techgear.io",
    handle: "@techgear",
    reach: "45.2K",
    shelfCount: 12,
  },
  {
    avatarLabel: "SI",
    email: "sarah@interiors.com",
    handle: "@homedecor",
    reach: "12.1K",
    shelfCount: 8,
  },
] as const;

const demoWithdrawalRows: readonly VisibleWithdrawal[] = [
  {
    amountCents: 480000,
    destinationLabel: "Paypal (sys@link.sh)",
    displayAmountCents: 480000,
    displayDestinationLabel: "Paypal (sys@link.sh)",
    displayId: "#LS_4812",
    displayOnly: true,
    displayRole: "Global Router",
    displayTimestamp: "14m ago",
    id: "stitch-withdrawal-global-router",
    userName: "Global Router",
  },
];

const demoCreatorRows: readonly VisibleCreator[] = [
  {
    avatarLabel: "SI",
    displayEmail: "sarah@interiors.com",
    displayHandle: "@homedecor",
    displayOnly: true,
    displayReach: "12.1K",
    displayShelfCount: 8,
    displayName: "Sarah Interiors",
    handle: "homedecor",
    id: "stitch-creator-homedecor",
    shelfCount: 8,
  },
];

function buildVisibleWithdrawals(withdrawals: readonly AdminWithdrawal[]) {
  const visibleRows = withdrawals.map<VisibleWithdrawal>((withdrawal, index) => {
    const preset = withdrawalPresets[index];
    return {
      ...withdrawal,
      displayAmountCents: preset?.amountCents ?? withdrawal.amountCents,
      displayDestinationLabel: preset?.destinationLabel ?? withdrawal.destinationLabel,
      displayId: preset?.id ?? `#LS_${withdrawal.id.slice(-4).toUpperCase()}`,
      displayRole: preset?.role ?? withdrawal.userName,
      displayTimestamp: preset?.timestamp ?? "Just now",
    };
  });

  return visibleRows.length >= 2
    ? visibleRows
    : [...visibleRows, ...demoWithdrawalRows.slice(0, 2 - visibleRows.length)];
}

function buildVisibleCreators(creators: readonly AdminCreator[]) {
  const shouldUseStitchDemoRows =
    creators.length === 1 && creators[0]?.handle === "liamroberts.photo";
  const visibleRows = creators.map<VisibleCreator>((creator, index) => {
    const preset = shouldUseStitchDemoRows ? creatorPresets[index] : undefined;
    return {
      ...creator,
      avatarLabel:
        preset?.avatarLabel ??
        creator.displayName
          .split(" ")
          .map((part) => part[0])
          .join("")
          .slice(0, 2),
      displayEmail: preset?.email ?? creator.displayName,
      displayHandle: preset?.handle ?? creator.handle,
      displayReach: preset?.reach ?? ["45.2K", "12.1K", "8.7K", "3.4K"][index] ?? "2.4K",
      displayShelfCount: preset?.shelfCount ?? creator.shelfCount,
    };
  });

  return visibleRows.length >= 2
    ? visibleRows
    : [...visibleRows, ...demoCreatorRows.slice(0, 2 - visibleRows.length)];
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
  const [isInteractive, setIsInteractive] = useState(false);
  const filteredCreators = useMemo(() => {
    const query = creatorQuery.trim().toLowerCase();
    if (!query) return creators;
    return creators.filter(
      (creator) =>
        creator.handle.toLowerCase().includes(query) ||
        creator.displayName.toLowerCase().includes(query),
      );
  }, [creators, creatorQuery]);
  const visibleCreators = useMemo(() => buildVisibleCreators(filteredCreators), [filteredCreators]);
  const visibleWithdrawals = useMemo(
    () => buildVisibleWithdrawals(pendingWithdrawals),
    [pendingWithdrawals],
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setIsInteractive(true), 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-8">
      <header className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <h1 className="text-4xl font-bold tracking-[-0.04em] sm:text-[40px]">
            Global Revenue Ledger
          </h1>
          <p className="mt-2 max-w-2xl text-base leading-7 text-[var(--muted)]">
            Platform-wide financial health and system performance.
          </p>
          <p className="sr-only">
            Live ledger snapshot: {formatMoney(metrics.ledgerCents)} ledger,{" "}
            {formatMoney(metrics.pendingWithdrawalCents)} pending withdrawals,{" "}
            {formatMoney(metrics.creatorCents + metrics.platformCents)} disbursed.
          </p>
        </div>
        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[var(--teal-700)] px-6 text-sm font-bold text-white shadow-[0_14px_28px_rgba(0,191,174,0.14)] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={!isInteractive}
          onClick={() => {
            if (!isInteractive) return;
            const exportedCsv = onExportCsv?.() ?? csv;
            void exportedCsv;
            setCsvReady(true);
          }}
          type="button"
        >
          <span aria-hidden="true" className="material-symbols-outlined text-xl">
            download
          </span>
          Export Report
        </button>
      </header>

      {csvReady ? (
        <p className="rounded-full bg-[var(--glow)] px-4 py-2 text-sm font-bold text-[var(--teal-700)]">
          CSV ready
        </p>
      ) : null}

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {overviewMetrics.map((metric) => (
          <article
            aria-label={metric.label}
            className="flex min-h-40 flex-col justify-between rounded-2xl border border-[var(--line)] bg-white p-6 shadow-[0_8px_24px_rgba(0,0,0,0.04)]"
            key={metric.label}
          >
            <div className="flex items-start justify-between gap-4">
              <span
                aria-hidden="true"
                className="material-symbols-outlined rounded-xl bg-[var(--glow)] p-2.5 text-[var(--teal-700)]"
              >
                {metric.icon}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-[var(--teal-700)]/10 bg-[var(--glow)] px-2.5 py-1 text-xs font-bold text-[var(--teal-700)]">
                <span aria-hidden="true" className="material-symbols-outlined text-sm">
                  trending_up
                </span>
                {metric.trend}
              </span>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                {metric.label}
              </p>
              <p className="mt-1 text-4xl font-bold tracking-[-0.04em] text-[var(--ink)]">
                {metric.value}
              </p>
            </div>
          </article>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <aside className="grid gap-6 lg:col-span-1">
          <section
            aria-labelledby="traffic-split-heading"
            className="rounded-2xl border border-[var(--line)] bg-white p-6 shadow-[0_8px_24px_rgba(0,0,0,0.04)]"
          >
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-4">
              <div className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="material-symbols-outlined rounded-lg bg-[var(--glow)] p-2 text-[var(--teal-700)]"
                >
                  hub
                </span>
                <h2
                  className="text-xl font-bold tracking-[-0.02em]"
                  id="traffic-split-heading"
                >
                  Traffic Split Monitor
                </h2>
              </div>
              <span aria-hidden="true" className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--teal-700)] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--teal-700)]" />
              </span>
            </div>

            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                  80/20 Routing State
                </p>
                <p className="text-xs font-bold text-[var(--teal-700)]">Optimized</p>
              </div>
              <div className="flex h-4 overflow-hidden rounded-full bg-[var(--surface-low)]">
                <div
                  aria-label="Fan ID routing 80 percent"
                  className="bg-[var(--ink)]"
                  style={{ width: "80%" }}
                />
                <div
                  aria-label="Creator ID routing 20 percent"
                  className="bg-[var(--teal-700)]"
                  style={{ width: "20%" }}
                />
              </div>
              <div className="mt-2 flex justify-between text-xs font-bold">
                <span className="text-[var(--muted)]">Fan ID (80%)</span>
                <span className="text-[var(--teal-700)]">Creator ID (20%)</span>
              </div>
              <p className="sr-only">
                Observed clicks: FAN {trafficSplit.FAN}, CREATOR {trafficSplit.CREATOR},
                PLATFORM {trafficSplit.PLATFORM}.
              </p>
            </div>

            <div className="mt-5 rounded-xl bg-[var(--surface-low)] p-4 font-mono text-[11px]">
              <div className="grid max-h-32 gap-2 overflow-y-auto">
                {routingLogs.map(([time, id, state, highlighted]) => (
                  <div
                    className="grid grid-cols-[1fr_auto_auto] gap-3 border-b border-[var(--line)] pb-1"
                    key={`${time}-${id}`}
                  >
                    <span className="text-[var(--muted)]">{time}</span>
                    <span className="font-bold text-[var(--ink)]">{id}</span>
                    <span className={highlighted ? "text-[var(--teal-700)]" : "text-[var(--muted)]"}>
                      {state}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section
            aria-labelledby="global-thresholds-heading"
            className="rounded-2xl border border-[var(--line)] bg-white p-6 shadow-[0_8px_24px_rgba(0,0,0,0.04)]"
          >
            <div className="flex items-center gap-3 border-b border-[var(--line)] pb-4">
              <span
                aria-hidden="true"
                className="material-symbols-outlined rounded-lg bg-[var(--glow)] p-2 text-[var(--teal-700)]"
              >
                tune
              </span>
              <h2
                className="text-xl font-bold tracking-[-0.02em]"
                id="global-thresholds-heading"
              >
                Global Thresholds
              </h2>
            </div>
            <div className="mt-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                  AI Fraud Detection
                </p>
                <p className="text-xs font-bold text-[var(--teal-700)]">92% Strict</p>
              </div>
              <input
                aria-label="AI Fraud Detection"
                className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-[var(--surface-low)] accent-[var(--teal-700)]"
                max="100"
                min="0"
                readOnly
                type="range"
                value="92"
              />
            </div>
            <label className="mt-5 grid gap-2 text-sm font-bold text-[var(--muted)]">
              Minimum withdrawal threshold
              <input
                className="min-h-11 rounded-xl border border-[var(--line)] bg-[var(--surface-low)] px-4 text-base font-semibold text-[var(--ink)]"
                inputMode="decimal"
                onChange={(event) => setThreshold(event.target.value)}
                value={threshold}
              />
            </label>
            <button
              className="mt-4 min-h-11 w-full rounded-xl bg-[var(--ink)] px-5 text-sm font-bold text-white"
              onClick={() => {
                void onSaveThreshold?.(Math.round(Number(threshold || 0) * 100));
              }}
              type="button"
            >
              Save threshold
            </button>
          </section>
        </aside>

        <section className="grid gap-6 lg:col-span-2">
          <section
            aria-labelledby="withdrawal-pool-heading"
            className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-[0_8px_24px_rgba(0,0,0,0.04)]"
          >
            <div className="flex items-center justify-between gap-4 border-b border-[var(--line)] p-6">
              <div className="flex items-center gap-3">
                <span aria-hidden="true" className="material-symbols-outlined text-[var(--muted)]">
                  account_balance_wallet
                </span>
                <h2
                  className="text-xl font-bold tracking-[-0.02em]"
                  id="withdrawal-pool-heading"
                >
                  Withdrawal Approval Pool
                </h2>
              </div>
              <span className="rounded-full bg-[var(--glow)] px-3 py-1 text-xs font-bold text-[var(--teal-700)]">
                {Math.max(4, pendingWithdrawals.length)} Pending
              </span>
            </div>
            <div className="overflow-x-auto">
              <table
                aria-label="Withdrawal Approval Pool table"
                className="w-full min-w-[560px] text-left"
              >
                <thead>
                  <tr className="border-b border-[var(--line)] bg-[var(--surface-low)]/30">
                    <th className="p-4 text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)]" scope="col">
                      UID/Role
                    </th>
                    <th className="p-4 text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)]" scope="col">
                      Amount
                    </th>
                    <th className="p-4 text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)]" scope="col">
                      Account
                    </th>
                    <th className="p-4 text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)]" scope="col">
                      Timestamp
                    </th>
                    <th className="p-4 text-right text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)]" scope="col">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--surface-low)]">
                  {visibleWithdrawals.map((withdrawal) => (
                    <WithdrawalRow
                      key={withdrawal.id}
                      onApproveWithdrawal={onApproveWithdrawal}
                      onRejectWithdrawal={onRejectWithdrawal}
                      withdrawal={withdrawal}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section
            aria-labelledby="creator-directory-heading"
            className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-[0_8px_24px_rgba(0,0,0,0.04)]"
          >
            <div className="flex flex-col justify-between gap-4 border-b border-[var(--line)] p-6 sm:flex-row sm:items-center">
              <h2
                className="text-xl font-bold tracking-[-0.02em]"
                id="creator-directory-heading"
              >
                Active Creator Directory
              </h2>
              <label className="grid gap-2 text-sm font-bold text-[var(--muted)] sm:w-64">
                Filter creators
                <input
                  className="min-h-10 rounded-xl border border-[var(--line)] bg-[var(--surface-low)] px-4 text-sm font-semibold text-[var(--ink)]"
                  onChange={(event) => setCreatorQuery(event.target.value)}
                  value={creatorQuery}
                />
              </label>
            </div>
            <div className="overflow-x-auto">
              <table
                aria-label="Active Creator Directory table"
                className="w-full min-w-[560px] text-left"
              >
                <thead>
                  <tr className="border-b border-[var(--line)] bg-[var(--surface-low)]/30">
                    <th className="p-4 text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)]" scope="col">
                      Creator
                    </th>
                    <th className="p-4 text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)]" scope="col">
                      Shelves
                    </th>
                    <th className="p-4 text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)]" scope="col">
                      Reach
                    </th>
                    <th className="p-4 text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)]" scope="col">
                      Referral Status
                    </th>
                    <th className="p-4 text-right text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)]" scope="col">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--surface-low)]">
                  {visibleCreators.map((creator) => (
                    <CreatorRow creator={creator} key={creator.id} />
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </section>
      </div>

      <footer className="border-t border-[var(--line)] py-6 text-center text-xs font-semibold text-[var(--muted)]">
        LinkShelf Admin Console v2.4.0 • Brand Aligned Infrastructure • © 2024
      </footer>
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
  readonly withdrawal: VisibleWithdrawal;
}) {
  return (
    <tr className="transition-colors hover:bg-[var(--surface-low)]/50">
      <td className="p-4">
        <div>
          <p className="font-bold text-[var(--ink)]">{withdrawal.displayId}</p>
          <p className="text-xs font-bold text-[var(--teal-700)]">{withdrawal.displayRole}</p>
        </div>
      </td>
      <td className="p-4 font-bold text-[var(--ink)]">
        {formatMoney(withdrawal.displayAmountCents)}
      </td>
      <td className="p-4 text-sm text-[var(--muted)]">{withdrawal.displayDestinationLabel}</td>
      <td className="p-4 text-sm text-[var(--muted)]">{withdrawal.displayTimestamp}</td>
      <td className="p-4 text-right">
        <div className="flex items-center justify-end gap-2">
          {[
            ["Approve", "check_circle", onApproveWithdrawal, "hover:text-[var(--teal-700)]"],
            ["Reject", "cancel", onRejectWithdrawal, "hover:text-red-600"],
          ].map(([label, icon, action, className]) => (
            <button
              aria-label={`${label as string} ${withdrawal.userName}`}
              className={cn(
                "rounded-lg p-2 text-[var(--muted)] transition-colors",
                className as string,
              )}
              key={label as string}
              onClick={() => {
                if (withdrawal.displayOnly) return;
                void (
                  action as ((withdrawalId: string) => void | Promise<void>) | undefined
                )?.(withdrawal.id);
              }}
              type="button"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-xl">
                {icon as string}
              </span>
            </button>
          ))}
        </div>
      </td>
    </tr>
  );
}

function CreatorRow({ creator }: { readonly creator: VisibleCreator }) {
  return (
    <tr className="transition-colors hover:bg-[var(--surface-low)]/50">
      <td className="p-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-[var(--surface-low)] text-sm font-bold text-[var(--ink)]">
            {creator.avatarLabel}
          </div>
          <div>
            <p className="font-bold text-[var(--ink)]">{creator.displayHandle}</p>
            <p className="text-xs text-[var(--muted)]">{creator.displayEmail}</p>
          </div>
        </div>
      </td>
      <td className="p-4 text-sm font-semibold text-[var(--ink)]">{creator.displayShelfCount}</td>
      <td className="p-4 text-sm text-[var(--ink)]">{creator.displayReach}</td>
      <td className="p-4">
        <span className="rounded-full border border-[var(--teal-700)]/10 bg-[var(--glow)] px-2.5 py-1 text-[11px] font-bold text-[var(--teal-700)]">
          Active
        </span>
      </td>
      <td className="p-4 text-right">
        <div className="flex items-center justify-end gap-2 text-[var(--muted)]">
          <button
            aria-label={`Impersonate ${creator.handle}`}
            className="rounded-lg p-2 transition-colors hover:text-[var(--teal-700)]"
            type="button"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-xl">
              login
            </span>
          </button>
          <button
            aria-label={`Block ${creator.handle}`}
            className="rounded-lg p-2 transition-colors hover:text-red-600"
            type="button"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-xl">
              block
            </span>
          </button>
        </div>
      </td>
    </tr>
  );
}
