import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuthSession } from "@/features/auth/adapter";
import { listCreatorShelves } from "@/features/shelves/actions";
import { getSharedPublicShelvesDatabase } from "@/features/shelves/service";
import { DashboardView } from "@/features/studio/dashboard-view";

export default async function StudioDashboardPage() {
  const database = getSharedPublicShelvesDatabase();
  const session = getAuthSession(database, { headers: await headers() });
  const studio = listCreatorShelves(database, session);

  if (!session) {
    redirect("/login?returnTo=/studio/dashboard");
  }
  if (!studio.ok) {
    redirect("/forbidden");
  }

  return <DashboardView shelves={studio.shelves} totals={studio.totals} />;
}
