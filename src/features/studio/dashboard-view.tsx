import type { ManagedShelf } from "@/features/shelves/actions";
import Link from "next/link";

const recentActivities = [
  {
    icon: "add_photo_alternate",
    text: "Alex added a new item to Photography Kit",
    time: "10 min ago",
  },
  {
    icon: "visibility",
    text: "Minimal Desk Setup shelf reached 1,000 views.",
    time: "2 hours ago",
  },
  {
    icon: "person",
    text: "Sarah J. saved your UI Resources shelf.",
    time: "Yesterday",
  },
  {
    icon: "edit",
    text: "You updated the description for Favorite Fonts.",
    time: "Yesterday",
  },
] as const;

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
  const latestShelf = shelves[0];

  return (
    <div className="mx-auto max-w-5xl">
      <header className="grid gap-5 md:grid-cols-[minmax(0,1.25fr)_11rem_11rem]">
        <Link
          className="group flex min-h-32 items-center justify-between rounded-2xl bg-[var(--glow)] px-8 py-6 text-[var(--ink)] shadow-[0_22px_55px_rgba(0,191,174,0.24)] transition-transform hover:-translate-y-0.5"
          href="/studio/create"
        >
          <span>
            <span className="block text-3xl font-black tracking-[-0.04em]">
              Create New Shelf
            </span>
            <span className="mt-3 block text-sm font-semibold text-[var(--ink)]/65">
              Organize and share your next collection.
            </span>
          </span>
          <span
            aria-hidden="true"
            className="grid h-16 w-16 place-items-center rounded-full bg-[var(--ink)] text-[var(--glow)] transition-transform group-hover:rotate-12"
          >
            <span className="material-symbols-outlined text-3xl">bolt</span>
          </span>
        </Link>

        <MetricTile change="+12%" label="Today's Clicks" value="1,248" />
        <MetricTile change="+5%" label="New Saves" value="342" />
      </header>

      <section className="mt-12">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span aria-hidden="true" className="material-symbols-outlined text-[var(--muted)]">
                history
              </span>
              <h1 className="text-2xl font-black tracking-[-0.04em]">Recent Activities</h1>
            </div>
            {latestShelf ? (
              <p className="mt-2 text-sm font-semibold text-[var(--muted)]">
                {totals.all} shelves live in Studio · latest collection: {latestShelf.title}
              </p>
            ) : null}
          </div>
          <Link className="text-sm font-bold text-[var(--teal-700)]" href="/studio/shelves">
            View All Activity
          </Link>
        </div>

        <div className="grid gap-5">
          {recentActivities.map((activity, index) => (
            <article
              className="flex items-center gap-5 rounded-2xl bg-white px-6 py-5 shadow-[0_18px_42px_rgba(11,19,43,0.045)]"
              key={activity.text}
            >
              <span
                aria-hidden="true"
                className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#f1eff5] text-[var(--teal-700)]"
              >
                <span className="material-symbols-outlined text-xl">{activity.icon}</span>
              </span>
              <p className="min-w-0 flex-1 text-sm font-bold text-[var(--ink)]">
                {activity.text}
              </p>
              <time className="text-xs font-bold text-[var(--muted)]">
                {index === 0 && latestShelf ? "10 min ago" : activity.time}
              </time>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function MetricTile({
  label,
  value,
  change,
}: {
  readonly label: string;
  readonly value: string;
  readonly change: string;
}) {
  return (
    <article className="rounded-2xl bg-white px-6 py-6 shadow-[0_18px_42px_rgba(11,19,43,0.045)]">
      <p className="flex items-center gap-2 text-xs font-black text-[var(--ink)]/65">
        <span aria-hidden="true" className="material-symbols-outlined text-base text-[var(--teal-700)]">
          trending_up
        </span>
        {label}
      </p>
      <div className="mt-5 flex items-end gap-2">
        <p className="text-4xl font-black tracking-[-0.05em]">{value}</p>
        <span className="mb-2 rounded-full bg-[var(--glow)]/40 px-2 py-1 text-xs font-black text-[var(--ink)]">
          {change}
        </span>
      </div>
    </article>
  );
}
