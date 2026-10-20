import type { SubmissionStatus } from "../api/types";
import { cn } from "../lib/format";

export type StatusFilterValue = SubmissionStatus | "all";

const OPTIONS: Array<{ value: StatusFilterValue; label: string }> = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

export function StatusFilter({
  value,
  onChange,
}: {
  value: StatusFilterValue;
  onChange: (value: StatusFilterValue) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Filter by status"
      className="inline-flex rounded-lg bg-slate-100 p-1"
    >
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-md px-3 py-1 text-sm font-medium transition-colors",
            value === option.value
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
