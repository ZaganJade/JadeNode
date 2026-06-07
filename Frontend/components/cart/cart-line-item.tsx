"use client";

import { useCart, unitPrice, type CartItem } from "@/lib/cart";
import { formatPrice, formatBillingCycle } from "@/lib/formatters";

const RESOURCE_ICON: Record<string, string> = {
  vps: "dns",
  dedicated: "developer_board",
  "dedicated server": "developer_board",
  storage: "database",
  network: "lan",
  gpu: "memory",
};

/** Quantity stepper used in both the drawer and the cart page. */
function QtyStepper({ item }: { item: CartItem }) {
  const { setQuantity } = useCart();
  return (
    <div className="inline-flex items-center rounded-lg border border-line bg-surface/60">
      <button
        type="button"
        aria-label={`Kurangi jumlah ${item.name}`}
        onClick={() => setQuantity(item.slug, item.quantity - 1)}
        className="grid h-8 w-8 place-items-center rounded-l-lg text-fg-muted transition-colors hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent"
      >
        <span className="material-symbols-outlined text-[16px]">remove</span>
      </button>
      <span
        aria-live="polite"
        className="grid h-8 min-w-8 place-items-center px-1 font-mono text-[12px] tabular-nums text-fg"
      >
        {item.quantity}
      </span>
      <button
        type="button"
        aria-label={`Tambah jumlah ${item.name}`}
        onClick={() => setQuantity(item.slug, item.quantity + 1)}
        className="grid h-8 w-8 place-items-center rounded-r-lg text-fg-muted transition-colors hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent"
      >
        <span className="material-symbols-outlined text-[16px]">add</span>
      </button>
    </div>
  );
}

interface CartLineItemProps {
  item: CartItem;
  /** `detailed` shows specs + per-cycle selector (cart page); `compact` for the drawer. */
  variant?: "compact" | "detailed";
}

export function CartLineItem({ item, variant = "compact" }: CartLineItemProps) {
  const { remove, setCycle } = useCart();
  const icon =
    RESOURCE_ICON[item.resource_type?.toLowerCase()] ?? "deployed_code";
  const price = unitPrice(item);
  const lineTotal = price * item.quantity;
  const canSwitchCycle = item.pricing.length > 1;

  return (
    <div className="flex gap-3 rounded-xl border border-line bg-surface/40 p-3">
      {/* Thumbnail */}
      <div className="relative grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-lg border border-line/80 bg-gradient-to-br from-white/[0.04] to-transparent">
        {item.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="material-symbols-outlined text-[24px] text-fg/60">
            {icon}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-fg">
              {item.name}
            </p>
            <p className="mt-0.5 flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.12em] text-fg-dim">
              {item.provider.name}
              {item.provider.verified && (
                <span className="material-symbols-outlined text-[12px] text-accent">
                  verified
                </span>
              )}
              <span className="text-line-strong">·</span>
              {item.region}
            </p>
          </div>
          <button
            type="button"
            aria-label={`Hapus ${item.name} dari keranjang`}
            onClick={() => remove(item.slug)}
            className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-fg-dim transition-colors hover:bg-error/10 hover:text-error focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <span className="material-symbols-outlined text-[16px]">delete</span>
          </button>
        </div>

        {/* Specs (detailed only) */}
        {variant === "detailed" && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {(["cpu", "ram", "storage"] as const).map((k) =>
              item.specs?.[k] ? (
                <span
                  key={k}
                  className="rounded-md border border-line/60 bg-surface-2 px-2 py-0.5 font-mono text-[10px] text-fg-muted"
                >
                  {k.toUpperCase()} {String(item.specs[k])}
                </span>
              ) : null,
            )}
          </div>
        )}

        {/* Cycle */}
        <div className="mt-2">
          {canSwitchCycle ? (
            <div
              role="radiogroup"
              aria-label={`Billing cycle untuk ${item.name}`}
              className="inline-flex gap-1"
            >
              {item.pricing.map((p) => {
                const active = p.cycle === item.cycle;
                return (
                  <button
                    key={p.cycle}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setCycle(item.slug, p.cycle)}
                    className={`rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
                      active
                        ? "border-accent/50 bg-accent/10 text-accent"
                        : "border-line text-fg-muted hover:text-fg"
                    }`}
                  >
                    {formatBillingCycle(p.cycle)}
                  </button>
                );
              })}
            </div>
          ) : (
            <span className="rounded-md border border-line/60 bg-surface/30 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-fg-dim">
              {formatBillingCycle(item.cycle)}
            </span>
          )}
        </div>

        {/* Qty + price */}
        <div className="mt-3 flex items-center justify-between">
          <QtyStepper item={item} />
          <div className="text-right">
            <p className="font-mono text-[13px] font-semibold tabular-nums text-fg">
              {formatPrice(lineTotal, item.currency)}
            </p>
            {item.quantity > 1 && (
              <p className="font-mono text-[10px] text-fg-dim">
                {formatPrice(price, item.currency)} × {item.quantity}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
