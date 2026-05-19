import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, invalid = false, ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        "w-full h-10 rounded-md border bg-white px-3 text-sm",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-sentinela-gold",
        "disabled:bg-slate-50 disabled:text-slate-500",
        invalid ? "border-red-500" : "border-slate-300",
        className,
      )}
      {...rest}
    />
  );
});
