import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { resolveServerAuthSession } from "@/features/auth/server";
import { HubShell } from "@/features/hub/hub-shell";

export default async function HubLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  const session = await resolveServerAuthSession(await headers(), "/hub/dashboard");
  if (!session) {
    redirect("/login?returnTo=/hub/dashboard");
  }
  if (session.user.role !== "FAN") {
    redirect("/forbidden");
  }

  return <HubShell user={{ displayName: session.user.displayName }}>{children}</HubShell>;
}
