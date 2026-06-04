"use client";

import { formatPrice, formatBillingCycle } from "@/lib/formatters";
import type { SpecItem } from "@/lib/formatters";

// ─── Types ──────────────────────────────────────────────────────────────────

interface ProviderSnapshot {
  name: string;
  verified: boolean;
}

interface OrderItemSnapshot {
  product_name: string;
  specs: Record<string, string | number | undefined | null>;
  billing_cycle: string;
  region: string;
  provisioning_sla?: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
}

interface OrderSummaryProps {
  provider: ProviderSnapshot;
  items: OrderItemSnapshot[];
  total: number;
  currency?: string;
}

// ─── Known spec labels ──────────────────────────────────────────────────────

const specLabels: Record<string, string> = {
  cpu: "CPU",
  vcpu: "vCPU",
  cores: "Cores",
  ram: "RAM",
  memory: "Memory",
  storage: "Storage",
  disk: "Disk",
  bandwidth: "Bandwidth",
  storage_type: "Tipe Storage",
  network: "Network",
  os: "OS",
  ip: "IP Address",
};

// ─── Component ──────────────────────────────────────────────────────────────

/**
 * Glass panel showing order details before payment.
 * Displays product snapshot, price breakdown, billing cycle, provider, and SLA.
 */
export function OrderSummary({
  provider,
  items,
  total,
  currency = "IDR",
}: OrderSummaryProps) {
  return (
    <div className="rounded-2xl border border-[rgba(255,191,0,0.08)] bg-[rgba(25,20,0,0.4)] p-8 backdrop-blur-[24px]">
      {/* Header */}
      <div className="mb-6 flex items-center gap-2">
        <svg
          className="h-5 w-5 text-[#FFBF00]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
          />
        </svg>
        <h2 className="font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-[#FFBF00]/60">
          Ringkasan Order
        </h2>
      </div>

      {/* Items */}
      <div className="space-y-6">
        {items.map((item, idx) => (
          <div key={idx}>
            {/* Product name */}
            <h3 className="text-lg font-semibold text-[#F5F5F0]">
              {item.product_name}
            </h3>

            {/* Provider badge */}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-full border border-[rgba(255,191,0,0.10)] bg-[rgba(25,20,0,0.5)] px-3 py-1 text-xs text-[#F5F5F0]/70 backdrop-blur-[12px]">
                {provider.verified && (
                  <svg
                    className="h-3 w-3 text-[#FFBF00]"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                <span>{provider.name}</span>
              </div>

              {/* Billing cycle */}
              <span className="rounded-full border border-[rgba(255,191,0,0.08)] bg-[rgba(25,20,0,0.3)] px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.15em] text-[#F5F5F0]/50">
                {formatBillingCycle(item.billing_cycle)}
              </span>

              {/* Region */}
              {item.region && (
                <span className="flex items-center gap-1 text-xs text-[#F5F5F0]/40">
                  <svg
                    className="h-3 w-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                    />
                  </svg>
                  {item.region}
                </span>
              )}

              {/* Provisioning SLA */}
              {item.provisioning_sla && (
                <span className="rounded-full border border-[rgba(255,191,0,0.08)] bg-[rgba(25,20,0,0.3)] px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.15em] text-[#FFBF00]/50">
                  SLA {item.provisioning_sla}
                </span>
              )}
            </div>

            {/* Specs grid */}
            {item.specs && Object.keys(item.specs).length > 0 && (
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {Object.entries(item.specs)
                  .filter(([, v]) => v != null && v !== "")
                  .map(([key, val]) => (
                    <div
                      key={key}
                      className="rounded-lg border border-[rgba(255,191,0,0.06)] bg-[rgba(25,20,0,0.3)] px-3 py-2"
                    >
                      <p className="font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-[#FFBF00]/50">
                        {specLabels[key] ?? key}
                      </p>
                      <p className="text-sm font-medium text-[#F5F5F0]">
                        {String(val)}
                      </p>
                    </div>
                  ))}
              </div>
            )}

            {/* Item price */}
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-[#F5F5F0]/40">
                {formatPrice(item.unit_price, currency)} &times; {item.quantity}
              </span>
              <span className="font-medium text-[#F5F5F0]">
                {formatPrice(item.subtotal, currency)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="mt-6 flex items-center justify-between border-t border-[rgba(255,191,0,0.08)] pt-4">
        <span className="font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-[#FFBF00]/60">
          Total
        </span>
        <span className="text-xl font-bold text-[#FFBF00]">
          {formatPrice(total, currency)}
        </span>
      </div>
    </div>
  );
}

export type { OrderSummaryProps, OrderItemSnapshot, ProviderSnapshot };
