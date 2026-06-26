import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AdminDashboard } from "@/features/admin/admin-dashboard";

afterEach(() => cleanup());

describe("Super Admin dashboard", () => {
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

    expect(screen.getByText("$56.97")).toBeVisible();
    expect(screen.getByText("FAN 1")).toBeVisible();

    await user.type(screen.getByLabelText("Filter creators"), "liam");
    expect(screen.getByText("liamshoots")).toBeVisible();
    expect(screen.queryByText("averykit")).toBeNull();

    await user.clear(screen.getByLabelText("Minimum withdrawal threshold"));
    await user.type(screen.getByLabelText("Minimum withdrawal threshold"), "75");
    await user.click(screen.getByRole("button", { name: "Save threshold" }));
    expect(onSaveThreshold).toHaveBeenCalledWith(7500);

    await user.click(screen.getByRole("button", { name: "Approve Jamie Chen" }));
    await user.click(screen.getByRole("button", { name: "Reject Jamie Chen" }));
    expect(onApprove).toHaveBeenCalledWith("withdrawal-jamie-pending");
    expect(onReject).toHaveBeenCalledWith("withdrawal-jamie-pending");

    await user.click(screen.getByRole("button", { name: "Export CSV" }));
    expect(onExportCsv).toHaveBeenCalledTimes(1);
    expect(screen.getByText("CSV ready")).toBeVisible();
  });
});
