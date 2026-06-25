/* eslint-disable @next/next/no-img-element -- Public shelf images come from the Stitch source or creator uploads. */

import type { PublicProfileProduct, PublicShelfProduct } from "@/features/shelves/types";

type ProductCardProduct = PublicShelfProduct | PublicProfileProduct;

function formatPrice(priceCents: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(priceCents / 100);
}

function productHref(productId: string, shareCode?: string) {
  const base = `/api/out/${encodeURIComponent(productId)}`;
  return shareCode ? `${base}?share=${encodeURIComponent(shareCode)}` : base;
}

export function ProductCard({
  product,
  shareCode,
  index,
  compact = false,
}: {
  readonly product: ProductCardProduct;
  readonly shareCode?: string;
  readonly index?: number;
  readonly compact?: boolean;
}) {
  return (
    <article
      aria-label={product.title}
      className={
        compact
          ? "landing-glass-card landing-glow-card flex items-center gap-4 rounded-2xl p-4"
          : "relative flex gap-4 rounded-3xl bg-white p-4 shadow-[0_12px_44px_rgba(11,19,43,0.07)] md:p-5"
      }
    >
      {typeof index === "number" ? (
        <span className="absolute -left-3 -top-3 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-[var(--teal-700)] text-sm font-bold text-white shadow-sm">
          {index + 1}
        </span>
      ) : null}

      <div
        className={
          compact
            ? "flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white p-2 shadow-sm"
            : "flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[var(--surface-low)]"
        }
      >
        {product.imageUrl ? (
          <img
            alt=""
            className={compact ? "h-full w-full object-contain" : "h-full w-full object-cover"}
            src={product.imageUrl}
          />
        ) : null}
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
        <div>
          <h3
            className={
              compact
                ? "text-sm font-semibold text-[var(--ink)]"
                : "text-xl font-bold tracking-[-0.02em] text-[var(--ink)] md:text-2xl"
            }
          >
            {product.title}
          </h3>
          <p className={compact ? "mt-1 text-xs text-[var(--muted)]" : "mt-2 text-sm font-medium leading-6 text-[var(--muted)]"}>
            {product.description}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[var(--ink)]">
              {formatPrice(product.priceCents, product.currency)}
            </span>
            {compact ? (
              <span className="rounded-md bg-[var(--teal-500)]/12 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[var(--teal-700)]">
                {product.merchant}
              </span>
            ) : null}
          </div>

          <a
            aria-label={`Get ${product.title}`}
            className="inline-flex items-center gap-1 rounded-full bg-[#eae7ea] px-4 py-2 text-sm font-bold text-[var(--ink)] transition-colors hover:bg-[var(--teal-700)] hover:text-white"
            href={productHref(product.id, shareCode)}
          >
            Get it
            <span aria-hidden="true" className="material-symbols-outlined text-base">
              shopping_bag
            </span>
          </a>
        </div>
      </div>
    </article>
  );
}
