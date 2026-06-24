"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

import { cn } from "@/lib/cn";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

export interface DialogProps {
  children: ReactNode;
  className?: string;
  onClose: () => void;
  open: boolean;
  title: string;
}

export function Dialog({ children, className, onClose, open, title }: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }

    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const firstFocusable = dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
    firstFocusable?.focus();

    return () => opener?.focus();
  }, [open]);

  if (!open) {
    return null;
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }

    if (event.key !== "Tab" || !dialogRef.current) {
      return;
    }

    const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
    const first = focusable.at(0);
    const last = focusable.at(-1);

    if (!first || !last) {
      event.preventDefault();
      dialogRef.current.focus();
      return;
    }

    const activeElement = document.activeElement;
    if (event.shiftKey && (activeElement === first || !dialogRef.current.contains(activeElement))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-[rgba(11,19,43,0.48)] p-4"
      onKeyDown={handleKeyDown}
    >
      <div
        aria-labelledby={titleId}
        aria-modal="true"
        className={cn(
          "w-full max-w-lg rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 text-[var(--ink)] shadow-[var(--shadow-card)]",
          className,
        )}
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2 className="m-0 text-xl font-bold" id={titleId}>
            {title}
          </h2>
          <button
            aria-label="Close dialog"
            className="inline-flex size-10 items-center justify-center rounded-full text-[var(--muted)] hover:bg-[var(--surface-low)] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--glow)]"
            onClick={onClose}
            type="button"
          >
            <span aria-hidden="true" className="material-symbols-outlined">
              close
            </span>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
