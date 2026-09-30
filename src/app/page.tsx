import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <span className="rounded-full bg-blue-100 px-4 py-1 text-sm font-medium text-blue-700">
        Aluwood Enterprises · Tenant Demo
      </span>
      <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
        POMS — Printers Operations Management System
      </h1>
      <p className="max-w-xl text-base text-slate-600">
        Track every job order from quotation to collection, manage stock and staff, and
        keep clients updated over SMS &amp; WhatsApp — all from one simple dashboard.
      </p>
      <Link
        href="/dashboard"
        className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
      >
        Go to Dashboard
      </Link>
    </main>
  );
}
