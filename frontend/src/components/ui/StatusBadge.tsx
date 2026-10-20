import type { SubmissionStatus } from "../../api/types";
import { cn } from "../../lib/format";

const STYLES: Record<SubmissionStatus, { label: string; badge: string; dot: string }> = {
  pending: {
    label: "Pending",
    badge: "bg-amber-50 text-amber-800 ring-amber-200",
    dot: "bg-amber-500",
  },
  approved: {
    label: "Approved",
    badge: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    dot: "bg-emerald-500",
  },
  rejected: {
    label: "Rejected",
    badge: "bg-rose-50 text-rose-800 ring-rose-200",
    dot: "bg-rose-500",
  },
};

export function StatusBadge({ status }: { status: SubmissionStatus }) {
  const style = STYLES[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        style.badge,
      )}
    >
      <span className={cn("size-1.5 rounded-full", style.dot)} aria-hidden="true" />
      {style.label}
    </span>
  );
}
