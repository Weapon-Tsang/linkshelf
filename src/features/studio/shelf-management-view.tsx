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
  return status === "PUBLISHED" ? "Published" : "Draft";
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
    <div>
      <header className="flex flex-col justify-between gap-6 xl:flex-row xl:items-end">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--teal-700)]">
            Shelf management
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-[-0.04em] sm:text-5xl">
            Your shelves
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-[var(--muted)]">
            Search, publish, and safely archive the shelves powering your public profile.
          </p>
        </div>
        <Link
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[var(--teal-700)] px-6 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[var(--ink)]"
          href="/studio/create"
        >
          <span aria-hidden="true" className="material-symbols-outlined">
            add
          </span>
          Create New Shelf
        </Link>
      </header>

      <section className="mt-8 rounded-[32px] border border-white/80 bg-white/82 p-4 shadow-[var(--shadow-card)] sm:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <form action="/studio/shelves" className="flex min-w-0 flex-1 gap-2" method="get">
            {status !== "ALL" ? <input name="status" type="hidden" value={status} /> : null}
            <label className="sr-only" htmlFor="studio-shelf-search">
              Search shelves
            </label>
            <input
              className="min-h-12 min-w-0 flex-1 rounded-full border border-[var(--line)] bg-[var(--surface-low)] px-5 text-sm font-semibold outline-none transition-colors placeholder:text-[var(--muted)] focus:border-[var(--teal-700)]"
              defaultValue={query}
              id="studio-shelf-search"
              name="q"
              placeholder="Search shelves"
            />
            <button
              className="rounded-full bg-[var(--ink)] px-5 text-sm font-bold text-white"
              type="submit"
            >
              Search
            </button>
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
                    "rounded-full border px-4 py-2 text-sm font-bold transition-colors",
                    active
                      ? "border-[var(--teal-700)] bg-[var(--teal-700)] text-white"
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

        <div className="mt-6 grid gap-4">
          {shelves.map((shelf) => (
            <article
              className="grid gap-5 rounded-[28px] border border-[var(--line)] bg-white p-5 shadow-sm min-[1440px]:grid-cols-[minmax(0,1.4fr)_minmax(20rem,0.9fr)] min-[1440px]:items-center"
              key={shelf.id}
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl font-bold tracking-[-0.03em]">{shelf.title}</h2>
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-bold",
                      shelf.status === "PUBLISHED"
                        ? "bg-[var(--glow)] text-[var(--teal-700)]"
                        : "bg-[#fff2d6] text-[#8a5b00]",
                    )}
                  >
                    {statusLabel(shelf.status)}
                  </span>
                </div>
                <p className="mt-2 text-sm font-semibold text-[var(--muted)]">
                  /{shelf.slug} · {shelf.category} · {shelf.productCount} products
                </p>
                <p className="mt-3 line-clamp-2 max-w-3xl leading-7 text-[var(--muted)]">
                  {shelf.description}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 min-[1440px]:justify-end">
                <Link
                  className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-bold text-[var(--ink)] transition-colors hover:border-[var(--teal-700)] hover:text-[var(--teal-700)]"
                  href={`/studio/shelves/${shelf.id}/edit`}
                >
                  Edit
                </Link>

                {shelf.status === "DRAFT" && publishShelfAction ? (
                  <form action={publishShelfAction}>
                    <input name="shelfId" type="hidden" value={shelf.id} />
                    <button
                      className="rounded-full bg-[var(--teal-700)] px-4 py-2 text-sm font-bold text-white"
                      type="submit"
                    >
                      Publish
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
                      className="rounded-full border border-[var(--danger)] px-4 py-2 text-sm font-bold text-[var(--danger)]"
                      type="submit"
                    >
                      Delete
                    </button>
                  </form>
                ) : null}
              </div>
            </article>
          ))}

          {shelves.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-[var(--line)] bg-[var(--surface-low)] p-8 text-center">
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
