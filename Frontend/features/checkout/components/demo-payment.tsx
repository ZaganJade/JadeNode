"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────────────────────────

type PaymentMethodId =
  | "gopay"
  | "ovo"
  | "dana"
  | "shopeepay"
  | "virtual_account"
  | "credit_card";

interface DemoPaymentProps {
  orderId: string;
  total: number;
  currency?: string;
  onSuccess: () => void;
  onPending: () => void;
  onError: () => void;
}

type Phase = "choose" | "processing" | "success" | "pending" | "error";

// ─── Payment Methods Config ─────────────────────────────────────────────────

interface PaymentMethodConfig {
  id: PaymentMethodId;
  name: string;
  category: string;
  icon: string;
  description: string;
  color: string;
  estimatedTime: string;
}

const PAYMENT_METHODS: PaymentMethodConfig[] = [
  {
    id: "gopay",
    name: "GoPay",
    category: "E-Wallet",
    icon: "account_balance_wallet",
    description: "Bayar dengan saldo GoPay atau GoPayLater",
    color: "#00AED6",
    estimatedTime: "Instan",
  },
  {
    id: "ovo",
    name: "OVO",
    category: "E-Wallet",
    icon: "account_balance_wallet",
    description: "Bayar dengan saldo OVO",
    color: "#4C3494",
    estimatedTime: "Instan",
  },
  {
    id: "dana",
    name: "DANA",
    category: "E-Wallet",
    icon: "account_balance_wallet",
    description: "Bayar dengan saldo DANA",
    color: "#118EEA",
    estimatedTime: "Instan",
  },
  {
    id: "shopeepay",
    name: "ShopeePay",
    category: "E-Wallet",
    icon: "account_balance_wallet",
    description: "Bayar dengan saldo ShopeePay",
    color: "#EE4D2D",
    estimatedTime: "Instan",
  },
  {
    id: "virtual_account",
    name: "Virtual Account",
    category: "Bank Transfer",
    icon: "account_balance",
    description: "Transfer via VA BCA, BNI, Mandiri, BRI",
    color: "#0060AF",
    estimatedTime: "1-5 menit",
  },
  {
    id: "credit_card",
    name: "Kartu Kredit / Debit",
    category: "Kartu",
    icon: "credit_card",
    description: "Visa, Mastercard, JCB",
    color: "#1A1F71",
    estimatedTime: "Instan",
  },
];

// ─── Format helpers ─────────────────────────────────────────────────────────

function formatDemoAmount(amount: number, currency: string): string {
  if (currency === "IDR") {
    return `Rp ${new Intl.NumberFormat("id-ID").format(amount)}`;
  }
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
  }).format(amount);
}

function generateVirtualAccount(): string {
  const prefix = "8860";
  const random = Array.from({ length: 12 }, () =>
    Math.floor(Math.random() * 10),
  ).join("");
  return prefix + random;
}

// ─── Component ──────────────────────────────────────────────────────────────

/**
 * Demo Payment Gateway — simulates payment flow with multiple digital methods.
 * This is a DEMO only — no real payment gateway is used.
 * Will be replaced with Midtrans integration in production.
 */
export function DemoPayment({
  orderId,
  total,
  currency = "IDR",
  onSuccess,
  onPending,
  onError,
}: DemoPaymentProps) {
  const [phase, setPhase] = useState<Phase>("choose");
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodId | null>(
    null,
  );
  const [vaNumber, setVaNumber] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState<string>("Semua");

  const categories = [
    "Semua",
    ...Array.from(new Set(PAYMENT_METHODS.map((m) => m.category))),
  ];

  const filteredMethods =
    categoryFilter === "Semua"
      ? PAYMENT_METHODS
      : PAYMENT_METHODS.filter((m) => m.category === categoryFilter);

  const selectedConfig = PAYMENT_METHODS.find((m) => m.id === selectedMethod);

  // ── Simulate payment ──────────────────────────────────────────────────
  const handlePay = useCallback(() => {
    if (!selectedMethod) return;

    setPhase("processing");

    // For VA, show a pending state with VA number
    if (selectedMethod === "virtual_account") {
      const va = generateVirtualAccount();
      setVaNumber(va);

      // Simulate waiting then auto-success
      let seconds = 8;
      setCountdown(seconds);
      const interval = setInterval(() => {
        seconds--;
        setCountdown(seconds);
        if (seconds <= 0) {
          clearInterval(interval);
          setPhase("success");
          setTimeout(onSuccess, 1500);
        }
      }, 1000);
    } else {
      // E-wallet & card: simulate 2-3 second processing then success
      const delay = 2000 + Math.random() * 1500;
      setTimeout(() => {
        // 90% success, 8% pending, 2% error (for demo realism)
        const rand = Math.random();
        if (rand < 0.9) {
          setPhase("success");
          setTimeout(onSuccess, 1500);
        } else if (rand < 0.98) {
          setPhase("pending");
          setTimeout(onPending, 2000);
        } else {
          setPhase("error");
          onError();
        }
      }, delay);
    }
  }, [selectedMethod, onSuccess, onPending, onError]);

  const handleRetry = () => {
    setPhase("choose");
    setSelectedMethod(null);
    setVaNumber(null);
    setCountdown(0);
  };

  // ── Copy VA number ────────────────────────────────────────────────────
  const copyVaNumber = () => {
    if (vaNumber) {
      navigator.clipboard.writeText(vaNumber).catch(() => {});
    }
  };

  // ── Render phases ─────────────────────────────────────────────────────

  // SUCCESS
  if (phase === "success") {
    return (
      <div className="rounded-2xl border border-[rgba(108,232,166,0.2)] bg-[rgba(108,232,166,0.04)] p-8 backdrop-blur">
        <div className="flex flex-col items-center gap-4 py-6 text-center">
          <div className="relative grid h-20 w-20 place-items-center">
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background:
                  "radial-gradient(50% 50% at 50% 50%, rgba(108,232,166,0.2), transparent 70%)",
              }}
            />
            <div className="relative grid h-16 w-16 place-items-center rounded-full border border-[rgba(108,232,166,0.25)] bg-[rgba(108,232,166,0.1)]">
              <span
                className="material-symbols-outlined text-[32px]"
                style={{ color: "#6CE8A6", fontVariationSettings: '"FILL" 1' }}
              >
                check_circle
              </span>
            </div>
          </div>
          <h3 className="studio-display text-[22px] text-[var(--color-fg)]">
            Pembayaran Berhasil!
          </h3>
          <p className="text-[13px] text-[var(--color-fg-muted)]">
            Pembayaran {selectedConfig?.name ?? ""} Anda telah berhasil
            diproses.
          </p>
          <div className="mt-2 rounded-lg border border-[rgba(108,232,166,0.15)] bg-black/30 px-4 py-2">
            <span className="font-mono text-[11px] text-[var(--color-fg-dim)]">
              Order #{orderId}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // PENDING
  if (phase === "pending") {
    return (
      <div className="rounded-2xl border border-[rgba(245,179,71,0.2)] bg-[rgba(245,179,71,0.04)] p-8 backdrop-blur">
        <div className="flex flex-col items-center gap-4 py-6 text-center">
          <div className="relative grid h-20 w-20 place-items-center">
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background:
                  "radial-gradient(50% 50% at 50% 50%, rgba(245,179,71,0.2), transparent 70%)",
              }}
            />
            <div className="relative grid h-16 w-16 place-items-center rounded-full border border-[rgba(245,179,71,0.25)] bg-[rgba(245,179,71,0.1)]">
              <span
                className="material-symbols-outlined text-[32px] text-[#F5B347]"
                style={{ fontVariationSettings: '"FILL" 1' }}
              >
                schedule
              </span>
            </div>
          </div>
          <h3 className="studio-display text-[22px] text-[var(--color-fg)]">
            Menunggu Konfirmasi
          </h3>
          <p className="text-[13px] text-[var(--color-fg-muted)]">
            Pembayaran {selectedConfig?.name ?? ""} sedang menunggu konfirmasi.
            Silakan cek status order Anda nanti.
          </p>
        </div>
      </div>
    );
  }

  // ERROR
  if (phase === "error") {
    return (
      <div className="rounded-2xl border border-[rgba(255,122,122,0.2)] bg-[rgba(255,122,122,0.04)] p-8 backdrop-blur">
        <div className="flex flex-col items-center gap-4 py-6 text-center">
          <div className="relative grid h-20 w-20 place-items-center">
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background:
                  "radial-gradient(50% 50% at 50% 50%, rgba(255,122,122,0.2), transparent 70%)",
              }}
            />
            <div className="relative grid h-16 w-16 place-items-center rounded-full border border-[rgba(255,122,122,0.25)] bg-[rgba(255,122,122,0.1)]">
              <span
                className="material-symbols-outlined text-[32px]"
                style={{ color: "#FF7A7A", fontVariationSettings: '"FILL" 1' }}
              >
                error
              </span>
            </div>
          </div>
          <h3 className="studio-display text-[22px] text-[var(--color-fg)]">
            Pembayaran Gagal
          </h3>
          <p className="text-[13px] text-[var(--color-fg-muted)]">
            Terjadi kesalahan saat memproses pembayaran. Silakan coba lagi.
          </p>
          <button
            type="button"
            onClick={handleRetry}
            className="mt-2 rounded-lg border border-[var(--color-line)] px-6 py-2.5 text-[13px] font-semibold text-[var(--color-fg-muted)] transition-all hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  // PROCESSING
  if (phase === "processing") {
    return (
      <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)]/50 p-8 backdrop-blur">
        <div className="flex flex-col items-center gap-5 py-6 text-center">
          {/* Spinner */}
          <div className="relative grid h-20 w-20 place-items-center">
            <div className="absolute inset-0 rounded-full border-2 border-[var(--color-line)]" />
            <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-[var(--color-accent)]" />
            <span
              className="material-symbols-outlined relative text-[28px]"
              style={{ color: selectedConfig?.color ?? "var(--color-accent)" }}
            >
              {selectedConfig?.icon ?? "payment"}
            </span>
          </div>

          <h3 className="studio-display text-[20px] text-[var(--color-fg)]">
            Memproses Pembayaran...
          </h3>

          {selectedMethod === "virtual_account" && vaNumber ? (
            // VA pending state
            <div className="w-full space-y-4">
              <div className="rounded-xl border border-[rgba(0,96,175,0.2)] bg-[rgba(0,96,175,0.06)] p-5">
                <p className="studio-eyebrow text-[8px] uppercase tracking-wider text-[var(--color-fg-dim)]">
                  Nomor Virtual Account
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="font-mono text-[20px] font-bold tracking-wider text-[var(--color-fg)]">
                    {vaNumber}
                  </span>
                  <button
                    type="button"
                    onClick={copyVaNumber}
                    className="flex items-center gap-1.5 rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-[11px] text-[var(--color-fg-muted)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      content_copy
                    </span>
                    Salin
                  </button>
                </div>
                <p className="mt-2 text-[11px] text-[var(--color-fg-dim)]">
                  Transfer {formatDemoAmount(total, currency)} ke nomor VA di
                  atas
                </p>
              </div>

              {/* Countdown */}
              <div className="flex flex-col items-center gap-2">
                <p className="text-[12px] text-[var(--color-fg-muted)]">
                  Menunggu pembayaran...
                </p>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-32 overflow-hidden rounded-full bg-[var(--color-line)]">
                    <div
                      className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-1000"
                      style={{
                        width: `${((8 - countdown) / 8) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="font-mono text-[11px] text-[var(--color-fg-dim)]">
                    {countdown}s
                  </span>
                </div>
                <p className="text-[10px] text-[var(--color-fg-dim)] italic">
                  *Demo: pembayaran akan otomatis berhasil
                </p>
              </div>
            </div>
          ) : (
            // E-wallet / card processing
            <div className="flex flex-col items-center gap-2">
              <p className="text-[13px] text-[var(--color-fg-muted)]">
                Menghubungkan ke {selectedConfig?.name ?? "payment gateway"}...
              </p>
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-accent)]" />
                <div
                  className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-accent)]"
                  style={{ animationDelay: "0.2s" }}
                />
                <div
                  className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-accent)]"
                  style={{ animationDelay: "0.4s" }}
                />
              </div>
              <p className="text-[10px] text-[var(--color-fg-dim)] italic">
                *Demo: simulasi pembayaran digital
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // CHOOSE METHOD (default)
  return (
    <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)]/50 p-6 backdrop-blur sm:p-8">
      {/* Header */}
      <div className="mb-6 flex items-center gap-2.5">
        <div className="grid h-8 w-8 place-items-center rounded-lg border border-[var(--color-line)]/80 bg-[var(--color-surface-2)]">
          <span
            className="material-symbols-outlined text-[16px] text-[var(--color-accent)]"
            style={{ fontVariationSettings: '"FILL" 0, "wght" 300' }}
          >
            payments
          </span>
        </div>
        <div>
          <h2 className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--color-fg-dim)]">
            Pilih Metode Pembayaran
          </h2>
        </div>
      </div>

      {/* Amount display */}
      <div className="mb-5 flex items-center justify-between rounded-xl border border-[var(--color-line)] bg-black/30 px-4 py-3">
        <span className="text-[11px] uppercase tracking-wider text-[var(--color-fg-dim)]">
          Total Pembayaran
        </span>
        <span className="studio-display text-[22px] text-[var(--color-accent)]">
          {formatDemoAmount(total, currency)}
        </span>
      </div>

      {/* Category tabs */}
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategoryFilter(cat)}
            className={cn(
              "shrink-0 rounded-lg border px-3 py-1.5 text-[11px] font-medium transition-all",
              categoryFilter === cat
                ? "border-[var(--color-accent)]/50 bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                : "border-[var(--color-line)] text-[var(--color-fg-muted)] hover:border-[var(--color-fg-dim)]/30 hover:text-[var(--color-fg)]",
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Payment method cards */}
      <div className="space-y-2.5">
        {filteredMethods.map((method) => {
          const isSelected = selectedMethod === method.id;
          return (
            <button
              key={method.id}
              type="button"
              onClick={() => setSelectedMethod(method.id)}
              className={cn(
                "group flex w-full items-center gap-3.5 rounded-xl border px-4 py-3.5 text-left transition-all duration-200",
                isSelected
                  ? "border-[var(--color-accent)]/50 bg-[var(--color-accent)]/8"
                  : "border-[var(--color-line)] bg-transparent hover:border-[var(--color-fg-dim)]/25 hover:bg-white/[0.02]",
              )}
            >
              {/* Icon */}
              <div
                className="grid h-10 w-10 shrink-0 place-items-center rounded-lg"
                style={{
                  backgroundColor: `${method.color}15`,
                  border: `1px solid ${method.color}30`,
                }}
              >
                <span
                  className="material-symbols-outlined text-[20px]"
                  style={{
                    color: method.color,
                    fontVariationSettings: '"FILL" 0, "wght" 300',
                  }}
                >
                  {method.icon}
                </span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "text-[14px] font-semibold transition-colors",
                      isSelected
                        ? "text-[var(--color-fg)]"
                        : "text-[var(--color-fg)] group-hover:text-[var(--color-fg)]",
                    )}
                  >
                    {method.name}
                  </span>
                  <span className="rounded-full border border-[var(--color-line)]/60 px-2 py-0.5 text-[9px] uppercase tracking-wider text-[var(--color-fg-dim)]">
                    {method.category}
                  </span>
                </div>
                <p className="mt-0.5 text-[12px] text-[var(--color-fg-muted)]">
                  {method.description}
                </p>
              </div>

              {/* Right side */}
              <div className="flex shrink-0 flex-col items-end gap-1">
                {method.estimatedTime && (
                  <span className="text-[10px] text-[var(--color-fg-dim)]">
                    {method.estimatedTime}
                  </span>
                )}
                {/* Radio indicator */}
                <span
                  className={cn(
                    "grid h-4 w-4 place-items-center rounded-full border transition-all",
                    isSelected
                      ? "border-[var(--color-accent)] bg-[var(--color-accent)]"
                      : "border-[var(--color-fg-dim)]/40",
                  )}
                >
                  {isSelected && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent-fg)]" />
                  )}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Pay button */}
      <button
        type="button"
        onClick={handlePay}
        disabled={!selectedMethod}
        className={cn(
          "mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl text-[14px] font-semibold transition-all",
          selectedMethod
            ? "bg-[var(--color-accent)] text-[var(--color-accent-fg)] hover:brightness-110"
            : "cursor-not-allowed border border-[var(--color-line)] text-[var(--color-fg-dim)]",
        )}
      >
        {selectedMethod ? (
          <>
            <span
              className="material-symbols-outlined text-[18px]"
              style={{ fontVariationSettings: '"FILL" 0, "wght" 300' }}
            >
              lock
            </span>
            Bayar dengan {selectedConfig?.name}
          </>
        ) : (
          "Pilih metode pembayaran"
        )}
      </button>

      {/* Demo notice */}
      <div className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-[rgba(245,179,71,0.15)] bg-[rgba(245,179,71,0.04)] px-3 py-2">
        <span
          className="material-symbols-outlined text-[14px] text-[#F5B347]"
          style={{ fontVariationSettings: '"FILL" 1' }}
        >
          info
        </span>
        <p className="text-[11px] text-[var(--color-fg-dim)]">
          <span className="font-medium text-[#F5B347]">Demo Mode</span> — Ini
          adalah simulasi pembayaran. Integrasi Midtrans akan digunakan di
          production.
        </p>
      </div>

      {/* Security badges */}
      <div className="mt-4 flex items-center justify-center gap-4">
        {["verified_user", "encrypted", "shield"].map((icon) => (
          <div
            key={icon}
            className="flex items-center gap-1 text-[10px] text-[var(--color-fg-dim)]"
          >
            <span
              className="material-symbols-outlined text-[13px] text-[var(--color-success)]"
              style={{ fontVariationSettings: '"FILL" 0, "wght" 300' }}
            >
              {icon}
            </span>
            {icon === "verified_user"
              ? "Aman"
              : icon === "encrypted"
                ? "Terenkripsi"
                : "Terproteksi"}
          </div>
        ))}
      </div>
    </div>
  );
}

export type { DemoPaymentProps, PaymentMethodId };
