import type { PublicShelf } from "@/features/shelves/types";
import { HotspotHero } from "./hotspot-hero";
import { ProductCard } from "./product-card";

function safeExternalHref(value: string) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? value : "#";
  } catch {
    return "#";
  }
}

export function ShelfPage({
  shelf,
  shareCode,
  initialShareDialogOpen = false,
}: {
  readonly shelf: PublicShelf;
  readonly shareCode?: string;
  readonly initialShareDialogOpen?: boolean;
}) {
  const shareDialog = shareCode
    ? {
        channels: shelf.socialChannels.map((channel) => ({
          type: channel.type,
          enabled: true,
        })),
        initialOpen: initialShareDialogOpen,
        shelfId: shelf.id,
        shortUrl: `/${shelf.creator.handle}/${shelf.slug}?share=${encodeURIComponent(shareCode)}`,
      }
    : undefined;

  return (
    <div className="min-h-screen bg-[var(--surface)] text-[var(--ink)] md:bg-[linear-gradient(135deg,#fcf8fb,#f0fffb)]">
      <main className="mx-auto max-w-[1180px] md:grid md:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)] md:gap-8 md:px-6 md:py-8">
        <div className="md:sticky md:top-8 md:self-start">
          <HotspotHero shareDialog={shareDialog} shelf={shelf} />
        </div>

        <div className="relative z-20 -mt-8 px-5 pb-12 md:mt-0 md:px-0">
          <section className="rounded-t-[32px] bg-[var(--surface)] px-2 pb-4 pt-10 text-center md:rounded-[32px] md:bg-white/72 md:p-10 md:shadow-[0_18px_70px_rgba(11,19,43,0.08)] md:backdrop-blur">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
              {shelf.category}
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-[-0.02em] md:text-5xl">
              {shelf.title}
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-[var(--muted)]">
              {shelf.description}
            </p>
          </section>

          {shelf.sourceContentUrl ? (
            <a
              aria-label="Explore the original post & story behind this setup"
              className="mt-8 flex items-center justify-between gap-4 rounded-3xl bg-[#f3f4f6] p-5 text-left text-lg font-bold text-[var(--ink)] transition-colors hover:bg-[#e9ebef]"
              href={safeExternalHref(shelf.sourceContentUrl)}
            >
              <span className="flex items-center gap-3">
                <span aria-hidden="true">✨</span>
                <span>Explore the original post & story behind this setup</span>
              </span>
              <span aria-hidden="true" className="material-symbols-outlined text-[var(--muted)]">
                arrow_outward
              </span>
            </a>
          ) : null}

          <section className="mt-8 flex flex-col gap-6" aria-label={`${shelf.title} products`}>
            {shelf.products.map((product, index) => (
              <div id={`product-${product.id}`} key={product.id}>
                <ProductCard index={index} product={product} shareCode={shareCode} />
              </div>
            ))}
          </section>
        </div>
      </main>

      <footer className="border-t border-[var(--line)] py-8 text-center text-sm font-semibold text-[var(--muted)]">
        Powered by <span className="text-[var(--ink)]">LinkShelf</span>
      </footer>
    </div>
  );
}
