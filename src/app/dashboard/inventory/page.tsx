import clsx from "@/lib/clsx";
import { formatKes } from "@/lib/format";
import { DEMO_INVENTORY } from "@/lib/sample-data";

export default function InventoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Inventory & Consumables</h1>
        <p className="text-sm text-slate-500">Stock is deducted automatically once a job moves to In Production.</p>
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3">Item</th>
              <th className="px-5 py-3">Type</th>
              <th className="px-5 py-3 text-right">On Hand</th>
              <th className="px-5 py-3 text-right">Reorder Level</th>
              <th className="px-5 py-3 text-right">Cost / Unit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {DEMO_INVENTORY.map((item) => {
              const isLow = item.quantityOnHand <= item.reorderLevel;
              return (
                <tr key={item.id} className={clsx("hover:bg-slate-50", isLow && "bg-red-50/60")}>
                  <td className="px-5 py-3 font-medium text-slate-900">{item.name}</td>
                  <td className="px-5 py-3 text-slate-600">{item.type}</td>
                  <td className={clsx("px-5 py-3 text-right", isLow && "font-semibold text-red-600")}>
                    {item.quantityOnHand} {item.unit}
                  </td>
                  <td className="px-5 py-3 text-right text-slate-500">
                    {item.reorderLevel} {item.unit}
                  </td>
                  <td className="px-5 py-3 text-right">{formatKes(item.costPerUnit)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
