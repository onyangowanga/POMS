import { DEMO_CLIENTS } from "@/lib/sample-data";
import { formatKes } from "@/lib/format";

export default function ClientsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Clients</h1>
        <p className="text-sm text-slate-500">Everyone who has ordered or requested a quotation.</p>
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="hidden w-full text-left text-sm md:table">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Phone</th>
              <th className="px-5 py-3">WhatsApp</th>
              <th className="px-5 py-3 text-right">Credit Balance</th>
              <th className="px-5 py-3">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {DEMO_CLIENTS.map((client) => (
              <tr key={client.id} className="hover:bg-slate-50">
                <td className="px-5 py-3 font-medium text-slate-900">{client.name}</td>
                <td className="px-5 py-3 text-slate-600">{client.phone}</td>
                <td className="px-5 py-3">{client.whatsappOptIn ? "Yes" : "No"}</td>
                <td className="px-5 py-3 text-right">{formatKes(client.creditBalance)}</td>
                <td className="px-5 py-3 text-slate-500">{client.notes ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="space-y-3 p-4 md:hidden">
          {DEMO_CLIENTS.map((client) => (
            <article key={client.id} className="rounded-lg border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div><h2 className="font-semibold text-slate-900">{client.name}</h2><p className="mt-1 text-sm text-slate-600">{client.phone}</p></div>
                <span className="text-xs text-slate-500">WhatsApp: {client.whatsappOptIn ? "Yes" : "No"}</span>
              </div>
              <div className="mt-3 flex justify-between text-sm"><span className="text-slate-500">Credit balance</span><span className="font-medium">{formatKes(client.creditBalance)}</span></div>
              {client.notes ? <p className="mt-2 text-xs text-slate-500">{client.notes}</p> : null}
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
