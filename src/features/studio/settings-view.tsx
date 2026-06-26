"use client";

import { useState } from "react";
import type { SocialChannelType } from "@/features/shelves/types";
import { cn } from "@/lib/cn";

export interface SettingsCreatorViewModel {
  readonly displayName: string;
  readonly bio: string;
  readonly category: string;
  readonly affiliateTag: string;
}

export interface SettingsChannelViewModel {
  readonly type: SocialChannelType;
  readonly enabled: boolean;
  readonly value: string;
}

type StudioFormAction = (formData: FormData) => void | Promise<void>;

function channelLabel(type: SocialChannelType) {
  if (type === "X") return "X";
  if (type === "COPY") return "Copy link";
  return type.charAt(0) + type.slice(1).toLowerCase();
}

export function SettingsView({
  channels,
  creator,
  deleteAccountAction,
  onDeleteAccount,
  saveProfileAction,
  saveTrackingAction,
  toggleChannelAction,
}: {
  readonly channels: readonly SettingsChannelViewModel[];
  readonly creator: SettingsCreatorViewModel;
  readonly deleteAccountAction?: () => void | Promise<void>;
  readonly onDeleteAccount?: () => void;
  readonly saveProfileAction?: StudioFormAction;
  readonly saveTrackingAction?: StudioFormAction;
  readonly toggleChannelAction?: StudioFormAction;
}) {
  const [displayName, setDisplayName] = useState(creator.displayName);
  const [bio, setBio] = useState(creator.bio);
  const [category, setCategory] = useState(creator.category);
  const [affiliateTag, setAffiliateTag] = useState(creator.affiliateTag);
  const [channelState, setChannelState] = useState(() =>
    Object.fromEntries(channels.map((channel) => [channel.type, channel.enabled])) as Record<
      SocialChannelType,
      boolean
    >,
  );
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  return (
    <div>
      <header>
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--teal-700)]">
          Settings
        </p>
        <h1 className="mt-2 text-4xl font-bold tracking-[-0.04em] sm:text-5xl">
          Creator preferences
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-[var(--muted)]">
          Tune your profile identity, simulated Amazon tracking ID, and fan-facing share channels.
        </p>
      </header>

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <form
          action={saveProfileAction}
          className="rounded-[32px] border border-white/80 bg-white/82 p-6 shadow-[var(--shadow-card)]"
        >
          <h2 className="text-2xl font-bold tracking-[-0.03em]">Profile</h2>
          <div className="mt-6 grid gap-5">
            <label className="grid gap-2 text-sm font-bold text-[var(--muted)]">
              Display name
              <input
                className="min-h-12 rounded-2xl border border-[var(--line)] bg-[var(--surface-low)] px-4 text-base font-semibold text-[var(--ink)]"
                name="displayName"
                onChange={(event) => setDisplayName(event.target.value)}
                value={displayName}
              />
            </label>

            <label className="grid gap-2 text-sm font-bold text-[var(--muted)]">
              Bio
              <textarea
                className="min-h-28 rounded-2xl border border-[var(--line)] bg-[var(--surface-low)] px-4 py-3 text-base font-semibold text-[var(--ink)]"
                name="bio"
                onChange={(event) => setBio(event.target.value)}
                value={bio}
              />
            </label>

            <label className="grid gap-2 text-sm font-bold text-[var(--muted)]">
              Category
              <input
                className="min-h-12 rounded-2xl border border-[var(--line)] bg-[var(--surface-low)] px-4 text-base font-semibold text-[var(--ink)]"
                name="category"
                onChange={(event) => setCategory(event.target.value)}
                value={category}
              />
            </label>
          </div>
          <button
            className="mt-6 min-h-12 rounded-full bg-[var(--teal-700)] px-5 text-sm font-bold text-white"
            type="submit"
          >
            Save profile
          </button>
        </form>

        <aside className="grid gap-6">
          <form
            action={saveTrackingAction}
            className="rounded-[32px] border border-white/80 bg-white/82 p-6 shadow-[var(--shadow-card)]"
          >
            <h2 className="text-2xl font-bold tracking-[-0.03em]">Affiliate</h2>
            <label className="grid gap-2 text-sm font-bold text-[var(--muted)]">
              Amazon Tracking ID
              <input
                className="min-h-12 rounded-2xl border border-[var(--line)] bg-[var(--surface-low)] px-4 text-base font-semibold text-[var(--ink)]"
                name="affiliateTag"
                onChange={(event) => setAffiliateTag(event.target.value)}
                value={affiliateTag}
              />
            </label>
            <button
              className="mt-5 min-h-12 rounded-full bg-[var(--ink)] px-5 text-sm font-bold text-white"
              type="submit"
            >
              Save tracking ID
            </button>
          </form>

          <section className="rounded-[32px] border border-white/80 bg-white/82 p-6 shadow-[var(--shadow-card)]">
            <h2 className="text-2xl font-bold tracking-[-0.03em]">Share channels</h2>
            <div className="mt-5 grid gap-3">
              {channels.map((channel) => {
                const enabled = channelState[channel.type] ?? false;
                return (
                  <button
                    aria-checked={enabled}
                    aria-label={channel.type}
                    className="flex min-h-14 items-center justify-between gap-4 rounded-2xl bg-[var(--surface-low)] px-4 text-left"
                    key={channel.type}
                    onClick={() =>
                      setChannelState((current) => {
                        const nextEnabled = !(current[channel.type] ?? false);
                        if (toggleChannelAction) {
                          const formData = new FormData();
                          formData.set("type", channel.type);
                          formData.set("enabled", String(nextEnabled));
                          void toggleChannelAction(formData);
                        }
                        return {
                          ...current,
                          [channel.type]: nextEnabled,
                        };
                      })
                    }
                    role="switch"
                    type="button"
                  >
                    <span>
                      <span className="block font-bold">{channel.type}</span>
                      <span className="block text-xs font-semibold text-[var(--muted)]">
                        {channelLabel(channel.type)}
                      </span>
                    </span>
                    <span
                      aria-hidden="true"
                      className={cn(
                        "relative h-7 w-12 rounded-full transition-colors",
                        enabled ? "bg-[var(--teal-700)]" : "bg-[#d8d2c9]",
                      )}
                    >
                      <span
                        className={cn(
                          "absolute top-1 h-5 w-5 rounded-full bg-white transition-transform",
                          enabled ? "translate-x-6" : "translate-x-1",
                        )}
                      />
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-[32px] border border-red-200 bg-red-50 p-6">
            <h2 className="text-2xl font-bold tracking-[-0.03em] text-red-950">
              Danger zone
            </h2>
            <p className="mt-3 text-sm leading-6 text-red-900">
              Type DELETE before removing your creator account from future sign-ins.
            </p>
            <label className="mt-5 grid gap-2 text-sm font-bold text-red-950">
              Confirm account deletion
              <input
                className="min-h-12 rounded-2xl border border-red-200 bg-white px-4 text-base font-semibold"
                onChange={(event) => setDeleteConfirmation(event.target.value)}
                value={deleteConfirmation}
              />
            </label>
            <button
              className="mt-4 min-h-12 w-full rounded-full bg-red-700 px-5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-red-300"
              onClick={() => {
                if (deleteConfirmation === "DELETE") {
                  onDeleteAccount?.();
                  void deleteAccountAction?.();
                }
              }}
              type="button"
            >
              Delete account
            </button>
          </section>
        </aside>
      </div>
    </div>
  );
}
