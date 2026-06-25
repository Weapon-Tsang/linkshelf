"use client";

import { useState } from "react";
import type { SaveTargetType } from "./types";
import { FanAuthDialog } from "./fan-auth-dialog";

export function SaveButton({
  targetType,
  targetId,
  returnTo,
  isSaved,
  className,
  iconOnly = false,
}: {
  readonly targetType: SaveTargetType;
  readonly targetId: string;
  readonly returnTo: string;
  readonly isSaved: boolean;
  readonly className?: string;
  readonly iconOnly?: boolean;
}) {
  const [authOpen, setAuthOpen] = useState(false);
  const labelTarget = targetType === "SHELF" ? "shelf" : "creator";
  const label = isSaved ? `Saved ${labelTarget}` : `Save ${labelTarget}`;

  return (
    <>
      <button
        aria-label={iconOnly ? label : undefined}
        className={
          className ??
          "inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-bold text-[var(--ink)] shadow-sm transition-colors hover:border-[var(--teal-700)] hover:text-[var(--teal-700)]"
        }
        data-target-id={targetId}
        onClick={() => setAuthOpen(true)}
        type="button"
      >
        <span aria-hidden="true" className="material-symbols-outlined">
          {isSaved ? "favorite" : "favorite"}
        </span>
        {iconOnly ? null : label}
      </button>

      <FanAuthDialog
        onClose={() => setAuthOpen(false)}
        open={authOpen}
        pendingAction="save"
        returnTo={returnTo}
      />
    </>
  );
}
