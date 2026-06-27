"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ShelfEditorInput, ShelfEditorProductInput } from "@/features/shelves/actions";
import type { ExtractedProductMetadata } from "@/features/shelves/metadata-adapter";
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
  itemDensity = "full",
  showCoverField = true,
  shelfUrlPrefix = "",
  themePlacement = "details",
}: {
  readonly initialValue?: ShelfEditorInput;
  readonly action?: ShelfEditorAction;
  readonly onExtractMetadata?: (url: string) => Promise<ExtractedProductMetadata>;
  readonly itemDensity?: "full" | "compact";
  readonly showCoverField?: boolean;
  readonly shelfUrlPrefix?: string;
  readonly themePlacement?: "details" | "preview";
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
    setProducts((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? product : item)),
    );
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

  function copyShelfUrl() {
    if (!shelfUrlPrefix || !navigator.clipboard) return;
    void navigator.clipboard.writeText(`${shelfUrlPrefix}${slug}`);
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
  const useStitchCreateDetailsLayout = themePlacement === "preview" && !showCoverField;
  const previewDevices: readonly PreviewDevice[] = ["mobile", "tablet"];
  const themeControl = (
    <label
      className={themePlacement === "details" ? undefined : "min-w-40"}
      htmlFor="shelf-theme"
    >
      <span
        className={
          themePlacement === "details"
            ? "text-sm font-bold text-[var(--muted)]"
            : "text-xs font-black uppercase tracking-[0.18em] text-[var(--muted)]"
        }
      >
        Theme
      </span>
      <select
        className={
          themePlacement === "details"
            ? "mt-2 min-h-12 w-full rounded-2xl border border-[var(--line)] bg-[var(--surface-low)] px-4 text-sm font-semibold outline-none focus:border-[var(--teal-700)]"
            : "mt-2 min-h-11 w-full rounded-2xl border border-[var(--line)] bg-white px-4 text-sm font-bold outline-none focus:border-[var(--teal-700)]"
        }
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
  );

  return (
    <form action={action} className="mx-auto grid max-w-6xl gap-8">
      {initialValue?.shelfId ? (
        <input name="shelfId" type="hidden" value={initialValue.shelfId} />
      ) : null}
      <input name="productsJson" type="hidden" value={JSON.stringify(products)} />
      <input name="payload" type="hidden" value={JSON.stringify(submitPayload)} />

      <header className="grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
        <Link
          className="text-sm font-bold text-[var(--muted)] transition-colors hover:text-[var(--teal-700)]"
          href="/studio/shelves"
        >
          ← Back to Shelves
        </Link>
        <h1 className="text-center text-3xl font-black tracking-[-0.05em]">
          {initialValue?.shelfId ? "Edit Shelf" : "Create Shelf"}
        </h1>
        <div className="flex justify-start gap-3 sm:justify-end">
          <SubmitButton intent="draft" variant="secondary">
            Save Draft
          </SubmitButton>
          <SubmitButton intent="publish" variant="primary">
            Publish Shelf
          </SubmitButton>
        </div>
      </header>

      <section
        aria-labelledby="shelf-details-heading"
        className="rounded-2xl bg-white p-6 shadow-[0_18px_42px_rgba(11,19,43,0.045)]"
      >
        <div className="mb-2 flex items-center gap-2">
          <span aria-hidden="true" className="material-symbols-outlined text-[var(--teal-700)]">
            check_circle
          </span>
          <h2
            className="text-xl font-black tracking-[-0.03em]"
            id="shelf-details-heading"
          >
            Shelf Details
          </h2>
        </div>
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

          {useStitchCreateDetailsLayout ? (
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
          ) : null}

          <label
            className={useStitchCreateDetailsLayout ? "md:col-span-2" : undefined}
            htmlFor="shelf-slug"
          >
            <span className="text-sm font-bold text-[var(--muted)]">Shelf URL</span>
            {shelfUrlPrefix ? (
              <div className="mt-2 flex min-h-12 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface-low)] focus-within:border-[var(--teal-700)]">
                <span
                  aria-hidden="true"
                  className="grid shrink-0 place-items-center border-r border-[var(--line)] px-4 text-sm font-bold text-[var(--muted)]"
                >
                  {shelfUrlPrefix}
                </span>
                <input
                  className="min-w-0 flex-1 bg-transparent px-3 text-sm font-black outline-none"
                  id="shelf-slug"
                  name="slug"
                  onChange={(event) => setSlug(event.target.value)}
                  value={slug}
                />
                <button
                  aria-label="Copy shelf URL"
                  className="grid w-12 shrink-0 place-items-center border-l border-[var(--line)] text-[var(--teal-700)] transition-colors hover:bg-[var(--glow)]/35"
                  onClick={copyShelfUrl}
                  type="button"
                >
                  <span aria-hidden="true" className="material-symbols-outlined text-lg">
                    content_copy
                  </span>
                </button>
              </div>
            ) : (
              <input
                className="mt-2 min-h-12 w-full rounded-2xl border border-[var(--line)] bg-[var(--surface-low)] px-4 text-sm font-semibold outline-none focus:border-[var(--teal-700)]"
                id="shelf-slug"
                name="slug"
                onChange={(event) => setSlug(event.target.value)}
                value={slug}
              />
            )}
          </label>

          {useStitchCreateDetailsLayout ? null : (
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
          )}

          {themePlacement === "details" ? themeControl : null}

          {showCoverField ? (
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
          ) : null}

          {useStitchCreateDetailsLayout ? null : (
            <label className="md:col-span-2" htmlFor="shelf-source">
              <span className="text-sm font-bold text-[var(--muted)]">
                Original Content URL
              </span>
              <input
                className="mt-2 min-h-12 w-full rounded-2xl border border-[var(--line)] bg-[var(--surface-low)] px-4 text-sm font-semibold outline-none focus:border-[var(--teal-700)]"
                id="shelf-source"
                name="sourceContentUrl"
                onChange={(event) => setSourceContentUrl(event.target.value)}
                value={sourceContentUrl}
              />
            </label>
          )}

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

          {useStitchCreateDetailsLayout ? (
            <label className="md:col-span-2" htmlFor="shelf-source">
              <span className="text-sm font-bold text-[var(--muted)]">
                Original Content URL
              </span>
              <input
                className="mt-2 min-h-12 w-full rounded-2xl border border-[var(--line)] bg-[var(--surface-low)] px-4 text-sm font-semibold outline-none focus:border-[var(--teal-700)]"
                id="shelf-source"
                name="sourceContentUrl"
                onChange={(event) => setSourceContentUrl(event.target.value)}
                value={sourceContentUrl}
              />
            </label>
          ) : null}
        </div>
      </section>

      <section
        aria-labelledby="ai-workbench-heading"
        className="rounded-2xl bg-white p-6 shadow-[0_18px_42px_rgba(11,19,43,0.045)]"
      >
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <div className="flex items-center gap-2">
              <span aria-hidden="true" className="material-symbols-outlined text-[var(--teal-700)]">
                auto_awesome
              </span>
              <h2
                className="text-xl font-black tracking-[-0.03em]"
                id="ai-workbench-heading"
              >
                AI Link Workbench
              </h2>
            </div>
            <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[var(--muted)]">
              Upload a hero image of your collection. Our AI will automatically identify
              items and suggest affiliate links. You can manually adjust hotspots and links below.
            </p>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[var(--glow)]/35 px-4 py-2 text-xs font-black text-[var(--teal-700)]">
            <span aria-hidden="true" className="material-symbols-outlined text-sm">
              bolt
            </span>
            Auto-Detect Active
          </span>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(360px,1fr)]">
          <div className="relative self-start overflow-hidden rounded-xl bg-[#f1eff4]">
            {coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt=""
                className="aspect-square w-full object-cover"
                data-testid="workbench-cover"
                src={coverUrl}
              />
            ) : (
              <div className="grid aspect-square place-items-center bg-[var(--glow)]/20 text-sm font-black text-[var(--teal-700)]">
                Add a collection cover image
              </div>
            )}
            {products.slice(0, 3).map((product, index) => {
              const selectedHotspot = index === 0;
              return (
                <span
                  aria-label={`Hotspot ${index + 1}${product.title ? ` ${product.title}` : ""}`}
                  className={`absolute grid h-9 w-9 place-items-center rounded-full border-2 border-white text-sm font-black shadow-lg ${
                    selectedHotspot
                      ? "bg-[var(--teal-700)] text-white"
                      : "bg-white text-[var(--ink)]"
                  }`}
                  key={`${product.id ?? "draft-hotspot"}-${index}`}
                  style={{
                    left: `${product.hotspotX ?? 22 + index * 24}%`,
                    top: `${product.hotspotY ?? 28 + index * 18}%`,
                  }}
                >
                  {index + 1}
                </span>
              );
            })}
          </div>

          <div>
            <div className="mb-4 flex items-center justify-between gap-4">
              <h3 className="font-black tracking-[-0.03em]">Detected Items ({products.length})</h3>
              <button
                aria-label="Add product"
                className="rounded-full bg-[var(--glow)]/35 px-4 py-2 text-xs font-black text-[var(--teal-700)]"
                onClick={() => setProducts((current) => [...current, blankProduct()])}
                type="button"
              >
                + Add Item Manually
              </button>
            </div>
            <div className="grid gap-4">
              {products.map((product, index) => (
                <ItemEditor
                  canMoveDown={index < products.length - 1}
                  canMoveUp={index > 0}
                  density={itemDensity}
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
        </div>
      </section>

      <section
        aria-labelledby="shelf-preview-heading"
        className="rounded-2xl bg-white p-6 shadow-[0_18px_42px_rgba(11,19,43,0.045)]"
      >
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div className="flex items-center gap-2">
            <span aria-hidden="true" className="material-symbols-outlined text-[var(--teal-700)]">
              preview
            </span>
            <h2
              className="text-xl font-black tracking-[-0.03em]"
              id="shelf-preview-heading"
            >
              Shelf Preview
            </h2>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            {themePlacement === "preview" ? themeControl : null}
            {useStitchCreateDetailsLayout ? null : (
              <div className="flex gap-2">
                {previewDevices.map((device) => (
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
            )}
          </div>
        </div>

        <div
          className={
            useStitchCreateDetailsLayout
              ? "mt-8 flex flex-col items-center justify-center gap-8 lg:flex-row lg:items-end"
              : "mt-6 flex justify-center"
          }
        >
          {useStitchCreateDetailsLayout ? (
            previewDevices.map((device) => (
              <ShelfPreview
                coverUrl={coverUrl}
                description={description}
                device={device}
                key={device}
                products={products}
                title={title}
              />
            ))
          ) : (
            <ShelfPreview
              coverUrl={coverUrl}
              description={description}
              device={previewDevice}
              products={products}
              title={title}
            />
          )}
        </div>
      </section>

      {useStitchCreateDetailsLayout ? null : (
        <div className="flex flex-wrap gap-3">
          <SubmitButton intent="draft" variant="secondary">
            Save Draft
          </SubmitButton>
          <SubmitButton intent="publish" variant="primary">
            Publish
          </SubmitButton>
        </div>
      )}
    </form>
  );
}

function SubmitButton({
  children,
  intent,
  variant,
}: {
  readonly children: string;
  readonly intent: "draft" | "publish";
  readonly variant: "primary" | "secondary";
}) {
  return (
    <button
      className={
        variant === "primary"
          ? "rounded-full bg-[var(--teal-700)] px-6 py-3 font-bold text-white"
          : "rounded-full border border-[var(--teal-700)] bg-white px-6 py-3 font-bold text-[var(--teal-700)]"
      }
      name="intent"
      type="submit"
      value={intent}
    >
      {children}
    </button>
  );
}
