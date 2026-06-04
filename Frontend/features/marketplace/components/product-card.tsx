"use client";

import { useRef, useCallback, type MouseEvent } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatPrice, formatBillingCycle, formatSpecs } from "@/lib/formatters";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ProductCardListing {
  slug: string;
  name: string;
  resourceType: string;
  provider: { name: string; verified: boolean };
  region: string;
  specs: Record<string, string | number | undefined | null>;
  price: number;
  billingCycle: string;
  availability: "available" | "limited" | "waitlist" | "unavailable";
  provisioningSla?: string;
}

interface ProductCardProps {
  listing: ProductCardListing;
  className?: string;
}

// ─── Availability badge ─────────────────────────────────────────────────────

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
 * Reusable product card with glass panel and interactive spotlight hover.
 *
 * Shows: name, provider, specs grid, price, availability badge, SLA badge.
 * Primary CTA: "Lihat Detail". Secondary: "Bandingkan".
 * Responsive: full-width on mobile, auto on desktop.
 */
export function ProductCard({ listing, className }: ProductCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const specItems = formatSpecs(listing.specs).slice(0, 4);

  // ── Interactive spotlight ────────────────────────────────────────────────
  const handleMouseMove = useCallback((e: MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    el.style.setProperty("--spotlight-x", `${x}px`);
    el.style.setProperty("--spotlight-y", `${y}px`);
  }, []);

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-[rgba(255,191,0,0.08)] bg-[rgba(25,20,0,0.4)] backdrop-blur-[24px] transition-colors hover:border-[rgba(255,191,0,0.18)]",
        "w-full",
        className,
      )}
    >
      {/* Spotlight overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(400px circle at var(--spotlight-x, 50%) var(--spotlight-y, 50%), rgba(255,191,0,0.06), transparent 60%)",
        }}
      />

      {/* Top accent line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(255,191,0,0.2)] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

      <div className="relative flex flex-col p-8">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-lg font-semibold text-[#F5F5F0]">
                {listing.name}
              </h3>
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs text-[#F5F5F0]/50">
              <span>{listing.provider.name}</span>
              {listing.provider.verified && (
                <span className="inline-flex items-center gap-0.5 text-[#FFBF00]">
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-mono text-[9px] uppercase tracking-[0.15em]">Verified</span>
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-[#F5F5F0]/40">{listing.region}</p>
          </div>

          {/* Availability */}
          <span
            className={cn(
              "shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase",
              availabilityStyles[listing.availability] ?? availabilityStyles.available,
            )}
          >
            {availabilityLabels[listing.availability] ?? listing.availability}
          </span>
        </div>

        {/* SLA badge */}
        {listing.provisioningSla && (
          <div className="mb-4 inline-flex self-start items-center gap-1.5 rounded-full border border-[rgba(255,191,0,0.12)] bg-[rgba(255,191,0,0.06)] px-2.5 py-0.5">
            <svg className="h-3 w-3 text-[#FFBF00]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-mono text-[9px] font-medium uppercase tracking-[0.12em] text-[#FFBF00]">
              SLA {listing.provisioningSla}
            </span>
          </div>
        )}

        {/* Spec grid */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {specItems.map((spec) => (
            <div
              key={spec.key}
              className="rounded-lg bg-[rgba(0,0,0,0.3)] px-3 py-2"
            >
              <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#FFBF00]/50">
                {spec.label}
              </p>
              <p className="mt-0.5 text-sm font-semibold text-[#F5F5F0]">
                {spec.value}
              </p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-between border-t border-[rgba(255,191,0,0.06)] pt-5">
          <div>
            <span className="text-xl font-bold text-[#F5F5F0]">
              {formatPrice(listing.price)}
            </span>
            <span className="ml-2 text-xs text-[#F5F5F0]/40">
              {formatBillingCycle(listing.billingCycle)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/marketplace/${listing.slug}`}
              className="inline-flex items-center gap-1 rounded-full bg-[#FFBF00] px-4 py-2 text-xs font-semibold text-[#0D0B00] shadow-[0_0_20px_rgba(255,191,0,0.25)] transition-shadow hover:shadow-[0_0_30px_rgba(255,191,0,0.4)]"
            >
              Lihat Detail
            </Link>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-full border border-[rgba(255,191,0,0.12)] bg-[rgba(25,20,0,0.6)] px-3 py-2 text-xs font-medium text-[#F5F5F0]/60 transition-colors hover:border-[rgba(255,191,0,0.3)] hover:text-[#F5F5F0]"
            >
              Bandingkan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
