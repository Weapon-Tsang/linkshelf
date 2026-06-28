"use client";

import Image from "next/image";
import { useState } from "react";
import type { SocialChannelType } from "@/features/shelves/types";

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

function slugFromName(name: string) {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 32);
  return slug || "creator";
}

export function SettingsView({
  creator,
  deleteAccountAction,
  onDeleteAccount,
  saveProfileAction,
  saveTrackingAction,
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
  const [affiliateTag, setAffiliateTag] = useState(creator.affiliateTag);
  const [urlSuffix, setUrlSuffix] = useState(() => slugFromName(creator.displayName));
  const [deleteConfirmationVisible, setDeleteConfirmationVisible] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8">
      <header>
        <h1 className="text-4xl font-black tracking-[-0.055em] text-[var(--teal-700)] sm:text-5xl">
          Settings
        </h1>
        <p className="mt-2 text-lg font-medium leading-8 text-[var(--muted)]">
          Manage your account settings and preferences.
        </p>
      </header>

      <form
        action={saveProfileAction}
        className="rounded-xl border border-white/80 bg-white p-8 shadow-[0_4px_20px_rgba(11,19,43,0.04)]"
      >
        <h2 className="border-b border-[var(--line)] pb-4 text-2xl font-black tracking-[-0.035em] text-[var(--ink)]">
          Profile Settings
        </h2>

        <div className="mt-6 flex flex-col items-start gap-8 sm:flex-row">
          <div className="flex w-full flex-col items-center gap-4 sm:w-32 sm:shrink-0">
            <button
              aria-label="Change avatar image"
              className="group relative h-32 w-32 overflow-hidden rounded-full border-2 border-dashed border-[#c8c5cc] bg-[var(--surface-low)] transition-colors hover:border-[var(--teal-500)] focus:outline-none focus:ring-2 focus:ring-[var(--teal-500)] focus:ring-offset-2"
              type="button"
            >
              <Image
                alt="Creator avatar"
                className="h-full w-full object-cover"
                height={128}
                priority
                src="/stitch/assets/settings-avatar.png"
                width={128}
              />
              <span className="absolute inset-0 grid place-items-center bg-[rgba(11,19,43,0.38)] opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                <span aria-hidden="true" className="material-symbols-outlined text-3xl text-white">
                  photo_camera
                </span>
              </span>
            </button>
            <button
              className="rounded-full bg-[rgba(0,191,174,0.12)] px-4 py-2 text-sm font-black text-[var(--teal-700)] transition-colors hover:bg-[rgba(0,191,174,0.22)]"
              type="button"
            >
              Change Avatar
            </button>
          </div>

          <div className="grid w-full flex-1 gap-6">
            <div>
              <label
                className="mb-2 block text-sm font-black text-[var(--muted)]"
                htmlFor="settings-display-name"
              >
                Display Name
              </label>
              <input
                aria-label="Display name"
                className="min-h-12 w-full rounded-full border border-[#c8c5cc] bg-white px-6 text-base font-semibold text-[var(--ink)] outline-none transition-all focus:border-[var(--teal-500)] focus:ring-1 focus:ring-[var(--teal-500)]"
                id="settings-display-name"
                name="displayName"
                onChange={(event) => setDisplayName(event.target.value)}
                type="text"
                value={displayName}
              />
            </div>

            <div>
              <label
                className="mb-2 block text-sm font-black text-[var(--muted)]"
                htmlFor="settings-url-suffix"
              >
                Custom URL Suffix
              </label>
              <div className="flex min-w-0 items-center">
                <span className="inline-flex min-h-12 items-center rounded-l-full border border-r-0 border-[#c8c5cc] bg-[var(--surface-low)] px-4 text-sm font-semibold text-[var(--muted)] sm:text-base">
                  linkshelf.studio/
                </span>
                <input
                  className="min-h-12 min-w-0 flex-1 rounded-r-full border border-[#c8c5cc] bg-white px-6 text-base font-semibold text-[var(--ink)] outline-none transition-all focus:border-[var(--teal-500)] focus:ring-1 focus:ring-[var(--teal-500)]"
                  id="settings-url-suffix"
                  onChange={(event) => setUrlSuffix(event.target.value)}
                  type="text"
                  value={urlSuffix}
                />
              </div>
              <p className="mt-2 text-xs font-bold text-[var(--muted)]">
                This is your public shelf URL.
              </p>
            </div>

            <div>
              <label
                className="mb-2 block text-sm font-black text-[var(--muted)]"
                htmlFor="settings-bio"
              >
                Bio
              </label>
              <textarea
                className="min-h-24 w-full resize-none rounded-xl border border-[#c8c5cc] bg-white px-6 py-3 text-base font-semibold text-[var(--ink)] outline-none transition-all focus:border-[var(--teal-500)] focus:ring-1 focus:ring-[var(--teal-500)]"
                id="settings-bio"
                name="bio"
                onChange={(event) => setBio(event.target.value)}
                rows={3}
                value={bio}
              />
            </div>

            <input name="category" type="hidden" value={creator.category} />

            <div className="flex justify-end pt-2">
              <button
                className="min-h-12 rounded-full bg-[var(--teal-500)] px-6 text-sm font-black text-white shadow-sm transition-colors hover:bg-[#00a89a]"
                type="submit"
              >
                Save Profile
              </button>
            </div>
          </div>
        </div>
      </form>

      <form
        action={saveTrackingAction}
        className="rounded-xl border border-white/80 bg-white p-8 shadow-[0_4px_20px_rgba(11,19,43,0.04)]"
      >
        <h2 className="border-b border-[var(--line)] pb-4 text-2xl font-black tracking-[-0.035em] text-[var(--ink)]">
          Affiliate Configuration
        </h2>

        <div className="mt-6 grid gap-6">
          <div>
            <label
              className="mb-2 block text-sm font-black text-[var(--muted)]"
              htmlFor="settings-amazon-tracking"
            >
              Amazon Tracking ID
            </label>
            <div className="relative">
              <span
                aria-hidden="true"
                className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]"
              >
                shopping_bag
              </span>
              <input
                className="min-h-12 w-full rounded-full border border-[#c8c5cc] bg-white py-3 pl-12 pr-6 text-base font-semibold text-[var(--ink)] outline-none transition-all focus:border-[var(--teal-500)] focus:ring-1 focus:ring-[var(--teal-500)]"
                id="settings-amazon-tracking"
                name="affiliateTag"
                onChange={(event) => setAffiliateTag(event.target.value)}
                placeholder="e.g., alexrivera-20"
                type="text"
                value={affiliateTag}
              />
            </div>
            <p className="mt-2 text-xs font-bold text-[var(--muted)]">
              Earn commissions when users purchase items through your shelf links.
            </p>
          </div>

          <div className="flex justify-end">
            <button
              className="min-h-12 rounded-full bg-[var(--surface-low)] px-6 text-sm font-black text-[var(--ink)] transition-colors hover:bg-[#e9e5e9]"
              type="submit"
            >
              Update ID
            </button>
          </div>
        </div>
      </form>

      <section className="rounded-xl border border-white/80 bg-white p-8 shadow-[0_4px_20px_rgba(11,19,43,0.04)]">
        <h2 className="border-b border-[var(--line)] pb-4 text-2xl font-black tracking-[-0.035em] text-[var(--ink)]">
          Account Binding
        </h2>

        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between gap-4 rounded-xl border border-[#c8c5cc] bg-white p-4">
            <div className="flex items-center gap-4">
              <span
                aria-hidden="true"
                className="grid h-10 w-10 place-items-center rounded-full border border-[var(--line)] bg-white font-serif text-lg font-black text-red-500 shadow-sm"
              >
                G
              </span>
              <div>
                <h3 className="text-sm font-black text-[var(--ink)]">Google Account</h3>
                <p className="mt-1 text-sm font-semibold text-[var(--muted)]">
                  alex.rivera@example.com
                </p>
              </div>
            </div>
            <button
              aria-label="Unbind Google Account"
              className="rounded-full px-4 py-2 text-sm font-black text-[var(--danger)] transition-colors hover:bg-[#ffdad6]/55"
              type="button"
            >
              Unbind
            </button>
          </div>

          <div className="flex items-center justify-between gap-4 rounded-xl border border-[#c8c5cc] bg-white p-4">
            <div className="flex items-center gap-4">
              <span
                aria-hidden="true"
                className="grid h-10 w-10 place-items-center rounded-full bg-[#24292e] text-white shadow-sm"
              >
                <span className="material-symbols-outlined text-xl">code</span>
              </span>
              <div>
                <h3 className="text-sm font-black text-[var(--ink)]">GitHub Account</h3>
                <p className="mt-1 text-sm font-semibold text-[var(--muted)]">Not connected</p>
              </div>
            </div>
            <button
              aria-label="Bind GitHub Account"
              className="rounded-full bg-[rgba(0,191,174,0.12)] px-6 py-2 text-sm font-black text-[var(--teal-700)] transition-colors hover:bg-[rgba(0,191,174,0.22)]"
              type="button"
            >
              Bind
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-[rgba(186,26,26,0.2)] bg-white p-8 shadow-[0_4px_20px_rgba(11,19,43,0.04)]">
        <h2 className="text-2xl font-black tracking-[-0.035em] text-[var(--danger)]">
          Danger Zone
        </h2>
        <p className="mt-2 text-base font-medium text-[var(--muted)]">
          Irreversible actions regarding your account.
        </p>

        <div className="mt-6 rounded-xl border border-[rgba(186,26,26,0.1)] bg-[#ffdad6]/25 p-4">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-sm font-black text-[var(--ink)]">Delete Account</h3>
              <p className="mt-1 text-sm font-semibold text-[var(--muted)]">
                Permanently remove your account and all data.
              </p>
            </div>
            <button
              className="min-h-12 rounded-full bg-[var(--danger)] px-6 text-sm font-black text-white shadow-sm transition-colors hover:bg-[#9f1414] disabled:cursor-not-allowed disabled:bg-red-300"
              onClick={() => {
                if (!deleteConfirmationVisible) {
                  setDeleteConfirmationVisible(true);
                  return;
                }
                if (deleteConfirmation === "DELETE") {
                  onDeleteAccount?.();
                  void deleteAccountAction?.();
                }
              }}
              type="button"
            >
              {deleteConfirmationVisible ? "Confirm Delete Account" : "Delete Account"}
            </button>
          </div>

          {deleteConfirmationVisible ? (
            <label className="mt-5 grid gap-2 text-sm font-black text-[var(--danger)]">
              Confirm account deletion
              <input
                className="min-h-12 rounded-full border border-red-200 bg-white px-5 text-base font-semibold text-[var(--ink)] outline-none transition-all focus:border-[var(--danger)] focus:ring-1 focus:ring-[var(--danger)]"
                onChange={(event) => setDeleteConfirmation(event.target.value)}
                value={deleteConfirmation}
              />
            </label>
          ) : null}
        </div>
      </section>

      <div className="h-12" aria-hidden="true" />
    </div>
  );
}
