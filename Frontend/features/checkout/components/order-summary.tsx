"use client";

import { formatPrice, formatBillingCycle } from "@/lib/formatters";

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
 * Studio-styled order summary panel.
 * Matches the marketplace's editorial dark + orange accent design.
 */
export function OrderSummary({
  provider,
  items,
  total,
  currency = "IDR",
}: OrderSummaryProps) {
  return (
    <div className="rounded-2xl border border-line bg-surface/50 p-6 backdrop-blur sm:p-8">
      {/* Header */}
      <div className="mb-6 flex items-center gap-2.5">
        <div className="grid h-8 w-8 place-items-center rounded-lg border border-line/80 bg-surface-2">
          <span className="material-symbols-outlined text-[16px] text-accent">
            receipt_long
          </span>
        </div>
        <h2 className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-fg-dim">
          Ringkasan Order
        </h2>
      </div>

      {/* Items */}
      <div className="space-y-6">
        {items.map((item, idx) => (
          <div key={idx}>
            {/* Product name */}
            <h3 className="text-[18px] font-bold text-fg">
              {item.product_name}
            </h3>

            {/* Meta badges */}
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              {/* Provider */}
              <div className="flex items-center gap-1.5 rounded-md border border-line/80 bg-surface/50 px-2.5 py-1 text-[11px] text-fg-muted">
                {provider.verified && (
                  <span className="material-symbols-outlined text-[13px] text-accent">
                    verified
                  </span>
                )}
                <span>{provider.name}</span>
              </div>

              {/* Billing cycle */}
              <span className="rounded-md border border-line/60 bg-surface/30 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-fg-dim">
                {formatBillingCycle(item.billing_cycle)}
              </span>

              {/* Region */}
              {item.region && (
                <span className="flex items-center gap-1 text-[11px] text-fg-dim">
                  <span className="material-symbols-outlined text-[13px]">
                    location_on
                  </span>
                  {item.region}
                </span>
              )}

              {/* Provisioning SLA */}
              {item.provisioning_sla && (
                <span className="rounded-md border border-accent/20 bg-accent/5 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-accent/70">
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
                      className="rounded-lg border border-line/60 bg-surface-2 px-3 py-2"
                    >
                      <p className="font-mono text-[9px] font-medium uppercase tracking-[0.16em] text-fg-dim">
                        {specLabels[key] ?? key}
                      </p>
                      <p className="mt-0.5 text-[13px] font-semibold text-fg">
                        {String(val)}
                      </p>
                    </div>
                  ))}
              </div>
            )}

            {/* Item price */}
            <div className="mt-3 flex items-center justify-between font-mono text-[12px]">
              <span className="text-fg-dim">
                {formatPrice(item.unit_price, currency)} &times; {item.quantity}
              </span>
              <span className="font-semibold text-fg">
                {formatPrice(item.subtotal, currency)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="mt-6 flex items-center justify-between border-t border-line pt-5">
        <span className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-fg-dim">
          Total
        </span>
        <span className="studio-display text-[28px] text-accent">
          {formatPrice(total, currency)}
        </span>
      </div>
    </div>
  );
}

export type { OrderSummaryProps, OrderItemSnapshot, ProviderSnapshot };
