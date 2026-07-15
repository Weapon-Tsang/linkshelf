import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { resolveServerAuthSession } from "@/features/auth/server";
import { getSharedPublicShelvesDatabase } from "@/features/shelves/service";
import { HubDashboard } from "@/features/hub/hub-dashboard";
import {
  exportWalletCsv,
  getWalletSummary,
  requestWithdrawal,
  saveFanTrackingId,
} from "@/features/wallet/actions";

async function getFanSession() {
  const database = getSharedPublicShelvesDatabase();
  const session = await resolveServerAuthSession(await headers(), "/hub/dashboard");
  if (!session) {
    redirect("/login?returnTo=/hub/dashboard");
  }
  if (session.user.role !== "FAN") {
    redirect("/forbidden");
  }
  return { database, session };
}

async function saveTrackingAction(affiliateTag: string) {
  "use server";

  const { database, session } = await getFanSession();
  saveFanTrackingId(database, { affiliateTag }, session);
  revalidatePath("/hub/dashboard");
}

async function withdrawalAction(input: {
  readonly amountCents: number;
  readonly destinationLabel: string;
}) {
  "use server";

  const { database, session } = await getFanSession();
  requestWithdrawal(database, input, session);
  revalidatePath("/hub/dashboard");
}

export default async function HubDashboardPage() {
  const { database, session } = await getFanSession();
  const summary = getWalletSummary(database, session);
  const csv = exportWalletCsv(database, session);

  if (!summary.ok || !csv.ok) {
    redirect("/forbidden");
  }

  return (
    <HubDashboard
      csv={csv.csv}
      onRequestWithdrawal={withdrawalAction}
      onSaveTrackingId={saveTrackingAction}
      savedShelves={summary.savedShelves}
      shares={summary.shares}
      summary={summary}
    />
  );
}
