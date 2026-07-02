import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { CreatorProfilePage } from "@/features/public-profile/creator-profile-page";
import { ShelfPage } from "@/features/public-profile/shelf-page";
import type { PublicCreatorProfile, PublicShelf } from "@/features/shelves/types";

const profile: PublicCreatorProfile = {
  creator: {
    id: "creator-liam",
    handle: "liamroberts.photo",
    displayName: "Liam Roberts",
    bio: "Landscape & travel photographer.",
    category: "Photography",
    avatarUrl: "https://example.com/avatar.jpg",
    coverUrl: "https://example.com/cover.jpg",
  },
  socialChannels: [
    {
      id: "channel-x",
      type: "X",
      value: "https://instagram.com/liamroberts.photo",
      sortPosition: 0,
    },
    {
      id: "channel-whatsapp",
      type: "WHATSAPP",
      value: "https://tiktok.com/@liamroberts.photo",
      sortPosition: 1,
    },
    {
      id: "channel-copy",
      type: "COPY",
      value: "https://youtube.com/@liamrobertsphoto",
      sortPosition: 2,
    },
  ],
  shelves: [
    {
      id: "shelf-photography",
      slug: "photography-kit",
      title: "Photography Kit",
      description: "Hybrid shooting gear.",
      category: "Photography",
      status: "PUBLISHED",
      coverUrl: "https://example.com/photo.jpg",
      productCount: 3,
    },
  ],
  featuredProducts: [
    {
      id: "product-sony-a7iv",
      title: "Sony a7 IV Mirrorless Camera",
      description: "33MP full-frame camera with pro performance.",
      priceCents: 249800,
      currency: "USD",
      merchant: "B&H Photo",
      imageUrl: "https://example.com/camera.jpg",
      sortPosition: 0,
      shelfId: "shelf-photography",
      shelfSlug: "photography-kit",
      shelfTitle: "Photography Kit",
      hotspotX: 55,
      hotspotY: 38,
    },
  ],
};

const shelf: PublicShelf = {
  id: "shelf-photography",
  slug: "photography-kit",
  title: "Photography Kit",
  description: "My daily driver setup for hybrid shooting.",
  category: "Photography",
  theme: "tech",
  sourceContentUrl: "https://www.youtube.com/watch?v=linkshelf-photo",
  coverUrl: "https://example.com/cover.jpg",
  heroImageUrl: "https://example.com/hero.jpg",
  creator: profile.creator,
  socialChannels: profile.socialChannels,
  products: [
    {
      id: "product-sony-a7iv",
      title: "Sony a7 IV Mirrorless Camera",
      description: "33MP full-frame camera with pro performance.",
      priceCents: 249800,
      currency: "USD",
      merchant: "B&H Photo",
      imageUrl: "https://example.com/camera.jpg",
      sortPosition: 0,
      hotspotX: 55,
      hotspotY: 38,
    },
    {
      id: "product-peak-tripod",
      title: "Peak Design Travel Tripod",
      description: "Compact, lightweight, and built to travel.",
      priceCents: 34995,
      currency: "USD",
      merchant: "Peak Design",
      imageUrl: "https://example.com/tripod.jpg",
      sortPosition: 1,
      hotspotX: 75,
      hotspotY: 60,
    },
  ],
};

describe("public LinkShelf surfaces", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the creator profile with shelf links and enabled social channels", () => {
    render(<CreatorProfilePage profile={profile} />);

    expect(screen.getByRole("heading", { name: "Liam Roberts" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Open Photography Kit shelf" })).toHaveAttribute(
      "href",
      "/liamroberts.photo/photography-kit",
    );
    expect(screen.getByRole("button", { name: "Share to earn" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Instagram" })).toHaveAttribute(
      "href",
      "https://instagram.com/liamroberts.photo",
    );
    expect(screen.getByRole("link", { name: "TikTok" })).toHaveAttribute(
      "href",
      "https://tiktok.com/@liamroberts.photo",
    );
    expect(screen.getByRole("link", { name: "YouTube" })).toHaveAttribute(
      "href",
      "https://youtube.com/@liamrobertsphoto",
    );
    expect(screen.queryByText("Get it")).not.toBeInTheDocument();
    expect(screen.getByText("open_in_new")).toBeVisible();
    expect(screen.queryByText("FACEBOOK")).not.toBeInTheDocument();
  });

  it("renders accessible product purchase links with optional fan attribution", () => {
    render(<ShelfPage shareCode="jamie-photo" shelf={shelf} />);

    expect(screen.getByRole("heading", { name: "Photography Kit" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Explore the original post & story behind this setup" })).toHaveAttribute(
      "href",
      "https://www.youtube.com/watch?v=linkshelf-photo",
    );

    const firstProduct = screen.getByRole("article", {
      name: "Sony a7 IV Mirrorless Camera",
    });
    expect(within(firstProduct).getByText("$2,498.00")).toBeVisible();
    expect(within(firstProduct).getByRole("link", { name: "Get Sony a7 IV Mirrorless Camera" })).toHaveAttribute(
      "href",
      "/api/out/product-sony-a7iv?share=jamie-photo",
    );
  });

  it("opens the share dialog on post-auth share resume links", () => {
    render(<ShelfPage initialShareDialogOpen shareCode="jamie-photo" shelf={shelf} />);

    expect(screen.getByRole("dialog", { name: "Share Shelf" })).toBeVisible();
    expect(screen.getByText("/liamroberts.photo/photography-kit?share=jamie-photo")).toBeVisible();
    expect(screen.getByRole("button", { name: "Share on X" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Share on WhatsApp" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Share on Copy" })).toBeVisible();
  });

  it("omits share attribution from product links when no share code is present", () => {
    render(<ShelfPage shelf={shelf} />);

    expect(
      screen.getByRole("link", { name: "Get Peak Design Travel Tripod" }),
    ).toHaveAttribute("href", "/api/out/product-peak-tripod");
  });
});
