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
  });

  it("links fans back to the seeded creator profile from the Hub shell explore item", () => {
    render(
      <HubShell user={{ displayName: "Jamie Photo" }}>
        <p>Fan rewards</p>
      </HubShell>,
    );

    const nav = screen.getByRole("navigation", { name: "Fan Hub" });
    expect(within(nav).getByRole("link", { name: "Explore" })).toHaveAttribute(
      "href",
      "/liamroberts.photo",
    );
  });

  it("renders the Stitch My Hub structure as one dashboard instead of hidden tabs", () => {
    render(
      <HubDashboard
        savedShelves={[
          {
            id: "shelf-photography",
            title: "Outdoor Adventure",
            creatorHandle: "AlexGear",
          },
        ]}
        shares={[
          {
            id: "share-jamie-photography",
            shelfTitle: "Minimalist Setup v2",
            channel: "X",
            shortCode: "jamie-photo",
            clicks: 1200,
          },
        ]}
        summary={{
          availableCents: 12850,
          pendingCents: 1230,
          lifetimeCents: 14080,
          affiliateTag: "fan-demo-20",
        }}
      />,
    );

    expect(screen.getByRole("heading", { name: "Affiliate ID Binding" })).toBeVisible();
    expect(screen.getByText("Available Balance")).toBeVisible();
    expect(screen.getByRole("heading", { name: "Rewards History" })).toBeVisible();
    expect(screen.getByRole("columnheader", { name: "Source" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "My Shared Shelves" })).toBeVisible();
    expect(screen.getByText("1.2k Clicks")).toBeVisible();
    expect(screen.getByRole("heading", { name: "Saved Collections" })).toBeVisible();
    expect(screen.getByText("14 Items Saved")).toBeVisible();
  });

  it("keeps the dashboard modules interactive for tracking ID, withdrawal, and CSV export", async () => {
    const user = userEvent.setup();
    const onWithdraw = vi.fn();
    const onExportCsv = vi.fn(() => "date,source,type,amount\n2026-06-20,Test,AFFILIATE,10.00");

    render(
      <HubDashboard
        onExportCsv={onExportCsv}
        onRequestWithdrawal={onWithdraw}
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
    await user.click(screen.getByRole("button", { name: "My Shares" }));
    expect(screen.getByText("jamie-photo")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Saved" }));
    expect(screen.getAllByText("Photography Kit").length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: "Wallet" }));
    await user.clear(screen.getByLabelText("Fan Tracking ID"));
    await user.type(screen.getByLabelText("Fan Tracking ID"), "jamie-demo-20");
    expect(screen.getByLabelText("Fan Tracking ID")).toHaveValue("jamie-demo-20");

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

    await user.click(screen.getByRole("button", { name: "Export CSV" }));
    expect(onExportCsv).toHaveBeenCalledTimes(1);
    expect(screen.getByText("CSV ready")).toBeVisible();
  });
});
