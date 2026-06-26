"use client";

import { useMemo, useState } from "react";

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

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
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
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  const visibleComments = useMemo(() => {
    const filtered =
      shelfFilter === "all"
        ? comments
        : comments.filter((comment) => comment.shelfId === shelfFilter);
    return [...filtered].sort((a, b) => {
      const left = new Date(a.createdAt).getTime();
      const right = new Date(b.createdAt).getTime();
      return sortOrder === "oldest" ? left - right : right - left;
    });
  }, [comments, shelfFilter, sortOrder]);

  return (
    <div>
      <header>
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--teal-700)]">
          Comments
        </p>
        <h1 className="mt-2 text-4xl font-bold tracking-[-0.04em] sm:text-5xl">
          Keep the shelf conversation warm
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-[var(--muted)]">
          Review fan questions, jump between shelves, and keep product context close.
        </p>
      </header>

      <section className="mt-8 rounded-[32px] border border-white/80 bg-white/82 p-6 shadow-[var(--shadow-card)]">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-bold text-[var(--muted)]">
            Filter by shelf
            <select
              className="min-h-12 rounded-2xl border border-[var(--line)] bg-[var(--surface-low)] px-4 text-base font-semibold text-[var(--ink)]"
              onChange={(event) => setShelfFilter(event.target.value)}
              value={shelfFilter}
            >
              <option value="all">All shelves</option>
              {shelves.map((shelf) => (
                <option key={shelf.id} value={shelf.id}>
                  {shelf.title}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-bold text-[var(--muted)]">
            Sort comments
            <select
              className="min-h-12 rounded-2xl border border-[var(--line)] bg-[var(--surface-low)] px-4 text-base font-semibold text-[var(--ink)]"
              onChange={(event) => setSortOrder(event.target.value as "newest" | "oldest")}
              value={sortOrder}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </label>
        </div>
      </section>

      <section className="mt-6 grid gap-4">
        {visibleComments.map((comment) => (
          <article
            className="rounded-[28px] border border-white/80 bg-white/82 p-5 shadow-[var(--shadow-card)]"
            key={comment.id}
          >
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
              <div>
                <p className="text-sm font-bold text-[var(--teal-700)]">{comment.shelfTitle}</p>
                <h2 className="mt-1 text-xl font-bold tracking-[-0.03em]">
                  {comment.authorName}
                </h2>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                <span>{comment.status === "VISIBLE" ? "Visible" : "Hidden"}</span>
                <span aria-hidden="true">·</span>
                <time dateTime={comment.createdAt}>{formatDate(comment.createdAt)}</time>
              </div>
            </div>
            <p className="mt-4 text-base leading-7 text-[var(--ink)]">{comment.body}</p>
            <div className="mt-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
              <form action={replyAction} className="flex gap-2">
                <input name="commentId" type="hidden" value={comment.id} />
                <input
                  aria-label={`Reply to ${comment.authorName}`}
                  className="min-h-11 min-w-0 flex-1 rounded-full border border-[var(--line)] bg-[var(--surface-low)] px-4 text-sm font-semibold"
                  name="body"
                  placeholder="Write a quick reply"
                />
                <button
                  className="rounded-full bg-[var(--teal-700)] px-4 py-2 text-sm font-bold text-white"
                  type="submit"
                >
                  Reply
                </button>
              </form>
              <form action={deleteAction}>
                <input name="commentId" type="hidden" value={comment.id} />
                <button
                  className="h-11 rounded-full border border-[var(--line)] px-4 text-sm font-bold text-[var(--muted)]"
                  type="submit"
                >
                  Hide
                </button>
              </form>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
