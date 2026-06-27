"use client";

import type { ShelfEditorProductInput } from "@/features/shelves/actions";
import { cn } from "@/lib/cn";

export type PreviewDevice = "mobile" | "tablet";

export function ShelfPreview({
  device,
  title,
  description,
  coverUrl,
  products,
  presentation = "standard",
}: {
  readonly device: PreviewDevice;
  readonly title: string;
  readonly description: string;
  readonly coverUrl: string;
  readonly products: readonly ShelfEditorProductInput[];
  readonly presentation?: "standard" | "stitch-create";
}) {
  if (presentation === "stitch-create" && device === "tablet") {
    const skeletonCards = products.length ? products.slice(0, 3) : [undefined, undefined, undefined];

    return (
      <aside className="w-full max-w-xl">
        <p className="mb-4 text-center text-xs font-black uppercase tracking-[0.18em] text-[var(--muted)]">
          tablet preview
        </p>
        <div
          className="relative h-[390px] overflow-hidden rounded-[28px] bg-[#c8cee4] shadow-[0_24px_58px_rgba(68,79,128,0.18)]"
          data-testid="tablet-preview-frame"
        >
          <div
            aria-hidden="true"
            className="absolute left-1/2 top-12 h-36 w-72 -translate-x-1/2 rounded-2xl border border-white/55 bg-white/35 p-4"
          >
            <div className="mx-auto mb-3 h-2 w-28 rounded-full bg-white/55" />
            <div className="grid gap-2">
              <div className="h-2 rounded-full bg-white/50" />
              <div className="h-2 w-10/12 rounded-full bg-white/45" />
              <div className="h-2 w-8/12 rounded-full bg-white/40" />
            </div>
          </div>

          <div
            className="absolute bottom-8 left-1/2 w-[82%] -translate-x-1/2 rounded-[28px] bg-white p-7 text-center shadow-[0_18px_42px_rgba(11,19,43,0.12)]"
            data-testid="tablet-preview-overlay"
          >
            <h3 className="text-2xl font-black tracking-[-0.04em]">
              {title || "Untitled Shelf"}
            </h3>
            <div className="mt-6 grid grid-cols-2 gap-4">
              {skeletonCards.map((product, index) => (
                <article
                  aria-label={product?.title ? `Tablet product placeholder ${index + 1}` : undefined}
                  className="rounded-2xl border border-[var(--line)] bg-white p-4"
                  data-testid="tablet-preview-skeleton-card"
                  key={`${product?.id ?? "tablet-placeholder"}-${index}`}
                >
                  <div className="mx-auto h-16 w-16 rounded-md bg-[var(--surface-low)]" />
                  <div className="mx-auto mt-4 h-3 w-20 rounded-full bg-[var(--surface-low)]" />
                  <div className="mx-auto mt-2 h-3 w-16 rounded-full bg-[var(--line)]" />
                </article>
              ))}
            </div>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside
      className={cn(
        "rounded-[36px] border border-white/80 bg-white/82 p-5 shadow-[var(--shadow-card)]",
        device === "mobile" ? "max-w-sm" : "max-w-xl",
      )}
    >
      <p className="mb-4 text-sm font-bold uppercase tracking-[0.18em] text-[var(--teal-700)]">
        {device} preview
      </p>
      <div className="overflow-hidden rounded-[28px] border border-[var(--line)] bg-[var(--surface)]">
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt="" className="h-44 w-full object-cover" src={coverUrl} />
        ) : (
          <div className="grid h-44 place-items-center bg-[var(--glow)] text-sm font-bold text-[var(--teal-700)]">
            Add a cover image
          </div>
        )}
        <div className="p-5">
          <h2 className="text-2xl font-bold tracking-[-0.03em]">
            {title || "Untitled Shelf"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            {description || "Describe what makes this shelf useful."}
          </p>
          <div className="mt-5 grid gap-3">
            {products.map((product, index) => (
              <article
                className="rounded-2xl border border-[var(--line)] bg-white p-3"
                key={`${product.id ?? "draft"}-${index}`}
              >
                <p className="font-bold">
                  {product.title || product.destinationUrl || "Untitled product"}
                </p>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {product.merchant || "Merchant"} · ${product.price ?? "—"}
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
