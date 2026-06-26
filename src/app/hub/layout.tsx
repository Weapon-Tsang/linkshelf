import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getAuthSession } from "@/features/auth/adapter";
import { getSharedPublicShelvesDatabase } from "@/features/shelves/service";
import { HubShell } from "@/features/hub/hub-shell";

export default async function HubLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  const database = getSharedPublicShelvesDatabase();
  const session = getAuthSession(database, { headers: await headers() });
  if (!session) {
    redirect("/login?returnTo=/hub/dashboard");
  }
  if (session.user.role !== "FAN") {
    redirect("/forbidden");
  }

  return <HubShell user={{ displayName: session.user.displayName }}>{children}</HubShell>;
}
