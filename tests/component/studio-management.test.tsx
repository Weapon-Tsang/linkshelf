import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ShelfManagementView } from "@/features/studio/shelf-management-view";

const shelves = [
  {
    id: "shelf-photography",
    slug: "photography-kit",
    title: "Photography Kit",
    description: "My go-to gear for professional shoots and travel vlogs.",
    category: "Photography",
    status: "PUBLISHED" as const,
    coverUrl: "/stitch/assets/photography-kit.jpg",
    productCount: 12,
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
    productCount: 5,
    updatedAt: "2026-06-25T10:00:00.000Z",
  },
];

describe("Studio shelf management Stitch structure", () => {
  it("renders visual shelf cards with thumbnails, status pills, and icon actions", () => {
    render(
      <ShelfManagementView
        query=""
        shelves={shelves}
        status="ALL"
        totals={{ all: 2, drafts: 1, published: 1 }}
      />,
    );

    const firstCard = screen.getByRole("article", { name: /Photography Kit/i });
    expect(within(firstCard).getByRole("img", { name: /Photography Kit cover/i })).toHaveAttribute(
      "src",
      "/stitch/assets/photography-kit.jpg",
    );
    expect(within(firstCard).getByText(/12 links/i)).toBeVisible();
    expect(within(firstCard).getByText("PUBLISHED")).toBeVisible();
    expect(within(firstCard).getByRole("link", { name: "Edit Photography Kit" })).toBeVisible();

    const secondCard = screen.getByRole("article", { name: /Desk Setup 2024/i });
    expect(within(secondCard).getByText("DRAFT")).toBeVisible();
    expect(within(secondCard).getByText(/5 links/i)).toBeVisible();
  });
});
