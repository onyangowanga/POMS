import type { JobOrderStatus, PaymentStatus } from "@/types/poms";

export const JOB_STATUS_LABELS: Record<JobOrderStatus, string> = {
  QUOTATION: "Quotation",
  PENDING_DEPOSIT: "Pending Deposit",
  IN_PRODUCTION: "In Production",
  READY_FOR_COLLECTION: "Ready for Collection",
  DELIVERED: "Delivered",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export const JOB_STATUS_BADGE_CLASSES: Record<JobOrderStatus, string> = {
  QUOTATION: "bg-slate-100 text-slate-700 ring-slate-300",
  PENDING_DEPOSIT: "bg-amber-100 text-amber-800 ring-amber-300",
  IN_PRODUCTION: "bg-blue-100 text-blue-800 ring-blue-300",
  READY_FOR_COLLECTION: "bg-purple-100 text-purple-800 ring-purple-300",
  DELIVERED: "bg-teal-100 text-teal-800 ring-teal-300",
  COMPLETED: "bg-emerald-100 text-emerald-800 ring-emerald-300",
  CANCELLED: "bg-red-100 text-red-800 ring-red-300",
};

export const PAYMENT_STATUS_BADGE_CLASSES: Record<PaymentStatus, string> = {
  UNPAID: "bg-red-100 text-red-800 ring-red-300",
  PARTIAL: "bg-amber-100 text-amber-800 ring-amber-300",
  PAID: "bg-emerald-100 text-emerald-800 ring-emerald-300",
};

export function formatKes(amount: number): string {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}
