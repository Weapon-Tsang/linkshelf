import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { resolveServerAuthSession } from "@/features/auth/server";
import { AdminShell } from "@/features/admin/admin-shell";

export default async function AdminLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  const session = await resolveServerAuthSession(await headers(), "/admin/dashboard");
  if (!session) {
    redirect("/admin-secret?returnTo=/admin/dashboard");
  }
  if (session.user.role !== "ADMIN") {
    redirect("/forbidden");
  }

  return <AdminShell user={{ displayName: session.user.displayName }}>{children}</AdminShell>;
}
