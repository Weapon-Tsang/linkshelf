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
    <div className="min-h-screen bg-[var(--surface-low)]/70 text-[var(--ink)] lg:grid lg:grid-cols-[188px_minmax(0,1fr)]">
      <aside
        aria-label="Fan Hub side rail"
        className="border-b border-[var(--line)] bg-white px-5 py-5 shadow-[0_4px_20px_rgba(11,19,43,0.04)] lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-[188px] lg:flex-col lg:border-b-0 lg:border-r lg:py-7 lg:shadow-none"
      >
        <Link className="inline-flex flex-col items-start" href="/hub/dashboard">
          <BrandMark className="text-2xl" />
          <span className="mt-1 text-sm font-semibold text-[var(--muted)]">
            Creator Economy
          </span>
        </Link>
        <p className="sr-only">Signed in as {user.displayName}</p>
        <nav aria-label="Fan Hub" className="mt-9 grid grid-cols-2 gap-2 lg:grid-cols-1">
          {navItems.map((item) => {
            const active =
              item.href === "/hub/dashboard"
                ? pathname === "/hub/dashboard"
                : pathname === item.href;
            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 border-r-4 border-transparent px-4 py-3 text-sm font-bold text-[var(--muted)] transition-colors hover:bg-[var(--surface-low)] hover:text-[var(--ink)] lg:px-3",
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
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--teal-700)] px-5 py-3 text-sm font-bold text-white shadow-[0_14px_30px_rgba(0,191,174,0.22)] transition-transform hover:scale-[1.02] active:scale-95"
            href="/liamroberts.photo"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-xl">
              add
            </span>
            New Link
          </Link>
        </div>
      </aside>
      <main className="min-w-0 px-5 py-8 sm:px-8 lg:px-8 lg:py-7">{children}</main>
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
