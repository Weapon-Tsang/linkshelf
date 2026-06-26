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
}: {
  readonly device: PreviewDevice;
  readonly title: string;
  readonly description: string;
  readonly coverUrl: string;
  readonly products: readonly ShelfEditorProductInput[];
}) {
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
