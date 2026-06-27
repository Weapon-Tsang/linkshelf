import { safeReturnTo } from "./guards";
import type { DevelopmentRoleHint } from "./adapter";

export interface GoogleLoginButtonProps {
  readonly role: DevelopmentRoleHint;
  readonly returnTo: string;
  readonly entry?: string;
  readonly className?: string;
}

export function GoogleLoginButton({
  role,
  returnTo,
  entry,
  className = "",
}: GoogleLoginButtonProps) {
  const safeEntry =
    entry && /^v1\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{43}$/.test(entry)
      ? entry
      : undefined;

  return (
    <form action="/api/auth/google" method="post">
      <input name="role" type="hidden" value={role} />
      <input name="returnTo" type="hidden" value={safeReturnTo(returnTo, "/")} />
      {safeEntry ? <input name="entry" type="hidden" value={safeEntry} /> : null}
      <button
        className={`inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-xl border border-[var(--line)] bg-white px-6 py-3 text-base font-semibold text-[var(--ink)] shadow-sm transition hover:border-[var(--teal-700)] hover:bg-[var(--surface-low)] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--teal-700)] ${className}`}
        type="submit"
      >
        <svg
          aria-hidden="true"
          className="h-5 w-5 shrink-0"
          data-testid="google-brand-mark"
          focusable="false"
          viewBox="0 0 24 24"
        >
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.27.81-.57z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Continue with Google
      </button>
    </form>
  );
}
