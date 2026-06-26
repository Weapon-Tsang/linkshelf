import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getAuthSession } from "@/features/auth/adapter";
import { listCreatorShelves } from "@/features/shelves/actions";
import { getSharedPublicShelvesDatabase } from "@/features/shelves/service";
import { StudioShell } from "@/features/studio/studio-shell";

export default async function StudioLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  const database = getSharedPublicShelvesDatabase();
  const session = getAuthSession(database, { headers: await headers() });
  if (!session) {
    redirect("/login?returnTo=/studio/dashboard");
  }

  const studio = listCreatorShelves(database, session);
  if (!studio.ok) {
    redirect("/forbidden");
  }

  return <StudioShell creator={studio.creator}>{children}</StudioShell>;
}
