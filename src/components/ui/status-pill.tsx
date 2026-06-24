import type { HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

export type Status = "published" | "draft" | "pending" | "approved" | "rejected" | "active";

const statusStyles: Record<Status, string> = {
  published: "bg-emerald-100 text-emerald-800",
  draft: "bg-slate-100 text-slate-700",
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-teal-100 text-teal-800",
  rejected: "bg-red-100 text-[var(--danger)]",
  active: "bg-cyan-100 text-cyan-800",
};

const statusLabels: Record<Status, string> = {
  published: "Published",
  draft: "Draft",
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  active: "Active",
};

export interface StatusPillProps extends HTMLAttributes<HTMLSpanElement> {
  status: Status;
}

export function StatusPill({ className, status, ...props }: StatusPillProps) {
  return (
    <span
      className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", statusStyles[status], className)}
      data-status={status}
      {...props}
    >
      {statusLabels[status]}
    </span>
  );
}
