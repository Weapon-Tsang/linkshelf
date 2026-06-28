"use client";

import type { ShelfEditorProductInput } from "@/features/shelves/actions";
import { cn } from "@/lib/cn";

export type PreviewDevice = "mobile" | "tablet";

const STITCH_LIAM_AVATAR_URL =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuB6yXZ9XFX1GPQAI3kFISkRWCEayI2tRpGzC3J35idZQbRoXmJy708U7hGywsG3ZNl-l-N0lraWe9zfF4WE6vn7kH6dymwzEHPKWJAWeYuVAl9gd_A1gNEjTnE-1K8PlUkCMgGE-qnmzRXKvfb9NzSPEqCOO2UMCTD08xgGK3f2paZJuW7-CvYEEHs-5Oh8Z4dokyrfYCv4PN1xae0XTaGcHMlU4gN8cy9mfaEqiNy38cJuNeltF83HC4pmC-HzzSjLVcLTL_yvuPk";

function formatPreviewPrice(price: number | undefined) {
  if (typeof price !== "number") return "—";
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: "currency",
  }).format(price);
}

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
  if (presentation === "stitch-create" && device === "mobile") {
    return (
      <aside className="w-full max-w-[280px]">
        <p className="mb-4 text-center text-xs font-black uppercase tracking-[0.18em] text-[var(--muted)]">
          mobile preview
        </p>
        <div
          className="flex h-[580px] flex-col overflow-hidden rounded-[32px] border-[6px] border-[var(--surface-low)] bg-white shadow-[0_18px_44px_rgba(11,19,43,0.08)]"
          data-testid="mobile-preview-phone"
        >
          <div className="flex h-6 items-center justify-between bg-white px-4 text-[10px] font-bold text-gray-500">
            <span>9:41</span>
            <span aria-hidden="true" className="flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">signal_cellular_4_bar</span>
              <span className="material-symbols-outlined text-xs">wifi</span>
              <span className="material-symbols-outlined text-xs">battery_full</span>
            </span>
          </div>

          <div className="flex-1 overflow-y-auto bg-[#fcf8fb] pb-6">
            <div className="relative h-48 w-full overflow-hidden">
              {coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt=""
                  className="h-full w-full object-cover"
                  src={coverUrl}
                />
              ) : (
                <div className="grid h-full place-items-center bg-[var(--glow)] text-xs font-black text-[var(--teal-700)]">
                  Add a cover image
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#fcf8fb] to-transparent" />
              <div className="absolute bottom-2 left-4 flex items-center gap-2">
                <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-white shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt="Liam Roberts avatar"
                    className="h-full w-full object-cover"
                    src={STITCH_LIAM_AVATAR_URL}
                  />
                </div>
                <div className="flex flex-col items-start">
                  <span className="rounded-sm bg-white/85 px-2 text-xs font-black text-[var(--ink)] backdrop-blur-sm">
                    Liam Roberts
                  </span>
                  <span className="mt-0.5 w-fit rounded-sm bg-white/85 px-2 text-[10px] font-bold text-[var(--teal-700)] backdrop-blur-sm">
                    @liamshoots
                  </span>
                </div>
              </div>
            </div>

            <div className="px-4 pt-4">
              <h3 className="text-lg font-black leading-tight tracking-[-0.03em]">
                {title || "Untitled Shelf"}
              </h3>
              <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                {description || "Describe what makes this shelf useful."}
              </p>
            </div>

            <div className="mt-5 grid gap-3 px-4">
              {products.map((product, index) => (
                <article
                  className="flex items-center gap-3 rounded-xl border border-[var(--line)]/70 bg-white p-3 shadow-sm"
                  key={`${product.id ?? "mobile-preview-product"}-${index}`}
                >
                  <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-[var(--surface-low)]">
                    {product.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        alt={`${product.title || "Product"} product image`}
                        className="h-full w-full object-cover mix-blend-multiply"
                        src={product.imageUrl}
                      />
                    ) : (
                      <span
                        aria-hidden="true"
                        className="material-symbols-outlined text-[var(--muted)]"
                      >
                        image
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate text-xs font-black text-[var(--ink)]">
                      {product.title || product.destinationUrl || "Untitled product"}
                    </h4>
                    <p className="mt-0.5 truncate text-[10px] font-semibold text-[var(--muted)]">
                      {product.merchant || "Merchant"} · {formatPreviewPrice(product.price)}
                    </p>
                  </div>
                  {index === 0 ? (
                    <button
                      aria-label={`Add ${product.title || "product"} to cart`}
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--glow)]/45 text-[var(--teal-700)]"
                      type="button"
                    >
                      <span aria-hidden="true" className="material-symbols-outlined text-base">
                        shopping_cart
                      </span>
                    </button>
                  ) : null}
                </article>
              ))}
            </div>
          </div>
        </div>
      </aside>
    );
  }

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
