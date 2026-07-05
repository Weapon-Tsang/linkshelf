import { BrandMark } from "@/components/brand/brand-mark";

const footerLinks = ["Privacy Policy", "Terms of Service", "Cookie Policy", "Contact"] as const;
const profileFooterLinks = ["Privacy", "Terms", "Cookies", "Contact"] as const;

export function SiteFooter({
  variant = "default",
}: {
  readonly variant?: "default" | "profile";
}) {
  const isProfile = variant === "profile";
  const links = isProfile ? profileFooterLinks : footerLinks;

  return (
    <footer
      className={
        isProfile
          ? "mt-12 w-full border-t border-[#c6c6ce]/30 bg-white py-8 transition-all ease-in-out"
          : "w-full border-t border-[#c6c6ce]/20 bg-[var(--surface)] transition-all ease-in-out"
      }
    >
      <div
        className={
          isProfile
            ? "mx-auto flex max-w-[1280px] flex-col items-center justify-between gap-4 px-6 md:flex-row"
            : "mx-auto flex max-w-[1280px] flex-col items-center justify-between gap-6 px-5 py-12 md:flex-row md:px-10"
        }
      >
        <BrandMark className="text-lg" />

        <div className="flex flex-wrap justify-center gap-6">
          {links.map((label) => (
            <a
              className={
                isProfile
                  ? "text-xs font-semibold uppercase leading-4 tracking-wider text-[var(--muted)] underline transition-colors duration-200 hover:text-[var(--teal-700)]"
                  : "text-sm font-medium text-[var(--muted)] transition-colors duration-200 hover:text-[var(--ink)]"
              }
              href="#"
              key={label}
            >
              {label}
            </a>
          ))}
        </div>

        <p className={isProfile ? "text-xs font-semibold leading-4 text-[var(--muted)]" : "text-sm font-medium text-[var(--muted)]"}>
          {isProfile ? "© 2024 LinkShelf Inc." : "© 2024 LinkShelf Inc. All rights reserved."}
        </p>
      </div>
    </footer>
  );
}
