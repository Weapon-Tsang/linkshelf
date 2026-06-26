import type { DatabaseSync } from "node:sqlite";
import type { AuthSession } from "@/features/auth/adapter";

type AdminFailureReason =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "INVALID_INPUT"
  | "INVALID_TRANSITION"
  | "NOT_FOUND";

export type AdminActionResult<T extends object = object> =
  | ({ readonly ok: true } & T)
  | {
      readonly ok: false;
      readonly reason: AdminFailureReason;
    };

export interface AdminCreator {
  readonly id: string;
  readonly handle: string;
  readonly displayName: string;
  readonly shelfCount: number;
}

export interface AdminWithdrawal {
  readonly id: string;
  readonly userName: string;
  readonly amountCents: number;
  readonly destinationLabel: string;
}

export interface AdminDashboardData {
  readonly metrics: {
    readonly ledgerCents: number;
    readonly pendingWithdrawalCents: number;
    readonly creatorCents: number;
    readonly platformCents: number;
  };
  readonly trafficSplit: Record<"FAN" | "CREATOR" | "PLATFORM", number>;
  readonly thresholds: {
    readonly minimumWithdrawalCents: number;
  };
  readonly pendingWithdrawals: readonly AdminWithdrawal[];
  readonly creators: readonly AdminCreator[];
}

export interface AdminActionOptions {
  readonly now?: () => Date;
}

function toNumber(value: number | bigint | null | undefined) {
  if (typeof value === "bigint") return Number(value);
  return Number(value ?? 0);
}

function requireAdmin(session: AuthSession | null): AdminActionResult {
  if (!session) return { ok: false, reason: "UNAUTHENTICATED" };
  if (session.user.role !== "ADMIN") return { ok: false, reason: "FORBIDDEN" };
  return { ok: true };
}

function readSum(database: DatabaseSync, sql: string, ...params: string[]) {
  const row = database.prepare(sql).get(...params) as { total: number | bigint } | undefined;
  return toNumber(row?.total);
}

function readThreshold(database: DatabaseSync) {
  const row = database
    .prepare("SELECT value FROM admin_settings WHERE key = 'minimum_withdrawal_cents'")
    .get() as { value: string } | undefined;
  const parsed = Number(row?.value ?? 5000);
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : 5000;
}

function csvCell(value: string) {
  return /[",\n\r]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

function amount(cents: number) {
  return (cents / 100).toFixed(2);
}

export function getAdminDashboardData(
  database: DatabaseSync,
  session: AuthSession | null,
  input: {
    readonly creatorQuery?: string;
  } = {},
): AdminActionResult<AdminDashboardData> {
  const admin = requireAdmin(session);
  if (!admin.ok) return admin;

  const trafficRows = database
    .prepare(
      `SELECT beneficiary, COUNT(*) AS count
       FROM click_events
       GROUP BY beneficiary`,
    )
    .all() as Array<{ beneficiary: "FAN" | "CREATOR" | "PLATFORM"; count: number | bigint }>;
  const trafficSplit = {
    FAN: 0,
    CREATOR: 0,
    PLATFORM: 0,
  };
  for (const row of trafficRows) {
    trafficSplit[row.beneficiary] = toNumber(row.count);
  }

  const creatorSearch = input.creatorQuery?.trim().toLowerCase() ?? "";
  const creatorParams: string[] = [];
  const creatorFilters = ["users.deleted_at IS NULL"];
  if (creatorSearch) {
    creatorFilters.push(
      "(LOWER(creator_profiles.handle) LIKE ? OR LOWER(creator_profiles.display_name) LIKE ?)",
    );
    creatorParams.push(`%${creatorSearch}%`, `%${creatorSearch}%`);
  }
  const creators = database
    .prepare(
      `SELECT
         creator_profiles.id AS id,
         creator_profiles.handle AS handle,
         creator_profiles.display_name AS displayName,
         COUNT(shelves.id) AS shelfCount
       FROM creator_profiles
       INNER JOIN users ON users.id = creator_profiles.user_id
       LEFT JOIN shelves ON shelves.creator_id = creator_profiles.id AND shelves.deleted_at IS NULL
       WHERE ${creatorFilters.join(" AND ")}
       GROUP BY creator_profiles.id
       ORDER BY creator_profiles.display_name`,
    )
    .all(...creatorParams) as Array<{
      id: string;
      handle: string;
      displayName: string;
      shelfCount: number | bigint;
    }>;

  const pendingWithdrawals = database
    .prepare(
      `SELECT
         withdrawals.id AS id,
         users.display_name AS userName,
         withdrawals.amount_cents AS amountCents,
         withdrawals.destination_label AS destinationLabel
       FROM withdrawals
       INNER JOIN users ON users.id = withdrawals.user_id
       WHERE withdrawals.status = 'PENDING'
       ORDER BY withdrawals.created_at`,
    )
    .all() as Array<{
      id: string;
      userName: string;
      amountCents: number | bigint;
      destinationLabel: string;
    }>;

  return {
    ok: true,
    metrics: {
      ledgerCents: readSum(database, "SELECT COALESCE(SUM(amount_cents), 0) AS total FROM wallet_entries"),
      pendingWithdrawalCents: readSum(
        database,
        "SELECT COALESCE(SUM(amount_cents), 0) AS total FROM withdrawals WHERE status = 'PENDING'",
      ),
      creatorCents: readSum(
        database,
        `SELECT COALESCE(SUM(wallet_entries.amount_cents), 0) AS total
         FROM wallet_entries
         INNER JOIN users ON users.id = wallet_entries.user_id
         WHERE users.role = ?`,
        "CREATOR",
      ),
      platformCents: readSum(
        database,
        `SELECT COALESCE(SUM(wallet_entries.amount_cents), 0) AS total
         FROM wallet_entries
         INNER JOIN users ON users.id = wallet_entries.user_id
         WHERE users.role = ?`,
        "ADMIN",
      ),
    },
    trafficSplit,
    thresholds: {
      minimumWithdrawalCents: readThreshold(database),
    },
    pendingWithdrawals: pendingWithdrawals.map((withdrawal) => ({
      ...withdrawal,
      amountCents: toNumber(withdrawal.amountCents),
    })),
    creators: creators.map((creator) => ({
      ...creator,
      shelfCount: toNumber(creator.shelfCount),
    })),
  };
}

export function saveAdminThreshold(
  database: DatabaseSync,
  input: {
    readonly minimumWithdrawalCents: number;
  },
  session: AuthSession | null,
  options: AdminActionOptions = {},
): AdminActionResult {
  const admin = requireAdmin(session);
  if (!admin.ok) return admin;
  const amountCents = Math.round(input.minimumWithdrawalCents);
  if (amountCents <= 0) return { ok: false, reason: "INVALID_INPUT" };
  const updatedAt = (options.now ?? (() => new Date()))().toISOString();
  database
    .prepare(
      `INSERT INTO admin_settings (key, value, updated_at)
       VALUES ('minimum_withdrawal_cents', ?, ?)
       ON CONFLICT(key) DO UPDATE SET
         value = excluded.value,
         updated_at = excluded.updated_at`,
    )
    .run(String(amountCents), updatedAt);
  return { ok: true };
}

export function reviewWithdrawal(
  database: DatabaseSync,
  input: {
    readonly withdrawalId: string;
    readonly decision: "APPROVED" | "REJECTED";
  },
  session: AuthSession | null,
  options: AdminActionOptions = {},
): AdminActionResult {
  const admin = requireAdmin(session);
  if (!admin.ok) return admin;
  if (input.decision !== "APPROVED" && input.decision !== "REJECTED") {
    return { ok: false, reason: "INVALID_INPUT" };
  }

  const existing = database
    .prepare("SELECT status FROM withdrawals WHERE id = ? LIMIT 1")
    .get(input.withdrawalId) as { status: string } | undefined;
  if (!existing) return { ok: false, reason: "NOT_FOUND" };
  if (existing.status !== "PENDING") return { ok: false, reason: "INVALID_TRANSITION" };

  const reviewedAt = (options.now ?? (() => new Date()))().toISOString();
  database
    .prepare(
      `UPDATE withdrawals
       SET status = ?,
           reviewer_id = ?,
           reviewed_at = ?,
           updated_at = ?
       WHERE id = ?
         AND status = 'PENDING'`,
    )
    .run(input.decision, session?.user.id ?? "", reviewedAt, reviewedAt, input.withdrawalId);
  return { ok: true };
}

export function exportAdminLedgerCsv(
  database: DatabaseSync,
  session: AuthSession | null,
): AdminActionResult<{ readonly csv: string }> {
  const admin = requireAdmin(session);
  if (!admin.ok) return admin;
  const rows = database
    .prepare(
      `SELECT
         wallet_entries.created_at AS createdAt,
         users.display_name AS userName,
         wallet_entries.type AS type,
         wallet_entries.status AS status,
         wallet_entries.amount_cents AS amountCents
       FROM wallet_entries
       INNER JOIN users ON users.id = wallet_entries.user_id
       ORDER BY wallet_entries.created_at DESC`,
    )
    .all() as Array<{
      createdAt: string;
      userName: string;
      type: string;
      status: string;
      amountCents: number | bigint;
    }>;
  return {
    ok: true,
    csv: [
      "date,user,type,status,amount",
      ...rows.map((row) =>
        [
          row.createdAt,
          csvCell(row.userName),
          row.type,
          row.status,
          amount(toNumber(row.amountCents)),
        ].join(","),
      ),
    ].join("\n"),
  };
}
