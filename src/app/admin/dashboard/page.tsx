import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuthSession } from "@/features/auth/adapter";
import {
  exportAdminLedgerCsv,
  getAdminDashboardData,
  reviewWithdrawal,
  saveAdminThreshold,
} from "@/features/admin/actions";
import { AdminDashboard } from "@/features/admin/admin-dashboard";
import { getSharedPublicShelvesDatabase } from "@/features/shelves/service";

async function getAdminSession() {
  const database = getSharedPublicShelvesDatabase();
  const session = getAuthSession(database, { headers: await headers() });
  if (!session) {
    redirect("/admin-secret?returnTo=/admin/dashboard");
  }
  if (session.user.role !== "ADMIN") {
    redirect("/forbidden");
  }
  return { database, session };
}

async function approveWithdrawalAction(withdrawalId: string) {
  "use server";

  const { database, session } = await getAdminSession();
  reviewWithdrawal(database, { withdrawalId, decision: "APPROVED" }, session);
  revalidatePath("/admin/dashboard");
}

async function rejectWithdrawalAction(withdrawalId: string) {
  "use server";

  const { database, session } = await getAdminSession();
  reviewWithdrawal(database, { withdrawalId, decision: "REJECTED" }, session);
  revalidatePath("/admin/dashboard");
}

async function saveThresholdAction(minimumWithdrawalCents: number) {
  "use server";

  const { database, session } = await getAdminSession();
  saveAdminThreshold(database, { minimumWithdrawalCents }, session);
  revalidatePath("/admin/dashboard");
}

export default async function AdminDashboardPage() {
  const { database, session } = await getAdminSession();
  const data = getAdminDashboardData(database, session);
  const csv = exportAdminLedgerCsv(database, session);

  if (!data.ok || !csv.ok) {
    redirect("/forbidden");
  }

  return (
    <AdminDashboard
      creators={data.creators}
      csv={csv.csv}
      metrics={data.metrics}
      onApproveWithdrawal={approveWithdrawalAction}
      onRejectWithdrawal={rejectWithdrawalAction}
      onSaveThreshold={saveThresholdAction}
      pendingWithdrawals={data.pendingWithdrawals}
      thresholds={data.thresholds}
      trafficSplit={data.trafficSplit}
    />
  );
}
