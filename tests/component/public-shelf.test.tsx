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
    { id: "channel-x", type: "X", value: "@liamshoots", sortPosition: 0 },
    { id: "channel-copy", type: "COPY", value: "https://linkshelf.local/liam", sortPosition: 1 },
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
      title: "Sony A7IV Mirrorless Camera",
      description: "33MP full-frame camera with pro performance.",
      priceCents: 249800,
      currency: "USD",
      merchant: "Amazon",
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
      title: "Sony A7IV Mirrorless Camera",
      description: "A versatile full-frame hybrid camera.",
      priceCents: 249800,
      currency: "USD",
      merchant: "Amazon",
      imageUrl: "https://example.com/camera.jpg",
      sortPosition: 0,
      hotspotX: 55,
      hotspotY: 38,
    },
    {
      id: "product-peak-tripod",
      title: "Peak Design Carbon Tripod",
      description: "A compact carbon travel tripod.",
      priceCents: 64995,
      currency: "USD",
      merchant: "Amazon",
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
    expect(screen.getByRole("link", { name: "Share to earn" })).toHaveAttribute(
      "href",
      "/liamroberts.photo/photography-kit",
    );
    expect(screen.getByRole("link", { name: "X" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Copy" })).toBeVisible();
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
      name: "Sony A7IV Mirrorless Camera",
    });
    expect(within(firstProduct).getByText("$2,498.00")).toBeVisible();
    expect(within(firstProduct).getByRole("link", { name: "Get Sony A7IV Mirrorless Camera" })).toHaveAttribute(
      "href",
      "/api/out/product-sony-a7iv?share=jamie-photo",
    );
  });

  it("omits share attribution from product links when no share code is present", () => {
    render(<ShelfPage shelf={shelf} />);

    expect(
      screen.getByRole("link", { name: "Get Peak Design Carbon Tripod" }),
    ).toHaveAttribute("href", "/api/out/product-peak-tripod");
  });
});
