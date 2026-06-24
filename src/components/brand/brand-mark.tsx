import type { HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

export function BrandMark({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      aria-label="LinkShelf"
      className={cn("inline-flex items-center gap-2 font-bold tracking-tight text-[var(--ink)]", className)}
      {...props}
    >
      <span aria-hidden="true" className="material-symbols-outlined text-[var(--teal-700)]">
        dataset
      </span>
      <span>LinkShelf</span>
    </span>
  );
}
