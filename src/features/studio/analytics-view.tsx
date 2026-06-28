"use client";

import Image from "next/image";
import { useState } from "react";

type AnalyticsRange = "7D" | "30D" | "90D" | "Custom";

const ranges: AnalyticsRange[] = ["7D", "30D", "90D", "Custom"];

const analyticsStats = [
  {
    label: "Total Views",
    value: "1.2M",
    trend: "12.5%",
    trendDirection: "up",
    icon: "visibility",
    iconClassName: "bg-[rgba(0,191,174,0.1)] text-[var(--teal-500)]",
    accentClassName: "bg-[rgba(0,191,174,0.08)]",
  },
  {
    label: "Total Saves",
    value: "45.8K",
    trend: "8.2%",
    trendDirection: "up",
    icon: "bookmark",
    iconClassName: "bg-[#dbe1ff] text-[#131a33]",
    accentClassName: "bg-[#dbe1ff]/50",
  },
  {
    label: "Total Comments",
    value: "8,402",
    trend: "2.1%",
    trendDirection: "down",
    icon: "forum",
    iconClassName: "bg-[#e5dffd] text-[#1b192e]",
    accentClassName: "bg-[#e5dffd]/50",
  },
  {
    label: "Avg. CTR",
    value: "14.2%",
    trend: "4.5%",
    trendDirection: "up",
    icon: "ads_click",
    iconClassName: "bg-[var(--ink)] text-white",
    accentClassName: "bg-[rgba(11,19,43,0.06)]",
  },
] as const;

const shelfPerformance = [
  {
    title: "Photography Kit 2024",
    updated: "Updated 2 days ago",
    views: "345K Views",
    change: "12%",
    direction: "up",
    image: "/stitch/assets/analytics-photography-kit.png",
    imageAlt: "Photography Kit camera gear flat lay",
    lineClassName:
      "bg-[linear-gradient(110deg,transparent_0_12%,var(--teal-500)_12%_18%,transparent_18%_34%,var(--teal-500)_34%_42%,transparent_42%_55%,var(--teal-500)_55%_62%,transparent_62%_100%)]",
  },
  {
    title: "Ultimate Desk Setup",
    updated: "Updated 1 week ago",
    views: "210K Views",
    change: "0%",
    direction: "flat",
    image: "/stitch/assets/analytics-desk-setup.png",
    imageAlt: "Ultimate Desk Setup shelf preview",
    lineClassName:
      "bg-[linear-gradient(110deg,transparent_0_18%,rgba(11,19,43,0.5)_18%_24%,transparent_24%_44%,rgba(11,19,43,0.5)_44%_52%,transparent_52%_100%)]",
  },
  {
    title: "Travel Essentials",
    updated: "Updated 1 month ago",
    views: "89K Views",
    change: "4%",
    direction: "down",
    icon: "shopping_bag",
    lineClassName:
      "bg-[linear-gradient(110deg,transparent_0_16%,rgba(186,26,26,0.7)_16%_22%,transparent_22%_48%,rgba(186,26,26,0.7)_48%_55%,transparent_55%_100%)]",
  },
] as const;

const trafficSources = [
  ["Instagram", "45%", "bg-[var(--teal-500)]"],
  ["TikTok", "30%", "bg-[var(--ink)]"],
  ["Twitter", "15%", "bg-[var(--glow)]"],
  ["Direct", "10%", "bg-[#dcd9dc]"],
] as const;

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
  const [range, setRange] = useState<AnalyticsRange>("30D");

  return (
    <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-8">
      <header className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
        <div>
          <h1 className="text-4xl font-black tracking-[-0.055em] text-[var(--ink)] sm:text-5xl">
            Analytics Overview
          </h1>
          <p className="mt-3 text-lg font-medium leading-8 text-[var(--muted)]">
            Monitor your shelf performance and audience engagement.
          </p>
          <p className="sr-only">
            Live database telemetry: {metrics.clicks.toLocaleString()} clicks,{" "}
            {metrics.shares.toLocaleString()} shares, {metrics.conversionRate}% conversion,
            and {formatCurrency(metrics.revenueCents)} simulated revenue.
          </p>
        </div>

        <div
          aria-label="Analytics date range"
          className="flex w-fit items-center gap-1 rounded-xl border border-[var(--line)] bg-white p-1 shadow-[0_6px_22px_rgba(11,19,43,0.06)]"
          role="group"
        >
          {ranges.map((item) => (
            <button
              aria-pressed={range === item}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg px-4 text-sm font-bold text-[var(--muted)] transition-colors aria-pressed:bg-[var(--glow)] aria-pressed:text-[var(--ink)] aria-pressed:shadow-sm hover:bg-[var(--surface-low)] hover:text-[var(--ink)]"
              key={item}
              onClick={() => setRange(item)}
              type="button"
            >
              {item === "Custom" ? (
                <span aria-hidden="true" className="material-symbols-outlined text-lg">
                  calendar_today
                </span>
              ) : null}
              {item}
            </button>
          ))}
        </div>
      </header>

      {range === "Custom" ? (
        <label className="-mt-3 block max-w-xs" htmlFor="custom-range">
          <span className="text-sm font-bold text-[var(--muted)]">Custom date range</span>
          <input
            className="mt-2 min-h-11 w-full rounded-2xl border border-[var(--line)] bg-white px-4 text-sm font-semibold shadow-[var(--shadow-card)]"
            id="custom-range"
            placeholder="Jun 1 – Jun 24"
          />
        </label>
      ) : null}

      <section aria-label="Analytics summary" className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {analyticsStats.map((stat) => (
          <article
            aria-label={stat.label}
            className="group relative min-h-[176px] overflow-hidden rounded-2xl border border-white/80 bg-white p-6 shadow-[0_12px_32px_rgba(11,19,43,0.055)] transition-shadow hover:shadow-[0_18px_44px_rgba(11,19,43,0.09)]"
            key={stat.label}
          >
            <div
              aria-hidden="true"
              className={`absolute right-0 top-0 h-24 w-24 rounded-bl-[100px] ${stat.accentClassName}`}
            />
            <div className="relative flex items-start justify-between">
              <div
                className={`grid h-10 w-10 place-items-center rounded-lg ${stat.iconClassName}`}
              >
                <span aria-hidden="true" className="material-symbols-outlined text-2xl">
                  {stat.icon}
                </span>
              </div>
              <span
                className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-black ${
                  stat.trendDirection === "down"
                    ? "bg-[#ffdad6]/60 text-[var(--danger)]"
                    : "bg-[rgba(100,246,227,0.55)] text-[var(--teal-700)]"
                }`}
              >
                <span aria-hidden="true" className="material-symbols-outlined text-sm">
                  {stat.trendDirection === "down" ? "trending_down" : "trending_up"}
                </span>
                {stat.trend}
              </span>
            </div>
            <p className="mt-7 text-base font-bold text-[var(--muted)]">{stat.label}</p>
            <p className="mt-3 text-5xl font-black tracking-[-0.06em] text-[var(--ink)]">
              {stat.value}
            </p>
          </article>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <section
          aria-labelledby="shelf-performance-heading"
          className="rounded-2xl border border-white/80 bg-white p-6 shadow-[0_12px_32px_rgba(11,19,43,0.055)]"
        >
          <div className="flex items-center justify-between gap-4">
            <h2
              className="text-3xl font-black tracking-[-0.045em] text-[var(--ink)]"
              id="shelf-performance-heading"
            >
              Shelf Performance
            </h2>
            <button
              className="inline-flex items-center gap-1 text-sm font-black text-[var(--teal-500)] hover:underline"
              type="button"
            >
              View All
              <span aria-hidden="true" className="material-symbols-outlined text-lg">
                arrow_forward
              </span>
            </button>
          </div>

          <div className="mt-7 grid gap-4">
            {shelfPerformance.map((shelf) => (
              <article
                className="group grid min-h-[82px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 rounded-xl border border-[var(--line)] bg-[var(--surface-low)] p-4 transition-colors hover:border-[rgba(0,191,174,0.5)] md:grid-cols-[auto_minmax(0,1fr)_120px_auto]"
                key={shelf.title}
              >
                {"image" in shelf ? (
                  <Image
                    alt={shelf.imageAlt}
                    className="h-12 w-12 rounded-lg object-cover shadow-sm"
                    height={48}
                    src={shelf.image}
                    width={48}
                  />
                ) : (
                  <div className="grid h-12 w-12 place-items-center rounded-lg bg-[#dbe1ff] text-[#131a33]">
                    <span aria-hidden="true" className="material-symbols-outlined text-2xl">
                      {shelf.icon}
                    </span>
                  </div>
                )}

                <div className="min-w-0">
                  <h3 className="truncate text-lg font-black tracking-[-0.035em] text-[var(--ink)] group-hover:text-[var(--teal-700)]">
                    {shelf.title}
                  </h3>
                  <p className="mt-1 text-sm font-bold text-[var(--muted)]">{shelf.updated}</p>
                </div>

                <div className="hidden min-w-[120px] md:block">
                  <div className="relative h-8 overflow-hidden rounded-full">
                    <span
                      aria-hidden="true"
                      className={`absolute inset-x-0 top-3 h-2 rounded-full blur-[1px] ${shelf.lineClassName}`}
                    />
                  </div>
                </div>

                <div className="text-right">
                  <p className="whitespace-nowrap text-sm font-black text-[var(--ink)] sm:text-base">
                    {shelf.views}
                  </p>
                  <p
                    className={`mt-1 inline-flex items-center justify-end gap-1 text-xs font-black ${
                      shelf.direction === "down"
                        ? "text-[var(--danger)]"
                        : shelf.direction === "up"
                          ? "text-[var(--teal-700)]"
                          : "text-[var(--muted)]"
                    }`}
                  >
                    <span aria-hidden="true" className="material-symbols-outlined text-sm">
                      {shelf.direction === "down"
                        ? "arrow_downward"
                        : shelf.direction === "up"
                          ? "arrow_upward"
                          : "horizontal_rule"}
                    </span>
                    {shelf.change}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section
          aria-labelledby="traffic-sources-heading"
          className="rounded-2xl border border-white/80 bg-white p-6 shadow-[0_12px_32px_rgba(11,19,43,0.055)]"
        >
          <h2
            className="text-3xl font-black tracking-[-0.045em] text-[var(--ink)]"
            id="traffic-sources-heading"
          >
            Traffic Sources
          </h2>
          <div
            aria-label="Traffic source donut"
            className="relative mx-auto mt-7 grid h-44 w-44 place-items-center rounded-full bg-[conic-gradient(var(--teal-500)_0_45%,var(--ink)_45%_75%,var(--glow)_75%_90%,#dcd9dc_90%_100%)]"
            role="img"
          >
            <div className="grid h-[128px] w-[128px] place-items-center rounded-full bg-white text-center shadow-inner">
              <span>
                <span className="block text-3xl font-black tracking-[-0.05em]">1.2M</span>
                <span className="block text-sm font-bold text-[var(--muted)]">Total</span>
              </span>
            </div>
          </div>
          <div className="mt-8 grid gap-4">
            {trafficSources.map(([label, value, color]) => (
              <div className="flex items-center justify-between gap-4" key={label}>
                <span className="inline-flex items-center gap-3 text-base font-bold text-[var(--ink)]">
                  <span aria-hidden="true" className={`h-3 w-3 rounded-full ${color}`} />
                  {label}
                </span>
                <span className="text-base font-black text-[var(--ink)]">{value}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
