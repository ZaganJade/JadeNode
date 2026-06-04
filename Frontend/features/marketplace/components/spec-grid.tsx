"use client";

import { cn } from "@/lib/utils";
import type { SpecItem } from "@/lib/formatters";

// ─── Types ──────────────────────────────────────────────────────────────────

interface SpecGridProps {
  specs: SpecItem[];
  className?: string;
}

// ─── Component ──────────────────────────────────────────────────────────────

/**
 * Glass-card grid of product specs (CPU, RAM, Storage, Bandwidth, …).
 *
 * Each item renders a mono uppercase label and value inside a dark glass
 * sub-container with amber accents.
 */
export function SpecGrid({ specs, className }: SpecGridProps) {
  if (specs.length === 0) return null;

  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-3 sm:grid-cols-4",
        className,
      )}
    >
      {specs.map((spec) => (
        <div
          key={spec.key}
          className="group relative overflow-hidden rounded-xl border border-[rgba(255,191,0,0.08)] bg-[rgba(25,20,0,0.4)] p-4 backdrop-blur-[24px] transition-colors hover:border-[rgba(255,191,0,0.18)]"
        >
          {/* Subtle top accent line */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(255,191,0,0.2)] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-[#FFBF00]/60">
            {spec.label}
          </p>
          <p className="mt-1 text-sm font-semibold text-[#F5F5F0]">
            {spec.value}
          </p>
        </div>
      ))}
    </div>
  );
}
