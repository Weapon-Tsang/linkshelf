"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { BrandMark } from "@/components/brand/brand-mark";
import { cn } from "@/lib/cn";

const navigationItems = [
  {
    label: "Dashboard",
    href: "/studio/dashboard",
    icon: "dashboard",
  },
  {
    label: "Shelves",
    href: "/studio/shelves",
    icon: "shelves",
  },
  {
    label: "Analytics",
    href: "/studio/analytics",
    icon: "monitoring",
  },
  {
    label: "Comments",
    href: "/studio/comments",
    icon: "forum",
  },
  {
    label: "Settings",
    href: "/studio/settings",
    icon: "settings",
  },
] as const;

export function StudioShell({
  creator,
  children,
}: {
  readonly creator: {
    readonly displayName: string;
    readonly handle: string;
  };
  readonly children: ReactNode;
}) {
  const pathname = usePathname();
  const isCreateWorkflow = pathname === "/studio/create";
  const showCreateCta = pathname !== "/studio/dashboard";

  if (isCreateWorkflow) {
    return (
      <div className="min-h-screen bg-[#fbf7fb] text-[var(--ink)]">
        <main className="min-w-0 px-5 py-8 sm:px-8 lg:px-10 lg:py-10">{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fbf7fb] text-[var(--ink)] lg:grid lg:grid-cols-[250px_minmax(0,1fr)]">
      <aside className="border-b border-[var(--line)] bg-white px-5 py-5 shadow-[12px_0_34px_rgba(11,19,43,0.035)] lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:border-b-0 lg:px-6 lg:py-7">
        <Link href="/studio/dashboard" className="inline-flex items-start gap-2">
          <BrandMark className="text-2xl" />
        </Link>
        <p className="ml-9 -mt-1 text-xs font-semibold text-[var(--muted)]">
          Creator Management
        </p>
        <p className="sr-only">
          Workspace for {creator.displayName} @{creator.handle}
        </p>

        {showCreateCta ? (
          <Link
            className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--teal-700)] px-4 text-sm font-bold text-white shadow-[0_12px_26px_rgba(0,124,114,0.22)] transition-colors hover:bg-[var(--ink)]"
            href="/studio/create"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-lg">
              add
            </span>
            Create New Shelf
          </Link>
        ) : null}

        <nav
          aria-label="Studio"
          className={cn(
            "grid grid-cols-2 gap-2 sm:grid-cols-5 lg:grid-cols-1",
            showCreateCta ? "mt-7" : "mt-11",
          )}
        >
          {navigationItems.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/studio/dashboard" && pathname.startsWith(`${item.href}/`));
            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-[var(--muted)] transition-colors hover:bg-[var(--surface-low)] hover:text-[var(--ink)]",
                  active && "bg-[var(--glow)] text-[var(--ink)] shadow-sm hover:bg-[var(--glow)] hover:text-[var(--ink)]",
                )}
                data-active={active ? "true" : "false"}
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

        <div className="mt-auto hidden items-center gap-3 lg:flex">
          <div
            aria-hidden="true"
            className="grid h-10 w-10 place-items-center rounded-full bg-[linear-gradient(135deg,#00bfae,#0b132b)] text-sm font-black text-white"
          >
            AR
          </div>
          <div>
            <p className="text-sm font-bold">Alex Rivera</p>
            <p className="text-xs font-semibold text-[var(--muted)]">Pro Plan</p>
          </div>
        </div>
      </aside>

      <main className="min-w-0 px-5 py-8 sm:px-8 lg:px-10 lg:py-10">{children}</main>
    </div>
  );
}
