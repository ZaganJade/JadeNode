import type { HTMLAttributes, ReactNode } from "react";
import { AlertCircle, CheckCircle2, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const alertVariants = {
  info: {
    container:
      "bg-[var(--color-steel)]/[0.08] border-[var(--color-steel)]/20 text-[var(--color-steel)]",
    icon: "text-[var(--color-steel)]",
  },
  success: {
    container:
      "bg-[var(--color-success)]/[0.08] border-[var(--color-success)]/20 text-[var(--color-success)]",
    icon: "text-[var(--color-success)]",
  },
  warning: {
    container:
      "bg-[var(--color-amber)]/[0.08] border-[var(--color-amber)]/20 text-[var(--color-amber)]",
    icon: "text-[var(--color-amber)]",
  },
  error: {
    container:
      "bg-[var(--color-error)]/[0.08] border-[var(--color-error)]/20 text-[var(--color-error)]",
    icon: "text-[var(--color-error)]",
  },
} as const;

const alertIcons: Record<keyof typeof alertVariants, ReactNode> = {
  info: <Info className="h-4 w-4" />,
  success: <CheckCircle2 className="h-4 w-4" />,
  warning: <AlertTriangle className="h-4 w-4" />,
  error: <AlertCircle className="h-4 w-4" />,
};

interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: keyof typeof alertVariants;
}

function Alert({ className, variant = "info", children, ...props }: AlertProps) {
  return (
    <div
      className={cn(
        "flex gap-3 rounded-lg border p-4 text-sm",
        alertVariants[variant].container,
        className,
      )}
      role="alert"
      {...props}
    >
      <span className={cn("mt-0.5 shrink-0", alertVariants[variant].icon)}>
        {alertIcons[variant]}
      </span>
      <div className="flex-1">{children}</div>
    </div>
  );
}

export { Alert, alertVariants };
export type { AlertProps };
