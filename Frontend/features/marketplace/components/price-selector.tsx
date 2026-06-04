"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { formatPrice, formatBillingCycle } from "@/lib/formatters";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface PricingOption {
  cycle: "monthly" | "yearly";
  price: number; // minor units (IDR cents)
}

interface PriceSelectorProps {
  pricing: PricingOption[];
  className?: string;
  /** Called when user switches billing cycle */
  onCycleChange?: (cycle: "monthly" | "yearly") => void;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function yearlySavingsPercent(monthly: number, yearly: number): number | null {
  if (monthly <= 0) return null;
  const annualMonthly = monthly * 12;
  const saved = annualMonthly - yearly;
  if (saved <= 0) return null;
  return Math.round((saved / annualMonthly) * 100);
}

// ─── Component ──────────────────────────────────────────────────────────────

/**
 * Monthly/yearly toggle with IDR price display and savings indicator.
 */
export function PriceSelector({
  pricing,
  className,
  onCycleChange,
}: PriceSelectorProps) {
  const [activeCycle, setActiveCycle] = useState<"monthly" | "yearly">(() => {
    if (pricing.some((p) => p.cycle === "monthly")) return "monthly";
    return pricing[0]?.cycle ?? "monthly";
  });

  const current = pricing.find((p) => p.cycle === activeCycle);
  const monthly = pricing.find((p) => p.cycle === "monthly");
  const yearly = pricing.find((p) => p.cycle === "yearly");

  const savings =
    monthly && yearly ? yearlySavingsPercent(monthly.price, yearly.price) : null;

  function handleToggle(cycle: "monthly" | "yearly") {
    setActiveCycle(cycle);
    onCycleChange?.(cycle);
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Toggle */}
      {pricing.length > 1 && (
        <div className="inline-flex items-center gap-1 rounded-full border border-[rgba(255,191,0,0.12)] bg-[rgba(25,20,0,0.4)] p-1 backdrop-blur-[24px]">
          {(["monthly", "yearly"] as const).map((cycle) => {
            const available = pricing.some((p) => p.cycle === cycle);
            if (!available) return null;

            const isActive = activeCycle === cycle;
            return (
              <button
                key={cycle}
                type="button"
                onClick={() => handleToggle(cycle)}
                disabled={!available}
                className={cn(
                  "rounded-full px-4 py-1.5 text-xs font-semibold transition-all",
                  isActive
                    ? "bg-[#FFBF00] text-[#0D0B00] shadow-[0_0_16px_rgba(255,191,0,0.3)]"
                    : "text-[#F5F5F0]/60 hover:text-[#F5F5F0]",
                )}
              >
                {formatBillingCycle(cycle)}
              </button>
            );
          })}
        </div>
      )}

      {/* Price display */}
      <div className="flex items-baseline gap-2">
        {current && (
          <>
            <span className="text-3xl font-bold text-[#F5F5F0]">
              {formatPrice(current.price)}
            </span>
            <span className="text-sm text-[#F5F5F0]/50">
              {formatBillingCycle(current.cycle)}
            </span>
          </>
        )}
      </div>

      {/* Savings indicator */}
      {activeCycle === "yearly" && savings != null && savings > 0 && (
        <div className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(255,191,0,0.15)] bg-[rgba(255,191,0,0.08)] px-3 py-1">
          <svg
            className="h-3.5 w-3.5 text-[#FFBF00]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
            />
          </svg>
          <span className="text-xs font-medium text-[#FFBF00]">
            Hemat {savings}% dibanding bulanan
          </span>
        </div>
      )}

      {/* Renewal note */}
      <p className="text-xs text-[#F5F5F0]/40">
        Harga belum termasuk PPN. Perpanjangan otomatis dikenakan harga yang sama.
      </p>
    </div>
  );
}
