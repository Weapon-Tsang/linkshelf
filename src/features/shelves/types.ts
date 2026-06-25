export type ShelfStatus = "DRAFT" | "PUBLISHED";
export type SocialChannelType = "X" | "WHATSAPP" | "FACEBOOK" | "EMAIL" | "COPY";

export interface PublicCreator {
  readonly id: string;
  readonly handle: string;
  readonly displayName: string;
  readonly bio: string;
  readonly category: string;
  readonly avatarUrl: string | null;
  readonly coverUrl: string | null;
}

export interface PublicSocialChannel {
  readonly id: string;
  readonly type: SocialChannelType;
  readonly value: string;
  readonly sortPosition: number;
}

export interface PublicProfileShelf {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly category: string;
  readonly status: ShelfStatus;
  readonly coverUrl: string | null;
  readonly productCount: number;
}

export interface PublicProfileProduct {
  readonly id: string;
  readonly shelfId: string;
  readonly shelfSlug: string;
  readonly shelfTitle: string;
  readonly title: string;
  readonly description: string;
  readonly priceCents: number;
  readonly currency: string;
  readonly merchant: string;
  readonly imageUrl: string | null;
  readonly sortPosition: number;
  readonly hotspotX: number | null;
  readonly hotspotY: number | null;
}

export interface PublicCreatorProfile {
  readonly creator: PublicCreator;
  readonly socialChannels: readonly PublicSocialChannel[];
  readonly shelves: readonly PublicProfileShelf[];
  readonly featuredProducts: readonly PublicProfileProduct[];
}

export interface PublicShelfProduct {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly priceCents: number;
  readonly currency: string;
  readonly merchant: string;
  readonly imageUrl: string | null;
  readonly sortPosition: number;
  readonly hotspotX: number | null;
  readonly hotspotY: number | null;
}

export interface PublicShelf {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly category: string;
  readonly theme: string;
  readonly sourceContentUrl: string | null;
  readonly coverUrl: string | null;
  readonly heroImageUrl: string | null;
  readonly creator: PublicCreator;
  readonly socialChannels: readonly PublicSocialChannel[];
  readonly products: readonly PublicShelfProduct[];
}

export type CreatorProfileResult =
  | {
      readonly ok: true;
      readonly profile: PublicCreatorProfile;
    }
  | {
      readonly ok: false;
      readonly reason: "CREATOR_NOT_FOUND";
    };

export type PublicShelfResult =
  | {
      readonly ok: true;
      readonly shelf: PublicShelf;
    }
  | {
      readonly ok: false;
      readonly reason: "CREATOR_NOT_FOUND" | "SHELF_NOT_FOUND";
    };
