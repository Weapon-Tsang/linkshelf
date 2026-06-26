"use client";

import { useState } from "react";

type AnalyticsRange = "7D" | "30D" | "90D" | "Custom";

const ranges: AnalyticsRange[] = ["7D", "30D", "90D", "Custom"];

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function AnalyticsView({
  metrics,
}: {
  readonly metrics: {
    readonly clicks: number;
    readonly shares: number;
    readonly conversionRate: number;
    readonly revenueCents: number;
  };
}) {
  const [range, setRange] = useState<AnalyticsRange>("7D");

  return (
    <div>
      <header>
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--teal-700)]">
          Analytics
        </p>
        <h1 className="mt-2 text-4xl font-bold tracking-[-0.04em] sm:text-5xl">
          Performance dashboard
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-[var(--muted)]">
          Watch traffic, shares, and simulated affiliate revenue move across your shelves.
        </p>
      </header>

      <section className="mt-8 rounded-[32px] border border-white/80 bg-white/82 p-6 shadow-[var(--shadow-card)]">
        <div className="flex flex-wrap gap-2">
          {ranges.map((item) => (
            <button
              aria-pressed={range === item}
              className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-bold aria-pressed:border-[var(--teal-700)] aria-pressed:bg-[var(--teal-700)] aria-pressed:text-white"
              key={item}
              onClick={() => setRange(item)}
              type="button"
            >
              {item}
            </button>
          ))}
        </div>

        {range === "Custom" ? (
          <label className="mt-5 block max-w-xs" htmlFor="custom-range">
            <span className="text-sm font-bold text-[var(--muted)]">Custom date range</span>
            <input
              className="mt-2 min-h-11 w-full rounded-2xl border border-[var(--line)] bg-[var(--surface-low)] px-4 text-sm font-semibold"
              id="custom-range"
              placeholder="Jun 1 – Jun 24"
            />
          </label>
        ) : null}

        <div className="mt-7 grid gap-4 md:grid-cols-4">
          {[
            ["Clicks", metrics.clicks.toLocaleString()],
            ["Shares", metrics.shares.toLocaleString()],
            ["Conversion", `${metrics.conversionRate}%`],
            ["Revenue", formatCurrency(metrics.revenueCents)],
          ].map(([label, value]) => (
            <article className="rounded-[24px] bg-[var(--surface-low)] p-5" key={label}>
              <p className="text-sm font-bold text-[var(--muted)]">{label}</p>
              <p className="mt-3 text-3xl font-bold tracking-[-0.04em]">{value}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-8 rounded-[32px] border border-white/80 bg-white/82 p-6 shadow-[var(--shadow-card)]">
        <h2 className="text-2xl font-bold tracking-[-0.03em]">Traffic sources</h2>
        <div className="mt-6 grid gap-5 md:grid-cols-[16rem_minmax(0,1fr)] md:items-center">
          <div
            aria-label="Traffic source donut"
            className="aspect-square rounded-full bg-[conic-gradient(var(--teal-700)_0_58%,var(--teal-500)_58%_82%,#cfc9d5_82%_100%)] p-10"
            role="img"
          >
            <div className="grid h-full place-items-center rounded-full bg-white text-center">
              <span className="text-3xl font-bold">58%</span>
            </div>
          </div>
          <div className="grid gap-3">
            {[
              ["Fan shares", "58%"],
              ["Creator profile", "24%"],
              ["Direct product clicks", "18%"],
            ].map(([label, value]) => (
              <div className="flex justify-between rounded-2xl bg-[var(--surface-low)] p-4" key={label}>
                <span className="font-semibold">{label}</span>
                <span className="font-bold text-[var(--teal-700)]">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
