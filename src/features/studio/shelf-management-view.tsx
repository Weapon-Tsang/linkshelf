"use client";

import Link from "next/link";
import type { ManagedShelf, ShelfManagementFilter } from "@/features/shelves/actions";
import { cn } from "@/lib/cn";

type ShelfAction = (formData: FormData) => void | Promise<void>;
export type ShelfManagementLayout = "grid" | "list";

const filters: Array<{ label: string; value: ShelfManagementFilter }> = [
  { label: "All", value: "ALL" },
  { label: "Published", value: "PUBLISHED" },
  { label: "Drafts", value: "DRAFT" },
];

const stitchManagementLinkCounts: Record<string, number> = {
  "shelf-photography": 12,
  "shelf-desk": 5,
  "shelf-travel": 18,
};

function filterHref(filter: ShelfManagementFilter, query: string, layout: ShelfManagementLayout) {
  const params = new URLSearchParams();
  if (filter !== "ALL") params.set("status", filter);
  if (query) params.set("q", query);
  if (layout === "list") params.set("layout", "list");
  const search = params.toString();
  return search ? `/studio/shelves?${search}` : "/studio/shelves";
}

function statusLabel(status: ManagedShelf["status"]) {
  return status === "PUBLISHED" ? "PUBLISHED" : "DRAFT";
}

function updatedLabel(shelf: ManagedShelf) {
  if (shelf.id === "shelf-travel") return "Oct 12";
  return shelf.id === "shelf-photography" ? "2 hrs ago" : "yesterday";
}

function displayedProductCount(shelf: ManagedShelf) {
  return stitchManagementLinkCounts[shelf.id] ?? shelf.productCount;
}

function displayedCategory(shelf: ManagedShelf) {
  return shelf.id === "shelf-photography" ? "Tech" : shelf.category;
}

export function ShelfManagementView({
  creatorHandle,
  shelves,
  query,
  status,
  layout = "grid",
  publishShelfAction,
  deleteShelfAction,
}: {
  readonly creatorHandle: string;
  readonly shelves: readonly ManagedShelf[];
  readonly totals: {
    readonly all: number;
    readonly published: number;
    readonly drafts: number;
  };
  readonly query: string;
  readonly status: ShelfManagementFilter;
  readonly layout?: ShelfManagementLayout;
  readonly publishShelfAction?: ShelfAction;
  readonly deleteShelfAction?: ShelfAction;
}) {
  const isListLayout = layout === "list";
  const actionControlBaseClass = cn(
    "grid place-items-center rounded-full text-[var(--muted)] transition-colors",
    isListLayout ? "h-10 w-10" : "h-8 w-8",
  );
  const actionControlClass = cn(
    actionControlBaseClass,
    "hover:bg-[var(--surface-low)] hover:text-[var(--teal-700)]",
  );

  return (
    <div className="mx-auto w-full max-w-6xl">
      <header className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
        <h1 className="text-[40px] font-bold leading-tight">My Shelves</h1>

        <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
          <form action="/studio/shelves" className="relative min-w-0 flex-1 lg:w-72" method="get">
            {status !== "ALL" ? <input name="status" type="hidden" value={status} /> : null}
            {isListLayout ? <input name="layout" type="hidden" value="list" /> : null}
            <label className="sr-only" htmlFor="studio-shelf-search">
              Search shelves
            </label>
            <span
              aria-hidden="true"
              className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base text-[var(--muted)]"
            >
              search
            </span>
            <input
              className="w-full rounded-full border border-[var(--line)] bg-white py-3 pl-12 pr-6 text-base font-normal shadow-sm outline-none transition-colors placeholder:text-[var(--muted)] focus:border-[var(--teal-700)]"
              defaultValue={query}
              id="studio-shelf-search"
              name="q"
              placeholder="Search shelves..."
            />
          </form>

          <div
            className="flex flex-wrap rounded-full border border-[var(--line)] bg-white p-1 shadow-[0_8px_24px_rgba(11,19,43,0.06)]"
            role="list"
            aria-label="Shelf filters"
          >
            {filters.map((filter) => {
              const active = filter.value === status;
              return (
                <Link
                  className={cn(
                    "rounded-full px-5 py-2 text-sm font-bold transition-colors",
                    active
                      ? "bg-[var(--glow)] text-[var(--teal-700)]"
                      : "text-[var(--muted)] hover:bg-[var(--surface-low)] hover:text-[var(--ink)]",
                  )}
                  data-active={active ? "true" : "false"}
                  href={filterHref(filter.value, query, layout)}
                  key={filter.value}
                >
                  {filter.label}
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      <section className="mt-10">
        <div className={isListLayout ? "flex flex-col gap-6" : "grid gap-6 xl:grid-cols-2"}>
          {shelves.map((shelf) => (
            <article
              aria-label={`${shelf.title} shelf card`}
              className={cn(
                isListLayout
                  ? "flex items-center rounded-2xl border-2 bg-white p-8 shadow-[0_12px_32px_rgba(11,19,43,0.08)] transition-all"
                  : "grid cursor-pointer gap-3 rounded-xl border-2 border-transparent bg-white p-5 shadow-[0_18px_42px_rgba(11,19,43,0.045)] transition-all hover:border-[var(--line)]/70 hover:shadow-[0_8px_24px_rgba(11,19,43,0.06)] md:grid-cols-[6rem_minmax(0,1fr)_auto]",
                shelf.id === "shelf-photography" &&
                  "border-[var(--teal-700)]",
                shelf.id !== "shelf-photography" && isListLayout && "border-transparent",
              )}
              key={shelf.id}
            >
              <div
                className={cn(
                  "h-24 w-24 self-start overflow-hidden rounded-xl bg-[#f2f0f4] shadow-sm md:h-24 md:w-24",
                  isListLayout && "mr-6 shrink-0",
                )}
              >
                {shelf.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt={`${shelf.title} cover`}
                    className="h-full w-full object-cover"
                    src={shelf.coverUrl}
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center text-[var(--teal-700)]">
                    <span aria-hidden="true" className="material-symbols-outlined">
                      image
                    </span>
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="mb-2 flex flex-wrap items-center gap-3">
                  <h2
                    className={cn(
                      "text-xl font-bold",
                      !isListLayout && "max-w-28",
                    )}
                  >
                    {shelf.title}
                  </h2>
                  <span
                    className={cn(
                      "flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider",
                      shelf.status === "PUBLISHED"
                        ? "bg-[var(--glow)]/45 text-[var(--teal-700)]"
                        : "bg-[#fff2d6] text-[#8a5b00]",
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "mr-2 h-2 w-2 rounded-full",
                        shelf.status === "PUBLISHED" ? "bg-[var(--teal-700)]" : "bg-[var(--muted)]",
                      )}
                    />
                    {statusLabel(shelf.status)}
                  </span>
                </div>
                <p className="mb-3 text-xs font-bold text-[var(--muted)]">
                  {displayedProductCount(shelf)} links • Last updated {updatedLabel(shelf)}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-lg bg-[#f4f1f6] px-3 py-1 text-xs font-bold text-[var(--muted)]">
                    {displayedCategory(shelf)}
                  </span>
                  <span className="rounded-lg bg-[#f4f1f6] px-3 py-1 text-xs font-bold text-[var(--muted)]">
                    Gear
                  </span>
                </div>
              </div>

              <div
                aria-label={`Shelf actions for ${shelf.title}`}
                className={cn(
                  isListLayout
                    ? "ml-6 flex items-center gap-3 border-l border-[var(--line)]/70 pl-6"
                    : "ml-4 flex items-center gap-2 self-center border-l border-[var(--line)]/70 pl-4 md:justify-end",
                )}
              >
                <Link
                  aria-label={`Edit ${shelf.title}`}
                  className={actionControlClass}
                  href={`/studio/shelves/${shelf.id}/edit`}
                >
                  <span aria-hidden="true" className="material-symbols-outlined text-xl">
                    edit
                  </span>
                </Link>

                {shelf.status === "PUBLISHED" ? (
                  <Link
                    aria-label={`View ${shelf.title}`}
                    className={actionControlClass}
                    href={`/${creatorHandle}/${shelf.slug}`}
                  >
                    <span aria-hidden="true" className="material-symbols-outlined text-xl">
                      rocket_launch
                    </span>
                  </Link>
                ) : null}

                {shelf.status === "DRAFT" && publishShelfAction ? (
                  <form action={publishShelfAction}>
                    <input name="shelfId" type="hidden" value={shelf.id} />
                    <button
                      aria-label={`Publish ${shelf.title}`}
                      className={actionControlClass}
                      type="submit"
                    >
                      <span aria-hidden="true" className="material-symbols-outlined text-xl">
                        rocket_launch
                      </span>
                    </button>
                  </form>
                ) : null}

                {deleteShelfAction ? (
                  <form
                    action={deleteShelfAction}
                    onSubmit={(event) => {
                      if (!window.confirm(`Delete "${shelf.title}" from your studio?`)) {
                        event.preventDefault();
                      }
                    }}
                  >
                    <input name="shelfId" type="hidden" value={shelf.id} />
                    <button
                      aria-label={`Delete ${shelf.title}`}
                      className={cn(
                        actionControlBaseClass,
                        "hover:bg-[#fff2f2] hover:text-[var(--danger)]",
                      )}
                      type="submit"
                    >
                      <span aria-hidden="true" className="material-symbols-outlined text-xl">
                        delete
                      </span>
                    </button>
                  </form>
                ) : null}
              </div>
            </article>
          ))}

          {shelves.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-[var(--line)] bg-white p-8 text-center">
              <p className="text-lg font-bold">No shelves found</p>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Try another search or create a new shelf.
              </p>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
