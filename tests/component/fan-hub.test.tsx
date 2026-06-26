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
  it("links fans back to the seeded creator profile from the Hub shell", () => {
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

  it("switches sections, edits tracking ID, confirms withdrawal, and exports CSV", async () => {
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
    expect(screen.getByText("Photography Kit")).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Wallet" }));
    await user.clear(screen.getByLabelText("Fan Tracking ID"));
    await user.type(screen.getByLabelText("Fan Tracking ID"), "jamie-demo-20");
    expect(screen.getByLabelText("Fan Tracking ID")).toHaveValue("jamie-demo-20");

    await user.click(screen.getByRole("button", { name: "Request withdrawal" }));
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
