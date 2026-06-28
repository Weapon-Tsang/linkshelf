"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

const navItems = [
  { label: "Dashboard", href: "/admin/dashboard", icon: "dashboard" },
  { label: "Creators", href: "/admin/dashboard#creators", icon: "group" },
  { label: "Content Moderation", href: "/admin/dashboard#moderation", icon: "fact_check" },
  { label: "Analytics", href: "/admin/dashboard#analytics", icon: "analytics" },
  { label: "Payments", href: "/admin/dashboard#payments", icon: "payments" },
  { label: "Settings", href: "/admin/dashboard#settings", icon: "settings" },
] as const;

export function AdminShell({
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
    <div className="min-h-screen bg-white text-[var(--ink)] lg:grid lg:grid-cols-[256px_minmax(0,1fr)]">
      <aside className="border-b border-[var(--line)] bg-white px-5 py-5 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:border-b-0 lg:border-r lg:px-4 lg:py-6">
        <Link className="inline-flex items-center gap-3 px-2" href="/admin/dashboard">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--teal-700)] text-xl font-bold text-white">
            L
          </span>
          <span className="text-xl font-bold tracking-tight">LinkShelf Admin</span>
        </Link>

        <nav aria-label="Admin" className="mt-8 grid grid-cols-2 gap-2 lg:grid-cols-1">
          {navItems.map((item) => {
            const active = pathname === "/admin/dashboard" && item.label === "Dashboard";
            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-full px-4 py-3 text-sm font-bold text-[var(--muted)] transition-colors hover:bg-[var(--surface-low)] hover:text-[var(--teal-700)]",
                  active &&
                    "bg-[var(--teal-700)] text-white shadow-[0_14px_30px_rgba(0,191,174,0.2)] hover:bg-[var(--teal-700)] hover:text-white",
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

        <div className="mt-auto hidden rounded-2xl bg-[var(--surface-low)] p-4 lg:block">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-[var(--ink)] text-sm font-bold text-white">
              SA
            </div>
            <div>
              <p className="text-sm font-bold leading-tight">{user.displayName}</p>
              <p className="text-xs font-semibold text-[var(--muted)]">System Root</p>
            </div>
          </div>
          <button
            className="mt-3 min-h-10 w-full rounded-lg border border-[var(--line)] bg-white text-xs font-bold text-[var(--ink)] transition-colors hover:bg-[var(--surface-low)]"
            type="button"
          >
            Support Portal
          </button>
        </div>
      </aside>
      <main className="min-w-0 overflow-y-auto px-5 py-6 sm:px-8 lg:px-6">{children}</main>
    </div>
  );
}
