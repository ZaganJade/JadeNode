"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={id}
            className="block text-[13px] font-medium text-[var(--color-fg-muted)]"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            "block w-full rounded-lg border bg-[var(--color-surface-2)] px-3 py-2.5 text-sm text-[var(--color-fg)] transition-colors placeholder:text-[var(--color-fg-dim)] focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50",
            error
              ? "border-[var(--color-error)]/50 focus:border-[var(--color-error)] focus:ring-[var(--color-error)]/15"
              : "border-[var(--color-line)] focus:border-[var(--color-accent)]/50 focus:ring-[var(--color-accent)]/15",
            className,
          )}
          aria-invalid={error ? true : undefined}
          aria-describedby={
            error && id ? `${id}-error` : hint && id ? `${id}-hint` : undefined
          }
          {...props}
        />
        {hint && !error && (
          <p
            id={id ? `${id}-hint` : undefined}
            className="text-xs text-[var(--color-fg-dim)]"
          >
            {hint}
          </p>
        )}
        {error && (
          <p
            id={id ? `${id}-error` : undefined}
            className="text-xs text-[var(--color-error)]"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

export { Input };
export type { InputProps };
