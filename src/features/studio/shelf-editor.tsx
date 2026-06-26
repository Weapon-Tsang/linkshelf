"use client";

import { useMemo, useState } from "react";
import type { ExtractedProductMetadata } from "@/features/shelves/metadata-adapter";
import type { ShelfEditorInput, ShelfEditorProductInput } from "@/features/shelves/actions";
import { ItemEditor } from "./item-editor";
import { ShelfPreview, type PreviewDevice } from "./shelf-preview";

type ShelfEditorAction = (formData: FormData) => void | Promise<void>;

function blankProduct(): ShelfEditorProductInput {
  return {
    destinationUrl: "",
    title: "",
    description: "",
    merchant: "",
    price: undefined,
    imageUrl: "",
    hotspotX: null,
    hotspotY: null,
  };
}

function normalizeInitialValue(value: ShelfEditorInput | undefined): Required<
  Pick<ShelfEditorInput, "title" | "slug" | "description" | "category" | "theme">
> &
  Pick<ShelfEditorInput, "shelfId" | "coverUrl" | "sourceContentUrl"> {
  return {
    shelfId: value?.shelfId,
    title: value?.title ?? "",
    slug: value?.slug ?? "",
    description: value?.description ?? "",
    category: value?.category ?? "General",
    theme: value?.theme ?? "tech",
    coverUrl: value?.coverUrl ?? "",
    sourceContentUrl: value?.sourceContentUrl ?? "",
  };
}

export function ShelfEditor({
  initialValue,
  action,
  onExtractMetadata,
}: {
  readonly initialValue?: ShelfEditorInput;
  readonly action?: ShelfEditorAction;
  readonly onExtractMetadata?: (url: string) => Promise<ExtractedProductMetadata>;
}) {
  const initial = useMemo(() => normalizeInitialValue(initialValue), [initialValue]);
  const [title, setTitle] = useState(initial.title);
  const [slug, setSlug] = useState(initial.slug);
  const [description, setDescription] = useState(initial.description);
  const [category, setCategory] = useState(initial.category);
  const [theme, setTheme] = useState(initial.theme);
  const [coverUrl, setCoverUrl] = useState(initial.coverUrl ?? "");
  const [sourceContentUrl, setSourceContentUrl] = useState(initial.sourceContentUrl ?? "");
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>("mobile");
  const [products, setProducts] = useState<readonly ShelfEditorProductInput[]>(
    initialValue?.products?.length ? initialValue.products : [blankProduct()],
  );

  function updateProduct(index: number, product: ShelfEditorProductInput) {
    setProducts((current) => current.map((item, itemIndex) => (itemIndex === index ? product : item)));
  }

  function moveProduct(index: number, direction: -1 | 1) {
    setProducts((current) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= current.length) return current;
      const next = [...current];
      const item = next[index];
      next[index] = next[nextIndex] ?? item;
      next[nextIndex] = item;
      return next;
    });
  }

  async function fetchMetadata(index: number) {
    const product = products[index];
    const url = product?.destinationUrl?.trim();
    if (!url || !onExtractMetadata) return;
    const metadata = await onExtractMetadata(url);
    updateProduct(index, {
      ...product,
      destinationUrl: url,
      title: metadata.title,
      description: metadata.description,
      merchant: metadata.merchant,
      price: metadata.price,
      imageUrl: metadata.imageUrl,
    });
  }

  const submitPayload = {
    shelfId: initialValue?.shelfId,
    title,
    slug,
    description,
    category,
    theme,
    coverUrl,
    sourceContentUrl,
    products,
  };

  return (
    <form action={action} className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_28rem]">
      {initialValue?.shelfId ? (
        <input name="shelfId" type="hidden" value={initialValue.shelfId} />
      ) : null}
      <input name="productsJson" type="hidden" value={JSON.stringify(products)} />

      <section className="space-y-6">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--teal-700)]">
            Shelf editor
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-[-0.04em]">
            {initialValue?.shelfId ? "Edit shelf" : "Create new shelf"}
          </h1>
        </div>

        <div className="rounded-[32px] border border-white/80 bg-white/82 p-6 shadow-[var(--shadow-card)]">
          <h2 className="text-2xl font-bold tracking-[-0.03em]">Shelf details</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label htmlFor="shelf-title">
              <span className="text-sm font-bold text-[var(--muted)]">Shelf title</span>
              <input
                className="mt-2 min-h-12 w-full rounded-2xl border border-[var(--line)] bg-[var(--surface-low)] px-4 text-sm font-semibold outline-none focus:border-[var(--teal-700)]"
                id="shelf-title"
                name="title"
                onChange={(event) => setTitle(event.target.value)}
                value={title}
              />
            </label>

            <label htmlFor="shelf-slug">
              <span className="text-sm font-bold text-[var(--muted)]">Slug</span>
              <input
                className="mt-2 min-h-12 w-full rounded-2xl border border-[var(--line)] bg-[var(--surface-low)] px-4 text-sm font-semibold outline-none focus:border-[var(--teal-700)]"
                id="shelf-slug"
                name="slug"
                onChange={(event) => setSlug(event.target.value)}
                value={slug}
              />
            </label>

            <label htmlFor="shelf-category">
              <span className="text-sm font-bold text-[var(--muted)]">Category</span>
              <input
                className="mt-2 min-h-12 w-full rounded-2xl border border-[var(--line)] bg-[var(--surface-low)] px-4 text-sm font-semibold outline-none focus:border-[var(--teal-700)]"
                id="shelf-category"
                name="category"
                onChange={(event) => setCategory(event.target.value)}
                value={category}
              />
            </label>

            <label htmlFor="shelf-theme">
              <span className="text-sm font-bold text-[var(--muted)]">Theme</span>
              <select
                className="mt-2 min-h-12 w-full rounded-2xl border border-[var(--line)] bg-[var(--surface-low)] px-4 text-sm font-semibold outline-none focus:border-[var(--teal-700)]"
                id="shelf-theme"
                name="theme"
                onChange={(event) => setTheme(event.target.value)}
                value={theme}
              >
                <option value="tech">Tech</option>
                <option value="minimal">Minimal</option>
                <option value="living">Living</option>
              </select>
            </label>

            <label className="md:col-span-2" htmlFor="shelf-cover">
              <span className="text-sm font-bold text-[var(--muted)]">Cover image URL</span>
              <input
                className="mt-2 min-h-12 w-full rounded-2xl border border-[var(--line)] bg-[var(--surface-low)] px-4 text-sm font-semibold outline-none focus:border-[var(--teal-700)]"
                id="shelf-cover"
                name="coverUrl"
                onChange={(event) => setCoverUrl(event.target.value)}
                value={coverUrl}
              />
            </label>

            <label className="md:col-span-2" htmlFor="shelf-source">
              <span className="text-sm font-bold text-[var(--muted)]">Source content URL</span>
              <input
                className="mt-2 min-h-12 w-full rounded-2xl border border-[var(--line)] bg-[var(--surface-low)] px-4 text-sm font-semibold outline-none focus:border-[var(--teal-700)]"
                id="shelf-source"
                name="sourceContentUrl"
                onChange={(event) => setSourceContentUrl(event.target.value)}
                value={sourceContentUrl}
              />
            </label>

            <label className="md:col-span-2" htmlFor="shelf-description">
              <span className="text-sm font-bold text-[var(--muted)]">Description</span>
              <textarea
                className="mt-2 min-h-28 w-full rounded-2xl border border-[var(--line)] bg-[var(--surface-low)] px-4 py-3 text-sm font-semibold outline-none focus:border-[var(--teal-700)]"
                id="shelf-description"
                name="description"
                onChange={(event) => setDescription(event.target.value)}
                value={description}
              />
            </label>
          </div>
        </div>

        <div className="rounded-[32px] border border-white/80 bg-white/82 p-6 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-bold tracking-[-0.03em]">Products</h2>
            <button
              className="rounded-full bg-[var(--teal-700)] px-4 py-2 text-sm font-bold text-white"
              onClick={() => setProducts((current) => [...current, blankProduct()])}
              type="button"
            >
              Add product
            </button>
          </div>
          <div className="mt-5 grid gap-4">
            {products.map((product, index) => (
              <ItemEditor
                canMoveDown={index < products.length - 1}
                canMoveUp={index > 0}
                index={index}
                key={`${product.id ?? "draft"}-${index}`}
                onChange={(nextProduct) => updateProduct(index, nextProduct)}
                onFetchMetadata={() => fetchMetadata(index)}
                onMoveDown={() => moveProduct(index, 1)}
                onMoveUp={() => moveProduct(index, -1)}
                onRemove={() =>
                  setProducts((current) =>
                    current.length === 1
                      ? [blankProduct()]
                      : current.filter((_, itemIndex) => itemIndex !== index),
                  )
                }
                product={product}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <input name="payload" type="hidden" value={JSON.stringify(submitPayload)} />
          <button
            className="rounded-full border border-[var(--teal-700)] px-6 py-3 font-bold text-[var(--teal-700)]"
            name="intent"
            type="submit"
            value="draft"
          >
            Save Draft
          </button>
          <button
            className="rounded-full bg-[var(--teal-700)] px-6 py-3 font-bold text-white"
            name="intent"
            type="submit"
            value="publish"
          >
            Publish
          </button>
        </div>
      </section>

      <section className="space-y-4 xl:sticky xl:top-8 xl:self-start">
        <div className="flex gap-2">
          {(["mobile", "tablet"] as const).map((device) => (
            <button
              aria-pressed={previewDevice === device}
              className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-bold capitalize aria-pressed:border-[var(--teal-700)] aria-pressed:bg-[var(--teal-700)] aria-pressed:text-white"
              key={device}
              onClick={() => setPreviewDevice(device)}
              type="button"
            >
              {device === "mobile" ? "Mobile preview" : "Tablet preview"}
            </button>
          ))}
        </div>
        <ShelfPreview
          coverUrl={coverUrl}
          description={description}
          device={previewDevice}
          products={products}
          title={title}
        />
      </section>
    </form>
  );
}
