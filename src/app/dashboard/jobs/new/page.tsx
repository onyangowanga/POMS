"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { calculateQuote, PriceCalculationError } from "@/lib/services/priceCalculator";
import { DEMO_CLIENTS, DEMO_FINISHING_SERVICES, DEMO_JOB_ORDERS, DEMO_PAPER_TYPES } from "@/lib/sample-data";
import { formatKes } from "@/lib/format";
import type { PriceLineRequest, SideOption } from "@/types/poms";

type DraftLine = PriceLineRequest & { key: string };

const NEXT_JOB_NUMBER = `POMS-ALU-${1001 + DEMO_JOB_ORDERS.length}`;

function emptyLine(): DraftLine {
  return { key: crypto.randomUUID(), quantity: 1, sides: "SINGLE" };
}

export default function NewJobOrderPage() {
  const [clientId, setClientId] = useState(DEMO_CLIENTS[0]?.id ?? "");
  const [vatRate, setVatRate] = useState(0);
  const [lines, setLines] = useState<DraftLine[]>([emptyLine()]);
  const [submitted, setSubmitted] = useState(false);

  const catalog = useMemo(
    () => ({ paperTypes: DEMO_PAPER_TYPES, finishingServices: DEMO_FINISHING_SERVICES }),
    [],
  );

  const { quote, error } = useMemo(() => {
    const validLines = lines.filter((line) => line.paperTypeId || line.finishingServiceId);
    if (validLines.length === 0) {
      return { quote: null, error: null };
    }
    try {
      return { quote: calculateQuote({ lines: validLines, vatRate }, catalog), error: null };
    } catch (err) {
      const message = err instanceof PriceCalculationError ? err.message : "Unable to calculate quote";
      return { quote: null, error: message };
    }
  }, [lines, vatRate, catalog]);

  function updateLine(key: string, patch: Partial<DraftLine>) {
    setLines((prev) => prev.map((line) => (line.key === key ? { ...line, ...patch } : line)));
  }

  function removeLine(key: string) {
    setLines((prev) => (prev.length === 1 ? prev : prev.filter((line) => line.key !== key)));
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-lg rounded-xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <h1 className="text-lg font-semibold text-emerald-800">Job Order Created</h1>
        <p className="mt-2 text-sm text-emerald-700">
          <strong>{NEXT_JOB_NUMBER}</strong> has been saved as a Quotation and is ready for deposit.
        </p>
        <p className="mt-4 text-xs text-emerald-600">
          This is a UI preview — connect the job order API route + Prisma to persist this for real.
        </p>
        <Link href="/dashboard/jobs" className="mt-6 inline-block rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">
          Back to Job Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">New Job Order</h1>
        <p className="text-sm text-slate-500">
          Next job number: <span className="font-mono font-medium text-slate-700">{NEXT_JOB_NUMBER}</span>
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <label className="block text-sm font-medium text-slate-700">Client</label>
        <select
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          className="mt-1 w-full max-w-sm rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          {DEMO_CLIENTS.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name} · {client.phone}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Line Items</h2>
          <button
            type="button"
            onClick={() => setLines((prev) => [...prev, emptyLine()])}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            + Add line
          </button>
        </div>

        <div className="space-y-3">
          {lines.map((line) => {
            const paper = DEMO_PAPER_TYPES.find((p) => p.id === line.paperTypeId);
            const service = DEMO_FINISHING_SERVICES.find((s) => s.id === line.finishingServiceId);
            const supportsDouble = paper ? paper.doubleSidePrice !== null : service ? service.doubleSidePrice !== null : true;

            return (
              <div key={line.key} className="grid grid-cols-12 items-end gap-2 rounded-lg border border-slate-100 p-3">
                <div className="col-span-5">
                  <label className="block text-xs font-medium text-slate-500">Paper / Service</label>
                  <select
                    value={line.paperTypeId ?? line.finishingServiceId ?? ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      const isFinishing = value.startsWith("finishing_");
                      updateLine(line.key, {
                        paperTypeId: isFinishing ? undefined : value || undefined,
                        finishingServiceId: isFinishing ? value : undefined,
                      });
                    }}
                    className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                  >
                    <option value="">Select...</option>
                    <optgroup label="Paper">
                      {DEMO_PAPER_TYPES.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Finishing">
                      {DEMO_FINISHING_SERVICES.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                <div className="col-span-3">
                  <label className="block text-xs font-medium text-slate-500">Sides</label>
                  <select
                    value={line.sides ?? "SINGLE"}
                    onChange={(e) => updateLine(line.key, { sides: e.target.value as SideOption })}
                    disabled={!supportsDouble}
                    className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm disabled:bg-slate-100"
                  >
                    <option value="SINGLE">Single</option>
                    <option value="DOUBLE" disabled={!supportsDouble}>
                      Double
                    </option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-500">Qty</label>
                  <input
                    type="number"
                    min={1}
                    value={line.quantity}
                    onChange={(e) => updateLine(line.key, { quantity: Number(e.target.value) })}
                    className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                  />
                </div>

                <div className="col-span-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeLine(line.key)}
                    className="text-xs font-medium text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Preview</h2>
          {quote && quote.lines.length > 0 ? (
            <table className="mt-3 w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="py-1">Item</th>
                  <th className="py-1 text-right">Qty</th>
                  <th className="py-1 text-right">Unit</th>
                  <th className="py-1 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {quote.lines.map((line, idx) => (
                  <tr key={idx}>
                    <td className="py-2">{line.description}</td>
                    <td className="py-2 text-right">{line.quantity}</td>
                    <td className="py-2 text-right">{formatKes(line.unitPrice)}</td>
                    <td className="py-2 text-right font-medium">{formatKes(line.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="mt-3 text-sm text-slate-400">Add a line item to see pricing.</p>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <label className="block text-xs font-medium text-slate-500">VAT rate (%)</label>
          <input
            type="number"
            min={0}
            max={100}
            value={vatRate}
            onChange={(e) => setVatRate(Number(e.target.value))}
            className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          />
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Subtotal</dt>
              <dd>{formatKes(quote?.subtotal ?? 0)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">VAT</dt>
              <dd>{formatKes(quote?.vatAmount ?? 0)}</dd>
            </div>
            <div className="flex justify-between text-base font-semibold">
              <dt>Total</dt>
              <dd>{formatKes(quote?.totalAmount ?? 0)}</dd>
            </div>
          </dl>
          <button
            type="button"
            disabled={!quote || quote.lines.length === 0}
            onClick={() => setSubmitted(true)}
            className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Create Job Order
          </button>
        </div>
      </div>
    </div>
  );
}
