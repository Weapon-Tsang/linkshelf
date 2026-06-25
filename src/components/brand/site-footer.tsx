import { BrandMark } from "@/components/brand/brand-mark";

const footerLinks = ["Privacy Policy", "Terms of Service", "Cookie Policy", "Contact"] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-[#c6c6ce]/20 bg-[var(--surface)]">
      <div className="mx-auto flex max-w-[1280px] flex-col items-center justify-between gap-5 px-5 py-12 md:flex-row md:px-10">
        <BrandMark className="text-lg" />

        <div className="flex flex-wrap justify-center gap-x-6 gap-y-3">
          {footerLinks.map((label) => (
            <a
              className="text-sm font-medium text-[var(--muted)] transition-colors hover:text-[var(--ink)]"
              href="#"
              key={label}
            >
              {label}
            </a>
          ))}
        </div>

        <p className="text-sm font-medium text-[var(--muted)]">
          © 2026 LinkShelf Inc. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
