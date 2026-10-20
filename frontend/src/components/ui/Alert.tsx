import type { ReactNode } from "react";
import { cn } from "../../lib/format";

const STYLES = {
  error: "border-rose-200 bg-rose-50 text-rose-800",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  info: "border-indigo-200 bg-indigo-50 text-indigo-800",
};

interface AlertProps {
  variant?: keyof typeof STYLES;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function Alert({ variant = "error", children, action, className }: AlertProps) {
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start justify-between gap-3 rounded-lg border px-4 py-3 text-sm",
        STYLES[variant],
        className,
      )}
    >
      <div>{children}</div>
      {action}
    </div>
  );
}
