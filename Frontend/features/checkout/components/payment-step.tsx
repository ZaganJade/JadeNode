"use client";

import { useState, useEffect, useCallback } from "react";
import { loadMidtransSnap, openMidtransSnap, type SnapResult } from "@/lib/midtrans";

// ─── Types ──────────────────────────────────────────────────────────────────

interface PaymentStepProps {
  /** Snap token from backend POST /v1/orders/{id}/pay */
  snapToken: string;
  /** Order public ID for redirection */
  orderId: string;
  /** Called when payment succeeds */
  onSuccess?: (result: SnapResult) => void;
  /** Called when payment is pending */
  onPending?: (result: SnapResult) => void;
  /** Called when payment errors */
  onError?: (result: SnapResult) => void;
  /** Called when user closes popup without paying */
  onClose?: () => void;
}

type PaymentStatus = "idle" | "loading" | "paying" | "success" | "pending" | "error";

// ─── Component ──────────────────────────────────────────────────────────────

/**
 * Midtrans Snap integration component.
 *
 * Loads snap.js from CDN and opens the Snap popup when the customer
 * clicks the pay button. Handles success/pending/error/close callbacks
 * with appropriate UI state.
 */
export function PaymentStep({
  snapToken,
  orderId,
  onSuccess,
  onPending,
  onError,
  onClose,
}: PaymentStepProps) {
  const [status, setStatus] = useState<PaymentStatus>("idle");
  const [loadError, setLoadError] = useState<string | null>(null);

  // Load Midtrans Snap on mount
  useEffect(() => {
    setStatus("loading");
    loadMidtransSnap()
      .then(() => setStatus("idle"))
      .catch((err) => {
        setLoadError(err instanceof Error ? err.message : "Gagal memuat Midtrans Snap.");
        setStatus("error");
      });
  }, []);

  const handlePay = useCallback(() => {
    setStatus("paying");
    try {
      openMidtransSnap(snapToken, {
        onSuccess: (result) => {
          setStatus("success");
          onSuccess?.(result);
        },
        onPending: (result) => {
          setStatus("pending");
          onPending?.(result);
        },
        onError: (result) => {
          setStatus("error");
          onError?.(result);
        },
        onClose: () => {
          setStatus("idle");
          onClose?.();
        },
      });
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Gagal membuka Midtrans Snap.");
      setStatus("error");
    }
  }, [snapToken, onSuccess, onPending, onError, onClose]);

  // ── Loading state
  if (status === "loading") {
    return (
      <div className="rounded-2xl border border-[rgba(255,191,0,0.08)] bg-[rgba(25,20,0,0.4)] p-8 backdrop-blur-[24px]">
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#FFBF00]/20 border-t-[#FFBF00]" />
          <p className="text-sm text-[#F5F5F0]/50">
            Memuat payment gateway...
          </p>
        </div>
      </div>
    );
  }

  // ── Success state
  if (status === "success") {
    return (
      <div className="rounded-2xl border border-success-500/20 bg-success-500/5 p-8 backdrop-blur-[24px]">
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success-500/10">
            <svg className="h-8 w-8 text-success-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-[#F5F5F0]">
            Pembayaran Berhasil
          </h3>
          <p className="text-sm text-[#F5F5F0]/50">
            Pembayaran Anda sedang diproses. Anda akan dialihkan ke detail order.
          </p>
        </div>
      </div>
    );
  }

  // ── Pending state
  if (status === "pending") {
    return (
      <div className="rounded-2xl border border-warning-500/20 bg-warning-500/5 p-8 backdrop-blur-[24px]">
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-warning-500/10">
            <svg className="h-8 w-8 text-warning-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-[#F5F5F0]">
            Pembayaran Menunggu Konfirmasi
          </h3>
          <p className="text-sm text-[#F5F5F0]/50">
            Pembayaran Anda sedang menunggu konfirmasi dari payment gateway.
            Silakan cek status order Anda nanti.
          </p>
        </div>
      </div>
    );
  }

  // ── Error state (with retry)
  if (status === "error" && loadError) {
    return (
      <div className="rounded-2xl border border-error-500/20 bg-error-500/5 p-8 backdrop-blur-[24px]">
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-error-500/10">
            <svg className="h-8 w-8 text-error-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-[#F5F5F0]">
            Pembayaran Gagal
          </h3>
          <p className="text-sm text-[#F5F5F0]/50">{loadError}</p>
          <button
            type="button"
            onClick={() => {
              setLoadError(null);
              setStatus("loading");
              loadMidtransSnap()
                .then(() => setStatus("idle"))
                .catch((err) => {
                  setLoadError(err instanceof Error ? err.message : "Gagal memuat Midtrans Snap.");
                  setStatus("error");
                });
            }}
            className="mt-2 rounded-full border border-[rgba(255,191,0,0.12)] bg-[rgba(25,20,0,0.6)] px-6 py-2.5 text-sm font-medium text-[#F5F5F0]/60 transition-colors hover:border-[rgba(255,191,0,0.3)] hover:text-[#F5F5F0]"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  // ── Idle / ready to pay
  return (
    <div className="rounded-2xl border border-[rgba(255,191,0,0.08)] bg-[rgba(25,20,0,0.4)] p-8 backdrop-blur-[24px]">
      <div className="flex flex-col items-center gap-6 py-4">
        {/* Payment icon */}
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(255,191,0,0.08)]">
          <svg
            className="h-8 w-8 text-[#FFBF00]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"
            />
          </svg>
        </div>

        <div className="text-center">
          <h3 className="text-lg font-semibold text-[#F5F5F0]">
            Bayar via Midtrans Snap
          </h3>
          <p className="mt-1 text-sm text-[#F5F5F0]/50">
            Klik tombol di bawah untuk membuka halaman pembayaran yang aman.
          </p>
        </div>

        <button
          type="button"
          onClick={handlePay}
          disabled={status === "paying"}
          className="inline-flex items-center rounded-full bg-[#FFBF00] px-8 py-3 text-sm font-semibold text-[#0D0B00] shadow-[0_0_20px_rgba(255,191,0,0.25)] transition-all hover:shadow-[0_0_30px_rgba(255,191,0,0.4)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === "paying" ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-[#0D0B00]/20 border-t-[#0D0B00]" />
              Membuka Pembayaran...
            </>
          ) : (
            "Bayar Sekarang"
          )}
        </button>

        <p className="text-center text-xs text-[#F5F5F0]/30">
          Anda akan diarahkan ke halaman pembayaran Midtrans yang aman.
        </p>
      </div>
    </div>
  );
}

export type { PaymentStepProps, PaymentStatus };
