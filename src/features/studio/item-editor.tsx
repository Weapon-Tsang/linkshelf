"use client";

import type { ShelfEditorProductInput } from "@/features/shelves/actions";

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
}) {
  const fieldId = (field: string) => `product-${index}-${field}`;

  function patch(next: Partial<ShelfEditorProductInput>) {
    onChange({ ...product, ...next });
  }

  return (
    <fieldset
      aria-label={`Product ${index + 1}`}
      className="rounded-[28px] border border-[var(--line)] bg-white p-5"
    >
      <div className="mb-5 flex items-center justify-between gap-3">
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
            className="grid h-9 w-9 place-items-center rounded-full border border-[var(--line)] disabled:opacity-40"
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
            className="grid h-9 w-9 place-items-center rounded-full border border-[var(--line)] disabled:opacity-40"
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
            className="grid h-9 w-9 place-items-center rounded-full border border-[var(--danger)] text-[var(--danger)]"
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
              className="min-h-11 min-w-0 flex-1 rounded-2xl border border-[var(--line)] bg-[var(--surface-low)] px-4 text-sm font-semibold outline-none focus:border-[var(--teal-700)]"
              id={fieldId("url")}
              onChange={(event) => patch({ destinationUrl: event.target.value })}
              placeholder="https://www.amazon.com/dp/B0CAMERA"
              value={product.destinationUrl ?? ""}
            />
            <button
              className="rounded-2xl bg-[var(--ink)] px-4 text-sm font-bold text-white"
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
            className="mt-2 min-h-11 w-full rounded-2xl border border-[var(--line)] bg-[var(--surface-low)] px-4 text-sm font-semibold outline-none focus:border-[var(--teal-700)]"
            id={fieldId("title")}
            onChange={(event) => patch({ title: event.target.value })}
            value={product.title ?? ""}
          />
        </label>

        <label htmlFor={fieldId("merchant")}>
          <span className="text-sm font-bold text-[var(--muted)]">Merchant</span>
          <input
            className="mt-2 min-h-11 w-full rounded-2xl border border-[var(--line)] bg-[var(--surface-low)] px-4 text-sm font-semibold outline-none focus:border-[var(--teal-700)]"
            id={fieldId("merchant")}
            onChange={(event) => patch({ merchant: event.target.value })}
            value={product.merchant ?? ""}
          />
        </label>

        <label htmlFor={fieldId("price")}>
          <span className="text-sm font-bold text-[var(--muted)]">Price</span>
          <input
            className="mt-2 min-h-11 w-full rounded-2xl border border-[var(--line)] bg-[var(--surface-low)] px-4 text-sm font-semibold outline-none focus:border-[var(--teal-700)]"
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
          <span className="text-sm font-bold text-[var(--muted)]">Product description</span>
          <textarea
            className="mt-2 min-h-24 w-full rounded-2xl border border-[var(--line)] bg-[var(--surface-low)] px-4 py-3 text-sm font-semibold outline-none focus:border-[var(--teal-700)]"
            id={fieldId("description")}
            onChange={(event) => patch({ description: event.target.value })}
            value={product.description ?? ""}
          />
        </label>
      </div>
    </fieldset>
  );
}
