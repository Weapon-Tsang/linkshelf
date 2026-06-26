"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { BrandMark } from "@/components/brand/brand-mark";
import { cn } from "@/lib/cn";

const navItems = [
  { label: "Wallet", href: "/hub/dashboard", icon: "account_balance_wallet" },
  { label: "My Shares", href: "/hub/dashboard#shares", icon: "share" },
  { label: "Saved", href: "/hub/dashboard#saved", icon: "bookmark" },
  { label: "Explore", href: "/liamroberts.photo", icon: "travel_explore" },
] as const;

export function HubShell({
  children,
  user,
}: {
  readonly children: ReactNode;
  readonly user: {
    readonly displayName: string;
  };
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[var(--surface-low)]/70 text-[var(--ink)] lg:grid lg:grid-cols-[256px_minmax(0,1fr)]">
      <aside className="border-b border-[var(--line)] bg-white px-5 py-5 shadow-[0_4px_20px_rgba(11,19,43,0.04)] lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:border-b-0 lg:border-r lg:px-6 lg:py-7">
        <Link className="inline-flex flex-col items-start" href="/hub/dashboard">
          <BrandMark className="text-2xl" />
          <span className="mt-1 text-sm font-semibold text-[var(--muted)]">
            Creator Economy
          </span>
        </Link>
        <div className="mt-8 rounded-3xl border border-[var(--line)] bg-[var(--surface-low)] p-4">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
            Fan Hub
          </p>
          <p className="mt-2 text-lg font-bold">{user.displayName}</p>
          <p className="mt-1 text-sm font-semibold text-[var(--teal-700)]">
            Rewards and saved shelves
          </p>
        </div>
        <nav aria-label="Fan Hub" className="mt-8 grid grid-cols-2 gap-2 lg:grid-cols-1">
          {navItems.map((item) => {
            const active =
              item.href === "/hub/dashboard"
                ? pathname === "/hub/dashboard"
                : pathname === item.href;
            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 border-r-4 border-transparent px-4 py-3 text-sm font-bold text-[var(--muted)] transition-colors hover:bg-[var(--surface-low)] hover:text-[var(--ink)]",
                  active &&
                    "border-[var(--teal-700)] bg-[var(--glow)] text-[var(--ink)] hover:bg-[var(--glow)] hover:text-[var(--ink)]",
                )}
                href={item.href}
                key={item.href}
              >
                <span aria-hidden="true" className="material-symbols-outlined text-xl">
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto pt-8">
          <Link
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--teal-700)] px-5 py-4 text-sm font-bold text-white shadow-[0_14px_30px_rgba(0,191,174,0.22)] transition-transform hover:scale-[1.02] active:scale-95"
            href="/liamroberts.photo"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-xl">
              add
            </span>
            New Link
          </Link>
          <div className="mt-4 hidden rounded-3xl bg-[var(--glow)] p-5 lg:block">
            <p className="text-sm font-bold text-[var(--ink)]">Share to earn</p>
            <p className="mt-2 text-sm leading-6 text-[var(--ink)]/80">
              Your fan links use your tracking ID first, then LinkShelf&apos;s platform fallback.
            </p>
          </div>
        </div>
      </aside>
      <main className="min-w-0 px-5 py-8 sm:px-8 lg:px-10 lg:py-10">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t border-[var(--line)] bg-white/90 px-4 py-3 backdrop-blur-md md:hidden">
        {navItems.slice(0, 3).map((item) => (
          <Link
            className="flex flex-col items-center gap-1 text-xs font-bold text-[var(--muted)]"
            href={item.href}
            key={item.href}
          >
            <span aria-hidden="true" className="material-symbols-outlined text-xl">
              {item.icon}
            </span>
            {item.label === "My Shares" ? "Shares" : item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
