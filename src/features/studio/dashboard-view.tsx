import type { ManagedShelf } from "@/features/shelves/actions";
import Link from "next/link";

const recentActivities = [
  {
    icon: "add_photo_alternate",
    iconClassName: "bg-[rgba(100,246,227,0.2)] text-[var(--teal-700)]",
    text: (
      <>
        <span className="font-black">Alex</span> added a new item to{" "}
        <span className="font-black text-[var(--teal-700)]">Photography Kit</span>
      </>
    ),
    plainText: "Alex added a new item to Photography Kit",
    time: "10 min ago",
  },
  {
    icon: "visibility",
    iconClassName: "bg-[#e5dffd]/60 text-[#47445c]",
    text: (
      <>
        <span className="font-black">Minimal Desk Setup</span> shelf reached 1,000 views.
      </>
    ),
    plainText: "Minimal Desk Setup shelf reached 1,000 views.",
    time: "2 hours ago",
  },
  {
    icon: "person",
    iconClassName: "bg-[linear-gradient(135deg,#0b132b,#64f6e3)] text-white",
    text: (
      <>
        <span className="font-black">Sarah J.</span> saved your{" "}
        <span className="font-black text-[var(--teal-700)]">UI Resources</span> shelf.
      </>
    ),
    plainText: "Sarah J. saved your UI Resources shelf.",
    time: "Yesterday",
  },
  {
    icon: "edit",
    iconClassName: "bg-[var(--surface-low)] text-[var(--muted)]",
    text: (
      <>
        You updated the description for{" "}
        <span className="font-black text-[var(--teal-700)]">Favorite Fonts</span>.
      </>
    ),
    plainText: "You updated the description for Favorite Fonts.",
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
    <div className="mx-auto max-w-[1280px] min-w-0">
      <header className="flex min-w-0 flex-col gap-6 xl:flex-row">
        <Link
          className="group flex min-h-36 min-w-0 flex-col items-start justify-between gap-5 rounded-2xl bg-[var(--glow)] px-6 py-6 text-[var(--ink)] shadow-[0_22px_55px_rgba(0,191,174,0.18)] transition-transform hover:-translate-y-0.5 sm:flex-row sm:items-center sm:px-8 xl:w-1/2"
          href="/studio/create"
        >
          <span className="min-w-0">
            <span className="block text-3xl font-black tracking-[-0.055em] sm:text-4xl">
              Create New Shelf
            </span>
            <span className="mt-4 block text-base font-semibold text-[var(--ink)]/65 sm:text-lg">
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

        <div className="grid gap-6 sm:grid-cols-2 xl:w-1/2">
          <MetricTile
            change="+12%"
            icon="trending_up"
            iconClassName="text-[var(--teal-700)]"
            label="Today's Clicks"
            value="1,248"
          />
          <MetricTile
            change="+5%"
            icon="bookmark_added"
            iconClassName="text-[#c8c3e0]"
            label="New Saves"
            value="342"
          />
        </div>
      </header>

      <section aria-labelledby="recent-activities-heading" className="mt-14">
        <div className="mb-8 flex items-center gap-3">
          <span aria-hidden="true" className="material-symbols-outlined text-3xl text-[var(--muted)]">
            history
          </span>
          <h1
            className="text-3xl font-black tracking-[-0.045em]"
            id="recent-activities-heading"
          >
            Recent Activities
          </h1>
          <p className="sr-only">
            Studio contains {totals.all} shelves
            {latestShelf ? `; latest collection is ${latestShelf.title}` : ""}.
          </p>
        </div>

        <div className="grid gap-4">
          {recentActivities.map((activity) => (
            <article
              className="flex min-h-[88px] min-w-0 w-full items-center gap-5 rounded-xl bg-white px-5 py-5 shadow-[0_4px_20px_rgba(11,19,43,0.04)] transition-shadow hover:shadow-[0_12px_32px_rgba(11,19,43,0.08)]"
              key={activity.plainText}
            >
              <span
                aria-hidden="true"
                className={`grid h-12 w-12 shrink-0 place-items-center rounded-full ${activity.iconClassName}`}
              >
                <span className="material-symbols-outlined text-xl">{activity.icon}</span>
              </span>
              <p className="min-w-0 flex-1 truncate text-base font-medium text-[var(--ink)]">
                {activity.text}
              </p>
              <time className="shrink-0 text-xs font-black text-[var(--muted)]">
                {activity.time}
              </time>
            </article>
          ))}
        </div>

        <Link
          className="mx-auto mt-8 flex w-fit rounded-full px-6 py-2 text-sm font-black text-[var(--teal-700)] transition-colors hover:bg-[rgba(100,246,227,0.2)]"
          href="/studio/shelves"
        >
          View All Activity
        </Link>
      </section>
    </div>
  );
}

function MetricTile({
  label,
  value,
  change,
  icon,
  iconClassName,
}: {
  readonly label: string;
  readonly value: string;
  readonly change: string;
  readonly icon: string;
  readonly iconClassName: string;
}) {
  return (
    <article
      aria-label={label}
      className="flex min-h-36 min-w-0 flex-col justify-between rounded-2xl bg-white px-6 py-6 shadow-[0_4px_20px_rgba(11,19,43,0.04)]"
    >
      <p className="flex items-center gap-3 text-base font-bold text-[var(--ink)]/70">
        <span aria-hidden="true" className={`material-symbols-outlined text-3xl ${iconClassName}`}>
          {icon}
        </span>
        {label}
      </p>
      <div className="flex items-end gap-3">
        <p className="text-5xl font-black tracking-[-0.06em]">{value}</p>
        <span className="mb-2 rounded-full bg-[rgba(100,246,227,0.35)] px-2 py-1 text-xs font-black text-[var(--teal-700)]">
          {change}
        </span>
      </div>
    </article>
  );
}
