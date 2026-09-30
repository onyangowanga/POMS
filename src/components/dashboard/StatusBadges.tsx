import clsx from "@/lib/clsx";
import { JOB_STATUS_BADGE_CLASSES, JOB_STATUS_LABELS, PAYMENT_STATUS_BADGE_CLASSES } from "@/lib/format";
import type { JobOrderStatus, PaymentStatus } from "@/types/poms";

export function JobStatusBadge({ status }: { status: JobOrderStatus }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
        JOB_STATUS_BADGE_CLASSES[status],
      )}
    >
      {JOB_STATUS_LABELS[status]}
    </span>
  );
}

const PAYMENT_LABELS: Record<PaymentStatus, string> = {
  UNPAID: "Unpaid",
  PARTIAL: "Partial",
  PAID: "Paid",
};

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
        PAYMENT_STATUS_BADGE_CLASSES[status],
      )}
    >
      {PAYMENT_LABELS[status]}
    </span>
  );
}
