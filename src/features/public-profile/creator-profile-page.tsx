/* eslint-disable @next/next/no-img-element -- Public profile imagery comes from Stitch or creator uploads. */

import Link from "next/link";
import { PublicNav } from "@/components/brand/public-nav";
import { SiteFooter } from "@/components/brand/site-footer";
import type {
  PublicCreatorProfile,
  PublicProfileShelf,
  PublicSocialChannel,
} from "@/features/shelves/types";
import { ProductCard } from "./product-card";

const channelLabels = {
  X: "X",
  WHATSAPP: "WhatsApp",
  FACEBOOK: "Facebook",
  EMAIL: "Email",
  COPY: "Copy",
} as const;

const channelIcons = {
  X: "alternate_email",
  WHATSAPP: "chat",
  FACEBOOK: "groups",
  EMAIL: "mail",
  COPY: "link",
} as const;

function shelfHref(handle: string, shelf: PublicProfileShelf) {
  return `/${handle}/${shelf.slug}`;
}

function safeExternalHref(value: string) {
  try {
    const url = new URL(value);
    return ["http:", "https:", "mailto:"].includes(url.protocol) ? value : "#";
  } catch {
    return "#";
  }
}

function channelHref(channel: PublicSocialChannel) {
  if (channel.type === "EMAIL") {
    return channel.value.startsWith("mailto:") ? channel.value : `mailto:${channel.value}`;
  }

  if (channel.type === "X" && channel.value.startsWith("@")) {
    return `https://x.com/${channel.value.slice(1)}`;
  }

  return safeExternalHref(channel.value);
}

export function CreatorProfilePage({
  profile,
}: {
  readonly profile: PublicCreatorProfile;
}) {
  const primaryShelf =
    profile.shelves.find((shelf) => shelf.status === "PUBLISHED") ?? profile.shelves[0] ?? null;
  const shareHref = primaryShelf ? shelfHref(profile.creator.handle, primaryShelf) : "#shelves";

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#e0f7fa_0%,#fff_48%,#f0fdf4_100%)] text-[var(--ink)]">
      <PublicNav />

      <main className="mx-auto max-w-[900px] px-5 pb-16 pt-24 md:px-6">
        <section className="relative">
          <div className="aspect-[21/9] overflow-hidden rounded-3xl bg-[var(--surface-low)] shadow-lg md:aspect-[3/1]">
            {profile.creator.coverUrl ? (
              <img
                alt=""
                className="h-full w-full object-cover"
                src={profile.creator.coverUrl}
              />
            ) : null}
          </div>

          <div className="absolute right-4 top-4 flex items-center gap-3">
            <Link
              className="hidden items-center gap-2 rounded-full border border-[var(--teal-700)]/20 bg-[var(--teal-700)]/10 px-4 py-2 text-sm font-semibold text-[var(--teal-700)] backdrop-blur-md sm:inline-flex"
              href={shareHref}
            >
              <span aria-hidden="true" className="material-symbols-outlined text-lg">
                monetization_on
              </span>
              Share to earn
            </Link>
            <button
              aria-label="Save creator after fan login"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--ink)] text-white opacity-80"
              disabled
              type="button"
            >
              <span aria-hidden="true" className="material-symbols-outlined">
                favorite
              </span>
            </button>
            <Link
              aria-label="Share creator"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--ink)] text-white transition-opacity hover:opacity-85"
              href={shareHref}
            >
              <span aria-hidden="true" className="material-symbols-outlined">
                share
              </span>
            </Link>
          </div>

          <div className="-mt-14 flex flex-col gap-5 px-5 md:-mt-16 md:flex-row md:items-end">
            <div className="h-28 w-28 overflow-hidden rounded-full border-4 border-white bg-white shadow-2xl md:h-32 md:w-32">
              {profile.creator.avatarUrl ? (
                <img
                  alt=""
                  className="h-full w-full object-cover"
                  src={profile.creator.avatarUrl}
                />
              ) : null}
            </div>
            <div className="pb-2">
              <h1 className="text-4xl font-bold tracking-[-0.02em]">
                {profile.creator.displayName}
              </h1>
              <p className="mt-1 text-lg font-medium text-[var(--muted)]">
                @{profile.creator.handle}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-8 px-5">
          <p className="max-w-2xl text-xl leading-9 text-[var(--ink)]">{profile.creator.bio}</p>

          <div className="mt-6 flex flex-wrap gap-3">
            {profile.socialChannels.map((channel) => (
              <a
                className="landing-glass-card inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-[var(--muted)] transition-colors hover:text-[var(--teal-700)]"
                href={channelHref(channel)}
                key={channel.id}
              >
                <span aria-hidden="true" className="material-symbols-outlined text-xl">
                  {channelIcons[channel.type]}
                </span>
                {channelLabels[channel.type]}
              </a>
            ))}
          </div>
        </section>

        <section className="mt-14" id="shelves">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-[-0.02em]">Shelves</h2>
            <a className="text-sm font-semibold text-[var(--teal-700)] hover:underline" href="#shelves">
              View All
            </a>
          </div>

          <div className="flex gap-5 overflow-x-auto pb-4">
            {profile.shelves.map((shelf) => (
              <Link
                aria-label={`Open ${shelf.title} shelf`}
                className="group w-40 shrink-0"
                href={shelfHref(profile.creator.handle, shelf)}
                key={shelf.id}
              >
                <span className="landing-glass-card block aspect-square overflow-hidden rounded-3xl p-1 transition-transform group-hover:scale-[1.02]">
                  {shelf.coverUrl ? (
                    <img
                      alt=""
                      className="h-full w-full rounded-[20px] object-cover"
                      src={shelf.coverUrl}
                    />
                  ) : null}
                </span>
                <span className="mt-3 block text-center text-sm font-semibold text-[var(--ink)] group-hover:text-[var(--teal-700)]">
                  {shelf.title.replace(" 2024", "")}
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-14">
          <div className="mb-6 flex items-center gap-3">
            <span aria-hidden="true" className="material-symbols-outlined text-[var(--teal-700)]">
              star
            </span>
            <h2 className="text-3xl font-bold tracking-[-0.02em]">Featured Gear</h2>
          </div>

          <div className="flex flex-col gap-5">
            {profile.featuredProducts.map((product) => (
              <ProductCard compact key={product.id} product={product} />
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
