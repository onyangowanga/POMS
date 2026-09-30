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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Job Orders</h1>
          <p className="text-sm text-slate-500">Every order, serialized and tracked from quotation to collection.</p>
        </div>
        <Link
          href="/dashboard/jobs/new"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
        >
          + New Job Order
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
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
      </div>
    </div>
  );
}
