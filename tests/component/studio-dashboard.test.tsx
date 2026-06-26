import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DashboardView } from "@/features/studio/dashboard-view";

describe("Studio dashboard Stitch structure", () => {
  it("prioritizes the create shelf card, compact metrics, and activity feed", () => {
    render(
      <DashboardView
        shelves={[
          {
            id: "shelf-photography",
            slug: "photography-kit",
            title: "Photography Kit",
            description: "My go-to gear for professional shoots and travel vlogs.",
            category: "Photography",
            status: "PUBLISHED",
            coverUrl: "/stitch/assets/photography-kit.jpg",
            productCount: 12,
            updatedAt: "2026-06-26T10:00:00.000Z",
          },
        ]}
        totals={{ all: 3, drafts: 1, published: 2 }}
      />,
    );

    expect(screen.getByRole("link", { name: /create new shelf/i })).toHaveAttribute(
      "href",
      "/studio/create",
    );
    expect(screen.getByText("Today's Clicks")).toBeVisible();
    expect(screen.getByText("New Saves")).toBeVisible();
    expect(screen.getByRole("heading", { name: "Recent Activities" })).toBeVisible();
    expect(screen.getByText(/Alex added a new item to Photography Kit/i)).toBeVisible();
    expect(screen.getByText(/Minimal Desk Setup shelf reached 1,000 views/i)).toBeVisible();
  });
});
