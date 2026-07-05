/* eslint-disable @next/next/no-img-element -- Public profile imagery comes from Stitch or creator uploads. */

import Link from "next/link";
import { PublicNav } from "@/components/brand/public-nav";
import { SiteFooter } from "@/components/brand/site-footer";
import { SaveButton } from "@/features/engagement/save-button";
import { ShareToEarnButton } from "@/features/engagement/share-dialog";
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

const platformDisplays = [
  { host: "instagram.com", icon: "photo_camera", label: "Instagram" },
  { host: "tiktok.com", icon: "music_note", label: "TikTok" },
  { host: "youtube.com", icon: "smart_display", label: "YouTube" },
  { host: "youtu.be", icon: "smart_display", label: "YouTube" },
] as const;

function shelfHref(handle: string, shelf: PublicProfileShelf) {
  return `/${handle}/${shelf.slug}`;
}

function ShelfCardContent({ shelf }: { readonly shelf: PublicProfileShelf }) {
  return (
    <>
      <span className="landing-glass-card block aspect-square overflow-hidden rounded-2xl p-1 transition-transform group-hover:scale-[1.02]">
        {shelf.coverUrl ? (
          <img
            alt=""
            className="h-full w-full rounded-xl object-cover"
            src={shelf.coverUrl}
          />
        ) : null}
      </span>
      <span className="mt-2 block text-center text-sm font-medium leading-5 text-[var(--ink)] group-hover:text-[var(--teal-700)]">
        {shelf.title.replace(" 2024", "")}
      </span>
    </>
  );
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

function channelDisplay(channel: PublicSocialChannel) {
  try {
    const hostname = new URL(channelHref(channel)).hostname.replace(/^www\./, "");
    const platform = platformDisplays.find(
      (display) => hostname === display.host || hostname.endsWith(`.${display.host}`),
    );
    if (platform) {
      return platform;
    }
  } catch {
    // Fall back to the share-channel type display below.
  }

  return {
    icon: channelIcons[channel.type],
    label: channelLabels[channel.type],
  };
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

      <main className="mx-auto max-w-[900px] px-4 pb-10 pt-24 md:px-6">
        <section className="relative animate-fade-up" style={{ animationDelay: "100ms" }}>
          <div className="aspect-[21/9] overflow-hidden rounded-2xl bg-[var(--surface-low)] shadow-lg md:aspect-[3/1]">
            {profile.creator.coverUrl ? (
              <img
                alt=""
                className="h-full w-full object-cover"
                src={profile.creator.coverUrl}
              />
            ) : null}
          </div>

          <div className="absolute right-4 top-4 flex items-center gap-3">
            <ShareToEarnButton
              className="hidden items-center gap-2 rounded-full border border-[var(--teal-700)]/20 bg-[var(--teal-700)]/10 px-4 py-1.5 text-[var(--teal-700)] backdrop-blur-md sm:inline-flex"
              returnTo={shareHref}
            >
              <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
                monetization_on
              </span>
              <span className="text-xs font-semibold leading-4">Share to earn</span>
            </ShareToEarnButton>
            <SaveButton
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--ink)] text-white transition-opacity hover:opacity-85 [&_.material-symbols-outlined]:text-[20px]"
              iconOnly
              isSaved={false}
              returnTo={`/${profile.creator.handle}`}
              targetId={profile.creator.id}
              targetType="CREATOR"
            />
            <ShareToEarnButton
              aria-label="Share creator"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--ink)] text-white transition-opacity hover:opacity-85"
              returnTo={shareHref}
            >
              <span aria-hidden="true" className="material-symbols-outlined text-[20px]">
                share
              </span>
            </ShareToEarnButton>
          </div>

          <div className="-mt-12 flex flex-col gap-6 px-6 md:-mt-16 md:flex-row md:items-end">
            <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-white bg-white shadow-2xl md:h-32 md:w-32">
              {profile.creator.avatarUrl ? (
                <img
                  alt=""
                  className="h-full w-full object-cover"
                  src={profile.creator.avatarUrl}
                />
              ) : null}
            </div>
            <div className="pb-2">
              <h1 className="text-[32px] font-semibold leading-10">
                {profile.creator.displayName}
              </h1>
              <p className="text-base font-normal leading-6 text-[var(--muted)]">
                @{profile.creator.handle}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-8 px-6 animate-fade-up" style={{ animationDelay: "200ms" }}>
          <p className="max-w-2xl text-lg leading-7 text-[var(--ink)]">{profile.creator.bio}</p>

          <div className="mt-6 flex flex-wrap gap-3">
            {profile.socialChannels.map((channel) => {
              const display = channelDisplay(channel);

              return (
                <a
                  className="landing-glass-card inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium leading-5 text-[var(--muted)] transition-colors hover:text-[var(--teal-700)]"
                  href={channelHref(channel)}
                  key={channel.id}
                >
                  <span aria-hidden="true" className="material-symbols-outlined text-[20px]">
                    {display.icon}
                  </span>
                  {display.label}
                </a>
              );
            })}
          </div>
        </section>

        <section className="mt-12 animate-fade-up" id="shelves" style={{ animationDelay: "300ms" }}>
          <div className="mb-4 flex items-center justify-between px-1">
            <h2 className="text-[24px] font-semibold leading-8">Shelves</h2>
            <a className="text-sm font-semibold text-[var(--teal-700)] hover:underline" href="#shelves">
              View All
            </a>
          </div>

          <div className="no-scrollbar flex gap-5 overflow-x-auto pb-4">
            {profile.shelves.map((shelf) =>
              shelf.status === "PUBLISHED" ? (
                <Link
                  aria-label={`Open ${shelf.title} shelf`}
                  className="group w-40 shrink-0"
                  href={shelfHref(profile.creator.handle, shelf)}
                  key={shelf.id}
                >
                  <ShelfCardContent shelf={shelf} />
                </Link>
              ) : (
                <div
                  aria-label={`${shelf.title} shelf preview`}
                  className="group w-40 shrink-0"
                  key={shelf.id}
                >
                  <ShelfCardContent shelf={shelf} />
                </div>
              ),
            )}
          </div>
        </section>

        <section className="mt-12 flex flex-col gap-4">
          <div className="mb-2 flex items-center gap-2 px-1">
            <span aria-hidden="true" className="material-symbols-outlined text-[var(--teal-700)]">
              star
            </span>
            <h2 className="text-[24px] font-semibold leading-8">Featured Gear</h2>
          </div>

          <div className="flex flex-col gap-4">
            {profile.featuredProducts.map((product, index) => (
              <ProductCard
                animationDelayMs={400 + index * 50}
                compact
                key={product.id}
                product={product}
              />
            ))}
          </div>
        </section>
      </main>

      <SiteFooter variant="profile" />
    </div>
  );
}
