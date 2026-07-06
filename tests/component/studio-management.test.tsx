import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ShelfManagementView } from "@/features/studio/shelf-management-view";

const shelves = [
  {
    id: "shelf-photography",
    slug: "photography-kit",
    title: "Photography Kit",
    description: "My go-to gear for professional shoots and travel vlogs.",
    category: "Photography",
    status: "PUBLISHED" as const,
    coverUrl: "/stitch/assets/0074830e959aaeb9f506d75bd6d046ba65d6525f2cab5fc10c2381b115d66bcf.png",
    productCount: 3,
    updatedAt: "2026-06-26T10:00:00.000Z",
  },
  {
    id: "shelf-desk",
    slug: "desk-setup-2024",
    title: "Desk Setup 2024",
    description: "A calm ergonomic workspace for editing and deep work.",
    category: "Workspace",
    status: "DRAFT" as const,
    coverUrl: "/stitch/assets/desk-setup.jpg",
    productCount: 2,
    updatedAt: "2026-06-25T10:00:00.000Z",
  },
  {
    id: "shelf-travel",
    slug: "travel-essentials",
    title: "Travel Essentials",
    description: "Lightweight gear for location shoots.",
    category: "Travel",
    status: "PUBLISHED" as const,
    coverUrl: "/stitch/assets/studio-management-travel-essentials.png",
    productCount: 2,
    updatedAt: "2026-06-24T10:00:00.000Z",
  },
];

describe("Studio shelf management Stitch structure", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders visual shelf cards with thumbnails, status pills, and icon actions", () => {
    render(
      <ShelfManagementView
        creatorHandle="liamroberts.photo"
        query=""
        shelves={shelves}
        status="ALL"
        totals={{ all: 3, drafts: 1, published: 2 }}
      />,
    );

    const firstCard = screen.getByRole("article", { name: /Photography Kit/i });
    expect(firstCard).toHaveClass("gap-3", "rounded-xl", "p-5", "border-2");
    expect(firstCard).toHaveClass("border-[var(--teal-700)]");
    expect(firstCard).not.toHaveClass("gap-4", "rounded-2xl", "p-6", "ring-2");
    expect(firstCard.className).toContain("md:grid-cols-[6rem_minmax(0,1fr)_auto]");
    expect(within(firstCard).getByRole("heading", { name: "Photography Kit" })).toHaveClass(
      "max-w-28",
    );
    const firstCover = within(firstCard).getByRole("img", { name: /Photography Kit cover/i });
    expect(firstCover).toHaveAttribute(
      "src",
      "/stitch/assets/0074830e959aaeb9f506d75bd6d046ba65d6525f2cab5fc10c2381b115d66bcf.png",
    );
    expect(firstCover.parentElement).toHaveClass(
      "self-start",
      "h-24",
      "w-24",
      "md:h-24",
      "md:w-24",
    );
    expect(within(firstCard).getByLabelText("Shelf actions for Photography Kit")).toHaveClass(
      "gap-2",
      "items-center",
      "self-center",
    );
    expect(within(firstCard).getByLabelText("Shelf actions for Photography Kit")).not.toHaveClass(
      "items-start",
    );
    expect(within(firstCard).getByText(/12 links/i)).toBeVisible();
    expect(within(firstCard).getByText("PUBLISHED")).toBeVisible();
    expect(within(firstCard).getByText("Tech")).toBeVisible();
    expect(within(firstCard).queryByText("Photography")).not.toBeInTheDocument();
    expect(within(firstCard).getByRole("link", { name: "Edit Photography Kit" })).toBeVisible();
    const firstViewLink = within(firstCard).getByRole("link", { name: "View Photography Kit" });
    expect(firstViewLink).toHaveAttribute("href", "/liamroberts.photo/photography-kit");
    expect(firstViewLink).toHaveClass("h-8", "w-8");

    const filterRail = screen.getByRole("list", { name: "Shelf filters" });
    expect(filterRail).toHaveClass("rounded-full", "border", "bg-white", "p-1");
    const activeFilter = screen.getByRole("link", { name: "All" });
    expect(activeFilter).toHaveClass("bg-[var(--glow)]", "text-[var(--teal-700)]");
    expect(activeFilter).not.toHaveClass("border");
    expect(screen.getByRole("link", { name: "Published" })).toHaveClass("px-5", "py-2");

    const secondCard = screen.getByRole("article", { name: /Desk Setup 2024/i });
    expect(within(secondCard).getByText("DRAFT")).toBeVisible();
    expect(within(secondCard).getByText(/5 links/i)).toBeVisible();

    const thirdCard = screen.getByRole("article", { name: /Travel Essentials/i });
    expect(within(thirdCard).getByText(/18 links/i)).toBeVisible();
    const thirdMeta = within(thirdCard).getByText(/Last updated Oct 12/i);
    expect(thirdMeta).toBeVisible();
    expect(thirdMeta).toHaveClass("text-xs");
  });

  it("uses the Stitch max-w-6xl management content container", () => {
    render(
      <ShelfManagementView
        creatorHandle="liamroberts.photo"
        query=""
        shelves={shelves}
        status="ALL"
        totals={{ all: 3, drafts: 1, published: 2 }}
      />,
    );

    const container = screen.getByRole("heading", { name: "My Shelves" }).parentElement?.parentElement;

    expect(container).toHaveClass("mx-auto", "w-full", "max-w-6xl");
    expect(container).not.toHaveClass("max-w-5xl");
  });

  it("uses the Stitch headline-lg typography for the management page title", () => {
    render(
      <ShelfManagementView
        creatorHandle="liamroberts.photo"
        query=""
        shelves={shelves}
        status="ALL"
        totals={{ all: 3, drafts: 1, published: 2 }}
      />,
    );

    const title = screen.getByRole("heading", { name: "My Shelves" });

    expect(title).toHaveClass("text-[40px]", "leading-tight", "font-bold");
    expect(title).not.toHaveClass("text-4xl", "sm:text-5xl", "font-black", "tracking-[-0.05em]");
  });

  it("uses the Stitch search input density on shelf management", () => {
    render(
      <ShelfManagementView
        creatorHandle="liamroberts.photo"
        query=""
        shelves={shelves}
        status="ALL"
        totals={{ all: 3, drafts: 1, published: 2 }}
      />,
    );

    const searchInput = screen.getByRole("textbox", { name: "Search shelves" });

    expect(searchInput).toHaveClass("pl-12", "pr-6", "py-3", "text-base", "font-normal", "shadow-sm");
    expect(searchInput).not.toHaveClass("pl-11", "pr-5", "text-sm", "font-semibold");
  });

  it("uses the Stitch header-to-card spacing on shelf management", () => {
    render(
      <ShelfManagementView
        creatorHandle="liamroberts.photo"
        query=""
        shelves={shelves}
        status="ALL"
        totals={{ all: 3, drafts: 1, published: 2 }}
      />,
    );

    const header = screen.getByRole("heading", { name: "My Shelves" }).closest("header");
    const cardsSection = header?.nextElementSibling;

    expect(cardsSection).toHaveClass("mt-10");
    expect(cardsSection).not.toHaveClass("mt-8");
  });

  it("uses Stitch dot indicators inside management status pills", () => {
    render(
      <ShelfManagementView
        creatorHandle="liamroberts.photo"
        query=""
        shelves={shelves}
        status="ALL"
        totals={{ all: 3, drafts: 1, published: 2 }}
      />,
    );

    const publishedPill = screen.getAllByText("PUBLISHED")[0];
    const draftPill = screen.getByText("DRAFT");
    const publishedDot = publishedPill.querySelector("[aria-hidden='true']");
    const draftDot = draftPill.querySelector("[aria-hidden='true']");

    expect(publishedPill).toHaveClass("flex", "items-center");
    expect(publishedDot).toHaveClass("mr-2", "h-2", "w-2", "rounded-full", "bg-[var(--teal-700)]");
    expect(draftPill).toHaveClass("flex", "items-center");
    expect(draftDot).toHaveClass("mr-2", "h-2", "w-2", "rounded-full", "bg-[var(--muted)]");
  });

  it("uses the Stitch status pill label typography", () => {
    render(
      <ShelfManagementView
        creatorHandle="liamroberts.photo"
        query=""
        shelves={shelves}
        status="ALL"
        totals={{ all: 3, drafts: 1, published: 2 }}
      />,
    );

    const publishedPill = screen.getAllByText("PUBLISHED")[0];
    const draftPill = screen.getByText("DRAFT");

    [publishedPill, draftPill].forEach((pill) => {
      expect(pill).toHaveClass("text-[11px]", "font-semibold", "uppercase", "tracking-wider");
      expect(pill).not.toHaveClass("text-[0.65rem]", "font-black", "tracking-[0.08em]");
    });
  });

  it("uses the Stitch title typography inside management shelf cards", () => {
    render(
      <ShelfManagementView
        creatorHandle="liamroberts.photo"
        query=""
        shelves={shelves}
        status="ALL"
        totals={{ all: 3, drafts: 1, published: 2 }}
      />,
    );

    const firstCard = screen.getByRole("article", { name: /Photography Kit/i });
    const cardTitle = within(firstCard).getByRole("heading", { name: "Photography Kit" });

    expect(cardTitle).toHaveClass("text-xl", "font-bold");
    expect(cardTitle).not.toHaveClass("font-black", "tracking-[-0.04em]");
  });

  it("uses the Stitch action divider inside grid management shelf cards", () => {
    render(
      <ShelfManagementView
        creatorHandle="liamroberts.photo"
        query=""
        shelves={shelves}
        status="ALL"
        totals={{ all: 3, drafts: 1, published: 2 }}
      />,
    );

    const firstCard = screen.getByRole("article", { name: /Photography Kit/i });
    const actions = within(firstCard).getByLabelText("Shelf actions for Photography Kit");

    expect(actions).toHaveClass("ml-4", "border-l", "pl-4");
    expect(actions).not.toHaveClass("border-transparent");
  });

  it("renders the Stitch one-column management state and keeps layout in controls", () => {
    render(
      <ShelfManagementView
        creatorHandle="liamroberts.photo"
        layout="list"
        query="gear"
        shelves={shelves}
        status="PUBLISHED"
        totals={{ all: 3, drafts: 1, published: 2 }}
      />,
    );

    expect(screen.getByDisplayValue("gear")).toBeVisible();
    expect(screen.getByDisplayValue("list")).toHaveAttribute("name", "layout");
    expect(screen.getByRole("link", { name: "Drafts" })).toHaveAttribute(
      "href",
      "/studio/shelves?status=DRAFT&q=gear&layout=list",
    );
    expect(screen.queryByRole("link", { name: "Drafts · 1" })).not.toBeInTheDocument();

    const firstCard = screen.getByRole("article", { name: /Photography Kit/i });
    expect(firstCard).toHaveClass("flex", "items-center", "p-8");
    expect(firstCard).not.toHaveClass("grid");
    expect(within(firstCard).getByRole("heading", { name: "Photography Kit" })).not.toHaveClass(
      "max-w-28",
    );
    expect(within(firstCard).getByRole("img", { name: /Photography Kit cover/i }).parentElement)
      .toHaveClass("mr-6", "h-24", "w-24");
    expect(within(firstCard).getByLabelText("Shelf actions for Photography Kit")).toHaveClass(
      "border-l",
      "pl-6",
    );
  });
});
