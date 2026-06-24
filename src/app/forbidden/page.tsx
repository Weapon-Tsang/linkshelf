import Link from "next/link";
import { BrandMark } from "@/components/brand/brand-mark";

export default function ForbiddenPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[var(--surface)] px-6 py-16">
      <section className="w-full max-w-lg rounded-3xl border border-[var(--line)] bg-white p-8 text-center shadow-[var(--shadow-card)] sm:p-12">
        <BrandMark className="text-xl" />
        <p className="mt-10 text-sm font-bold uppercase tracking-[0.18em] text-[var(--teal-700)]">
          Permission required
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">Access denied</h1>
        <p className="mt-4 leading-7 text-[var(--muted)]">
          Your account does not have permission to open this area.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            className="rounded-full bg-[var(--teal-700)] px-6 py-3 font-semibold text-white focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--teal-700)]"
            href="/"
          >
            Return home
          </Link>
          <Link
            className="rounded-full border border-[var(--teal-700)] px-6 py-3 font-semibold text-[var(--teal-700)] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--teal-700)]"
            href="/login"
          >
            Creator login
          </Link>
        </div>
      </section>
    </main>
  );
}
