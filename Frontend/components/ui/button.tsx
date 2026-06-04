"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = {
  primary:
    "bg-gradient-to-r from-amber-brand to-amber-brand-dark text-[#0D0B00] font-bold hover:brightness-110 focus-visible:ring-amber-brand shadow-glow",
  secondary:
    "bg-surface-glass text-foreground backdrop-blur-xl border border-surface-glass-border hover:border-amber-glow focus-visible:ring-amber-brand",
  outline:
    "border border-amber-brand/30 bg-transparent text-amber-brand hover:bg-amber-brand/10 focus-visible:ring-amber-brand",
  ghost:
    "text-foreground/70 hover:bg-foreground/5 hover:text-foreground focus-visible:ring-foreground-muted",
  danger:
    "bg-error-600 text-white hover:bg-error-700 focus-visible:ring-error-500",
};

const buttonSizes = {
  sm: "h-8 px-3 text-xs rounded-md",
  md: "h-10 px-4 text-sm rounded-lg",
  lg: "h-12 px-6 text-base rounded-xl",
};

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
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D0B00] disabled:pointer-events-none disabled:opacity-50",
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
