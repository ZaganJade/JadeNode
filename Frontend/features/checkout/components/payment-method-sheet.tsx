"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiException } from "@/lib/api";
import { formatPrice } from "@/lib/formatters";
import { loadMidtransSnap, openMidtransSnap } from "@/lib/midtrans";

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

type Phase = "choose" | "starting" | "paying" | "success" | "pending" | "error";

/**
 * Customer Payment hub sheet: choose a method, then pay a pending Invoice.
 * Amber treatment to match the customer dashboard.
 */
export function PaymentMethodSheet({
  invoice,
  onClose,
  onPaid,
}: PaymentMethodSheetProps) {
  const [phase, setPhase] = useState<Phase>("choose");
  const [error, setError] = useState<string | null>(null);
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

  const payWithMidtrans = useCallback(async () => {
    setPhase("starting");
    setError(null);
    try {
      const res = await api.post<{ data: { snap_token: string } }>(
        `/api/v1/invoices/${invoice.public_id}/pay`,
      );
      await loadMidtransSnap();
      setPhase("paying");
      openMidtransSnap(res.data.snap_token, {
        onSuccess: () => {
          setPhase("success");
          window.setTimeout(onPaid, 1600);
        },
        onPending: () => setPhase("pending"),
        onError: () => {
          setError("Pembayaran gagal diproses oleh gateway.");
          setPhase("error");
        },
        onClose: () => setPhase("choose"),
      });
    } catch (err) {
      setError(
        err instanceof ApiException
          ? err.message
          : "Gagal memulai pembayaran. Silakan coba lagi.",
      );
      setPhase("error");
    }
  }, [invoice.public_id, onPaid]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[110] flex items-end justify-center sm:items-center"
      onKeyDown={onKeyDown}
    >
      <button
        type="button"
        aria-label="Tutup"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/70 backdrop-blur-sm motion-safe:animate-[fadeIn_180ms_ease-out]"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pay-sheet-title"
        className="relative w-full max-w-[440px] rounded-t-2xl border border-[rgba(255,191,0,0.14)] bg-[rgba(20,16,0,0.92)] p-6 backdrop-blur-[24px] motion-safe:animate-[slideInUp_240ms_cubic-bezier(0.22,1,0.36,1)] sm:rounded-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2
              id="pay-sheet-title"
              className="text-lg font-bold text-[#F5F5F0]"
            >
              Bayar Invoice
            </h2>
            <p className="mt-0.5 font-mono text-xs text-[#F5F5F0]/40">
              {invoice.invoice_number}
            </p>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="grid h-9 w-9 place-items-center rounded-md text-[#F5F5F0]/50 transition-colors hover:bg-white/5 hover:text-[#F5F5F0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFBF00]"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Amount */}
        <div className="mt-5 flex items-center justify-between rounded-xl border border-[rgba(255,191,0,0.1)] bg-[rgba(255,191,0,0.04)] px-4 py-3">
          <span className="text-xs uppercase tracking-wider text-[#F5F5F0]/50">
            Total tagihan
          </span>
          <span className="text-xl font-bold text-[#FFBF00]">
            {formatPrice(invoice.total, invoice.currency)}
          </span>
        </div>

        {/* Body by phase */}
        {phase === "success" ? (
          <div className="mt-6 flex flex-col items-center gap-3 py-4 text-center">
            <span className="material-symbols-outlined text-[44px] text-success-400">
              check_circle
            </span>
            <p className="text-sm text-[#F5F5F0]">Pembayaran berhasil!</p>
          </div>
        ) : phase === "pending" ? (
          <div className="mt-6 flex flex-col items-center gap-3 py-4 text-center">
            <span className="material-symbols-outlined text-[44px] text-amber-400">
              schedule
            </span>
            <p className="text-sm text-[#F5F5F0]">
              Menunggu konfirmasi pembayaran dari gateway.
            </p>
            <button
              type="button"
              onClick={onPaid}
              className="mt-1 rounded-full border border-[rgba(255,191,0,0.2)] px-5 py-2 text-sm text-[#F5F5F0]/70 hover:text-[#F5F5F0]"
            >
              Tutup &amp; segarkan
            </button>
          </div>
        ) : (
          <>
            <p className="mt-6 text-xs font-medium uppercase tracking-wider text-[#F5F5F0]/40">
              Pilih metode pembayaran
            </p>

            <div className="mt-3 space-y-2.5">
              {/* Midtrans */}
              <button
                type="button"
                onClick={payWithMidtrans}
                disabled={phase === "starting" || phase === "paying"}
                className="flex w-full items-center gap-3 rounded-xl border border-[rgba(255,191,0,0.14)] bg-[rgba(25,20,0,0.6)] px-4 py-3.5 text-left transition-colors hover:border-[rgba(255,191,0,0.35)] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFBF00]"
              >
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-[rgba(255,191,0,0.1)]">
                  <span className="material-symbols-outlined text-[20px] text-[#FFBF00]">
                    credit_card
                  </span>
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-semibold text-[#F5F5F0]">
                    Midtrans Snap
                  </span>
                  <span className="block text-xs text-[#F5F5F0]/40">
                    Kartu, e-wallet, VA bank
                  </span>
                </span>
                {phase === "starting" || phase === "paying" ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#FFBF00]/30 border-t-[#FFBF00]" />
                ) : (
                  <span className="material-symbols-outlined text-[18px] text-[#F5F5F0]/30">
                    chevron_right
                  </span>
                )}
              </button>

              {/* Wallet — Private Beta v1 */}
              <div
                aria-disabled="true"
                className="flex w-full items-center gap-3 rounded-xl border border-[rgba(255,191,0,0.08)] bg-[rgba(25,20,0,0.3)] px-4 py-3.5 opacity-60"
              >
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-white/[0.04]">
                  <span className="material-symbols-outlined text-[20px] text-[#F5F5F0]/40">
                    account_balance_wallet
                  </span>
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-semibold text-[#F5F5F0]/70">
                    Wallet
                  </span>
                  <span className="block text-xs text-[#F5F5F0]/40">
                    Bayar dari saldo Wallet
                  </span>
                </span>
                <span className="rounded-full border border-[rgba(255,191,0,0.2)] px-2 py-0.5 text-[10px] uppercase tracking-wider text-[#FFBF00]/70">
                  Segera
                </span>
              </div>
            </div>

            {error && (
              <p className="mt-4 flex items-center gap-2 rounded-lg border border-error-500/20 bg-error-500/5 px-3 py-2.5 text-xs text-error-400">
                <span className="material-symbols-outlined text-[16px]">
                  warning
                </span>
                {error}
              </p>
            )}

            <p className="mt-4 text-center text-[11px] text-[#F5F5F0]/30">
              Diarahkan ke Midtrans · pembayaran aman terenkripsi
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export type { PayableInvoice };
