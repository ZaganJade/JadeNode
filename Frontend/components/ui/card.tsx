"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { useCallback } from "react";
import { cn } from "@/lib/utils";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  interactive?: boolean;
}

function Card({ className, children, interactive = false, ...props }: CardProps) {
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!interactive) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      e.currentTarget.style.setProperty("--mouse-x", `${x}%`);
      e.currentTarget.style.setProperty("--mouse-y", `${y}%`);
    },
    [interactive],
  );

  return (
    <div
      onMouseMove={handleMouseMove}
      className={cn(
        "rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)]/60 backdrop-blur-xl",
        interactive &&
          "transition-colors hover:border-[var(--color-line-strong)]",
        "p-8",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("border-b border-[var(--color-line)] px-6 py-4", className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-6 py-4", className)} {...props} />;
}

function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("border-t border-[var(--color-line)] px-6 py-4", className)}
      {...props}
    />
  );
}

export { Card, CardContent, CardFooter, CardHeader };
