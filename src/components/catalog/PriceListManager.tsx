"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { formatKes } from "@/lib/format";
import { readJsonResponse } from "@/lib/http";

type Paper = { id: string; name: string; singleSidePrice: number; doubleSidePrice: number | null; category?: string | null; gsm?: number | null };
type Service = { id: string; name: string; price: number; doubleSidePrice: number | null };

type CatalogResponse = { paperTypes: Paper[]; finishingServices: Service[] };

export function PriceListManager() {
  const { user } = useAuth();
  const isOwner = user?.role === "OWNER";
  const [catalog, setCatalog] = useState<CatalogResponse>({ paperTypes: [], finishingServices: [] });
  const [draft, setDraft] = useState({ kind: "paper", name: "", single: "", double: "" });
  const [message, setMessage] = useState("");

  async function loadCatalog() {
    try { setCatalog(await readJsonResponse<CatalogResponse>(fetch("/api/catalog"))); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Unable to load price list."); }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => { void loadCatalog(); }, 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  async function updatePaper(item: Paper, singleSidePrice: number, doubleSidePrice: number | null) {
    const response = await fetch("/api/catalog", { method: "PATCH", headers: { "Content-Type": "application/json", "x-poms-role": user?.role ?? "" }, body: JSON.stringify({ kind: "paper", id: item.id, name: item.name, singleSidePrice, doubleSidePrice }) });
    setMessage(response.ok ? "Price list saved." : "Only the owner can edit pricing.");
    if (response.ok) await loadCatalog();
  }

  async function addItem(event: React.FormEvent) {
    event.preventDefault();
    const isPaper = draft.kind === "paper";
    const body = isPaper
      ? { kind: "paper", name: draft.name, singleSidePrice: Number(draft.single), doubleSidePrice: draft.double ? Number(draft.double) : null }
      : { kind: "service", name: draft.name, price: Number(draft.single), doubleSidePrice: draft.double ? Number(draft.double) : null };
    const response = await fetch("/api/catalog", { method: "POST", headers: { "Content-Type": "application/json", "x-poms-role": user?.role ?? "" }, body: JSON.stringify(body) });
    setMessage(response.ok ? "Catalog item added." : "Only the owner can add catalog items.");
    if (response.ok) { setDraft({ kind: "paper", name: "", single: "", double: "" }); await loadCatalog(); }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div><h1 className="text-xl font-semibold text-slate-900">Price List</h1><p className="text-sm text-slate-500">Live tenant pricing in KES.</p></div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{isOwner ? "Owner edit mode" : "Read only"}</span>
      </div>

      {isOwner ? <form onSubmit={addItem} className="grid gap-3 rounded-xl border border-teal-100 bg-teal-50/50 p-4 sm:grid-cols-5">
        <select value={draft.kind} onChange={(event) => setDraft({ ...draft, kind: event.target.value })} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"><option value="paper">Paper</option><option value="service">Finishing service</option></select>
        <input required value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="Name" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
        <input required type="number" min="0" step="0.01" value={draft.single} onChange={(event) => setDraft({ ...draft, single: event.target.value })} placeholder={draft.kind === "paper" ? "Single side" : "Price"} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
        <input type="number" min="0" step="0.01" value={draft.double} onChange={(event) => setDraft({ ...draft, double: event.target.value })} placeholder="Double side (optional)" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
        <button className="rounded-md bg-teal-700 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-800">Add item</button>
      </form> : null}
      {message ? <p className="text-sm font-medium text-teal-700">{message}</p> : null}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="hidden w-full text-left text-sm md:table"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Paper Type / Service</th><th className="px-5 py-3 text-right">Single Side</th><th className="px-5 py-3 text-right">Double Side</th><th className="px-5 py-3 text-right">Action</th></tr></thead><tbody className="divide-y divide-slate-100">
          {catalog.paperTypes.map((item) => <PriceRow key={item.id} label={item.name} single={item.singleSidePrice} double={item.doubleSidePrice} owner={isOwner} onSave={(single, double) => updatePaper(item, single, double)} />)}
          {catalog.finishingServices.map((item) => <PriceRow key={item.id} label={`${item.name} (finishing)`} single={item.price} double={item.doubleSidePrice} owner={false} onSave={async () => undefined} />)}
        </tbody></table>
        <div className="space-y-3 p-4 md:hidden">{catalog.paperTypes.map((item) => <PriceCard key={item.id} label={item.name} single={item.singleSidePrice} double={item.doubleSidePrice} />)}{catalog.finishingServices.map((item) => <PriceCard key={item.id} label={`${item.name} (finishing)`} single={item.price} double={item.doubleSidePrice} />)}</div>
      </div>
    </div>
  );
}

function PriceRow({ label, single, double, owner, onSave }: { label: string; single: number; double: number | null; owner: boolean; onSave: (single: number, double: number | null) => Promise<void> }) {
  const [singleValue, setSingleValue] = useState(String(single));
  const [doubleValue, setDoubleValue] = useState(double === null ? "" : String(double));
  return <tr><td className="px-5 py-3 text-slate-900">{label}</td><td className="px-5 py-3 text-right">{owner ? <input value={singleValue} onChange={(event) => setSingleValue(event.target.value)} className="w-24 rounded border border-slate-300 px-2 py-1 text-right" /> : formatKes(single)}</td><td className="px-5 py-3 text-right">{owner ? <input value={doubleValue} onChange={(event) => setDoubleValue(event.target.value)} placeholder="N/A" className="w-24 rounded border border-slate-300 px-2 py-1 text-right" /> : double !== null ? formatKes(double) : "N/A"}</td><td className="px-5 py-3 text-right">{owner ? <button type="button" onClick={() => onSave(Number(singleValue), doubleValue ? Number(doubleValue) : null)} className="rounded bg-teal-700 px-2 py-1 text-xs font-semibold text-white">Save</button> : <span className="text-xs text-slate-400">Read only</span>}</td></tr>;
}

function PriceCard({ label, single, double }: { label: string; single: number; double: number | null }) {
  return <article className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 p-4"><p className="text-sm font-medium text-slate-900">{label}</p><div className="text-right text-xs text-slate-500"><p>Single {formatKes(single)}</p><p className="mt-1">Double {double !== null ? formatKes(double) : "N/A"}</p></div></article>;
}
