import {
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";
import { cn } from "../../lib/format";

const CONTROL =
  "block w-full rounded-lg border-0 bg-white px-3 py-2 text-sm text-slate-900 ring-1 ring-inset " +
  "placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-600 focus:outline-none " +
  "disabled:bg-slate-50 disabled:text-slate-500";

interface FieldShellProps {
  id: string;
  label: string;
  error?: string;
  hint?: ReactNode;
  children: ReactNode;
}

function FieldShell({ id, label, error, hint, children }: FieldShellProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-message`} className="mt-1.5 text-sm text-rose-600">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-message`} className="mt-1.5 text-xs text-slate-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function controlProps(id: string, error?: string, hint?: ReactNode) {
  return {
    id,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error || hint ? `${id}-message` : undefined,
    className: cn(CONTROL, error ? "ring-rose-400" : "ring-slate-300"),
  };
}

type Common = { label: string; error?: string; hint?: ReactNode };

export function TextField({
  label,
  error,
  hint,
  ...props
}: Common & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} error={error} hint={hint}>
      <input {...props} {...controlProps(id, error, hint)} />
    </FieldShell>
  );
}

export function TextAreaField({
  label,
  error,
  hint,
  ...props
}: Common & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} error={error} hint={hint}>
      <textarea rows={4} {...props} {...controlProps(id, error, hint)} />
    </FieldShell>
  );
}
