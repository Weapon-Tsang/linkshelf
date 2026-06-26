import Link from "next/link";
import type { ManagedShelf } from "@/features/shelves/actions";

function formatStatus(status: ManagedShelf["status"]) {
  return status === "PUBLISHED" ? "Published" : "Draft";
}

export function DashboardView({
  shelves,
  totals,
}: {
  readonly shelves: readonly ManagedShelf[];
  readonly totals: {
    readonly all: number;
    readonly published: number;
    readonly drafts: number;
  };
}) {
  const productCount = shelves.reduce((sum, shelf) => sum + shelf.productCount, 0);
  const latestShelves = shelves.slice(0, 3);

  return (
    <div>
      <header className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--teal-700)]">
            Studio dashboard
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-[-0.04em] sm:text-5xl">
            Manage your shelves
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-[var(--muted)]">
            Track publishing health, keep drafts moving, and jump back into the shelves fans see.
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

      <section className="mt-9 grid gap-4 md:grid-cols-3">
        {[
          ["Total shelves", totals.all],
          ["Published", totals.published],
          ["Products", productCount],
        ].map(([label, value]) => (
          <article
            className="rounded-[28px] border border-white/80 bg-white/82 p-6 shadow-[var(--shadow-card)]"
            key={label}
          >
            <p className="text-sm font-bold text-[var(--muted)]">{label}</p>
            <p className="mt-4 text-4xl font-bold tracking-[-0.04em]">{value}</p>
          </article>
        ))}
      </section>

      <section className="mt-8 rounded-[32px] border border-white/80 bg-white/82 p-6 shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-[-0.03em]">Recent activity</h2>
            <p className="mt-1 text-sm font-semibold text-[var(--muted)]">
              Current shelves from your public profile data
            </p>
          </div>
          <Link className="text-sm font-bold text-[var(--teal-700)]" href="/studio/shelves">
            View all
          </Link>
        </div>

        <div className="mt-6 divide-y divide-[var(--line)]">
          {latestShelves.map((shelf) => (
            <div className="flex items-center justify-between gap-4 py-4" key={shelf.id}>
              <div>
                <p className="font-bold">{shelf.title}</p>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {shelf.productCount} products · {formatStatus(shelf.status)}
                </p>
              </div>
              <Link
                className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-bold text-[var(--ink)] transition-colors hover:border-[var(--teal-700)] hover:text-[var(--teal-700)]"
                href={`/studio/shelves/${shelf.id}/edit`}
              >
                Edit
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
