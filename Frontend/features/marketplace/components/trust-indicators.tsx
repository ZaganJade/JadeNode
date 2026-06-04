"use client";

import { cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────────────────────────

interface TrustItem {
  icon: "verified" | "clock" | "shield";
  label: string;
  value: string;
}

interface TrustIndicatorsProps {
  providerVerified?: boolean;
  provisioningSla?: string;
  supportTarget?: string;
  className?: string;
}

// ─── Icons (inline SVG to avoid extra dependencies) ─────────────────────────

function VerifiedIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="#FFBF00" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="#FFBF00" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="#FFBF00" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286zm0 13.036h.008v.008h-.008v-.008z" />
    </svg>
  );
}

const iconMap: Record<TrustItem["icon"], () => React.ReactElement> = {
  verified: VerifiedIcon,
  clock: ClockIcon,
  shield: ShieldIcon,
};

// ─── Component ──────────────────────────────────────────────────────────────

/**
 * Row of trust-indicator glass cards: verified provider, SLA, support.
 */
export function TrustIndicators({
  providerVerified = true,
  provisioningSla,
  supportTarget,
  className,
}: TrustIndicatorsProps) {
  const items: TrustItem[] = [
    {
      icon: "verified",
      label: "Provider Terverifikasi",
      value: providerVerified ? "Identitas dan infrastruktur terverifikasi" : "Belum terverifikasi",
    },
    {
      icon: "clock",
      label: "Provisioning SLA",
      value: provisioningSla ?? "SLA belum ditentukan",
    },
    {
      icon: "shield",
      label: "SLA Terjamin",
      value: supportTarget ?? "Target support belum ditentukan",
    },
  ];

  return (
    <div className={cn("grid grid-cols-1 gap-3 sm:grid-cols-3", className)}>
      {items.map((item) => {
        const Icon = iconMap[item.icon];
        return (
          <div
            key={item.icon}
            className="group relative overflow-hidden rounded-xl border border-[rgba(255,191,0,0.08)] bg-[rgba(25,20,0,0.4)] p-5 backdrop-blur-[24px] transition-colors hover:border-[rgba(255,191,0,0.18)]"
          >
            {/* Top accent */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(255,191,0,0.2)] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[rgba(255,191,0,0.08)]">
                <Icon />
              </div>
              <div className="min-w-0">
                <p className="font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-[#FFBF00]/60">
                  {item.label}
                </p>
                <p className="mt-1 text-sm text-[#F5F5F0]">{item.value}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
