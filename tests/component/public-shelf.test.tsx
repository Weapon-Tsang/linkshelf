import { readFileSync } from "node:fs";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

  it("renders draft profile shelf cards as non-link previews", () => {
    render(
      <CreatorProfilePage
        profile={{
          ...profile,
          shelves: [
            ...profile.shelves,
            {
              id: "shelf-desk",
              slug: "desk-setup-2024",
              title: "Desk Setup 2024",
              description: "A calm, ergonomic workspace for editing and deep work.",
              category: "Workspace",
              status: "DRAFT",
              coverUrl: "https://example.com/desk.jpg",
              productCount: 2,
            },
          ],
        }}
      />,
    );

    expect(screen.getByLabelText("Desk Setup 2024 shelf preview")).toBeVisible();
    expect(screen.queryByRole("link", { name: "Open Desk Setup 2024 shelf" })).toBeNull();
  });

  it("opens fan authentication from the anonymous hero share button", async () => {
    render(<ShelfPage shelf={shelf} />);

    await userEvent.click(screen.getByRole("button", { name: "Share shelf" }));

    expect(screen.getByRole("dialog", { name: "Fan Authentication" })).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Continue with Google" }).closest("form")?.querySelector(
        'input[name="returnTo"]',
      ),
    ).toHaveValue("/liamroberts.photo/photography-kit?resume=share");
  });

  it("uses Stitch headline-md typography for creator profile section headings", () => {
    render(<CreatorProfilePage profile={profile} />);

    const shelvesHeading = screen.getByRole("heading", { name: "Shelves" });
    const featuredHeading = screen.getByRole("heading", { name: "Featured Gear" });

    [shelvesHeading, featuredHeading].forEach((heading) => {
      expect(heading).toHaveClass("text-[24px]", "leading-8", "font-semibold");
      expect(heading).not.toHaveClass("text-3xl", "tracking-[-0.02em]");
    });
  });

  it("uses the Stitch vertical rhythm for creator profile shelf and gear sections", () => {
    render(<CreatorProfilePage profile={profile} />);

    const shelvesSection = screen.getByRole("heading", { name: "Shelves" }).closest("section");
    const shelvesHeader = screen.getByRole("heading", { name: "Shelves" }).parentElement;
    const featuredHeading = screen.getByRole("heading", { name: "Featured Gear" });
    const featuredSection = featuredHeading.closest("section");
    const featuredHeader = featuredHeading.parentElement;
    const featuredList = featuredHeader?.nextElementSibling;

    expect(shelvesSection).toHaveClass("mt-12");
    expect(shelvesSection).not.toHaveClass("mt-14");
    expect(shelvesHeader).toHaveClass("mb-4", "px-1");
    expect(shelvesHeader).not.toHaveClass("mb-5");
    expect(featuredSection).toHaveClass("mt-12", "flex", "flex-col", "gap-4");
    expect(featuredSection).not.toHaveClass("mt-14");
    expect(featuredHeader).toHaveClass("gap-2", "mb-2", "px-1");
    expect(featuredHeader).not.toHaveClass("gap-3");
    expect(featuredHeader).not.toHaveClass("mb-6");
    expect(featuredList).toHaveClass("gap-4");
    expect(featuredList).not.toHaveClass("gap-5");
  });

  it("uses the Stitch fade-up staging hooks on creator profile sections and gear cards", () => {
    render(
      <CreatorProfilePage
        profile={{
          ...profile,
          featuredProducts: [
            ...profile.featuredProducts,
            {
              id: "product-sony-lens",
              title: "Sony FE 35mm f/1.4 GM Lens",
              description: "Stunning sharpness and beautiful bokeh.",
              priceCents: 139800,
              currency: "USD",
              merchant: "B&H Photo",
              imageUrl: "https://example.com/lens.jpg",
              sortPosition: 1,
              shelfId: "shelf-photography",
              shelfSlug: "photography-kit",
              shelfTitle: "Photography Kit",
              hotspotX: 35,
              hotspotY: 42,
            },
            {
              id: "product-peak-tripod",
              title: "Peak Design Travel Tripod",
              description: "Compact, lightweight, and built to travel.",
              priceCents: 34995,
              currency: "USD",
              merchant: "Peak Design",
              imageUrl: "https://example.com/tripod.jpg",
              sortPosition: 2,
              shelfId: "shelf-photography",
              shelfSlug: "photography-kit",
              shelfTitle: "Photography Kit",
              hotspotX: 65,
              hotspotY: 58,
            },
          ],
        }}
      />,
    );

    const coverImage = document.querySelector('img[src="https://example.com/cover.jpg"]');
    const profileSection = coverImage?.closest("section");
    const infoSection = screen.getByText(profile.creator.bio).closest("section");
    const shelvesSection = screen.getByRole("heading", { name: "Shelves" }).closest("section");

    expect(profileSection).toHaveClass("animate-fade-up");
    expect(profileSection).toHaveStyle({ animationDelay: "100ms" });
    expect(infoSection).toHaveClass("animate-fade-up");
    expect(infoSection).toHaveStyle({ animationDelay: "200ms" });
    expect(shelvesSection).toHaveClass("animate-fade-up");
    expect(shelvesSection).toHaveStyle({ animationDelay: "300ms" });

    [
      ["Sony a7 IV Mirrorless Camera", "400ms"],
      ["Sony FE 35mm f/1.4 GM Lens", "450ms"],
      ["Peak Design Travel Tripod", "500ms"],
    ].forEach(([name, delay]) => {
      const gearCard = screen.getByRole("article", { name });

      expect(gearCard).toHaveClass("animate-fade-up");
      expect(gearCard).toHaveStyle({ animationDelay: delay });
    });
  });

  it("uses the Stitch hidden-scrollbar rail for creator profile shelves", () => {
    render(<CreatorProfilePage profile={profile} />);

    const shelvesHeading = screen.getByRole("heading", { name: "Shelves" });
    const shelvesRail = shelvesHeading.parentElement?.nextElementSibling;
    const profileCss = readFileSync("src/app/globals.css", "utf8");

    expect(shelvesRail).toHaveClass("overflow-x-auto", "pb-4", "no-scrollbar");
    expect(profileCss).toContain(".no-scrollbar::-webkit-scrollbar");
    expect(profileCss).toContain("display: none;");
    expect(profileCss).toContain("scrollbar-width: none;");
  });

  it("uses the Stitch radius treatment for creator profile shelf cards", () => {
    render(<CreatorProfilePage profile={profile} />);

    const shelfLink = screen.getByRole("link", { name: "Open Photography Kit shelf" });
    const shelfFrame = shelfLink.querySelector(".landing-glass-card");
    const shelfImage = shelfLink.querySelector("img");

    expect(shelfFrame).toHaveClass("rounded-2xl");
    expect(shelfFrame).not.toHaveClass("rounded-3xl");
    expect(shelfImage).toHaveClass("rounded-xl");
    expect(shelfImage).not.toHaveClass("rounded-[20px]");
  });

  it("uses the Stitch label-md treatment for creator profile shelf card labels", () => {
    render(<CreatorProfilePage profile={profile} />);

    const shelfLabel = screen.getByText("Photography Kit");

    expect(shelfLabel).toHaveClass("mt-2", "text-sm", "leading-5", "font-medium");
    expect(shelfLabel).not.toHaveClass("mt-3", "font-semibold");
  });

  it("uses the Stitch radius treatment for the creator profile cover", () => {
    render(<CreatorProfilePage profile={profile} />);

    const coverImage = document.querySelector('img[src="https://example.com/cover.jpg"]');
    const coverFrame = coverImage?.parentElement;

    expect(coverFrame).toHaveClass("rounded-2xl");
    expect(coverFrame).not.toHaveClass("rounded-3xl");
  });

  it("uses the Stitch main canvas spacing for the creator profile", () => {
    render(<CreatorProfilePage profile={profile} />);

    const coverImage = document.querySelector('img[src="https://example.com/cover.jpg"]');
    const mainCanvas = coverImage?.closest("main");

    expect(mainCanvas).toHaveClass("mx-auto", "max-w-[900px]", "px-4", "pb-10", "pt-24", "md:px-6");
    expect(mainCanvas).not.toHaveClass("px-5", "pb-16");
  });

  it("uses the Stitch profile footer treatment on creator profiles", () => {
    render(<CreatorProfilePage profile={profile} />);

    const footer = screen.getByRole("contentinfo");
    const footerInner = footer.firstElementChild;

    expect(footer).toHaveClass("mt-12", "bg-white", "py-8");
    expect(footer).not.toHaveClass("bg-[var(--surface)]", "py-12");
    expect(footerInner).toHaveClass("gap-4", "px-6");
    expect(screen.getByRole("link", { name: "Privacy" })).toBeVisible();
    expect(screen.getByText("© 2024 LinkShelf Inc.")).toBeVisible();
    expect(screen.queryByText("© 2024 LinkShelf Inc. All rights reserved.")).toBeNull();
  });

  it("uses the Stitch headline-lg typography for the creator name", () => {
    render(<CreatorProfilePage profile={profile} />);

    const creatorName = screen.getByRole("heading", { name: "Liam Roberts" });

    expect(creatorName).toHaveClass("text-[32px]", "leading-10", "font-semibold");
    expect(creatorName).not.toHaveClass("text-4xl", "font-bold", "tracking-[-0.02em]");
  });

  it("uses the Stitch header overlap and spacing for the creator identity row", () => {
    render(<CreatorProfilePage profile={profile} />);

    const creatorName = screen.getByRole("heading", { name: "Liam Roberts" });
    const identityRow = creatorName.parentElement?.parentElement;

    expect(identityRow).toHaveClass("-mt-12", "gap-6", "px-6", "md:-mt-16");
    expect(identityRow).not.toHaveClass("-mt-14", "gap-5", "px-5");
  });

  it("uses the Stitch responsive avatar frame sizing on the creator profile", () => {
    render(<CreatorProfilePage profile={profile} />);

    const avatarImage = document.querySelector('img[src="https://example.com/avatar.jpg"]');
    const avatarFrame = avatarImage?.parentElement;

    expect(avatarFrame).toHaveClass("h-24", "w-24", "md:h-32", "md:w-32");
    expect(avatarFrame).not.toHaveClass("h-28", "w-28");
  });

  it("uses the Stitch compact floating action controls on the creator profile cover", () => {
    render(<CreatorProfilePage profile={profile} />);

    const saveButton = screen.getByRole("button", { name: "Save creator" });
    const shareButton = screen.getByRole("button", { name: "Share creator" });
    const shareIcon = within(shareButton).getByText("share");

    expect(saveButton).toHaveClass("h-10", "w-10", "[&_.material-symbols-outlined]:text-[20px]");
    expect(saveButton).not.toHaveClass("h-11", "w-11");
    expect(shareButton).toHaveClass("h-10", "w-10");
    expect(shareButton).not.toHaveClass("h-11", "w-11");
    expect(shareIcon).toHaveClass("text-[20px]");
  });

  it("uses the Stitch compact share-to-earn pill on the creator profile cover", () => {
    render(<CreatorProfilePage profile={profile} />);

    const shareToEarn = screen.getByRole("button", { name: "Share to earn" });
    const shareToEarnIcon = within(shareToEarn).getByText("monetization_on");
    const shareToEarnLabel = within(shareToEarn).getByText("Share to earn");

    expect(shareToEarn).toHaveClass("px-4", "py-1.5");
    expect(shareToEarn).not.toHaveClass("py-2", "text-sm", "font-semibold");
    expect(shareToEarnIcon).toHaveClass("text-[18px]");
    expect(shareToEarnIcon).not.toHaveClass("text-lg");
    expect(shareToEarnLabel).toHaveClass("text-xs", "font-semibold", "leading-4");
  });

  it("uses the Stitch body-md typography for the creator handle", () => {
    render(<CreatorProfilePage profile={profile} />);

    const creatorHandle = screen.getByText("@liamroberts.photo");

    expect(creatorHandle).toHaveClass("text-base", "leading-6", "font-normal");
    expect(creatorHandle).not.toHaveClass("text-lg", "font-medium", "mt-1");
  });

  it("uses the Stitch body-lg typography for the creator bio", () => {
    render(<CreatorProfilePage profile={profile} />);

    const creatorBio = screen.getByText(profile.creator.bio);

    expect(creatorBio).toHaveClass("max-w-2xl", "text-lg", "leading-7");
    expect(creatorBio).not.toHaveClass("text-xl", "leading-9");
  });

  it("uses the Stitch horizontal inset for the creator bio and social section", () => {
    render(<CreatorProfilePage profile={profile} />);

    const creatorBio = screen.getByText(profile.creator.bio);
    const infoSection = creatorBio.closest("section");

    expect(infoSection).toHaveClass("mt-8", "px-6");
    expect(infoSection).not.toHaveClass("px-5");
  });

  it("uses the Stitch social chip density on the creator profile", () => {
    render(<CreatorProfilePage profile={profile} />);

    const instagram = screen.getByRole("link", { name: "Instagram" });
    const instagramIcon = within(instagram).getByText("photo_camera");

    expect(instagram).toHaveClass("px-4", "py-2", "text-sm", "leading-5", "font-medium");
    expect(instagram).not.toHaveClass("px-5", "py-3", "font-semibold");
    expect(instagramIcon).toHaveClass("text-[20px]");
    expect(instagramIcon).not.toHaveClass("text-xl");
  });

  it("uses the Stitch compact thumbnail frame for creator profile gear cards", () => {
    render(<CreatorProfilePage profile={profile} />);

    const firstGearCard = screen.getByRole("article", { name: "Sony a7 IV Mirrorless Camera" });
    const thumbnailFrame = firstGearCard.querySelector("img")?.parentElement;

    expect(thumbnailFrame).toHaveClass("h-[88px]", "w-[88px]", "rounded-xl");
    expect(thumbnailFrame).not.toHaveClass("h-20", "w-20", "rounded-2xl");
  });

  it("uses Stitch label typography inside compact creator profile gear cards", () => {
    render(<CreatorProfilePage profile={profile} />);

    const firstGearCard = screen.getByRole("article", { name: "Sony a7 IV Mirrorless Camera" });
    const productTitle = within(firstGearCard).getByRole("heading", {
      name: "Sony a7 IV Mirrorless Camera",
    });
    const productDescription = within(firstGearCard).getByText(
      "33MP full-frame camera with pro performance.",
    );

    expect(productTitle).toHaveClass("text-sm", "leading-5", "font-medium");
    expect(productTitle).not.toHaveClass("font-semibold");
    expect(productDescription).toHaveClass("text-xs", "leading-4", "font-normal");
  });

  it("uses Stitch price and merchant chip density inside compact creator profile gear cards", () => {
    render(<CreatorProfilePage profile={profile} />);

    const firstGearCard = screen.getByRole("article", { name: "Sony a7 IV Mirrorless Camera" });
    const price = within(firstGearCard).getByText("$2,498.00");
    const merchant = within(firstGearCard).getByText("B&H Photo");

    expect(price).toHaveClass("text-sm", "leading-5", "font-medium");
    expect(price).not.toHaveClass("font-semibold");
    expect(merchant).toHaveClass("rounded", "px-2", "py-0.5", "text-[10px]", "font-bold", "uppercase");
    expect(merchant).not.toHaveClass("rounded-md", "py-1", "tracking-wide");
  });

  it("uses the Stitch compact action icon treatment inside creator profile gear cards", () => {
    render(<CreatorProfilePage profile={profile} />);

    const firstGearCard = screen.getByRole("article", { name: "Sony a7 IV Mirrorless Camera" });
    const actionLink = within(firstGearCard).getByRole("link", {
      name: "Get Sony a7 IV Mirrorless Camera",
    });
    const actionIcon = within(actionLink).getByText("open_in_new");

    expect(actionLink).toHaveClass("h-10", "w-10", "rounded-full");
    expect(actionIcon).toHaveClass("text-[20px]");
    expect(actionIcon).not.toHaveClass("text-xl");
  });

  it("uses the Stitch group-hover chrome on compact creator profile gear cards", () => {
    render(<CreatorProfilePage profile={profile} />);

    const firstGearCard = screen.getByRole("article", { name: "Sony a7 IV Mirrorless Camera" });
    const productTitle = within(firstGearCard).getByRole("heading", {
      name: "Sony a7 IV Mirrorless Camera",
    });
    const actionLink = within(firstGearCard).getByRole("link", {
      name: "Get Sony a7 IV Mirrorless Camera",
    });

    expect(firstGearCard).toHaveClass("group", "cursor-pointer");
    expect(productTitle).toHaveClass("transition-colors", "group-hover:text-[var(--teal-700)]");
    expect(actionLink).toHaveClass(
      "transition-all",
      "group-hover:bg-[var(--teal-700)]",
      "group-hover:text-white",
    );
    expect(actionLink).not.toHaveClass("transition-colors");
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
