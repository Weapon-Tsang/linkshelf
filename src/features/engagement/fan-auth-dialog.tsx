"use client";

import { GoogleLoginButton } from "@/features/auth/google-login-button";
import { safeReturnTo } from "@/features/auth/guards";

export type PendingFanAction = "save" | "share";

function returnToWithResume(returnTo: string, pendingAction: PendingFanAction) {
  const safe = safeReturnTo(returnTo, "/");
  const url = new URL(safe, "https://linkshelf.local");
  url.searchParams.set("resume", pendingAction);
  return `${url.pathname}${url.search}${url.hash}`;
}

export function FanAuthDialog({
  open,
  pendingAction,
  returnTo,
  onClose,
}: {
  readonly open: boolean;
  readonly pendingAction: PendingFanAction;
  readonly returnTo: string;
  readonly onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#efe9ef]/75 px-5 backdrop-blur-xl">
      <section
        aria-labelledby="fan-auth-title"
        aria-modal="true"
        className="relative w-full max-w-[460px] overflow-hidden rounded-[32px] border border-white/70 bg-white/82 p-8 text-center shadow-[0_28px_90px_rgba(11,19,43,0.16)] backdrop-blur-2xl"
        role="dialog"
      >
        <div className="pointer-events-none absolute -top-20 left-1/2 h-36 w-36 -translate-x-1/2 rounded-full bg-[var(--glow)] blur-3xl" />

        <button
          aria-label="Close fan authentication"
          className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full text-[var(--muted)] transition-colors hover:bg-[var(--surface-low)] hover:text-[var(--ink)]"
          onClick={onClose}
          type="button"
        >
          <span aria-hidden="true" className="material-symbols-outlined">
            close
          </span>
        </button>

        <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--glow)] text-[var(--teal-700)]">
          <span aria-hidden="true" className="material-symbols-outlined text-4xl">
            group
          </span>
        </div>

        <h2
          className="mt-8 text-4xl font-bold tracking-[-0.03em] text-[var(--ink)]"
          id="fan-auth-title"
        >
          Fan Authentication
        </h2>
        <p className="mt-3 text-lg font-medium text-[var(--muted)]">Connect to Earn & Save</p>

        <div className="mt-10">
          <GoogleLoginButton
            role="fan"
            returnTo={returnToWithResume(returnTo, pendingAction)}
          />
        </div>

        <p className="mt-8 text-sm font-semibold text-[var(--muted)]">
          By connecting, you agree to our{" "}
          <a className="text-[var(--teal-700)] hover:underline" href="#">
            Terms of Service
          </a>
          .
        </p>

        <div className="mx-auto mt-6 inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white/72 px-5 py-3 text-sm font-bold text-[var(--teal-700)]">
          <span aria-hidden="true" className="material-symbols-outlined text-lg">
            encrypted
          </span>
          Secure 256-bit encryption
        </div>
      </section>
    </div>
  );
}
