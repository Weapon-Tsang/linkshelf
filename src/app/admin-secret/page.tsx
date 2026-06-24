import { redirect } from "next/navigation";
import { safeReturnTo } from "@/features/auth/guards";
import { GoogleLoginButton } from "@/features/auth/google-login-button";

interface AdminSecretPageProps {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminSecretPage({ searchParams }: AdminSecretPageProps) {
  const query = await searchParams;
  const returnTo = safeReturnTo(first(query.returnTo), "/admin/dashboard");
  const requestedChallenge = first(query.challenge);
  const entry =
    requestedChallenge &&
    /^v1\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{43}$/.test(requestedChallenge)
      ? requestedChallenge
      : undefined;

  if (process.env.NODE_ENV !== "production" && !entry) {
    redirect(
      `/api/auth/admin-entry?returnTo=${encodeURIComponent(returnTo)}`,
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-[#f3f5f7] px-5 py-10 text-[var(--ink)] sm:px-10">
      <header className="flex items-center justify-center gap-3">
        <span
          aria-hidden="true"
          className="material-symbols-outlined text-4xl text-[var(--teal-700)]"
        >
          shield
        </span>
        <span className="text-2xl font-bold tracking-tight">LinkShelf Admin Portal</span>
      </header>

      <section className="flex flex-1 items-center justify-center py-12">
        <div className="relative w-full max-w-[440px] overflow-hidden rounded-2xl border border-[var(--line)] bg-white p-8 shadow-[var(--shadow-card)] sm:p-10">
          <div className="absolute inset-x-0 top-0 h-1 bg-[var(--teal-700)]" />
          <p className="text-center text-xs font-bold uppercase tracking-[0.22em] text-[var(--muted)]">
            System authentication
          </p>
          <h1 className="mt-7 text-center text-3xl font-bold tracking-tight">
            Secure administrator access
          </h1>
          <p className="mt-4 text-center leading-7 text-[var(--muted)]">
            Continue with the Google account assigned to your existing LinkShelf administrator profile.
          </p>
          <div className="mt-8">
            <GoogleLoginButton role="admin" returnTo={returnTo} entry={entry} />
          </div>
          <p className="mt-7 flex items-center justify-center gap-2 text-center text-sm font-semibold text-[var(--muted)]">
            <span aria-hidden="true" className="material-symbols-outlined text-lg">
              verified_user
            </span>
            Authorized administrators only
          </p>
        </div>
      </section>

      <footer className="text-center text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
        Admin console access only
      </footer>
    </main>
  );
}
