import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const badgeVariants = {
  default: "bg-surface-glass text-foreground border border-surface-glass-border",
  available:
    "bg-success-500/15 text-success-400 border border-success-500/25",
  limited:
    "bg-amber-500/15 text-amber-400 border border-amber-500/25",
  waitlist:
    "bg-info-500/15 text-info-400 border border-info-500/25",
  unavailable:
    "bg-error-500/15 text-error-400 border border-error-500/25",
  success: "bg-success-500/15 text-success-400 border border-success-500/25",
  warning: "bg-warning-500/15 text-warning-400 border border-warning-500/25",
  error: "bg-error-500/15 text-error-400 border border-error-500/25",
  info: "bg-info-500/15 text-info-400 border border-info-500/25",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: keyof typeof badgeVariants;
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-2xs font-semibold uppercase tracking-wider font-mono",
        badgeVariants[variant],
        className,
      )}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
export type { BadgeProps };
