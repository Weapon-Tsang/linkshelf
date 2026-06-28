import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AnalyticsView } from "@/features/studio/analytics-view";
import { CommentsView } from "@/features/studio/comments-view";
import { SettingsView } from "@/features/studio/settings-view";

afterEach(() => cleanup());

describe("Studio analytics, comments, and settings tools", () => {
  it("switches analytics ranges including custom", async () => {
    const user = userEvent.setup();
    render(
      <AnalyticsView
        metrics={{
          clicks: 1240,
          shares: 86,
          conversionRate: 8.4,
          revenueCents: 289800,
        }}
      />,
    );

    expect(screen.getByRole("heading", { name: "Analytics Overview" })).toBeVisible();
    expect(
      screen.getByText("Monitor your shelf performance and audience engagement."),
    ).toBeVisible();

    for (const label of ["7D", "30D", "90D", "Custom"]) {
      expect(screen.getByRole("button", { name: label })).toBeVisible();
    }
    expect(screen.getByRole("button", { name: "30D" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    for (const [label, value] of [
      ["Total Views", "1.2M"],
      ["Total Saves", "45.8K"],
      ["Total Comments", "8,402"],
      ["Avg. CTR", "14.2%"],
    ] as const) {
      const card = screen.getByRole("article", { name: label });
      expect(within(card).getByText(label)).toBeVisible();
      expect(within(card).getByText(value)).toBeVisible();
    }

    const shelfPerformance = screen.getByRole("region", { name: "Shelf Performance" });
    expect(within(shelfPerformance).getByText("Photography Kit 2024")).toBeVisible();
    expect(within(shelfPerformance).getByText("Ultimate Desk Setup")).toBeVisible();
    expect(within(shelfPerformance).getByText("Travel Essentials")).toBeVisible();
    expect(
      within(shelfPerformance).getByRole("img", {
        name: "Photography Kit camera gear flat lay",
      }),
    ).toHaveAttribute("src", expect.stringContaining("analytics-photography-kit.png"));
    expect(
      within(shelfPerformance).getByRole("img", {
        name: "Ultimate Desk Setup shelf preview",
      }),
    ).toHaveAttribute("src", expect.stringContaining("analytics-desk-setup.png"));

    await user.click(screen.getByRole("button", { name: "90D" }));
    expect(screen.getByRole("button", { name: "90D" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await user.click(screen.getByRole("button", { name: "Custom" }));
    expect(screen.getByLabelText("Custom date range")).toBeVisible();
    const trafficSources = screen.getByRole("region", { name: "Traffic Sources" });
    for (const [label, value] of [
      ["Instagram", "45%"],
      ["TikTok", "30%"],
      ["Twitter", "15%"],
      ["Direct", "10%"],
    ] as const) {
      expect(within(trafficSources).getByText(label)).toBeVisible();
      expect(within(trafficSources).getByText(value)).toBeVisible();
    }
  });

  it("renders comment shelf and sort filters", async () => {
    const user = userEvent.setup();
    render(
      <CommentsView
        comments={[
          {
            id: "comment-1",
            shelfId: "shelf-photography",
            shelfTitle: "Photography Kit",
            authorName: "Jamie Chen",
            body: "Love this setup",
            createdAt: "2026-06-05T09:10:00.000Z",
            status: "VISIBLE",
          },
          {
            id: "comment-2",
            shelfId: "shelf-travel",
            shelfTitle: "Travel Essentials",
            authorName: "Avery Park",
            body: "Packing cube recs?",
            createdAt: "2026-06-06T09:10:00.000Z",
            status: "VISIBLE",
          },
        ]}
        shelves={[
          { id: "shelf-photography", title: "Photography Kit" },
          { id: "shelf-travel", title: "Travel Essentials" },
        ]}
      />,
    );

    await user.selectOptions(screen.getByLabelText("Filter by shelf"), "shelf-travel");
    await user.selectOptions(screen.getByLabelText("Sort comments"), "oldest");
    expect(screen.getByLabelText("Filter by shelf")).toHaveValue("shelf-travel");
    expect(screen.getByLabelText("Sort comments")).toHaveValue("oldest");
    expect(screen.getByText("Packing cube recs?")).toBeVisible();
  });

  it("edits settings state and requires confirmed account deletion", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(
      <SettingsView
        channels={[
          { type: "X", enabled: true, value: "@liamshoots" },
          { type: "FACEBOOK", enabled: false, value: "https://facebook.com/liamshoots" },
        ]}
        creator={{
          displayName: "Liam Roberts",
          bio: "Photographer",
          category: "Photography",
          affiliateTag: "liamcreator-20",
        }}
        onDeleteAccount={onDelete}
      />,
    );

    await user.clear(screen.getByLabelText("Display name"));
    await user.type(screen.getByLabelText("Display name"), "Liam R.");
    await user.clear(screen.getByLabelText("Amazon Tracking ID"));
    await user.type(screen.getByLabelText("Amazon Tracking ID"), "liam-demo-20");
    await user.click(screen.getByRole("switch", { name: "FACEBOOK" }));

    expect(screen.getByLabelText("Display name")).toHaveValue("Liam R.");
    expect(screen.getByLabelText("Amazon Tracking ID")).toHaveValue("liam-demo-20");
    expect(screen.getByRole("switch", { name: "FACEBOOK" })).toHaveAttribute(
      "aria-checked",
      "true",
    );

    await user.click(screen.getByRole("button", { name: "Delete account" }));
    expect(onDelete).not.toHaveBeenCalled();
    await user.type(screen.getByLabelText("Confirm account deletion"), "DELETE");
    await user.click(screen.getByRole("button", { name: "Delete account" }));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});
