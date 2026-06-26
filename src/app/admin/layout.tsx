import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getAuthSession } from "@/features/auth/adapter";
import { AdminShell } from "@/features/admin/admin-shell";
import { getSharedPublicShelvesDatabase } from "@/features/shelves/service";

export default async function AdminLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  const database = getSharedPublicShelvesDatabase();
  const session = getAuthSession(database, { headers: await headers() });
  if (!session) {
    redirect("/admin-secret?returnTo=/admin/dashboard");
  }
  if (session.user.role !== "ADMIN") {
    redirect("/forbidden");
  }

  return <AdminShell user={{ displayName: session.user.displayName }}>{children}</AdminShell>;
}
