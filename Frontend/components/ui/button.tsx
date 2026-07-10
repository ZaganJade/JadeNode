"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = {
  primary:
    "bg-[var(--color-accent)] text-[var(--color-accent-fg)] font-semibold hover:brightness-110 focus-visible:ring-[var(--color-accent)]",
  secondary:
    "bg-[var(--color-surface-3)] text-[var(--color-fg)] border border-[var(--color-line)] hover:border-[var(--color-line-strong)] focus-visible:ring-[var(--color-line-strong)]",
  outline:
    "border border-[var(--color-accent)]/30 bg-transparent text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10 focus-visible:ring-[var(--color-accent)]",
  ghost:
    "text-[var(--color-fg-muted)] hover:bg-white/[0.04] hover:text-[var(--color-fg)] focus-visible:ring-[var(--color-line-strong)]",
  danger:
    "bg-[var(--color-error)] text-[#1c0a0a] font-semibold hover:brightness-110 focus-visible:ring-[var(--color-error)]",
} as const;

const buttonSizes = {
  sm: "h-8 px-3 text-xs rounded-md",
  md: "h-10 px-4 text-sm rounded-lg",
  lg: "h-12 px-6 text-base rounded-xl",
} as const;

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof buttonVariants;
  size?: keyof typeof buttonSizes;
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      type = "button",
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)] disabled:pointer-events-none disabled:opacity-50",
          buttonVariants[variant],
          buttonSizes[size],
          className,
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";

export { Button, buttonVariants, buttonSizes };
export type { ButtonProps };
