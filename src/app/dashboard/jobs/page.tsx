"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { JobStatusBadge, PaymentStatusBadge } from "@/components/dashboard/StatusBadges";
import { formatDate, formatKes } from "@/lib/format";
import { readJsonResponse } from "@/lib/http";
import type { JobOrder } from "@/types/poms";

type ApiJob = JobOrder & { client: { name: string; phone: string } };

export default function JobOrdersPage() {
  const [jobs, setJobs] = useState<ApiJob[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void readJsonResponse<ApiJob[]>(fetch("/api/jobs"))
        .then(setJobs)
        .catch((requestError: Error) => setError(requestError.message));
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  return <div className="space-y-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h1 className="text-xl font-semibold text-slate-900">Job Orders</h1><p className="text-sm text-slate-500">Every order, serialized and tracked from quotation to collection.</p></div><Link href="/dashboard/jobs/new" className="w-full rounded-lg bg-blue-600 px-4 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-blue-700 sm:w-auto">+ New Job Order</Link></div>{error ? <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}<div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><table className="hidden w-full text-left text-sm md:table"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Job #</th><th className="px-5 py-3">Client</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Payment</th><th className="px-5 py-3 text-right">Total</th><th className="px-5 py-3 text-right">Balance</th><th className="px-5 py-3">Created</th></tr></thead><tbody className="divide-y divide-slate-100">{jobs.map((job) => <tr key={job.id} className="hover:bg-slate-50"><td className="px-5 py-3 font-medium"><Link href={`/dashboard/jobs/${job.id}`} className="text-slate-900 hover:underline">{job.jobNumber}</Link></td><td className="px-5 py-3 text-slate-600">{job.client.name}<br /><span className="text-xs">{job.client.phone}</span></td><td className="px-5 py-3"><JobStatusBadge status={job.status} /></td><td className="px-5 py-3"><PaymentStatusBadge status={job.paymentStatus} /></td><td className="px-5 py-3 text-right">{formatKes(job.totalAmount)}</td><td className="px-5 py-3 text-right">{formatKes(job.balanceDue)}</td><td className="px-5 py-3 text-slate-500">{formatDate(job.createdAt)}</td></tr>)}</tbody></table><div className="space-y-3 p-4 md:hidden">{jobs.map((job) => <Link key={job.id} href={`/dashboard/jobs/${job.id}`} className="block rounded-lg border border-slate-200 p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-slate-900">{job.jobNumber}</p><p className="mt-1 text-sm text-slate-600">{job.client.name}</p><p className="text-xs text-slate-500">{job.client.phone}</p></div><JobStatusBadge status={job.status} /></div><div className="mt-3 grid grid-cols-2 gap-3 text-sm"><div><p className="text-xs text-slate-500">Total</p><p className="font-medium">{formatKes(job.totalAmount)}</p></div><div><p className="text-xs text-slate-500">Balance</p><p className="font-medium">{formatKes(job.balanceDue)}</p></div></div><div className="mt-3 flex justify-between"><PaymentStatusBadge status={job.paymentStatus} /><span className="text-xs text-slate-500">{formatDate(job.createdAt)}</span></div></Link>)}</div>{!jobs.length && !error ? <p className="p-8 text-center text-sm text-slate-400">No job orders yet.</p> : null}</div></div>;
}
