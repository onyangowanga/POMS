"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { formatKes } from "@/lib/format";
import clsx from "@/lib/clsx";
import { readJsonResponse } from "@/lib/http";

type InventoryItem = { id: string; name: string; type: "PAPER" | "TONER" | "INK" | "OTHER"; size?: string | null; unit: string; quantityOnHand: number; reorderLevel: number; costPerUnit: number; paperTypeId?: string | null };
type PaperType = { id: string; name: string };

export function InventoryManager() {
  const { user } = useAuth();
  const isOwner = user?.role === "OWNER";
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [paperTypes, setPaperTypes] = useState<PaperType[]>([]);
  const [message, setMessage] = useState("");
  const [draft, setDraft] = useState({ name: "", type: "PAPER", size: "A4", unit: "ream", quantity: "", reorder: "", cost: "", paperTypeId: "" });

  async function loadInventory() {
    try { const result = await readJsonResponse<{ inventory: InventoryItem[]; paperTypes: PaperType[] }>(fetch("/api/catalog")); setItems(result.inventory); setPaperTypes(result.paperTypes); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Unable to load inventory."); }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => { void loadInventory(); }, 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  async function saveItem(item: InventoryItem, quantityOnHand: number, reorderLevel: number) {
    const response = await fetch("/api/catalog", { method: "PATCH", headers: { "Content-Type": "application/json", "x-poms-role": user?.role ?? "" }, body: JSON.stringify({ kind: "inventory", ...item, quantityOnHand, reorderLevel }) });
    setMessage(response.ok ? "Inventory updated." : "Only the owner can edit inventory.");
    if (response.ok) await loadInventory();
  }

  async function addItem(event: React.FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/catalog", { method: "POST", headers: { "Content-Type": "application/json", "x-poms-role": user?.role ?? "" }, body: JSON.stringify({ kind: "inventory", name: draft.name, type: draft.type, size: draft.type === "PAPER" ? draft.size : null, unit: draft.unit, quantityOnHand: Number(draft.quantity), reorderLevel: Number(draft.reorder), costPerUnit: Number(draft.cost), paperTypeId: draft.type === "PAPER" ? draft.paperTypeId || null : null }) });
    setMessage(response.ok ? "Inventory item added." : "Only the owner can add inventory.");
    if (response.ok) { setDraft({ name: "", type: "PAPER", size: "A4", unit: "ream", quantity: "", reorder: "", cost: "", paperTypeId: "" }); await loadInventory(); }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="text-xl font-semibold text-slate-900">Inventory & Consumables</h1><p className="text-sm text-slate-500">Live stock levels from the database.</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{isOwner ? "Owner edit mode" : "Read only"}</span></div>
      {message ? <p className="text-sm font-medium text-teal-700">{message}</p> : null}
      {isOwner ? <form onSubmit={addItem} className="grid gap-3 rounded-xl border border-teal-100 bg-teal-50/50 p-4 sm:grid-cols-6">
        <input required value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="Item name" className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" />
        <select value={draft.type} onChange={(event) => setDraft({ ...draft, type: event.target.value })} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"><option value="PAPER">Paper</option><option value="TONER">Toner</option><option value="INK">Ink</option><option value="OTHER">Other</option></select>
        {draft.type === "PAPER" ? <><select value={draft.paperTypeId} onChange={(event) => setDraft({ ...draft, paperTypeId: event.target.value })} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"><option value="">Paper type</option>{paperTypes.map((paper) => <option key={paper.id} value={paper.id}>{paper.name}</option>)}</select><select value={draft.size} onChange={(event) => setDraft({ ...draft, size: event.target.value })} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"><option>A4</option><option>A3</option><option>Other</option></select></> : null}
        <input required value={draft.unit} onChange={(event) => setDraft({ ...draft, unit: event.target.value })} placeholder="Unit" className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" />
        <input required type="number" min="0" value={draft.quantity} onChange={(event) => setDraft({ ...draft, quantity: event.target.value })} placeholder="Opening stock" className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" />
        <input required type="number" min="0" value={draft.reorder} onChange={(event) => setDraft({ ...draft, reorder: event.target.value })} placeholder="Reorder level" className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" />
        <button className="rounded-md bg-teal-700 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-800">Add stock</button>
      </form> : null}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="hidden w-full text-left text-sm md:table"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Item</th><th className="px-5 py-3">Type</th><th className="px-5 py-3 text-right">On Hand</th><th className="px-5 py-3 text-right">Reorder Level</th><th className="px-5 py-3 text-right">Cost / Unit</th><th className="px-5 py-3 text-right">Action</th></tr></thead><tbody className="divide-y divide-slate-100">{items.map((item) => <InventoryRow key={item.id} item={item} owner={isOwner} onSave={saveItem} />)}</tbody></table>
        <div className="space-y-3 p-4 md:hidden">{items.map((item) => <InventoryCard key={item.id} item={item} owner={isOwner} onSave={saveItem} />)}</div>
      </div>
    </div>
  );
}

function InventoryRow({ item, owner, onSave }: { item: InventoryItem; owner: boolean; onSave: (item: InventoryItem, quantity: number, reorder: number) => Promise<void> }) {
  const [quantity, setQuantity] = useState(String(item.quantityOnHand));
  const [reorder, setReorder] = useState(String(item.reorderLevel));
  const low = item.quantityOnHand <= item.reorderLevel;
  return <tr className={clsx(low && "bg-red-50/60")}><td className="px-5 py-3 font-medium text-slate-900">{item.name}</td><td className="px-5 py-3 text-slate-600">{item.type}</td><td className={clsx("px-5 py-3 text-right", low && "font-semibold text-red-600")}>{owner ? <input type="number" min="0" value={quantity} onChange={(event) => setQuantity(event.target.value)} className="w-24 rounded border border-slate-300 px-2 py-1 text-right" /> : `${item.quantityOnHand} ${item.unit}`}</td><td className="px-5 py-3 text-right text-slate-500">{owner ? <input type="number" min="0" value={reorder} onChange={(event) => setReorder(event.target.value)} className="w-24 rounded border border-slate-300 px-2 py-1 text-right" /> : `${item.reorderLevel} ${item.unit}`}</td><td className="px-5 py-3 text-right">{formatKes(item.costPerUnit)}</td><td className="px-5 py-3 text-right">{owner ? <button type="button" onClick={() => onSave(item, Number(quantity), Number(reorder))} className="rounded bg-teal-700 px-2 py-1 text-xs font-semibold text-white">Save</button> : <span className="text-xs text-slate-400">Read only</span>}</td></tr>;
}

function InventoryCard({ item, owner, onSave }: { item: InventoryItem; owner: boolean; onSave: (item: InventoryItem, quantity: number, reorder: number) => Promise<void> }) {
  const [quantity, setQuantity] = useState(String(item.quantityOnHand));
  const [reorder, setReorder] = useState(String(item.reorderLevel));
  const low = item.quantityOnHand <= item.reorderLevel;
  return <article className={clsx("rounded-lg border p-4", low ? "border-red-200 bg-red-50/60" : "border-slate-200")}><div className="flex items-start justify-between gap-3"><div><h2 className="font-semibold text-slate-900">{item.name}</h2><p className="mt-1 text-xs text-slate-500">{item.type} · {formatKes(item.costPerUnit)} / unit</p></div><span className={clsx("text-sm font-semibold", low ? "text-red-600" : "text-slate-900")}>{item.quantityOnHand} {item.unit}</span></div>{owner ? <div className="mt-3 grid grid-cols-2 gap-2"><input type="number" min="0" value={quantity} onChange={(event) => setQuantity(event.target.value)} className="rounded border border-slate-300 px-2 py-1.5 text-sm" placeholder="On hand" /><input type="number" min="0" value={reorder} onChange={(event) => setReorder(event.target.value)} className="rounded border border-slate-300 px-2 py-1.5 text-sm" placeholder="Reorder level" /><button type="button" onClick={() => onSave(item, Number(quantity), Number(reorder))} className="col-span-2 rounded bg-teal-700 px-2 py-1.5 text-xs font-semibold text-white">Save inventory</button></div> : <p className="mt-3 text-xs text-slate-500">Reorder at {item.reorderLevel} {item.unit}</p>}</article>;
}
