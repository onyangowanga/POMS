import Link from "next/link";
import { notFound } from "next/navigation";
import { JobStatusBadge, PaymentStatusBadge } from "@/components/dashboard/StatusBadges";
import { JobStatusActions } from "@/components/dashboard/JobStatusActions";
import { formatDate, formatKes } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { JOB_ORDER_STATUSES } from "@/types/poms";

export default async function JobOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const storedJob = await prisma.jobOrder.findUnique({ where: { id }, include: { client: true, items: true } });
  if (!storedJob) notFound();
  const job = {
    ...storedJob,
    subtotal: Number(storedJob.subtotal),
    discountAmount: Number(storedJob.discountAmount),
    vatRate: Number(storedJob.vatRate),
    vatAmount: Number(storedJob.vatAmount),
    totalAmount: Number(storedJob.totalAmount),
    amountPaid: Number(storedJob.amountPaid),
    balanceDue: Number(storedJob.balanceDue),
    items: storedJob.items.map((item) => ({ ...item, quantity: Number(item.quantity), unitPrice: Number(item.unitPrice), lineTotal: Number(item.lineTotal) })),
  };
  const client = job.client;
  const currentStepIndex = JOB_ORDER_STATUSES.indexOf(job.status);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Link href="/dashboard/jobs" className="text-sm text-blue-600 hover:underline">
            ← All job orders
          </Link>
          <h1 className="mt-1 text-xl font-semibold text-slate-900">{job.jobNumber}</h1>
          <p className="text-sm text-slate-500">{client.name} · {client.phone}</p>
        </div>
        <div className="flex gap-2">
          <JobStatusBadge status={job.status} />
          <PaymentStatusBadge status={job.paymentStatus} />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-slate-900">Workflow</h2>
        <ol className="flex flex-wrap gap-2 text-xs">
          {JOB_ORDER_STATUSES.filter((s) => s !== "CANCELLED").map((status, index) => (
            <li
              key={status}
              className={`rounded-full px-3 py-1.5 font-medium ${
                index <= currentStepIndex ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"
              }`}
            >
              {index + 1}. {status.replaceAll("_", " ")}
            </li>
          ))}
        </ol>
      </div>

      <JobStatusActions initialStatus={job.status} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="text-sm font-semibold text-slate-900">Job Specification</h2>
            </div>
            <div className="px-5 py-4 text-sm text-slate-600">{job.notes || "No description provided."}</div>
            {job.items.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-[620px] w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-2">Item</th>
                    <th className="px-5 py-2">Sides</th>
                    <th className="px-5 py-2 text-right">Qty</th>
                    <th className="px-5 py-2 text-right">Unit Price</th>
                    <th className="px-5 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {job.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-5 py-3 text-slate-900">{item.description}</td>
                      <td className="px-5 py-3 text-slate-500">{item.sides ?? "—"}</td>
                      <td className="px-5 py-3 text-right">{item.quantity}</td>
                      <td className="px-5 py-3 text-right">{formatKes(item.unitPrice)}</td>
                      <td className="px-5 py-3 text-right font-medium">{formatKes(item.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
                </table>
              </div>
            ) : null}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">Financial Ledger</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Subtotal</dt>
                <dd className="text-slate-900">{formatKes(job.subtotal)}</dd>
              </div>
              <div className="flex justify-between text-red-600">
                <dt>Discount</dt>
                <dd>-{formatKes(job.discountAmount)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">VAT ({job.vatRate}%)</dt>
                <dd className="text-slate-900">{formatKes(job.vatAmount)}</dd>
              </div>
              <div className="flex justify-between font-semibold">
                <dt>Total</dt>
                <dd>{formatKes(job.totalAmount)}</dd>
              </div>
              <div className="flex justify-between text-emerald-600">
                <dt>Paid</dt>
                <dd>{formatKes(job.amountPaid)}</dd>
              </div>
              <div className="flex justify-between text-red-600">
                <dt>Balance Due</dt>
                <dd>{formatKes(job.balanceDue)}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">Client Notifications</h2>
            <p className="mt-1 text-xs text-slate-400">
              Wired up once the SMS / WhatsApp gateway is connected.
            </p>
            <div className="mt-3 flex flex-col gap-2">
              {["Send Invoice", "Job Completed Alert", "Payment Acknowledgment", "Payment Reminder"].map((action) => (
                <button
                  key={action}
                  disabled
                  title="Notification gateway not yet connected"
                  className="cursor-not-allowed rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm text-slate-400"
                >
                  {action}
                </button>
              ))}
            </div>
          </div>

          <div className="text-xs text-slate-400">Created {formatDate(job.createdAt)} · Updated {formatDate(job.updatedAt)}</div>
        </div>
      </div>
    </div>
  );
}
