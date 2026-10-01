import Link from "next/link";
import { StatCard } from "@/components/dashboard/StatCard";
import { JobStatusBadge, PaymentStatusBadge } from "@/components/dashboard/StatusBadges";
import { formatDate, formatKes } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { JOB_ORDER_STATUSES, type JobOrderStatus } from "@/types/poms";

export const dynamic = "force-dynamic";

export default async function DashboardOverviewPage() {
  const tenant = await prisma.tenant.findUniqueOrThrow({ where: { slug: "aluwood" } });
  const [storedJobs, storedInventory] = await Promise.all([
    prisma.jobOrder.findMany({ where: { tenantId: tenant.id }, include: { client: true }, orderBy: { createdAt: "desc" }, take: 10 }),
    prisma.inventoryItem.findMany({ where: { tenantId: tenant.id }, orderBy: { name: "asc" } }),
  ]);
  const jobs = storedJobs.map((job) => ({ ...job, totalAmount: Number(job.totalAmount), amountPaid: Number(job.amountPaid), balanceDue: Number(job.balanceDue), createdAt: job.createdAt.toISOString() }));
  const lowStockItems = storedInventory.filter((item) => Number(item.quantityOnHand) <= Number(item.reorderLevel));
  const totalRevenueToday = jobs.reduce((sum, job) => sum + job.amountPaid, 0);
  const outstandingReceivables = jobs.reduce((sum, job) => sum + job.balanceDue, 0);

  const pipelineCounts = JOB_ORDER_STATUSES.reduce(
    (acc, status) => {
      acc[status] = jobs.filter((job) => job.status === status).length;
      return acc;
    },
    {} as Record<JobOrderStatus, number>,
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Revenue Collected" value={formatKes(totalRevenueToday)} hint="Across all job orders" tone="success" href="/dashboard/jobs" />
        <StatCard
          label="Outstanding Receivables"
          value={formatKes(outstandingReceivables)}
          hint="Unpaid + partial balances"
          tone="warning"
          href="/dashboard/clients"
        />
        <StatCard
          label="Low Stock Alerts"
          value={String(lowStockItems.length)}
          hint={lowStockItems.map((i) => i.name).join(", ") || "All stock healthy"}
          tone={lowStockItems.length > 0 ? "danger" : "default"}
          href="/dashboard/inventory"
        />
        <StatCard label="Active Job Orders" value={String(jobs.length)} hint="Open across the pipeline" href="/dashboard/jobs" />
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
        <table className="hidden w-full text-left text-sm md:table">
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
            {jobs.map((job) => (
              <tr key={job.id} className="hover:bg-slate-50">
                <td className="px-5 py-3 font-medium text-slate-900">
                  <Link href={`/dashboard/jobs/${job.id}`} className="hover:underline">
                    {job.jobNumber}
                  </Link>
                </td>
                <td className="px-5 py-3 text-slate-600">{job.client.name}</td>
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
          {jobs.map((job) => (
            <Link
              key={job.id}
              href={`/dashboard/jobs/${job.id}`}
              className="block rounded-lg border border-slate-200 p-4 transition hover:border-blue-300 hover:bg-blue-50/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{job.jobNumber}</p>
                  <p className="mt-1 text-sm text-slate-600">{job.client.name}</p>
                </div>
                <JobStatusBadge status={job.status} />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs text-slate-500">Total</p><p className="font-medium">{formatKes(job.totalAmount)}</p></div>
                <div><p className="text-xs text-slate-500">Balance</p><p className="font-medium">{formatKes(job.balanceDue)}</p></div>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                <PaymentStatusBadge status={job.paymentStatus} />
                <span>{formatDate(job.createdAt)}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
