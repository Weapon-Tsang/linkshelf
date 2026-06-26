import type { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { AuthSession } from "@/features/auth/adapter";
import {
  exportAdminLedgerCsv,
  getAdminDashboardData,
  reviewWithdrawal,
  saveAdminThreshold,
} from "@/features/admin/actions";
import { createDatabase } from "@/lib/db/client";
import { migrate } from "@/lib/db/migrate";
import { seed } from "@/lib/db/seed";

const NOW = new Date("2026-06-24T17:00:00.000Z");

const adminSession: AuthSession = {
  user: {
    id: "user-admin",
    googleSubject: "google-admin",
    email: "admin@linkshelf.local",
    displayName: "Super Admin",
    role: "ADMIN",
    avatarUrl: null,
  },
  issuedAt: NOW.getTime(),
  expiresAt: NOW.getTime() + 60_000,
};

const creatorSession: AuthSession = {
  ...adminSession,
  user: {
    ...adminSession.user,
    id: "user-creator",
    role: "CREATOR",
  },
};

describe("super admin actions", () => {
  let database: DatabaseSync;

  beforeEach(() => {
    database = createDatabase(":memory:");
    migrate(database);
    seed(database, { publicRoot: "/definitely/missing" });
  });

  afterEach(() => {
    database.close();
  });

  it("requires ADMIN role and derives revenue and traffic metrics from click events", () => {
    expect(getAdminDashboardData(database, creatorSession)).toEqual({
      ok: false,
      reason: "FORBIDDEN",
    });

    const result = getAdminDashboardData(database, adminSession);
    expect(result).toMatchObject({
      ok: true,
      metrics: {
        ledgerCents: 23178,
        pendingWithdrawalCents: 5000,
      },
      trafficSplit: {
        FAN: 1,
        CREATOR: 1,
        PLATFORM: 1,
      },
    });
  });

  it("approves or rejects only pending withdrawals", () => {
    expect(
      reviewWithdrawal(
        database,
        { withdrawalId: "withdrawal-jamie-pending", decision: "APPROVED" },
        adminSession,
        { now: () => NOW },
      ),
    ).toEqual({ ok: true });
    expect(
      database
        .prepare("SELECT status, reviewer_id AS reviewerId FROM withdrawals WHERE id = ?")
        .get("withdrawal-jamie-pending"),
    ).toEqual({ status: "APPROVED", reviewerId: "user-admin" });

    expect(
      reviewWithdrawal(
        database,
        { withdrawalId: "withdrawal-jamie-pending", decision: "REJECTED" },
        adminSession,
      ),
    ).toEqual({ ok: false, reason: "INVALID_TRANSITION" });
  });

  it("filters creators, persists threshold settings, and exports ledger CSV", () => {
    expect(saveAdminThreshold(database, { minimumWithdrawalCents: 7500 }, adminSession)).toEqual({
      ok: true,
    });
    expect(getAdminDashboardData(database, adminSession, { creatorQuery: "liam" })).toMatchObject({
      ok: true,
      thresholds: {
        minimumWithdrawalCents: 7500,
      },
      creators: [{ handle: "liamroberts.photo" }],
    });

    const csv = exportAdminLedgerCsv(database, adminSession);
    expect(csv.ok && csv.csv.split("\n")[0]).toBe("date,user,type,status,amount");
    expect(csv.ok && csv.csv).toContain("Super Admin,ADJUSTMENT,CLEARED,12.00");
  });
});
