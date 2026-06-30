import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HubDashboard } from "@/features/hub/hub-dashboard";
import { HubShell } from "@/features/hub/hub-shell";

let currentPathname = "/hub/dashboard";

vi.mock("next/navigation", () => ({
  usePathname: () => currentPathname,
}));

afterEach(() => {
  cleanup();
  currentPathname = "/hub/dashboard";
});

describe("Fan Hub dashboard", () => {
  it("renders the Stitch side navigation for the fan economy hub", () => {
    render(
      <HubShell user={{ displayName: "Jamie Photo" }}>
        <p>Fan rewards</p>
      </HubShell>,
    );

    expect(screen.getByText("Creator Economy")).toBeVisible();

    const nav = screen.getByRole("navigation", { name: "Fan Hub" });
    expect(within(nav).getByRole("link", { name: "Wallet" })).toHaveAttribute(
      "href",
      "/hub/dashboard",
    );
    expect(within(nav).getByRole("link", { name: "My Shares" })).toHaveAttribute(
      "href",
      "/hub/dashboard#shares",
    );
    expect(within(nav).getByRole("link", { name: "Saved" })).toHaveAttribute(
      "href",
      "/hub/dashboard#saved",
    );
    expect(screen.getByRole("link", { name: "New Link" })).toHaveAttribute(
      "href",
      "/liamroberts.photo",
    );
    expect(within(screen.getByRole("complementary", { name: "Fan Hub side rail" })).queryByText(
      "dataset",
    )).not.toBeInTheDocument();
  });

  it("uses the Stitch side rail scale without duplicating top utility navigation", () => {
    render(
      <HubShell user={{ displayName: "Jamie Photo" }}>
        <p>Fan rewards</p>
      </HubShell>,
    );

    const sideRail = screen.getByRole("complementary", { name: "Fan Hub side rail" });
    expect(sideRail).toHaveClass("lg:w-[256px]");

    const nav = screen.getByRole("navigation", { name: "Fan Hub" });
    expect(within(nav).queryByRole("link", { name: "Explore" })).not.toBeInTheDocument();
  });

  it("renders the Stitch My Hub structure as one dashboard instead of hidden tabs", () => {
    render(
      <HubDashboard
        savedShelves={[
          {
            id: "shelf-photography",
            title: "Outdoor Adventure",
            creatorHandle: "AlexGear",
            itemCount: 14,
          },
          {
            id: "shelf-home",
            title: "Dream Home",
            creatorHandle: "HomeInspo",
            itemCount: 28,
          },
        ]}
        shares={[
          {
            id: "share-jamie-photography",
            shelfTitle: "Minimalist Setup v2",
            channel: "X",
            shortCode: "jamie-photo",
            clicks: 1200,
            shareCount: 342,
          },
          {
            id: "share-fall-reading",
            shelfTitle: "Fall Reading List",
            channel: "COPY",
            shortCode: "fall-books",
            clicks: 840,
            shareCount: 128,
          },
        ]}
        summary={{
          availableCents: 12850,
          pendingCents: 1230,
          lifetimeCents: 14080,
          affiliateTag: "fan-demo-20",
          entries: [
            {
              id: "wallet-opening-balance",
              amountCents: 13395,
              type: "ADJUSTMENT",
              status: "CLEARED",
              description: "Fan Hub opening balance",
              createdAt: "2026-06-01T10:00:00.000Z",
            },
            {
              id: "wallet-tech",
              amountCents: 1240,
              type: "ADJUSTMENT",
              status: "CLEARED",
              description: "Tech Collection",
              createdAt: "2023-10-24T10:00:00.000Z",
            },
            {
              id: "wallet-home",
              amountCents: 415,
              type: "ADJUSTMENT",
              status: "CLEARED",
              description: "Home Office Gear",
              createdAt: "2023-10-22T10:00:00.000Z",
            },
            {
              id: "wallet-fall",
              amountCents: 2800,
              type: "ADJUSTMENT",
              status: "CLEARED",
              description: "Fall Essentials",
              createdAt: "2023-10-19T10:00:00.000Z",
            },
          ],
        }}
      />,
    );

    expect(screen.getByRole("heading", { name: "Affiliate ID Binding" })).toBeVisible();
    expect(screen.getByText("Available Balance")).toBeVisible();
    expect(screen.getByRole("heading", { name: "Rewards History" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Download CSV" })).toBeVisible();
    expect(screen.getByRole("columnheader", { name: "Source" })).toBeVisible();
    expect(screen.getByRole("table", { name: "Rewards history entries" })).toHaveClass(
      "table-fixed",
    );
    expect(screen.getByRole("columnheader", { name: "Amount" })).toHaveClass("w-24");
    expect(screen.getAllByText("Platform Default")[0]).toHaveClass("whitespace-nowrap");
    expect(screen.getByText("Oct 24, 2023")).toBeVisible();
    expect(screen.getByText("Oct 22, 2023")).toBeVisible();
    expect(screen.getByText("Oct 19, 2023")).toBeVisible();
    expect(screen.queryByText("Fan Hub opening balance")).not.toBeInTheDocument();
    expect(screen.getByText("Tech Collection")).toBeVisible();
    expect(screen.getByText("Home Office Gear")).toBeVisible();
    expect(screen.getByText("Fall Essentials")).toBeVisible();
    expect(screen.getByRole("heading", { name: "My Shared Shelves" })).toBeVisible();
    expect(screen.getByText("1.2k Clicks")).toBeVisible();
    expect(screen.getByText("840 Clicks")).toBeVisible();
    expect(screen.getByText("342 Shares")).toBeVisible();
    expect(screen.getByText("128 Shares")).toBeVisible();
    expect(screen.getByRole("heading", { name: "Saved Collections" })).toBeVisible();
    expect(screen.getByText("14 Items Saved")).toBeVisible();
    expect(screen.getByText("28 Items Saved")).toBeVisible();
    const minimalistPreview = screen.getByRole("img", {
      name: "Minimalist Setup v2 shelf preview",
    });
    expect(minimalistPreview).toHaveAttribute(
      "src",
      expect.stringMatching(/^\/stitch\/assets\/.+\.(jpg|png|webp)$/),
    );
    expect(minimalistPreview.closest("div")).toHaveClass("h-20", "w-20");
    expect(
      screen.getByRole("img", { name: "Fall Reading List shelf preview" }),
    ).toHaveAttribute(
      "src",
      expect.stringMatching(/^\/stitch\/assets\/.+\.(jpg|png|webp)$/),
    );
    expect(
      screen.getByRole("img", { name: "Outdoor Adventure collection cover" }),
    ).toHaveAttribute(
      "src",
      expect.stringMatching(/^\/stitch\/assets\/.+\.(jpg|png|webp)$/),
    );
    expect(
      screen.getByRole("img", { name: "Dream Home collection cover" }),
    ).toHaveAttribute(
      "src",
      expect.stringMatching(/^\/stitch\/assets\/.+\.(jpg|png|webp)$/),
    );
    const utilityNav = screen.getByRole("navigation", { name: "Fan dashboard utility" });
    expect(utilityNav).toBeVisible();
    expect(utilityNav).toHaveClass("justify-center");
    expect(screen.getByRole("img", { name: "Jamie Chen" })).toHaveAttribute(
      "src",
      "/stitch/assets/fan-dashboard-avatar.png",
    );
    expect(screen.queryByText("My Hub")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Fan rewards dashboard" })).toHaveClass(
      "sr-only",
    );
    expect(screen.queryByRole("button", { name: "Wallet" })).not.toBeInTheDocument();
    expect(screen.getByLabelText("Fan Tracking ID")).toHaveValue("");
    expect(screen.getByPlaceholderText("Your Amazon Tracking ID")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Save tracking ID" })).not.toBeInTheDocument();
  });

  it("keeps the dashboard modules interactive for tracking ID, withdrawal, and CSV export", async () => {
    const user = userEvent.setup();
    const onSaveTrackingId = vi.fn();
    const onWithdraw = vi.fn();
    const onExportCsv = vi.fn(() => "date,source,type,amount\n2026-06-20,Test,AFFILIATE,10.00");

    render(
      <HubDashboard
        onExportCsv={onExportCsv}
        onRequestWithdrawal={onWithdraw}
        onSaveTrackingId={onSaveTrackingId}
        savedShelves={[
          {
            id: "shelf-photography",
            title: "Photography Kit",
            creatorHandle: "liamshoots",
          },
        ]}
        shares={[
          {
            id: "share-jamie-photography",
            shelfTitle: "Photography Kit",
            channel: "X",
            shortCode: "jamie-photo",
            clicks: 12,
          },
        ]}
        summary={{
          availableCents: 5000,
          pendingCents: 1599,
          lifetimeCents: 6599,
          affiliateTag: "fan-demo-20",
        }}
      />,
    );

    expect(screen.getByText("$50")).toBeVisible();
    expect(screen.getByText("jamie-photo")).toBeVisible();
    expect(screen.getAllByText("Photography Kit").length).toBeGreaterThan(0);

    await user.type(screen.getByLabelText("Fan Tracking ID"), "jamie-demo-20");
    expect(screen.getByLabelText("Fan Tracking ID")).toHaveValue("jamie-demo-20");
    await user.click(screen.getByRole("button", { name: "Save tracking ID" }));
    expect(onSaveTrackingId).toHaveBeenCalledWith("jamie-demo-20");

    await user.click(screen.getByRole("button", { name: "Withdraw Funds" }));
    expect(screen.getByRole("dialog", { name: "Confirm withdrawal" })).toBeVisible();
    await user.clear(screen.getByLabelText("Withdrawal amount"));
    await user.type(screen.getByLabelText("Withdrawal amount"), "40");
    await user.type(screen.getByLabelText("Destination"), "Amazon gift card");
    await user.click(screen.getByRole("button", { name: "Confirm request" }));
    expect(onWithdraw).toHaveBeenCalledWith({
      amountCents: 4000,
      destinationLabel: "Amazon gift card",
    });

    await user.click(screen.getByRole("button", { name: "Download CSV" }));
    expect(onExportCsv).toHaveBeenCalledTimes(1);
    expect(screen.getByText("CSV ready")).toBeVisible();
  });
});
