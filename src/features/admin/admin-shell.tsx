"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { BrandMark } from "@/components/brand/brand-mark";
import { cn } from "@/lib/cn";

const navItems = [
  { label: "Dashboard", href: "/admin/dashboard", icon: "admin_panel_settings" },
  { label: "Studio", href: "/studio/dashboard", icon: "shelves" },
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
    <div className="min-h-screen bg-[#f7f4ef] text-[var(--ink)] lg:grid lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="border-b border-[var(--line)] bg-white/78 px-5 py-5 backdrop-blur-xl lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:border-b-0 lg:border-r lg:px-6 lg:py-7">
        <Link className="inline-flex" href="/admin/dashboard">
          <BrandMark className="text-2xl" />
        </Link>
        <div className="mt-7 rounded-3xl border border-[var(--line)] bg-[var(--surface-low)] p-4">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
            Super Admin
          </p>
          <p className="mt-2 text-lg font-bold">{user.displayName}</p>
          <p className="mt-1 text-sm font-semibold text-[var(--teal-700)]">
            Brand identity and revenue control
          </p>
        </div>
        <nav aria-label="Admin" className="mt-6 grid grid-cols-2 gap-2 lg:grid-cols-1">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-[var(--muted)] transition-colors hover:bg-[var(--surface-low)] hover:text-[var(--ink)]",
                  active && "bg-[var(--teal-700)] text-white hover:bg-[var(--teal-700)] hover:text-white",
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
        <div className="mt-auto hidden rounded-3xl bg-[var(--glow)] p-5 lg:block">
          <p className="text-sm font-bold text-[var(--ink)]">80/20 monitor</p>
          <p className="mt-2 text-sm leading-6 text-[var(--ink)]/80">
            Review affiliate attribution, withdrawal queues, and platform revenue controls.
          </p>
        </div>
      </aside>
      <main className="min-w-0 px-5 py-8 sm:px-8 lg:px-10 lg:py-10">{children}</main>
    </div>
  );
}
