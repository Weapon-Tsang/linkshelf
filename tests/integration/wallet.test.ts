import type { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { AuthSession } from "@/features/auth/adapter";
import {
  exportWalletCsv,
  getFanTrackingTag,
  requestWithdrawal,
  saveFanTrackingId,
} from "@/features/wallet/actions";
import { createDatabase } from "@/lib/db/client";
import { migrate } from "@/lib/db/migrate";
import { seed } from "@/lib/db/seed";

const NOW = new Date("2026-06-24T16:00:00.000Z");

const fanSession: AuthSession = {
  user: {
    id: "user-fan",
    googleSubject: "google-fan",
    email: "fan@linkshelf.local",
    displayName: "Jamie Chen",
    role: "FAN",
    avatarUrl: null,
  },
  issuedAt: NOW.getTime(),
  expiresAt: NOW.getTime() + 60_000,
};

describe("fan wallet lifecycle", () => {
  let database: DatabaseSync;

  beforeEach(() => {
    database = createDatabase(":memory:");
    migrate(database);
    seed(database, { publicRoot: "/definitely/missing" });
    database
      .prepare(
        `INSERT INTO wallet_entries
          (id, user_id, click_event_id, amount_cents, type, status, description, created_at, cleared_at)
         VALUES (?, ?, NULL, ?, 'ADJUSTMENT', 'CLEARED', ?, ?, ?)`,
      )
      .run(
        "wallet-fan-cleared",
        "user-fan",
        BigInt(10_000),
        "Manual cleared test credit",
        "2026-06-20T10:00:00.000Z",
        "2026-06-21T10:00:00.000Z",
      );
  });

  afterEach(() => {
    database.close();
  });

  it("falls back to the platform tracking ID when the fan clears their simulated ID", () => {
    expect(
      saveFanTrackingId(database, { affiliateTag: " " }, fanSession, {
        now: () => NOW,
      }),
    ).toEqual({ ok: true });
    expect(getFanTrackingTag(database, fanSession)).toEqual({
      ok: true,
      affiliateTag: "linkshelf-platform-20",
      fallback: true,
    });
  });

  it("rejects withdrawals above cleared balance and creates valid pending requests", () => {
    expect(
      requestWithdrawal(
        database,
        {
          amountCents: 7_500,
          destinationLabel: "Amazon gift card ending 7777",
        },
        fanSession,
        { now: () => NOW },
      ),
    ).toEqual({ ok: false, reason: "INSUFFICIENT_FUNDS" });

    expect(
      requestWithdrawal(
        database,
        {
          amountCents: 4_000,
          destinationLabel: "Amazon gift card ending 7777",
        },
        fanSession,
        { createId: () => "withdrawal-new", now: () => NOW },
      ),
    ).toEqual({ ok: true, withdrawalId: "withdrawal-new" });
    expect(
      database
        .prepare("SELECT amount_cents AS amountCents, status FROM withdrawals WHERE id = ?")
        .get("withdrawal-new"),
    ).toEqual({
      amountCents: 4000,
      status: "PENDING",
    });
  });

  it("exports wallet CSV with date, source, type, and amount headers", () => {
    const csv = exportWalletCsv(database, fanSession);
    expect(csv.ok && csv.csv.split("\n")[0]).toBe("date,source,type,amount");
    expect(csv.ok && csv.csv).toContain("Manual cleared test credit,ADJUSTMENT,100.00");
  });
});
