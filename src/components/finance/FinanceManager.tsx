"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { formatKes } from "@/lib/format";
import { readJsonResponse } from "@/lib/http";

type FinanceData = { sales: number; collected: number; purchases: number; expenses: number; grossRevenue: number; purchaseEntries: Array<{ id: string; description: string; category: string; amount: number | string; supplier?: string | null }>; expenseEntries: Array<{ id: string; description: string; category: string; amount: number | string }> };

export function FinanceManager() {
  const { user } = useAuth();
  const [period, setPeriod] = useState("monthly");
  const [data, setData] = useState<FinanceData | null>(null);
  const [form, setForm] = useState({ kind: "purchase", description: "", category: "", amount: "", supplier: "", date: "" });
  const [message, setMessage] = useState("");

  const load = useCallback(async () => { const result = await readJsonResponse<FinanceData>(fetch(`/api/finance?period=${period}`)); setData(result); }, [period]);
  useEffect(() => { const timeoutId = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timeoutId); }, [load]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/finance", { method: "POST", headers: { "Content-Type": "application/json", "x-poms-role": user?.role ?? "" }, body: JSON.stringify({ ...form, amount: Number(form.amount) }) });
    setMessage(response.ok ? "Finance entry recorded." : "Only the owner can record finance entries.");
    if (response.ok) { setForm({ ...form, description: "", category: "", amount: "", supplier: "", date: "" }); await load(); }
  }

  return <div className="space-y-6"><div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="text-xl font-semibold text-slate-900">Finance</h1><p className="text-sm text-slate-500">Sales, purchases, operating expenses and gross revenue.</p></div><select value={period} onChange={(event) => setPeriod(event.target.value)} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"><option value="daily">Today</option><option value="weekly">This week</option><option value="monthly">This month</option></select></div>
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{[["Sales", data?.sales ?? 0, "text-slate-900"], ["Collected", data?.collected ?? 0, "text-emerald-600"], ["Stock Purchases", data?.purchases ?? 0, "text-amber-600"], ["Other Expenses", data?.expenses ?? 0, "text-red-600"], ["Gross Revenue", data?.grossRevenue ?? 0, "text-teal-700"]].map(([label, value, color]) => <div key={String(label)} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">{label}</p><p className={`mt-2 text-2xl font-semibold ${color}`}>{formatKes(Number(value))}</p></div>)}</div>
  {user?.role === "OWNER" ? <form onSubmit={submit} className="grid gap-3 rounded-xl border border-teal-100 bg-teal-50/50 p-4 sm:grid-cols-6"><select value={form.kind} onChange={(event) => setForm({ ...form, kind: event.target.value })} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"><option value="purchase">Stock purchase</option><option value="expense">Other expense</option></select><input required value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Description" className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" /><input required value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} placeholder="Category" className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" /><input required type="number" min="0" step="0.01" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} placeholder="Amount" className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" />{form.kind === "purchase" ? <input value={form.supplier} onChange={(event) => setForm({ ...form, supplier: event.target.value })} placeholder="Supplier" className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" /> : <input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" />}<button className="rounded-md bg-teal-700 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-800">Record entry</button></form> : null}
  {message ? <p className="text-sm font-medium text-teal-700">{message}</p> : null}
  <div className="grid gap-6 lg:grid-cols-2"><EntryList title="Recent purchases" entries={data?.purchaseEntries ?? []} /><EntryList title="Other expenses" entries={data?.expenseEntries ?? []} /></div></div>;
}

function EntryList({ title, entries }: { title: string; entries: Array<{ id: string; description: string; category: string; amount: number | string; supplier?: string | null }> }) { return <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-sm font-semibold text-slate-900">{title}</h2><div className="mt-3 divide-y divide-slate-100">{entries.length ? entries.map((entry) => <div key={entry.id} className="flex justify-between gap-3 py-3 text-sm"><div><p className="font-medium text-slate-800">{entry.description}</p><p className="text-xs text-slate-500">{entry.category}{entry.supplier ? ` · ${entry.supplier}` : ""}</p></div><span className="font-semibold text-slate-900">{formatKes(Number(entry.amount))}</span></div>) : <p className="py-3 text-sm text-slate-400">No entries for this period.</p>}</div></section>; }
