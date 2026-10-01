"use client";

import { useState } from "react";
import { JOB_ORDER_STATUSES, type JobOrderStatus } from "@/types/poms";
import { useAuth } from "@/components/auth/AuthProvider";
import { JOB_STATUS_LABELS } from "@/lib/format";

export function JobStatusActions({ initialStatus }: { initialStatus: JobOrderStatus }) {
  const { user } = useAuth();
  const [status, setStatus] = useState(initialStatus);
  const [saved, setSaved] = useState(false);

  if (!user) return null;

  function saveStatus() {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Update Job Status</h2>
          <p className="mt-1 text-xs text-slate-500">Available to {user.role === "OWNER" ? "owners and staff" : "production staff"}.</p>
        </div>
        <div className="flex gap-2">
          <select value={status} onChange={(event) => setStatus(event.target.value as JobOrderStatus)} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
            {JOB_ORDER_STATUSES.map((option) => <option key={option} value={option}>{JOB_STATUS_LABELS[option]}</option>)}
          </select>
          <button type="button" onClick={saveStatus} className="rounded-md bg-teal-700 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-800">Save</button>
        </div>
      </div>
      {saved ? <p className="mt-3 text-xs font-medium text-emerald-700">Status updated in demo mode. Persistence will be connected to Prisma next.</p> : null}
    </div>
  );
}
