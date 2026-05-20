import type { ReactNode } from "react";

export function Field({
  label,
  htmlFor,
  error,
  hint,
  required = false,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string | undefined;
  hint?: string | undefined;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-sentinela-ink">
        {label}
        {required ? <span className="ml-1 text-red-600">*</span> : null}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      {!error && hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}
