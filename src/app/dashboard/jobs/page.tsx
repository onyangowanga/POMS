import Link from "next/link";
import { JobStatusBadge, PaymentStatusBadge } from "@/components/dashboard/StatusBadges";
import { formatDate, formatKes } from "@/lib/format";
import { DEMO_CLIENTS, DEMO_JOB_ORDERS } from "@/lib/sample-data";

function clientName(clientId: string): string {
  return DEMO_CLIENTS.find((c) => c.id === clientId)?.name ?? "Unknown client";
}

export default function JobOrdersPage() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Job Orders</h1>
          <p className="text-sm text-slate-500">Every order, serialized and tracked from quotation to collection.</p>
        </div>
        <Link
          href="/dashboard/jobs/new"
          className="w-full rounded-lg bg-blue-600 px-4 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-blue-700 sm:w-auto"
        >
          + New Job Order
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="hidden w-full text-left text-sm md:table">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3">Job #</th>
              <th className="px-5 py-3">Client</th>
              <th className="px-5 py-3">Description</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Payment</th>
              <th className="px-5 py-3 text-right">Total</th>
              <th className="px-5 py-3 text-right">Balance</th>
              <th className="px-5 py-3">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {DEMO_JOB_ORDERS.map((job) => (
              <tr key={job.id} className="hover:bg-slate-50">
                <td className="px-5 py-3 font-medium text-slate-900">
                  <Link href={`/dashboard/jobs/${job.id}`} className="hover:underline">
                    {job.jobNumber}
                  </Link>
                </td>
                <td className="px-5 py-3 text-slate-600">{clientName(job.clientId)}</td>
                <td className="max-w-xs truncate px-5 py-3 text-slate-500">{job.notes}</td>
                <td className="px-5 py-3">
                  <JobStatusBadge status={job.status} />
                </td>
                <td className="px-5 py-3">
                  <PaymentStatusBadge status={job.paymentStatus} />
                </td>
                <td className="px-5 py-3 text-right text-slate-900">{formatKes(job.totalAmount)}</td>
                <td className="px-5 py-3 text-right text-slate-900">{formatKes(job.balanceDue)}</td>
                <td className="px-5 py-3 text-slate-500">{formatDate(job.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="space-y-3 p-4 md:hidden">
          {DEMO_JOB_ORDERS.map((job) => (
            <Link key={job.id} href={`/dashboard/jobs/${job.id}`} className="block rounded-lg border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{job.jobNumber}</p>
                  <p className="mt-1 text-sm text-slate-600">{clientName(job.clientId)}</p>
                </div>
                <JobStatusBadge status={job.status} />
              </div>
              <p className="mt-3 line-clamp-2 text-sm text-slate-500">{job.notes}</p>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs text-slate-500">Total</p><p className="font-medium">{formatKes(job.totalAmount)}</p></div>
                <div><p className="text-xs text-slate-500">Balance</p><p className="font-medium">{formatKes(job.balanceDue)}</p></div>
              </div>
              <div className="mt-3 flex items-center justify-between"><PaymentStatusBadge status={job.paymentStatus} /><span className="text-xs text-slate-500">{formatDate(job.createdAt)}</span></div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
