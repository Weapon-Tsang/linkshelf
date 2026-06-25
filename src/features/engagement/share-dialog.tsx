"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import type { SocialChannelType } from "@/features/shelves/types";
import { FanAuthDialog } from "./fan-auth-dialog";

export interface ShareDialogChannel {
  readonly type: SocialChannelType;
  readonly enabled: boolean;
}

const channelLabels: Record<SocialChannelType, string> = {
  X: "X",
  WHATSAPP: "WhatsApp",
  FACEBOOK: "Facebook",
  EMAIL: "Email",
  COPY: "Copy",
};

const channelIcons: Record<SocialChannelType, string> = {
  X: "alternate_email",
  WHATSAPP: "chat",
  FACEBOOK: "groups",
  EMAIL: "mail",
  COPY: "content_copy",
};

export function ShareDialog({
  open,
  shelfId,
  shortUrl,
  channels,
  onClose,
  onChannelSelect,
}: {
  readonly open: boolean;
  readonly shelfId: string;
  readonly shortUrl: string;
  readonly channels: readonly ShareDialogChannel[];
  readonly onClose: () => void;
  readonly onChannelSelect?: (channel: SocialChannelType) => void;
}) {
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const enabledChannels = channels.filter((channel) => channel.enabled);

  async function copyLink() {
    await navigator.clipboard?.writeText(shortUrl);
    setCopied(true);
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-end justify-center bg-black/40 px-4 backdrop-blur-sm sm:items-center">
      <section
        aria-describedby={`share-dialog-description-${shelfId}`}
        aria-labelledby={`share-dialog-title-${shelfId}`}
        aria-modal="true"
        className="w-full max-w-md rounded-t-[32px] bg-[var(--surface)] p-6 shadow-2xl sm:rounded-[32px]"
        role="dialog"
      >
        <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-[var(--line)] sm:hidden" />
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              className="text-2xl font-bold tracking-[-0.02em] text-[var(--ink)]"
              id={`share-dialog-title-${shelfId}`}
            >
              Share Shelf
            </h2>
            <p
              className="mt-1 text-sm font-medium text-[var(--muted)]"
              id={`share-dialog-description-${shelfId}`}
            >
              Earn when someone buys from your link
            </p>
          </div>
          <button
            aria-label="Close share dialog"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--surface-low)] text-[var(--muted)] hover:text-[var(--ink)]"
            onClick={onClose}
            type="button"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-xl">
              close
            </span>
          </button>
        </div>

        <div className="mt-7">
          <p className="mb-2 text-sm font-bold text-[var(--muted)]">Or copy your unique link</p>
          <div className="flex items-center gap-2 rounded-2xl border border-[var(--line)] bg-[var(--surface-low)] p-2 pl-4">
            <span className="min-w-0 flex-1 truncate font-mono text-sm text-[var(--muted)]">
              {shortUrl}
            </span>
            <button
              className="rounded-xl bg-[var(--teal-500)] px-4 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
              onClick={copyLink}
              type="button"
            >
              Copy Link
            </button>
          </div>
          {copied ? (
            <p className="mt-2 text-sm font-semibold text-[var(--teal-700)]" role="status">
              Link copied
            </p>
          ) : null}
        </div>

        <div className="mt-7 flex justify-center gap-4 overflow-x-auto pb-2">
          {enabledChannels.map((channel) => (
            <button
              aria-label={`Share on ${channelLabels[channel.type]}`}
              className="flex min-w-16 flex-col items-center gap-2 text-sm font-semibold text-[var(--muted)] transition-colors hover:text-[var(--teal-700)]"
              key={channel.type}
              onClick={() => onChannelSelect?.(channel.type)}
              type="button"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full border border-[var(--line)] bg-white text-[var(--ink)] shadow-sm">
                <span aria-hidden="true" className="material-symbols-outlined">
                  {channelIcons[channel.type]}
                </span>
              </span>
              {channelLabels[channel.type]}
            </button>
          ))}
        </div>

        <div className="mt-6 rounded-3xl border border-[var(--line)] bg-white p-5">
          <div className="mb-4 flex items-start justify-between gap-4">
            <p className="text-sm font-medium leading-6 text-[var(--muted)]">
              Connect your Amazon Tracking ID to claim your 80% affiliate share directly.
            </p>
            <span className="text-2xl font-bold text-[var(--teal-500)]">80/20</span>
          </div>
          <div className="flex h-3 overflow-hidden rounded-full bg-[var(--line)]">
            <span className="w-4/5 bg-[var(--teal-700)]" />
            <span className="w-1/5 bg-[#85819b]" />
          </div>
          <div className="mt-3 flex justify-between text-sm font-bold">
            <span className="text-[var(--teal-700)]">80% fan / 20% creator</span>
            <span className="text-[var(--muted)]">auto tracked</span>
          </div>
        </div>
      </section>
    </div>
  );
}

export function ShareToEarnButton({
  returnTo,
  children,
  className,
  "aria-label": ariaLabel,
}: {
  readonly returnTo: string;
  readonly children: ReactNode;
  readonly className?: string;
  readonly "aria-label"?: string;
}) {
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <>
      <button
        aria-label={ariaLabel}
        className={
          className ??
          "inline-flex items-center gap-2 rounded-full bg-[var(--teal-700)] px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90"
        }
        onClick={() => setAuthOpen(true)}
        type="button"
      >
        {children}
      </button>
      <FanAuthDialog
        onClose={() => setAuthOpen(false)}
        open={authOpen}
        pendingAction="share"
        returnTo={returnTo}
      />
    </>
  );
}
