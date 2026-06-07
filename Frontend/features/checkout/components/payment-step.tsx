"use client";

import { useState, useEffect, useCallback } from "react";
import { loadMidtransSnap, openMidtransSnap, type SnapResult } from "@/lib/midtrans";

// ─── Types ──────────────────────────────────────────────────────────────────

interface PaymentStepProps {
  snapToken: string;
  orderId: string;
  onSuccess?: (result: SnapResult) => void;
  onPending?: (result: SnapResult) => void;
  onError?: (result: SnapResult) => void;
  onClose?: () => void;
}

type PaymentStatus = "idle" | "loading" | "paying" | "success" | "pending" | "error";

// ─── Component ──────────────────────────────────────────────────────────────

/**
 * Midtrans Snap integration — studio editorial styling.
 * Dark void background with orange accent, matching the marketplace design system.
 */
export function PaymentStep({
  snapToken,
  orderId,
  onSuccess,
  onPending,
  onError,
  onClose,
}: PaymentStepProps) {
  const [status, setStatus] = useState<PaymentStatus>("loading");
  const [loadError, setLoadError] = useState<string | null>(null);

  // Load Midtrans Snap on mount
  useEffect(() => {
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
      <div className="rounded-2xl border border-line bg-surface/50 p-8 backdrop-blur">
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent/20 border-t-accent" />
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-fg-dim">
            Memuat payment gateway…
          </p>
        </div>
      </div>
    );
  }

  // ── Success state
  if (status === "success") {
    return (
      <div className="rounded-2xl border border-success/20 bg-success/5 p-8 backdrop-blur">
        <div className="flex flex-col items-center gap-4 py-6 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-full border border-success/20 bg-success/10">
            <span className="material-symbols-outlined text-[28px] text-success">
              check_circle
            </span>
          </div>
          <h3 className="studio-display text-[20px] text-fg">
            Pembayaran Berhasil
          </h3>
          <p className="text-[13px] text-fg-muted">
            Pembayaran Anda sedang diproses. Anda akan dialihkan ke detail order.
          </p>
        </div>
      </div>
    );
  }

  // ── Pending state
  if (status === "pending") {
    return (
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-8 backdrop-blur">
        <div className="flex flex-col items-center gap-4 py-6 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-full border border-amber-500/20 bg-amber-500/10">
            <span className="material-symbols-outlined text-[28px] text-amber-400">
              schedule
            </span>
          </div>
          <h3 className="studio-display text-[20px] text-fg">
            Menunggu Konfirmasi
          </h3>
          <p className="text-[13px] text-fg-muted">
            Pembayaran sedang menunggu konfirmasi dari payment gateway.
            Cek status order Anda nanti.
          </p>
        </div>
      </div>
    );
  }

  // ── Error state (with retry)
  if (status === "error" && loadError) {
    return (
      <div className="rounded-2xl border border-error/20 bg-error/5 p-8 backdrop-blur">
        <div className="flex flex-col items-center gap-4 py-6 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-full border border-error/20 bg-error/10">
            <span className="material-symbols-outlined text-[28px] text-error">
              error
            </span>
          </div>
          <h3 className="studio-display text-[20px] text-fg">
            Pembayaran Gagal
          </h3>
          <p className="text-[13px] text-fg-muted">{loadError}</p>
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
            className="mt-2 rounded-lg border border-line px-5 py-2.5 text-[13px] font-semibold text-fg-muted transition-all hover:border-accent hover:text-accent"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  // ── Idle / ready to pay
  return (
    <div className="rounded-2xl border border-line bg-surface/50 p-8 backdrop-blur">
      <div className="flex flex-col items-center gap-6 py-4">
        {/* Payment icon */}
        <div className="relative grid h-16 w-16 place-items-center">
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background:
                "radial-gradient(50% 50% at 50% 50%, rgba(255,116,0,0.12), transparent 70%)",
            }}
          />
          <div className="relative grid h-14 w-14 place-items-center rounded-full border border-accent/20 bg-accent/5">
            <span className="material-symbols-outlined text-[28px] text-accent">
              credit_card
            </span>
          </div>
        </div>

        <div className="text-center">
          <h3 className="studio-display text-[20px] text-fg">
            Bayar via Midtrans Snap
          </h3>
          <p className="mt-2 text-[13px] text-fg-muted">
            Klik tombol di bawah untuk membuka halaman pembayaran yang aman.
          </p>
        </div>

        <button
          type="button"
          onClick={handlePay}
          disabled={status === "paying"}
          className="inline-flex items-center gap-2 rounded-lg border border-line-strong px-8 py-3 text-[13px] font-semibold text-fg transition-all hover:border-accent hover:bg-accent hover:text-accent-fg disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-line-strong disabled:hover:bg-transparent disabled:hover:text-fg"
        >
          {status === "paying" ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-fg/20 border-t-fg" />
              Membuka Pembayaran…
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[16px]">
                lock
              </span>
              Bayar Sekarang
            </>
          )}
        </button>

        <p className="text-center font-mono text-[10px] uppercase tracking-[0.14em] text-fg-dim">
          Diarahkan ke Midtrans · Pembayaran aman terenkripsi
        </p>
      </div>
    </div>
  );
}

export type { PaymentStepProps, PaymentStatus };
