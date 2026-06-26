"use client";

import Link from "next/link";
import type { ManagedShelf, ShelfManagementFilter } from "@/features/shelves/actions";
import { cn } from "@/lib/cn";

type ShelfAction = (formData: FormData) => void | Promise<void>;

const filters: Array<{ label: string; value: ShelfManagementFilter }> = [
  { label: "All", value: "ALL" },
  { label: "Published", value: "PUBLISHED" },
  { label: "Drafts", value: "DRAFT" },
];

function filterHref(filter: ShelfManagementFilter, query: string) {
  const params = new URLSearchParams();
  if (filter !== "ALL") params.set("status", filter);
  if (query) params.set("q", query);
  const search = params.toString();
  return search ? `/studio/shelves?${search}` : "/studio/shelves";
}

function statusLabel(status: ManagedShelf["status"]) {
  return status === "PUBLISHED" ? "PUBLISHED" : "DRAFT";
}

function updatedLabel(shelf: ManagedShelf) {
  return shelf.id === "shelf-photography" ? "2 hrs ago" : "yesterday";
}

export function ShelfManagementView({
  shelves,
  totals,
  query,
  status,
  publishShelfAction,
  deleteShelfAction,
}: {
  readonly shelves: readonly ManagedShelf[];
  readonly totals: {
    readonly all: number;
    readonly published: number;
    readonly drafts: number;
  };
  readonly query: string;
  readonly status: ShelfManagementFilter;
  readonly publishShelfAction?: ShelfAction;
  readonly deleteShelfAction?: ShelfAction;
}) {
  return (
    <div className="mx-auto max-w-5xl">
      <header className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
        <h1 className="text-4xl font-black tracking-[-0.05em] sm:text-5xl">My Shelves</h1>

        <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
          <form action="/studio/shelves" className="relative min-w-0 flex-1 lg:w-72" method="get">
            {status !== "ALL" ? <input name="status" type="hidden" value={status} /> : null}
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
              className="min-h-12 w-full rounded-full border border-[var(--line)] bg-white pl-11 pr-5 text-sm font-semibold outline-none transition-colors placeholder:text-[var(--muted)] focus:border-[var(--teal-700)]"
              defaultValue={query}
              id="studio-shelf-search"
              name="q"
              placeholder="Search shelves..."
            />
          </form>

          <div className="flex flex-wrap gap-2" role="list" aria-label="Shelf filters">
            {filters.map((filter) => {
              const active = filter.value === status;
              const count =
                filter.value === "ALL"
                  ? totals.all
                  : filter.value === "PUBLISHED"
                    ? totals.published
                    : totals.drafts;
              return (
                <Link
                  className={cn(
                    "rounded-full border px-5 py-3 text-sm font-bold transition-colors",
                    active
                      ? "border-[var(--glow)] bg-[var(--glow)] text-[var(--teal-700)]"
                      : "border-[var(--line)] bg-white text-[var(--muted)] hover:text-[var(--ink)]",
                  )}
                  data-active={active ? "true" : "false"}
                  href={filterHref(filter.value, query)}
                  key={filter.value}
                >
                  {filter.label} · {count}
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      <section className="mt-8">
        <div className="grid gap-6 xl:grid-cols-2">
          {shelves.map((shelf) => (
            <article
              aria-label={`${shelf.title} shelf card`}
              className={cn(
                "grid gap-5 rounded-2xl bg-white p-6 shadow-[0_18px_42px_rgba(11,19,43,0.045)] md:grid-cols-[6.75rem_minmax(0,1fr)_auto]",
                shelf.id === "shelf-photography" && "ring-2 ring-[var(--teal-700)]",
              )}
              key={shelf.id}
            >
              <div className="overflow-hidden rounded-xl bg-[#f2f0f4]">
                {shelf.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt={`${shelf.title} cover`}
                    className="h-32 w-full object-cover md:h-24"
                    src={shelf.coverUrl}
                  />
                ) : (
                  <div className="grid h-32 place-items-center text-[var(--teal-700)] md:h-24">
                    <span aria-hidden="true" className="material-symbols-outlined">
                      image
                    </span>
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-black leading-tight tracking-[-0.04em]">
                    {shelf.title}
                  </h2>
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-[0.65rem] font-black tracking-[0.08em]",
                      shelf.status === "PUBLISHED"
                        ? "bg-[var(--glow)]/45 text-[var(--teal-700)]"
                        : "bg-[#fff2d6] text-[#8a5b00]",
                    )}
                  >
                    {statusLabel(shelf.status)}
                  </span>
                </div>
                <p className="mt-2 text-sm font-bold text-[var(--muted)]">
                  {shelf.productCount} links · Last updated {updatedLabel(shelf)}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-lg bg-[#f4f1f6] px-3 py-1 text-xs font-bold text-[var(--muted)]">
                    {shelf.category}
                  </span>
                  <span className="rounded-lg bg-[#f4f1f6] px-3 py-1 text-xs font-bold text-[var(--muted)]">
                    Gear
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 md:justify-end">
                <Link
                  aria-label={`Edit ${shelf.title}`}
                  className="grid h-10 w-10 place-items-center rounded-full text-[var(--muted)] transition-colors hover:bg-[var(--surface-low)] hover:text-[var(--teal-700)]"
                  href={`/studio/shelves/${shelf.id}/edit`}
                >
                  <span aria-hidden="true" className="material-symbols-outlined text-xl">
                    edit
                  </span>
                </Link>

                {shelf.status === "DRAFT" && publishShelfAction ? (
                  <form action={publishShelfAction}>
                    <input name="shelfId" type="hidden" value={shelf.id} />
                    <button
                      aria-label={`Publish ${shelf.title}`}
                      className="grid h-10 w-10 place-items-center rounded-full text-[var(--muted)] transition-colors hover:bg-[var(--surface-low)] hover:text-[var(--teal-700)]"
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
                      className="grid h-10 w-10 place-items-center rounded-full text-[var(--muted)] transition-colors hover:bg-[#fff2f2] hover:text-[var(--danger)]"
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
