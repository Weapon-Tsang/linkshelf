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
        query=""
        shelves={shelves}
        status="ALL"
        totals={{ all: 3, drafts: 1, published: 2 }}
      />,
    );

    const firstCard = screen.getByRole("article", { name: /Photography Kit/i });
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
    expect(within(firstCard).getByText(/12 links/i)).toBeVisible();
    expect(within(firstCard).getByText("PUBLISHED")).toBeVisible();
    expect(within(firstCard).getByRole("link", { name: "Edit Photography Kit" })).toBeVisible();

    const secondCard = screen.getByRole("article", { name: /Desk Setup 2024/i });
    expect(within(secondCard).getByText("DRAFT")).toBeVisible();
    expect(within(secondCard).getByText(/5 links/i)).toBeVisible();

    const thirdCard = screen.getByRole("article", { name: /Travel Essentials/i });
    expect(within(thirdCard).getByText(/18 links/i)).toBeVisible();
    expect(within(thirdCard).getByText(/Last updated Oct 12/i)).toBeVisible();
  });

  it("renders the Stitch one-column management state and keeps layout in controls", () => {
    render(
      <ShelfManagementView
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
    expect(within(firstCard).getByRole("img", { name: /Photography Kit cover/i }).parentElement)
      .toHaveClass("mr-6", "h-24", "w-24");
    expect(within(firstCard).getByLabelText("Shelf actions for Photography Kit")).toHaveClass(
      "border-l",
      "pl-6",
    );
  });
});
