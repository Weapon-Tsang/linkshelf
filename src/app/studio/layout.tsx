import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { resolveServerAuthSession } from "@/features/auth/server";
import { listCreatorShelves } from "@/features/shelves/actions";
import { getSharedPublicShelvesDatabase } from "@/features/shelves/service";
import { StudioShell } from "@/features/studio/studio-shell";

export default async function StudioLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  const session = await resolveServerAuthSession(await headers(), "/studio/dashboard");
  if (!session) {
    redirect("/login?returnTo=/studio/dashboard");
  }

  const database = getSharedPublicShelvesDatabase();
  const studio = listCreatorShelves(database, session);
  if (!studio.ok) {
    redirect("/forbidden");
  }

  return <StudioShell creator={studio.creator}>{children}</StudioShell>;
}
