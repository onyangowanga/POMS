import Link from "next/link";
import { StatCard } from "@/components/dashboard/StatCard";
import { JobStatusBadge, PaymentStatusBadge } from "@/components/dashboard/StatusBadges";
import { formatDate, formatKes } from "@/lib/format";
import { DEMO_CLIENTS, DEMO_INVENTORY, DEMO_JOB_ORDERS } from "@/lib/sample-data";
import { JOB_ORDER_STATUSES, type JobOrderStatus } from "@/types/poms";

function clientName(clientId: string): string {
  return DEMO_CLIENTS.find((c) => c.id === clientId)?.name ?? "Unknown client";
}

export default function DashboardOverviewPage() {
  const totalRevenueToday = DEMO_JOB_ORDERS.reduce((sum, job) => sum + job.amountPaid, 0);
  const outstandingReceivables = DEMO_JOB_ORDERS.reduce((sum, job) => sum + job.balanceDue, 0);
  const lowStockItems = DEMO_INVENTORY.filter((item) => item.quantityOnHand <= item.reorderLevel);

  const pipelineCounts = JOB_ORDER_STATUSES.reduce(
    (acc, status) => {
      acc[status] = DEMO_JOB_ORDERS.filter((job) => job.status === status).length;
      return acc;
    },
    {} as Record<JobOrderStatus, number>,
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Revenue Collected" value={formatKes(totalRevenueToday)} hint="Across all job orders" tone="success" />
        <StatCard
          label="Outstanding Receivables"
          value={formatKes(outstandingReceivables)}
          hint="Unpaid + partial balances"
          tone="warning"
        />
        <StatCard
          label="Low Stock Alerts"
          value={String(lowStockItems.length)}
          hint={lowStockItems.map((i) => i.name).join(", ") || "All stock healthy"}
          tone={lowStockItems.length > 0 ? "danger" : "default"}
        />
        <StatCard label="Active Job Orders" value={String(DEMO_JOB_ORDERS.length)} hint="Open across the pipeline" />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Job Status Pipeline</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {JOB_ORDER_STATUSES.map((status) => (
            <div key={status} className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-center">
              <p className="text-2xl font-semibold text-slate-900">{pipelineCounts[status]}</p>
              <p className="mt-1 text-xs text-slate-500">
                <JobStatusBadge status={status} />
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-900">Recent Job Orders</h2>
          <Link href="/dashboard/jobs" className="text-sm font-medium text-blue-600 hover:underline">
            View all
          </Link>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3">Job #</th>
              <th className="px-5 py-3">Client</th>
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
