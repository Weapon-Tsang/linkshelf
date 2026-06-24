import { BrandMark } from "@/components/brand/brand-mark";
import { safeReturnTo } from "@/features/auth/guards";
import { GoogleLoginButton } from "@/features/auth/google-login-button";

interface LoginPageProps {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const query = await searchParams;
  const returnTo = safeReturnTo(first(query.returnTo), "/studio/dashboard");

  return (
    <main className="grid min-h-screen bg-[var(--surface)] lg:grid-cols-[minmax(0,1fr)_34rem]">
      <section className="relative hidden overflow-hidden bg-[#dff8f2] p-14 lg:flex lg:items-center xl:p-20">
        <div className="mx-auto w-full max-w-3xl">
          <p className="mb-5 inline-flex rounded-full bg-[var(--glow)] px-4 py-2 text-sm font-bold text-[var(--ink)]">
            Creator Portal
          </p>
          <h1 className="max-w-2xl text-5xl font-bold leading-[1.08] tracking-tight text-[var(--ink)] xl:text-6xl">
            Your entire digital presence, organized on one shelf.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-[var(--muted)]">
            Bring your recommendations, audience, and creator business into one calm workspace.
          </p>
          <div className="mt-12 grid grid-cols-[2fr_1fr] gap-5" aria-hidden="true">
            <div className="flex min-h-64 flex-col justify-between rounded-3xl border border-white/80 bg-white/75 p-7 shadow-[var(--shadow-card)]">
              <span className="material-symbols-outlined w-fit rounded-xl bg-[var(--teal-700)] p-3 text-3xl text-white">
                monitoring
              </span>
              <div>
                <p className="text-sm font-bold uppercase tracking-widest text-[var(--teal-700)]">
                  Weekly reach
                </p>
                <p className="mt-2 text-4xl font-bold text-[var(--ink)]">+12%</p>
              </div>
            </div>
            <div className="grid gap-5">
              <div className="grid place-items-center rounded-3xl border border-white/80 bg-white/75 shadow-[var(--shadow-card)]">
                <span className="material-symbols-outlined text-4xl text-[var(--teal-700)]">
                  share
                </span>
              </div>
              <div className="grid place-items-center rounded-3xl border border-white/80 bg-white/75 shadow-[var(--shadow-card)]">
                <span className="material-symbols-outlined text-4xl text-[var(--teal-700)]">
                  payments
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative flex min-h-screen items-center px-6 py-28 sm:px-12">
        <BrandMark className="absolute left-6 top-8 text-2xl sm:left-12" />
        <div className="mx-auto w-full max-w-sm">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--teal-700)]">
            Creator workspace
          </p>
          <h2 className="mt-3 text-4xl font-bold tracking-tight text-[var(--ink)]">
            Creator Login
          </h2>
          <p className="mt-4 leading-7 text-[var(--muted)]">
            Continue with your Google account to manage your shelves, audience, and earnings.
          </p>
          <div className="mt-9">
            <GoogleLoginButton role="creator" returnTo={returnTo} />
          </div>
          <p className="mt-6 text-center text-sm leading-6 text-[var(--muted)]">
            Google is the only sign-in provider for LinkShelf creators.
          </p>
        </div>
      </section>
    </main>
  );
}
