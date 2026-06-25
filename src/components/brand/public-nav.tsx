import Link from "next/link";
import { BrandMark } from "@/components/brand/brand-mark";

const CREATOR_LOGIN_HREF = "/login?returnTo=%2Fstudio%2Fdashboard";

export function PublicNav() {
  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-[#c6c6ce]/30 bg-[var(--surface)]/82 shadow-sm backdrop-blur-md">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between px-5 py-4 md:px-10">
        <Link aria-label="LinkShelf home" href="/">
          <BrandMark className="text-lg md:text-2xl" />
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <a
            className="border-b-2 border-[var(--ink)] pb-1 text-sm font-semibold text-[var(--ink)] transition-transform active:scale-95"
            href="#explore"
          >
            Explore
          </a>
          <a
            className="text-sm font-medium text-[var(--muted)] transition-colors hover:text-[var(--ink)]"
            href="#pricing"
          >
            Pricing
          </a>
        </div>

        <a
          className="hidden rounded-full bg-[var(--ink)] px-6 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 md:inline-flex"
          href={CREATOR_LOGIN_HREF}
        >
          Get Started
        </a>

        <a
          aria-label="Get Started"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--line)] text-[var(--ink)] md:hidden"
          href={CREATOR_LOGIN_HREF}
        >
          <span aria-hidden="true" className="material-symbols-outlined">
            menu
          </span>
        </a>
      </div>
    </nav>
  );
}
