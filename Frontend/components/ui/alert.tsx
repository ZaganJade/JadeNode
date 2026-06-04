import type { HTMLAttributes, ReactNode } from "react";
import { AlertCircle, CheckCircle2, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const alertVariants = {
  info: {
    container: "bg-primary-50 border-primary-200 text-primary-800",
    icon: "text-primary-500",
  },
  success: {
    container: "bg-success-50 border-success-500/20 text-success-700",
    icon: "text-success-500",
  },
  warning: {
    container: "bg-warning-50 border-warning-500/20 text-warning-600",
    icon: "text-warning-500",
  },
  error: {
    container: "bg-error-50 border-error-500/20 text-error-700",
    icon: "text-error-500",
  },
};

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
      <span className={cn("shrink-0 mt-0.5", alertVariants[variant].icon)}>
        {alertIcons[variant]}
      </span>
      <div className="flex-1">{children}</div>
    </div>
  );
}

export { Alert, alertVariants };
export type { AlertProps };
