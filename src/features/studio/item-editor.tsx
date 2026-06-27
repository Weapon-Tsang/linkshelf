"use client";

import type { ShelfEditorProductInput } from "@/features/shelves/actions";

function formatPrice(price: number | undefined): string | null {
  if (typeof price !== "number" || !Number.isFinite(price)) return null;
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    style: "currency",
  }).format(price);
}

export function ItemEditor({
  product,
  index,
  canMoveUp,
  canMoveDown,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  onFetchMetadata,
  density = "full",
}: {
  readonly product: ShelfEditorProductInput;
  readonly index: number;
  readonly canMoveUp: boolean;
  readonly canMoveDown: boolean;
  readonly onChange: (product: ShelfEditorProductInput) => void;
  readonly onRemove: () => void;
  readonly onMoveUp: () => void;
  readonly onMoveDown: () => void;
  readonly onFetchMetadata: () => void | Promise<void>;
  readonly density?: "full" | "compact";
}) {
  const fieldId = (field: string) => `product-${index}-${field}`;
  const compact = density === "compact";
  const cardClass = compact
    ? "rounded-2xl border border-[var(--line)] bg-white/92 p-3.5 shadow-[0_10px_28px_rgba(11,19,43,0.04)]"
    : "rounded-[28px] border border-[var(--line)] bg-white p-5";
  const headerClass = compact
    ? "mb-3 flex items-center justify-between gap-3"
    : "mb-5 flex items-center justify-between gap-3";
  const iconButtonClass = compact
    ? "grid h-8 w-8 place-items-center rounded-full border border-[var(--line)] disabled:opacity-40"
    : "grid h-9 w-9 place-items-center rounded-full border border-[var(--line)] disabled:opacity-40";
  const removeButtonClass = compact
    ? "grid h-8 w-8 place-items-center rounded-full border border-[var(--danger)] text-[var(--danger)]"
    : "grid h-9 w-9 place-items-center rounded-full border border-[var(--danger)] text-[var(--danger)]";
  const inputClass = compact
    ? "min-h-8 w-full rounded-md border border-[var(--line)] bg-[var(--surface-low)] px-2.5 text-xs font-semibold outline-none focus:border-[var(--teal-700)]"
    : "min-h-11 w-full rounded-2xl border border-[var(--line)] bg-[var(--surface-low)] px-4 text-sm font-semibold outline-none focus:border-[var(--teal-700)]";
  const urlInputClass = compact
    ? "min-h-8 min-w-0 flex-1 rounded-md border border-[var(--line)] bg-[var(--surface-low)] px-2.5 text-xs font-semibold outline-none focus:border-[var(--teal-700)]"
    : "min-h-11 min-w-0 flex-1 rounded-2xl border border-[var(--line)] bg-[var(--surface-low)] px-4 text-sm font-semibold outline-none focus:border-[var(--teal-700)]";
  const fetchButtonClass = compact
    ? "rounded-xl bg-[var(--ink)] px-3 text-xs font-bold text-white"
    : "rounded-2xl bg-[var(--ink)] px-4 text-sm font-bold text-white";
  const formattedPrice = formatPrice(product.price);

  function patch(next: Partial<ShelfEditorProductInput>) {
    onChange({ ...product, ...next });
  }

  return (
    <fieldset
      aria-label={`Product ${index + 1}`}
      className={cardClass}
      data-density={density}
    >
      {compact ? (
        <div className="grid gap-2.5">
          <div className="flex items-start gap-2.5">
            <span
              aria-label="Drag product handle"
              className="material-symbols-outlined mt-8 text-base text-[var(--muted)]"
            >
              drag_indicator
            </span>
            <span className="mt-6 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--mint-300)] text-xs font-black text-[var(--teal-700)]">
              {index + 1}
            </span>
            <label className="min-w-0 flex-1" htmlFor={fieldId("title")}>
              <span className="text-[9px] font-black uppercase tracking-[0.18em] text-[var(--muted)]">
                ITEM NAME
              </span>
              <input
                className={`mt-1 ${inputClass}`}
                id={fieldId("title")}
                onChange={(event) => patch({ title: event.target.value })}
                value={product.title ?? ""}
              />
            </label>
            <button
              aria-label="Remove product"
              className="mt-6 grid h-7 w-7 shrink-0 place-items-center rounded-md border border-[var(--line)] text-[var(--muted)]"
              onClick={onRemove}
              type="button"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-base">
                delete
              </span>
            </button>
          </div>

          <label htmlFor={fieldId("url")}>
            <span className="text-[9px] font-black uppercase tracking-[0.18em] text-[var(--muted)]">
              Product URL
            </span>
            <input
              aria-label="Product URL"
              className={`mt-1 ${urlInputClass}`}
              id={fieldId("url")}
              onChange={(event) => patch({ destinationUrl: event.target.value })}
              placeholder="https://www.amazon.com/dp/B0CAMERA"
              value={product.destinationUrl ?? ""}
            />
          </label>

          <div className="flex flex-wrap gap-2">
            {product.merchant ? (
              <span className="rounded-md bg-[#eef3f1] px-2.5 py-1 text-[10px] font-black text-[var(--teal-700)]">
                {product.merchant}
              </span>
            ) : null}
            {formattedPrice ? (
              <span className="rounded-md bg-[#f3eef1] px-2.5 py-1 text-[10px] font-black text-[var(--ink)]">
                {formattedPrice}
              </span>
            ) : null}
          </div>
        </div>
      ) : (
        <>
          <div className={headerClass}>
            <legend className="text-lg font-bold">
              Product {index + 1}
              {product.title ? (
                <span className="ml-2 text-sm font-semibold text-[var(--muted)]">
                  {product.title}
                </span>
              ) : null}
            </legend>
            <div className="flex gap-2">
              <button
                aria-label="Move product up"
                className={iconButtonClass}
                disabled={!canMoveUp}
                onClick={onMoveUp}
                type="button"
              >
                <span aria-hidden="true" className="material-symbols-outlined text-lg">
                  arrow_upward
                </span>
              </button>
              <button
                aria-label="Move product down"
                className={iconButtonClass}
                disabled={!canMoveDown}
                onClick={onMoveDown}
                type="button"
              >
                <span aria-hidden="true" className="material-symbols-outlined text-lg">
                  arrow_downward
                </span>
              </button>
              <button
                aria-label="Remove product"
                className={removeButtonClass}
                onClick={onRemove}
                type="button"
              >
                <span aria-hidden="true" className="material-symbols-outlined text-lg">
                  close
                </span>
              </button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="md:col-span-2" htmlFor={fieldId("url")}>
              <span className="text-sm font-bold text-[var(--muted)]">Product URL</span>
              <div className="mt-2 flex gap-2">
                <input
                  aria-label="Product URL"
                  className={urlInputClass}
                  id={fieldId("url")}
                  onChange={(event) => patch({ destinationUrl: event.target.value })}
                  placeholder="https://www.amazon.com/dp/B0CAMERA"
                  value={product.destinationUrl ?? ""}
                />
                <button
                  className={fetchButtonClass}
                  onClick={onFetchMetadata}
                  type="button"
                >
                  Fetch metadata
                </button>
              </div>
            </label>

            <label htmlFor={fieldId("title")}>
              <span className="text-sm font-bold text-[var(--muted)]">Product title</span>
              <input
                className={`mt-2 ${inputClass}`}
                id={fieldId("title")}
                onChange={(event) => patch({ title: event.target.value })}
                value={product.title ?? ""}
              />
            </label>

            <label htmlFor={fieldId("merchant")}>
              <span className="text-sm font-bold text-[var(--muted)]">Merchant</span>
              <input
                className={`mt-2 ${inputClass}`}
                id={fieldId("merchant")}
                onChange={(event) => patch({ merchant: event.target.value })}
                value={product.merchant ?? ""}
              />
            </label>

            <label htmlFor={fieldId("price")}>
              <span className="text-sm font-bold text-[var(--muted)]">Price</span>
              <input
                className={`mt-2 ${inputClass}`}
                id={fieldId("price")}
                min="0"
                onChange={(event) => patch({ price: Number(event.target.value) })}
                step="0.01"
                type="number"
                value={product.price ?? ""}
              />
            </label>

            <label htmlFor={fieldId("image")}>
              <span className="text-sm font-bold text-[var(--muted)]">Image URL</span>
              <input
                className="mt-2 min-h-11 w-full rounded-2xl border border-[var(--line)] bg-[var(--surface-low)] px-4 text-sm font-semibold outline-none focus:border-[var(--teal-700)]"
                id={fieldId("image")}
                onChange={(event) => patch({ imageUrl: event.target.value })}
                value={product.imageUrl ?? ""}
              />
            </label>

            <label className="md:col-span-2" htmlFor={fieldId("description")}>
              <span className="text-sm font-bold text-[var(--muted)]">
                Product description
              </span>
              <textarea
                className="mt-2 min-h-24 w-full rounded-2xl border border-[var(--line)] bg-[var(--surface-low)] px-4 py-3 text-sm font-semibold outline-none focus:border-[var(--teal-700)]"
                id={fieldId("description")}
                onChange={(event) => patch({ description: event.target.value })}
                value={product.description ?? ""}
              />
            </label>
          </div>
        </>
      )}
    </fieldset>
  );
}
