import { formatKes } from "@/lib/format";
import { DEMO_FINISHING_SERVICES, DEMO_PAPER_TYPES } from "@/lib/sample-data";

export default function PriceListPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Price List</h1>
        <p className="text-sm text-slate-500">Default pricing matrix for Aluwood Enterprises (KES).</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3">Paper Type / Service</th>
              <th className="px-5 py-3 text-right">Single Side</th>
              <th className="px-5 py-3 text-right">Double Side</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {DEMO_PAPER_TYPES.map((paper) => (
              <tr key={paper.id} className="hover:bg-slate-50">
                <td className="px-5 py-3 text-slate-900">{paper.name}</td>
                <td className="px-5 py-3 text-right">{formatKes(paper.singleSidePrice)}</td>
                <td className="px-5 py-3 text-right">
                  {paper.doubleSidePrice !== null ? formatKes(paper.doubleSidePrice) : "N/A"}
                </td>
              </tr>
            ))}
            {DEMO_FINISHING_SERVICES.map((service) => (
              <tr key={service.id} className="bg-blue-50/40 hover:bg-blue-50">
                <td className="px-5 py-3 text-slate-900">{service.name} (finishing)</td>
                <td className="px-5 py-3 text-right">{formatKes(service.price)}</td>
                <td className="px-5 py-3 text-right">
                  {service.doubleSidePrice !== null ? formatKes(service.doubleSidePrice) : "N/A"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-400">
        Editable CRUD management for this list will be wired to the <code>PaperType</code> /{" "}
        <code>FinishingService</code> Prisma models once the owner-settings API is built.
      </p>
    </div>
  );
}
