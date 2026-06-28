"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";

export interface StudioCommentViewModel {
  readonly id: string;
  readonly shelfId: string;
  readonly shelfTitle: string;
  readonly authorName: string;
  readonly body: string;
  readonly status: "VISIBLE" | "HIDDEN";
  readonly createdAt: string;
}

export interface StudioShelfOption {
  readonly id: string;
  readonly title: string;
}

type StudioFormAction = (formData: FormData) => void | Promise<void>;

function relativeTime(value: string) {
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return "just now";

  const deltaMs = Math.max(0, Date.now() - then);
  const minutes = Math.max(1, Math.round(deltaMs / 60_000));
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]?.slice(0, 1).toUpperCase() ?? "?";
  return `${parts[0]?.slice(0, 1) ?? ""}${parts.at(-1)?.slice(0, 1) ?? ""}`.toUpperCase();
}

function shelfTone(title: string) {
  const normalized = title.toLowerCase();
  if (normalized.includes("tech")) {
    return "bg-[#e5dffd] text-[#1b192e]";
  }
  return "bg-[var(--glow)] text-[var(--teal-700)]";
}

export function CommentsView({
  comments,
  deleteAction,
  replyAction,
  shelves,
}: {
  readonly comments: readonly StudioCommentViewModel[];
  readonly deleteAction?: StudioFormAction;
  readonly replyAction?: StudioFormAction;
  readonly shelves: readonly StudioShelfOption[];
}) {
  const [shelfFilter, setShelfFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "unread">("newest");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [pinnedComments, setPinnedComments] = useState<ReadonlySet<string>>(() => new Set());

  const visibleComments = useMemo(() => {
    const visible = comments.filter((comment) => comment.status === "VISIBLE");
    const filtered =
      shelfFilter === "all"
        ? visible
        : visible.filter((comment) => comment.shelfId === shelfFilter);
    return [...filtered].sort((a, b) => {
      const left = new Date(a.createdAt).getTime();
      const right = new Date(b.createdAt).getTime();
      return sortOrder === "oldest" ? left - right : right - left;
    });
  }, [comments, shelfFilter, sortOrder]);

  return (
    <div className="mx-auto w-full max-w-[1180px]">
      <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-4xl font-black tracking-[-0.055em] text-[var(--ink)] sm:text-5xl">
            Recent Comments
          </h1>
          <p className="mt-3 text-lg font-medium leading-8 text-[var(--muted)]">
            Manage interactions across your shelves.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="sr-only" htmlFor="comment-shelf-filter">
            Filter by shelf
          </label>
          <select
            className="min-h-12 rounded-xl border border-[var(--line)] bg-white px-5 text-base font-bold text-[var(--ink)] shadow-[0_6px_22px_rgba(11,19,43,0.06)]"
            id="comment-shelf-filter"
            onChange={(event) => setShelfFilter(event.target.value)}
            value={shelfFilter}
          >
            <option value="all">All Shelves</option>
            {shelves.map((shelf) => (
              <option key={shelf.id} value={shelf.id}>
                {shelf.title}
              </option>
            ))}
          </select>

          <label className="sr-only" htmlFor="comment-sort-order">
            Sort comments
          </label>
          <select
            className="min-h-12 rounded-xl border border-[var(--line)] bg-white px-5 text-base font-bold text-[var(--ink)] shadow-[0_6px_22px_rgba(11,19,43,0.06)]"
            id="comment-sort-order"
            onChange={(event) => setSortOrder(event.target.value as "newest" | "oldest" | "unread")}
            value={sortOrder}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="unread">Unread</option>
          </select>
        </div>
      </header>

      <section aria-label="Recent comments list" className="mt-8 grid gap-4">
        {visibleComments.map((comment, index) => {
          const pinned = pinnedComments.has(comment.id);
          const isReplying = replyingTo === comment.id;

          return (
            <article
              aria-label={`${comment.authorName} comment`}
              className="grid gap-4 rounded-2xl border border-transparent bg-white p-6 shadow-[0_10px_30px_rgba(11,19,43,0.045)] transition-shadow hover:border-[var(--line)] hover:shadow-[0_16px_44px_rgba(11,19,43,0.08)] sm:grid-cols-[auto_minmax(0,1fr)_auto]"
              key={comment.id}
            >
              <div
                aria-hidden="true"
                className={cn(
                  "grid h-12 w-12 place-items-center rounded-full text-lg font-black",
                  index % 2 === 0
                    ? "bg-[linear-gradient(135deg,#dbe1ff,#64f6e3)] text-[var(--ink)]"
                    : "bg-[#dbe1ff] text-[#131a33]",
                )}
              >
                {initials(comment.authorName)}
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-black text-[var(--ink)]">{comment.authorName}</h2>
                  <time
                    className="text-sm font-bold text-[var(--muted)]"
                    dateTime={comment.createdAt}
                  >
                    {relativeTime(comment.createdAt)}
                  </time>
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-black",
                      shelfTone(comment.shelfTitle),
                    )}
                  >
                    {comment.shelfTitle}
                  </span>
                  {pinned ? (
                    <span className="rounded-full bg-[var(--surface-low)] px-3 py-1 text-xs font-black text-[var(--muted)]">
                      Pinned
                    </span>
                  ) : null}
                </div>

                <p className="mt-3 text-lg font-medium leading-8 text-[var(--ink)]">
                  {comment.body}
                </p>

                {isReplying ? (
                  <form
                    action={replyAction}
                    className="mt-5 grid gap-3 border-l-2 border-[var(--line)] pl-4 sm:grid-cols-[minmax(0,1fr)_auto]"
                  >
                    <input name="commentId" type="hidden" value={comment.id} />
                    <input
                      aria-label={`Reply text for ${comment.authorName}`}
                      className="min-h-11 min-w-0 rounded-full border border-[var(--line)] bg-[var(--surface-low)] px-4 text-sm font-semibold"
                      name="body"
                      placeholder={`Reply to ${comment.authorName}`}
                    />
                    <button
                      className="rounded-full bg-[var(--teal-700)] px-5 py-2 text-sm font-black text-white"
                      type="submit"
                    >
                      Send Reply
                    </button>
                  </form>
                ) : null}
              </div>

              <div className="flex items-start gap-2 sm:ml-4">
                <button
                  aria-expanded={isReplying}
                  aria-label={`Reply to ${comment.authorName}`}
                  className="grid h-10 w-10 place-items-center rounded-full text-[var(--muted)] transition-colors hover:bg-[var(--surface-low)] hover:text-[var(--teal-700)]"
                  onClick={() => setReplyingTo(isReplying ? null : comment.id)}
                  type="button"
                >
                  <span aria-hidden="true" className="material-symbols-outlined text-2xl">
                    reply
                  </span>
                </button>
                <button
                  aria-pressed={pinned}
                  aria-label={`Pin ${comment.authorName}`}
                  className="grid h-10 w-10 place-items-center rounded-full text-[var(--muted)] transition-colors hover:bg-[var(--surface-low)] hover:text-[var(--teal-700)] aria-pressed:bg-[var(--glow)] aria-pressed:text-[var(--ink)]"
                  onClick={() =>
                    setPinnedComments((current) => {
                      const next = new Set(current);
                      if (next.has(comment.id)) {
                        next.delete(comment.id);
                      } else {
                        next.add(comment.id);
                      }
                      return next;
                    })
                  }
                  type="button"
                >
                  <span aria-hidden="true" className="material-symbols-outlined text-2xl">
                    location_on
                  </span>
                </button>
                <form action={deleteAction}>
                  <input name="commentId" type="hidden" value={comment.id} />
                  <button
                    aria-label={`Delete ${comment.authorName}`}
                    className="grid h-10 w-10 place-items-center rounded-full text-[var(--muted)] transition-colors hover:bg-red-50 hover:text-[var(--danger)]"
                    type="submit"
                  >
                    <span aria-hidden="true" className="material-symbols-outlined text-2xl">
                      delete
                    </span>
                  </button>
                </form>
              </div>
            </article>
          );
        })}
      </section>

      <div className="mt-8 flex justify-center">
        <button
          className="min-h-12 rounded-full border border-[var(--line)] bg-white px-8 text-base font-black text-[var(--muted)] shadow-[0_6px_22px_rgba(11,19,43,0.05)] transition-colors hover:bg-[var(--surface-low)] hover:text-[var(--ink)]"
          type="button"
        >
          Load More Comments
        </button>
      </div>
    </div>
  );
}
