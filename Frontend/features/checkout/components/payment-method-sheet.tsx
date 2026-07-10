"use client";

import { useEffect, useRef } from "react";
import { formatPrice } from "@/lib/formatters";
import { DemoPayment } from "@/features/checkout/components/demo-payment";

interface PayableInvoice {
  public_id: string;
  invoice_number: string;
  total: number;
  currency: string;
}

interface PaymentMethodSheetProps {
  invoice: PayableInvoice;
  onClose: () => void;
  onPaid: () => void;
}

/**
 * Customer payment sheet — wraps the DemoPayment component in a modal.
 *
 * Demo mode: no real payment gateway is used. The DemoPayment component
 * simulates a digital payment flow (e-wallet / VA / card) and calls
 * `onPaid` on success. This keeps the invoice/order UX complete for the
 * portfolio build without requiring a backend payment integration.
 */
export function PaymentMethodSheet({
  invoice,
  onClose,
  onPaid,
}: PaymentMethodSheetProps) {
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const id = window.setTimeout(() => closeBtnRef.current?.focus(), 20);
    return () => {
      document.body.style.overflow = prev;
      window.clearTimeout(id);
    };
  }, []);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[110] flex items-end justify-center overflow-y-auto sm:items-center sm:p-4"
      onKeyDown={onKeyDown}
    >
      <button
        type="button"
        aria-label="Tutup"
        onClick={onClose}
        className="fixed inset-0 cursor-default bg-black/70 backdrop-blur-sm"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pay-sheet-title"
        className="relative my-auto w-full max-w-[480px] rounded-t-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-6 backdrop-blur-[24px] sm:rounded-2xl"
      >
        {/* Header */}
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2
              id="pay-sheet-title"
              className="text-lg font-bold text-[var(--color-fg)]"
            >
              Bayar Invoice
            </h2>
            <p className="mt-0.5 font-mono text-xs text-[var(--color-fg-dim)]">
              {invoice.invoice_number} ·{" "}
              {formatPrice(invoice.total, invoice.currency)}
            </p>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="grid h-9 w-9 place-items-center rounded-md text-[var(--color-fg-muted)] transition-colors hover:bg-white/5 hover:text-[var(--color-fg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
          >
            <span
              className="material-symbols-outlined text-[20px]"
              style={{ fontVariationSettings: '"FILL" 0, "wght" 300' }}
            >
              close
            </span>
          </button>
        </div>

        {/* Demo payment body */}
        <DemoPayment
          orderId={invoice.public_id}
          total={invoice.total}
          currency={invoice.currency}
          onSuccess={() => {
            onPaid();
          }}
          onPending={() => {
            onPaid();
          }}
          onError={() => {}}
        />
      </div>
    </div>
  );
}

export type { PayableInvoice };
