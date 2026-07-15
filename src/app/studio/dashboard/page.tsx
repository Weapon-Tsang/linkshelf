import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { resolveServerAuthSession } from "@/features/auth/server";
import { listCreatorShelves } from "@/features/shelves/actions";
import { getSharedPublicShelvesDatabase } from "@/features/shelves/service";
import { DashboardView } from "@/features/studio/dashboard-view";

export default async function StudioDashboardPage() {
  const session = await resolveServerAuthSession(await headers(), "/studio/dashboard");
  if (!session) {
    redirect("/login?returnTo=/studio/dashboard");
  }

  const database = getSharedPublicShelvesDatabase();
  const studio = listCreatorShelves(database, session);
  if (!studio.ok) {
    redirect("/forbidden");
  }

  return <DashboardView shelves={studio.shelves} totals={studio.totals} />;
}
