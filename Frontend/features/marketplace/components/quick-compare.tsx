"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatPrice, formatBillingCycle, formatSpecs } from "@/lib/formatters";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ComparableListing {
  slug: string;
  name: string;
  provider: { name: string; verified: boolean };
  specs: Record<string, string | number | undefined | null>;
  price: number;
  billingCycle: string;
  availability: "available" | "limited" | "waitlist" | "unavailable";
}

interface QuickCompareProps {
  listings: ComparableListing[];
  className?: string;
}

// ─── Availability badge colours ─────────────────────────────────────────────

const availabilityStyles: Record<string, string> = {
  available: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  limited: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  waitlist: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  unavailable: "bg-red-500/10 text-red-400 border-red-500/20",
};

const availabilityLabels: Record<string, string> = {
  available: "Tersedia",
  limited: "Terbatas",
  waitlist: "Waitlist",
  unavailable: "Tidak Tersedia",
};

// ─── Component ──────────────────────────────────────────────────────────────

/**
 * Horizontal scrollable row of smaller product cards for Quick Compare.
 *
 * Shows key specs side by side with a "Lihat Detail" link on each card.
 */
export function QuickCompare({ listings, className }: QuickCompareProps) {
  if (listings.length === 0) return null;

  return (
    <div className={cn("space-y-4", className)}>
      <h3 className="font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-[#FFBF00]/60">
        Quick Compare
      </h3>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
        {listings.map((listing) => (
          <QuickCompareCard key={listing.slug} listing={listing} />
        ))}
      </div>
    </div>
  );
}

// ─── Card ───────────────────────────────────────────────────────────────────

function QuickCompareCard({ listing }: { listing: ComparableListing }) {
  const specItems = formatSpecs(listing.specs).slice(0, 4); // show at most 4 specs

  return (
    <Link
      href={`/marketplace/${listing.slug}`}
      className="group flex w-[260px] shrink-0 flex-col overflow-hidden rounded-xl border border-[rgba(255,191,0,0.08)] bg-[rgba(25,20,0,0.4)] backdrop-blur-[24px] transition-colors hover:border-[rgba(255,191,0,0.18)]"
    >
      {/* Top accent */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(255,191,0,0.2)] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

      <div className="flex flex-1 flex-col p-4">
        {/* Header */}
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#F5F5F0]">
              {listing.name}
            </p>
            <p className="mt-0.5 text-xs text-[#F5F5F0]/50">
              {listing.provider.name}
              {listing.provider.verified && (
                <span className="ml-1 text-[#FFBF00]">&#10003;</span>
              )}
            </p>
          </div>

          {/* Availability badge */}
          <span
            className={cn(
              "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase",
              availabilityStyles[listing.availability] ?? availabilityStyles.available,
            )}
          >
            {availabilityLabels[listing.availability] ?? listing.availability}
          </span>
        </div>

        {/* Mini spec grid */}
        <div className="grid grid-cols-2 gap-1.5">
          {specItems.map((spec) => (
            <div
              key={spec.key}
              className="rounded-lg bg-[rgba(0,0,0,0.3)] px-2 py-1.5"
            >
              <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#FFBF00]/50">
                {spec.label}
              </p>
              <p className="text-xs text-[#F5F5F0]">{spec.value}</p>
            </div>
          ))}
        </div>

        {/* Footer: price */}
        <div className="mt-3 border-t border-[rgba(255,191,0,0.06)] pt-3">
          <div className="flex items-baseline justify-between">
            <span className="text-lg font-bold text-[#F5F5F0]">
              {formatPrice(listing.price)}
            </span>
            <span className="text-[10px] text-[#F5F5F0]/40">
              {formatBillingCycle(listing.billingCycle)}
            </span>
          </div>

          <span className="mt-2 block text-center text-xs font-semibold text-[#FFBF00] opacity-0 transition-opacity group-hover:opacity-100">
            Lihat Detail →
          </span>
        </div>
      </div>
    </Link>
  );
}
