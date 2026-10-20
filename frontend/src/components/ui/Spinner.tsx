import { cn } from "../../lib/format";

export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn("animate-spin", className ?? "size-5")}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
      <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z" />
    </svg>
  );
}

export function PageSpinner({ label = "Loading…" }: { label?: string }) {
  return (
    <div
      className="flex min-h-[50vh] items-center justify-center gap-3 text-slate-500"
      role="status"
    >
      <Spinner />
      <span>{label}</span>
    </div>
  );
}
