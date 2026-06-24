"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

import { cn } from "@/lib/cn";

const TABBABLE_SELECTOR = [
  "a[href]",
  "area[href]",
  "button",
  "input",
  "select",
  "textarea",
  "iframe",
  "object",
  "embed",
  "[contenteditable]",
  "[tabindex]",
].join(",");

function isVisible(element: HTMLElement) {
  for (let current: HTMLElement | null = element; current; current = current.parentElement) {
    const style = window.getComputedStyle(current);
    if (style.display === "none" || style.visibility === "hidden" || style.visibility === "collapse" || style.opacity === "0") {
      return false;
    }
  }

  return Array.from(element.getClientRects()).some((rect) => rect.width > 0 && rect.height > 0);
}

function getTabbableElements(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLElement>(TABBABLE_SELECTOR)).filter((element) => {
    const inputIsHidden = element instanceof HTMLInputElement && element.type === "hidden";
    const excludedByAncestor = element.closest('[hidden], [inert], [aria-hidden="true"]');

    return !inputIsHidden
      && !excludedByAncestor
      && !element.matches(":disabled")
      && element.tabIndex >= 0
      && isVisible(element);
  });
}

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
    const firstFocusable = dialogRef.current && getTabbableElements(dialogRef.current).at(0);
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

    const focusable = getTabbableElements(dialogRef.current);
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
            className="inline-flex size-10 items-center justify-center rounded-full text-[var(--muted)] hover:bg-[var(--surface-low)] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--teal-700)]"
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
