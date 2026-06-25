/* eslint-disable @next/next/no-img-element -- Public shelf hero imagery comes from Stitch or creator uploads. */

import type { PublicShelf } from "@/features/shelves/types";
import { SaveButton } from "@/features/engagement/save-button";
import { ShareToEarnButton } from "@/features/engagement/share-dialog";

export function HotspotHero({ shelf }: { readonly shelf: PublicShelf }) {
  return (
    <header className="relative min-h-[520px] overflow-hidden rounded-b-[36px] bg-[var(--ink)] md:min-h-[680px] md:rounded-[36px]">
      {shelf.heroImageUrl ? (
        <img
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          src={shelf.heroImageUrl}
        />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-[var(--surface)]" />

      <div className="absolute right-5 top-5 z-10 flex items-center gap-3">
        <SaveButton
          className="flex h-12 w-12 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur-md transition-colors hover:bg-black"
          iconOnly
          isSaved={false}
          returnTo={`/${shelf.creator.handle}/${shelf.slug}`}
          targetId={shelf.id}
          targetType="SHELF"
        />
        <ShareToEarnButton
          aria-label="Share shelf"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur-md transition-colors hover:bg-black"
          returnTo={`/${shelf.creator.handle}/${shelf.slug}`}
        >
          <span aria-hidden="true" className="material-symbols-outlined">
            ios_share
          </span>
        </ShareToEarnButton>
      </div>

      <ShareToEarnButton
        className="absolute right-5 top-20 z-10 rounded-full border border-[var(--teal-500)]/25 bg-[var(--teal-700)]/20 px-4 py-2 text-sm font-semibold text-[var(--teal-500)] backdrop-blur-md transition-colors hover:bg-[var(--teal-700)]/30"
        returnTo={`/${shelf.creator.handle}/${shelf.slug}`}
      >
        Share to earn
      </ShareToEarnButton>

      {shelf.products.map((product, index) =>
        product.hotspotX !== null && product.hotspotY !== null ? (
          <a
            aria-label={`Jump to ${product.title}`}
            className="absolute z-10 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-[var(--teal-700)] text-base font-bold text-white shadow-[0_12px_32px_rgba(0,0,0,0.24)] transition-transform hover:scale-110"
            href={`#product-${product.id}`}
            key={product.id}
            style={{ left: `${product.hotspotX}%`, top: `${product.hotspotY}%` }}
          >
            {index + 1}
          </a>
        ) : null,
      )}

      <div className="absolute bottom-12 left-6 z-10 text-white md:bottom-16 md:left-10">
        <h1 className="text-4xl font-bold tracking-[-0.03em] md:text-6xl">
          {shelf.creator.displayName}
        </h1>
        <div className="mt-3 flex items-center gap-3 text-lg font-medium text-white/85">
          <span>@{shelf.creator.handle.split(".")[0]}</span>
          <span aria-hidden="true" className="material-symbols-outlined text-xl">
            tag
          </span>
          <span aria-hidden="true" className="material-symbols-outlined text-xl">
            photo_camera
          </span>
        </div>
      </div>
    </header>
  );
}
