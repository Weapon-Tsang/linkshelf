import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AdminDashboard } from "@/features/admin/admin-dashboard";
import { AdminShell } from "@/features/admin/admin-shell";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/dashboard",
}));

afterEach(() => cleanup());

describe("Super Admin dashboard", () => {
  it("renders the Stitch admin navigation rail", () => {
    render(
      <AdminShell user={{ displayName: "Super Admin" }}>
        <p>Admin workspace</p>
      </AdminShell>,
    );

    expect(screen.getByText("LinkShelf Admin")).toBeVisible();
    expect(screen.getByText("System Root")).toBeVisible();
    const nav = screen.getByRole("navigation", { name: "Admin" });
    for (const label of [
      "Dashboard",
      "Creators",
      "Content Moderation",
      "Analytics",
      "Payments",
      "Settings",
    ]) {
      expect(nav).toHaveTextContent(label);
    }
    expect(screen.getByRole("button", { name: "Support Portal" })).toBeVisible();
  });

  it("pads the seeded admin tables to the Stitch visual density", () => {
    render(
      <AdminDashboard
        creators={[
          {
            id: "creator-liam",
            handle: "liamroberts.photo",
            displayName: "Liam Roberts",
            shelfCount: 3,
          },
        ]}
        metrics={{
          ledgerCents: 23178,
          pendingWithdrawalCents: 5000,
          creatorCents: 2898,
          platformCents: 1200,
        }}
        pendingWithdrawals={[
          {
            id: "withdrawal-jamie-pending",
            userName: "Jamie Chen",
            amountCents: 5000,
            destinationLabel: "Amazon gift card ending 2048",
          },
        ]}
        thresholds={{ minimumWithdrawalCents: 5000 }}
        trafficSplit={{ FAN: 1, CREATOR: 1, PLATFORM: 1 }}
      />,
    );

    expect(screen.getByText("4 Pending")).toBeVisible();
    expect(screen.getByText("#LS_4812")).toBeVisible();
    expect(screen.getByText("Global Router")).toBeVisible();
    expect(screen.getByText("$4,800.00")).toBeVisible();
    expect(screen.getByText("Paypal (sys@link.sh)")).toBeVisible();
    expect(screen.getByText("@homedecor")).toBeVisible();
    expect(screen.getByText("sarah@interiors.com")).toBeVisible();
  });

  it("filters creators, edits thresholds, reviews withdrawals, and exports CSV", async () => {
    const user = userEvent.setup();
    const onApprove = vi.fn();
    const onReject = vi.fn();
    const onSaveThreshold = vi.fn();
    const onExportCsv = vi.fn(() => "date,user,type,status,amount\n2026-06-07,Super Admin,ADJUSTMENT,CLEARED,12.00");

    render(
      <AdminDashboard
        creators={[
          {
            id: "creator-liam",
            handle: "liamshoots",
            displayName: "Liam Roberts",
            shelfCount: 3,
          },
          {
            id: "creator-avery",
            handle: "averykit",
            displayName: "Avery Kit",
            shelfCount: 1,
          },
        ]}
        metrics={{
          ledgerCents: 5697,
          pendingWithdrawalCents: 5000,
          creatorCents: 2898,
          platformCents: 1200,
        }}
        onApproveWithdrawal={onApprove}
        onExportCsv={onExportCsv}
        onRejectWithdrawal={onReject}
        onSaveThreshold={onSaveThreshold}
        pendingWithdrawals={[
          {
            id: "withdrawal-jamie-pending",
            userName: "Jamie Chen",
            amountCents: 5000,
            destinationLabel: "Amazon gift card ending 2048",
          },
        ]}
        thresholds={{ minimumWithdrawalCents: 5000 }}
        trafficSplit={{ FAN: 1, CREATOR: 1, PLATFORM: 1 }}
      />,
    );

    expect(screen.getByRole("heading", { name: "Global Revenue Ledger" })).toBeVisible();
    expect(
      screen.getByText("Platform-wide financial health and system performance."),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Export Report" })).toBeVisible();

    for (const label of [
      "Total Commission Pool",
      "Disbursed Amount",
      "Pending Withdrawals",
      "Global Active IDs",
    ]) {
      const metricCard = screen.getByRole("article", { name: label });
      expect(metricCard).toBeVisible();
      expect(metricCard).toHaveClass("min-h-32");
      expect(metricCard).not.toHaveClass("min-h-36", "min-h-40");
    }

    expect(screen.getByRole("region", { name: "Traffic Split Monitor" })).toBeVisible();
    expect(screen.getByText("80/20 Routing State")).toBeVisible();
    expect(screen.getByText("Optimized")).toBeVisible();
    expect(screen.getByText("SID_8492")).toBeVisible();
    expect(screen.queryByText("FAN_004Y")).not.toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Global Thresholds" })).toBeVisible();
    expect(screen.getByRole("region", { name: "Traffic Split Monitor" }).parentElement).toHaveClass(
      "flex",
      "flex-col",
    );
    expect(screen.queryByLabelText("Minimum withdrawal threshold")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Apply Global Rules" })).toBeVisible();
    expect(screen.getByRole("region", { name: "Withdrawal Approval Pool" })).toBeVisible();
    expect(screen.getByRole("region", { name: "Active Creator Directory" })).toBeVisible();
    expect(
      screen.getByRole("region", { name: "Withdrawal Approval Pool" }).parentElement,
    ).toHaveClass("flex", "flex-col");
    expect(
      screen.getByRole("table", { name: "Withdrawal Approval Pool table" }),
    ).toHaveClass("min-w-[560px]");
    expect(
      screen.getByRole("table", { name: "Active Creator Directory table" }),
    ).toHaveClass("min-w-[560px]");

    expect(screen.queryByLabelText("Filter creator directory")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Filter creators" }));
    await user.type(screen.getByLabelText("Filter creator directory"), "liam");
    expect(screen.getByText("liamshoots")).toBeVisible();
    expect(screen.queryByText("averykit")).toBeNull();

    await user.click(screen.getByRole("button", { name: "Apply Global Rules" }));
    expect(screen.getByRole("dialog", { name: "Global Threshold Rules" })).toBeVisible();
    await user.clear(screen.getByLabelText("Minimum withdrawal threshold"));
    await user.type(screen.getByLabelText("Minimum withdrawal threshold"), "75");
    await user.click(screen.getByRole("button", { name: "Save threshold" }));
    expect(onSaveThreshold).toHaveBeenCalledWith(7500);

    await user.click(screen.getByRole("button", { name: "Approve Jamie Chen" }));
    expect(onApprove).toHaveBeenCalledWith("withdrawal-jamie-pending");

    expect(screen.queryByRole("button", { name: "Reject Jamie Chen" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "View withdrawal Jamie Chen" }));
    expect(screen.getByRole("dialog", { name: "Withdrawal Details" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Reject withdrawal Jamie Chen" }));
    expect(onReject).toHaveBeenCalledWith("withdrawal-jamie-pending");

    await user.click(screen.getByRole("button", { name: "Export Report" }));
    expect(onExportCsv).toHaveBeenCalledTimes(1);
    expect(screen.getByText("CSV ready")).toBeVisible();
  });

  it("uses compact density tokens for the Super Admin first screen", () => {
    render(
      <AdminDashboard
        creators={[
          {
            id: "creator-liam",
            handle: "liamshoots",
            displayName: "Liam Roberts",
            shelfCount: 3,
          },
        ]}
        metrics={{
          ledgerCents: 5697,
          pendingWithdrawalCents: 5000,
          creatorCents: 2898,
          platformCents: 1200,
        }}
        pendingWithdrawals={[
          {
            id: "withdrawal-jamie-pending",
            userName: "Jamie Chen",
            amountCents: 5000,
            destinationLabel: "Amazon gift card ending 2048",
          },
        ]}
        thresholds={{ minimumWithdrawalCents: 5000 }}
        trafficSplit={{ FAN: 1, CREATOR: 1, PLATFORM: 1 }}
      />,
    );

    const dashboardRoot = screen
      .getByRole("heading", { name: "Global Revenue Ledger" })
      .closest(".mx-auto");
    expect(dashboardRoot).toHaveClass("gap-6");
    expect(dashboardRoot).not.toHaveClass("gap-8");

    for (const label of [
      "Total Commission Pool",
      "Disbursed Amount",
      "Pending Withdrawals",
      "Global Active IDs",
    ]) {
      const metricCard = screen.getByRole("article", { name: label });
      expect(metricCard).toHaveClass("min-h-32", "p-5");
      expect(metricCard).not.toHaveClass("min-h-36", "p-6");
    }

    const trafficRegion = screen.getByRole("region", { name: "Traffic Split Monitor" });
    expect(trafficRegion).toHaveClass("p-5");
    expect(trafficRegion.parentElement).toHaveClass("gap-5");
    expect(trafficRegion.parentElement).not.toHaveClass("gap-6");
    expect(screen.getByRole("region", { name: "Global Thresholds" })).toHaveClass("p-5");

    const withdrawalRegion = screen.getByRole("region", {
      name: "Withdrawal Approval Pool",
    });
    expect(withdrawalRegion.parentElement).toHaveClass("gap-5");
    expect(withdrawalRegion.parentElement).not.toHaveClass("gap-6");
    expect(screen.getByRole("columnheader", { name: "UID/Role" })).toHaveClass("p-3");
    expect(screen.getByRole("columnheader", { name: "Creator" })).toHaveClass("p-3");
    expect(screen.getByText("$4,800.00").closest("td")).toHaveClass("p-3");
    expect(screen.getByText("@homedecor").closest("td")).toHaveClass("p-3");
  });
});
