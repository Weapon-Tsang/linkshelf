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
    entry && /^v1\.[A-Za-z0-9_-]{43}$/.test(entry) ? entry : undefined;

  return (
    <form action="/api/auth/google" method="post">
      <input name="role" type="hidden" value={role} />
      <input name="returnTo" type="hidden" value={safeReturnTo(returnTo, "/")} />
      {safeEntry ? <input name="entry" type="hidden" value={safeEntry} /> : null}
      <button
        className={`inline-flex min-h-14 w-full items-center justify-center rounded-xl border border-[var(--line)] bg-white px-6 py-3 text-base font-semibold text-[var(--ink)] shadow-sm transition hover:border-[var(--teal-700)] hover:bg-[var(--surface-low)] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--teal-700)] ${className}`}
        type="submit"
      >
        Continue with Google
      </button>
    </form>
  );
}
