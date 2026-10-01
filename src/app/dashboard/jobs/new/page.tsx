"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { calculateQuote, PriceCalculationError } from "@/lib/services/priceCalculator";
import { formatKes } from "@/lib/format";
import { readJsonResponse } from "@/lib/http";
import type { PriceLineRequest, SideOption } from "@/types/poms";

type DraftLine = PriceLineRequest & { key: string; isOther?: boolean };
type Client = { id: string; name: string; phone: string; email?: string | null; address?: string | null };
type Paper = { id: string; name: string; singleSidePrice: number; doubleSidePrice: number | null; isActive: boolean };
type Service = { id: string; name: string; price: number; doubleSidePrice: number | null; isActive: boolean };

type Catalog = { paperTypes: Paper[]; finishingServices: Service[] };

function emptyLine(): DraftLine { return { key: crypto.randomUUID(), quantity: 1, sides: "SINGLE" }; }

export default function NewJobOrderPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [catalog, setCatalog] = useState<Catalog>({ paperTypes: [], finishingServices: [] });
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [vatRate, setVatRate] = useState(0);
  const [notes, setNotes] = useState("");
  const [orderType, setOrderType] = useState<"QUOTATION" | "ORDER">("QUOTATION");
  const [lines, setLines] = useState<DraftLine[]>([emptyLine()]);
  const [submittedJobNumber, setSubmittedJobNumber] = useState("");
  const [whatsappUrl, setWhatsappUrl] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void Promise.all([readJsonResponse<Catalog>(fetch("/api/catalog").then((response) => response)), readJsonResponse<Client[]>(fetch("/api/clients").then((response) => response))])
        .then(([nextCatalog, nextClients]) => { setCatalog(nextCatalog); setClients(nextClients); })
        .catch((requestError: Error) => setError(requestError.message));
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  const quote = useMemo(() => {
    const validLines = lines.filter((line) => line.paperTypeId || line.finishingServiceId || line.customUnitPrice !== undefined);
    if (!validLines.length) return { quote: null, error: null };
    try { return { quote: calculateQuote({ lines: validLines, discountAmount, vatRate }, catalog), error: null }; }
    catch (err) { return { quote: null, error: err instanceof PriceCalculationError ? err.message : "Unable to calculate quote" }; }
  }, [catalog, discountAmount, lines, vatRate]);

  function updateLine(key: string, patch: Partial<DraftLine>) { setLines((previous) => previous.map((line) => line.key === key ? { ...line, ...patch } : line)); }
  function selectClient(value: string) {
    setClientName(value);
    const match = clients.find((client) => client.name.toLowerCase() === value.toLowerCase());
    if (match) setClientPhone(match.phone);
  }

  async function createJob() {
    setError("");
    if (!clientName.trim() || !clientPhone.trim()) { setError("Client name and phone number are required."); return; }
    if (!quote.quote) { setError("Add at least one priced line item."); return; }
    const apiLines = lines.filter((line) => line.paperTypeId || line.finishingServiceId || line.customUnitPrice !== undefined).map((line) => { const { key, isOther, ...apiLine } = line; void key; void isOther; return apiLine; });
    const response = await fetch("/api/jobs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderType, client: { name: clientName, phone: clientPhone }, items: apiLines, discountAmount, vatRate, notes }) });
    const result = await response.json();
    if (!response.ok) { setError(result.error ?? "Unable to create job order."); return; }
    setSubmittedJobNumber(result.jobNumber);
    setWhatsappUrl(`https://wa.me/${clientPhone.replace(/\D/g, "")}?text=${encodeURIComponent(`Hello ${clientName}, your POMS ${orderType === "ORDER" ? "order/invoice" : "quotation"} ${result.jobNumber} totals ${formatKes(quote.quote.totalAmount)}. Thank you, Aluwood Enterprises.`)}`);
  }

  if (submittedJobNumber) return <div className="mx-auto max-w-lg rounded-xl border border-emerald-200 bg-emerald-50 p-8 text-center"><h1 className="text-lg font-semibold text-emerald-800">{orderType === "ORDER" ? "Order Booked" : "Quotation Created"}</h1><p className="mt-2 text-sm text-emerald-700"><strong>{submittedJobNumber}</strong> has been saved.</p><div className="mt-6 flex flex-col gap-2"><a href={whatsappUrl} target="_blank" rel="noreferrer" className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white">Open WhatsApp message</a><Link href="/dashboard/jobs" className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white">Back to Job Orders</Link></div></div>;

  return <div className="mx-auto max-w-4xl space-y-6">
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><span className="mr-2 text-sm font-semibold text-slate-900">Booking type</span><button type="button" onClick={() => setOrderType("QUOTATION")} className={`rounded-full px-3 py-1.5 text-xs font-medium ${orderType === "QUOTATION" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"}`}>Quotation only</button><button type="button" onClick={() => setOrderType("ORDER")} className={`rounded-full px-3 py-1.5 text-xs font-medium ${orderType === "ORDER" ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-600"}`}>Book as order</button></div>
    <div><h1 className="text-xl font-semibold text-slate-900">New Job Order</h1><p className="text-sm text-slate-500">Create a quote, save the client, and serialize the job in the database.</p></div>
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-sm font-semibold text-slate-900">Client</h2><div className="mt-3 grid gap-3 sm:grid-cols-2"><div><label className="text-xs font-medium text-slate-500">Client name</label><input list="client-options" value={clientName} onChange={(event) => selectClient(event.target.value)} placeholder="Type a client name" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" /><datalist id="client-options">{clients.map((client) => <option key={client.id} value={client.name}>{client.phone}</option>)}</datalist></div><div><label className="text-xs font-medium text-slate-500">Phone number</label><input value={clientPhone} onChange={(event) => setClientPhone(event.target.value)} placeholder="07..." className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" /></div></div><p className="mt-2 text-xs text-slate-400">Selecting a known client fills their phone number. Both fields remain editable.</p></div>
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-semibold text-slate-900">Line Items</h2><button type="button" onClick={() => setLines((previous) => [...previous, emptyLine()])} className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">+ Add line</button></div><div className="space-y-3">{lines.map((line) => { const paper = catalog.paperTypes.find((item) => item.id === line.paperTypeId); const service = catalog.finishingServices.find((item) => item.id === line.finishingServiceId); const supportsDouble = paper ? paper.doubleSidePrice !== null : service ? service.doubleSidePrice !== null : true; return <div key={line.key} className="grid grid-cols-1 items-end gap-3 rounded-lg border border-slate-100 p-3 sm:grid-cols-12"><div className="sm:col-span-5"><label className="text-xs font-medium text-slate-500">Paper / Service</label><select value={line.isOther ? "other" : line.paperTypeId ?? line.finishingServiceId ?? ""} onChange={(event) => { const value = event.target.value; if (value === "other") updateLine(line.key, { paperTypeId: undefined, finishingServiceId: undefined, isOther: true, description: "", customUnitPrice: 0 }); else { const isService = value.startsWith("finishing_"); updateLine(line.key, { paperTypeId: isService ? undefined : value || undefined, finishingServiceId: isService ? value : undefined, isOther: false, description: undefined, customUnitPrice: undefined }); } }} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"><option value="">Select...</option><optgroup label="Paper">{catalog.paperTypes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</optgroup><optgroup label="Finishing">{catalog.finishingServices.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}<option value="other">Other custom service</option></optgroup></select></div>{line.isOther ? <div className="sm:col-span-3"><label className="text-xs font-medium text-slate-500">Custom description</label><input value={line.description ?? ""} onChange={(event) => updateLine(line.key, { description: event.target.value })} placeholder="e.g. Binding" className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" /></div> : null}{line.isOther ? <div className="sm:col-span-2"><label className="text-xs font-medium text-slate-500">Unit price</label><input type="number" min="0" step="0.01" value={line.customUnitPrice ?? 0} onChange={(event) => updateLine(line.key, { customUnitPrice: Number(event.target.value) })} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" /></div> : <div className="sm:col-span-3"><label className="text-xs font-medium text-slate-500">Sides</label><select value={line.sides ?? "SINGLE"} onChange={(event) => updateLine(line.key, { sides: event.target.value as SideOption })} disabled={!supportsDouble} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm disabled:bg-slate-100"><option value="SINGLE">Single</option><option value="DOUBLE" disabled={!supportsDouble}>Double</option></select></div>}<div className="sm:col-span-2"><label className="text-xs font-medium text-slate-500">Qty</label><input type="number" min="1" value={line.quantity} onChange={(event) => updateLine(line.key, { quantity: Number(event.target.value) })} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" /></div><button type="button" onClick={() => setLines((previous) => previous.length === 1 ? previous : previous.filter((item) => item.key !== line.key))} className="text-right text-xs font-medium text-red-600 hover:underline sm:col-span-2">Remove</button></div>; })}</div>{quote.error || error ? <p className="mt-3 text-sm text-red-600">{quote.error ?? error}</p> : null}</div>
    <div className="grid gap-6 lg:grid-cols-3"><div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-sm font-semibold text-slate-900">Notes</h2><textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={4} placeholder="Job instructions or delivery notes" className="mt-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" /></div><div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><label className="text-xs font-medium text-slate-500">Discount (KES)</label><input type="number" min="0" value={discountAmount} onChange={(event) => setDiscountAmount(Number(event.target.value))} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" /><label className="mt-3 block text-xs font-medium text-slate-500">VAT rate (%)</label><input type="number" min="0" value={vatRate} onChange={(event) => setVatRate(Number(event.target.value))} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" /><dl className="mt-4 space-y-2 text-sm"><div className="flex justify-between"><dt className="text-slate-500">Subtotal</dt><dd>{formatKes(quote.quote?.subtotal ?? 0)}</dd></div><div className="flex justify-between text-red-600"><dt>Discount</dt><dd>-{formatKes(quote.quote?.discountAmount ?? 0)}</dd></div><div className="flex justify-between"><dt className="text-slate-500">VAT</dt><dd>{formatKes(quote.quote?.vatAmount ?? 0)}</dd></div><div className="flex justify-between text-base font-semibold"><dt>Total</dt><dd>{formatKes(quote.quote?.totalAmount ?? 0)}</dd></div></dl><button type="button" onClick={createJob} disabled={!quote.quote} className="mt-4 w-full rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300">Create Job Order</button></div></div>
  </div>;
}
