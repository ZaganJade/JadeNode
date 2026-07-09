"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StudioNav } from "@/components/landing/studio/studio-nav";
import { ScrollRail } from "@/components/landing/studio/scroll-rail";
import { DemoPayment } from "@/features/checkout/components/demo-payment";
import { api, ApiException } from "@/lib/api";
import { formatPrice, formatBillingCycle } from "@/lib/formatters";
import { useCart, unitPrice } from "@/lib/cart";

// ─── Types ──────────────────────────────────────────────────────────────────

interface AuthState {
  authenticated: boolean;
  emailVerified: boolean;
  betaAccess: "none" | "pending" | "approved" | "rejected";
  loading: boolean;
}

interface CreatedOrder {
  id: number;
  public_id: string;
}

type Step = "review" | "payment" | "success";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="studio-eyebrow text-accent">{children}</p>;
}

function StepIndicator({ step }: { step: Step }) {
  const steps = [
    { key: "review", label: "01", text: "Review" },
    { key: "payment", label: "02", text: "Pembayaran" },
    { key: "success", label: "03", text: "Selesai" },
  ] as const;
  const currentIndex = steps.findIndex((s) => s.key === step);

  return (
    <div className="flex items-center gap-0">
      {steps.map((s, i) => {
        const isActive = s.key === step;
        const isCompleted = i < currentIndex;
        return (
          <div key={s.key} className="flex items-center">
            <div className="flex items-center gap-2.5">
              <div
                className={`grid h-8 w-8 place-items-center rounded-lg border text-[11px] font-mono font-semibold transition-all duration-500 ${
                  isCompleted
                    ? "border-accent/40 bg-accent/10 text-accent"
                    : isActive
                      ? "border-accent/60 bg-accent text-accent-fg"
                      : "border-line text-fg-dim"
                }`}
              >
                {isCompleted ? (
                  <span className="material-symbols-outlined text-[14px]">
                    check
                  </span>
                ) : (
                  s.label
                )}
              </div>
              <span
                className={`hidden text-[12px] font-medium sm:block ${
                  isActive
                    ? "text-fg"
                    : isCompleted
                      ? "text-fg-muted"
                      : "text-fg-dim"
                }`}
              >
                {s.text}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`mx-3 h-px w-8 transition-colors duration-500 sm:w-12 ${
                  i < currentIndex ? "bg-accent/40" : "bg-line"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function CartCheckoutPage() {
  const { items, subtotal, count, clear, ready } = useCart();
  const router = useRouter();

  const [auth, setAuth] = useState<AuthState>({
    authenticated: false,
    emailVerified: false,
    betaAccess: "none",
    loading: true,
  });
  const [step, setStep] = useState<Step>("review");
  const [order, setOrder] = useState<CreatedOrder | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const idempotencyKey = useRef<string>(
    `cart-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  );

  // ── Auth state ──────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function loadAuth() {
      try {
        const session = await api.get<{
          user: { email_verified_at: string | null } | null;
          capabilities: string[];
          authenticated: boolean;
        }>("/api/v1/auth/user");
        if (cancelled) return;

        const authenticated = session.authenticated && session.user != null;
        const emailVerified = session.user?.email_verified_at != null;
        const hasBeta = session.capabilities?.includes("beta_access") ?? false;
        let betaAccess: AuthState["betaAccess"] = hasBeta ? "approved" : "none";

        if (authenticated && !hasBeta) {
          try {
            const betaStatus = await api.get<{
              status: "none" | "pending" | "approved" | "rejected";
            }>("/api/v1/beta-access/status");
            betaAccess = betaStatus.status;
          } catch {
            /* keep default */
          }
        }

        if (!cancelled)
          setAuth({ authenticated, emailVerified, betaAccess, loading: false });
      } catch {
        if (!cancelled)
          setAuth({
            authenticated: false,
            emailVerified: false,
            betaAccess: "none",
            loading: false,
          });
      }
    }
    loadAuth();
    return () => {
      cancelled = true;
    };
  }, []);

  const summaryItems = useMemo(
    () =>
      items.map((it) => ({
        ...it,
        price: unitPrice(it),
        lineTotal: unitPrice(it) * it.quantity,
      })),
    [items],
  );

  // ── Create order + snap token ───────────────────────────────────────────
  const handleCheckout = useCallback(async () => {
    if (items.length === 0 || submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await api.post<{
        order: { id: number; public_id: string };
      }>("/api/v1/cart/checkout", {
        idempotency_key: idempotencyKey.current,
        items: items.map((it) => ({
          product_slug: it.slug,
          billing_cycle: it.cycle,
          quantity: it.quantity,
        })),
      });

      const created = { id: res.order.id, public_id: res.order.public_id };
      setOrder(created);

      // Demo: skip real payment gateway, show demo payment UI
      setShowPayment(true);
      setStep("payment");
    } catch (err) {
      setError(
        err instanceof ApiException
          ? err.message
          : "Gagal memproses checkout. Silakan coba lagi.",
      );
    } finally {
      setSubmitting(false);
    }
  }, [items, submitting]);

  const handlePaymentSuccess = useCallback(() => {
    setStep("success");
    clear();
    if (order) {
      setTimeout(() => router.push(`/orders/${order.public_id}`), 2200);
    }
  }, [order, router, clear]);

  const handlePaymentPending = useCallback(() => {
    clear();
    if (order) {
      setTimeout(() => router.push(`/orders/${order.public_id}`), 2600);
    }
  }, [order, router, clear]);

  // ── Shell ───────────────────────────────────────────────────────────────
  const shell = (children: React.ReactNode) => (
    <main className="studio relative min-h-screen overflow-x-hidden">
      <ScrollRail />
      <StudioNav />
      <div className="relative mx-auto max-w-[820px] px-6 pt-28 pb-24 sm:px-8">
        {children}
      </div>
    </main>
  );

  // ── Empty cart (only matters before an order is created) ──────────────────
  if (ready && items.length === 0 && step !== "success") {
    return shell(
      <div className="studio-card rounded-2xl border border-line bg-surface/50 p-12 text-center backdrop-blur">
        <span className="material-symbols-outlined mb-4 block text-[64px] text-fg-dim">
          remove_shopping_cart
        </span>
        <h1 className="studio-display text-[26px] text-fg">
          Keranjang kosong
        </h1>
        <p className="mt-3 text-[14px] text-fg-muted">
          Tambahkan listing ke keranjang sebelum melanjutkan ke pembayaran.
        </p>
        <Link
          href="/marketplace"
          className="mt-6 inline-flex items-center gap-2 rounded-lg border border-line-strong px-5 py-2.5 text-[13px] font-semibold text-fg transition-all hover:border-accent hover:bg-accent hover:text-accent-fg"
        >
          <span className="material-symbols-outlined text-[16px]">storefront</span>
          Jelajahi Marketplace
        </Link>
      </div>,
    );
  }

  // ── Access gate ───────────────────────────────────────────────────────────
  const canCheckout =
    auth.authenticated && auth.emailVerified && auth.betaAccess === "approved";

  if (!auth.loading && !canCheckout && step === "review") {
    return shell(
      <div className="studio-card rounded-2xl border border-line bg-surface/50 p-10 text-center backdrop-blur">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-xl border border-line bg-surface-2">
          <span className="material-symbols-outlined text-[28px] text-accent">
            lock
          </span>
        </div>
        <h2 className="studio-display mt-6 text-[24px] text-fg">
          Checkout Membutuhkan Akses
        </h2>
        {!auth.authenticated ? (
          <>
            <p className="mt-3 text-[14px] text-fg-muted">
              Silakan login atau daftar terlebih dahulu untuk checkout
              keranjang.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-lg border border-line-strong px-5 py-2.5 text-[13px] font-semibold text-fg transition-all hover:border-accent hover:bg-accent hover:text-accent-fg"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-lg border border-line px-5 py-2.5 text-[13px] font-semibold text-fg-muted transition-all hover:border-accent/50 hover:text-fg"
              >
                Daftar
              </Link>
            </div>
          </>
        ) : !auth.emailVerified ? (
          <p className="mt-3 text-[14px] text-fg-muted">
            Verifikasi email kamu terlebih dahulu sebelum checkout.
          </p>
        ) : auth.betaAccess === "pending" ? (
          <p className="mt-3 text-[14px] text-fg-muted">
            Permintaan Beta Access sedang direview. Tunggu persetujuan sebelum
            checkout.
          </p>
        ) : (
          <>
            <p className="mt-3 text-[14px] text-fg-muted">
              Selama private beta, kamu perlu Beta Access untuk checkout.
            </p>
            <Link
              href="/beta-access"
              className="mt-6 inline-flex items-center gap-2 rounded-lg border border-line-strong px-5 py-2.5 text-[13px] font-semibold text-fg transition-all hover:border-accent hover:bg-accent hover:text-accent-fg"
            >
              Ajukan Beta Access
            </Link>
          </>
        )}
        <Link
          href="/cart"
          className="mt-6 block font-mono text-[11px] uppercase tracking-[0.14em] text-fg-dim transition-colors hover:text-accent"
        >
          ← Kembali ke keranjang
        </Link>
      </div>,
    );
  }

  // ── Success ───────────────────────────────────────────────────────────────
  if (step === "success") {
    return shell(
      <div className="studio-card rounded-2xl border border-success/20 bg-surface/50 p-10 text-center backdrop-blur">
        <div className="relative mx-auto grid h-20 w-20 place-items-center">
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background:
                "radial-gradient(50% 50% at 50% 50%, rgba(108,232,166,0.15), transparent 70%)",
            }}
          />
          <div className="relative grid h-16 w-16 place-items-center rounded-full border border-success/20 bg-success/10">
            <span className="material-symbols-outlined text-[32px] text-success">
              check_circle
            </span>
          </div>
        </div>
        <h2 className="studio-display mt-6 text-[28px] text-fg">
          Order Berhasil Dibuat!
        </h2>
        <p className="mt-3 text-[14px] text-fg-muted">
          {order
            ? `Order #${order.public_id} berhasil dibuat. Mengalihkan ke detail order…`
            : "Order berhasil dibuat."}
        </p>
        {order && (
          <Link
            href={`/orders/${order.public_id}`}
            className="mt-6 inline-flex items-center gap-2 rounded-lg border border-line-strong px-5 py-2.5 text-[13px] font-semibold text-fg transition-all hover:border-accent hover:bg-accent hover:text-accent-fg"
          >
            <span className="material-symbols-outlined text-[16px]">
              receipt_long
            </span>
            Lihat Detail Order
          </Link>
        )}
      </div>,
    );
  }

  // ── Review / Payment ──────────────────────────────────────────────────────
  return shell(
    <>
      {/* Breadcrumb */}
      <nav className="mb-8 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em]">
        <Link
          href="/cart"
          className="flex items-center gap-1.5 text-fg-dim transition-colors hover:text-accent"
        >
          <span className="material-symbols-outlined text-[16px]">
            arrow_back
          </span>
          Keranjang
        </Link>
        <span className="text-line-strong">/</span>
        <span className="text-fg-muted">Checkout</span>
      </nav>

      <div className="mb-10">
        <Eyebrow>Checkout</Eyebrow>
        <h1 className="studio-hero-title mt-3 text-[clamp(30px,5vw,48px)] text-fg">
          Konfirmasi &amp; bayar pesanan
        </h1>
        <div className="mt-6">
          <StepIndicator step={step} />
        </div>
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-error/20 bg-error/5 px-5 py-4">
          <span className="material-symbols-outlined text-[18px] text-error">
            warning
          </span>
          <div className="text-[13px] text-error">
            <p>{error}</p>
            {order && (
              <Link
                href="/invoices"
                className="mt-1 inline-block underline hover:text-fg"
              >
                Order sudah dibuat — bayar nanti di halaman Invoice →
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Order summary (from client cart) */}
      <div className="mb-6 rounded-2xl border border-line bg-surface/50 p-6 backdrop-blur sm:p-8">
        <div className="mb-6 flex items-center gap-2.5">
          <div className="grid h-8 w-8 place-items-center rounded-lg border border-line/80 bg-surface-2">
            <span className="material-symbols-outlined text-[16px] text-accent">
              receipt_long
            </span>
          </div>
          <h2 className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-fg-dim">
            Ringkasan Order · {count} item
          </h2>
        </div>

        <div className="divide-y divide-line/60">
          {summaryItems.map((item) => (
            <div
              key={item.slug}
              className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0"
            >
              <div className="min-w-0">
                <h3 className="text-[15px] font-bold text-fg">{item.name}</h3>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <span className="flex items-center gap-1 rounded-md border border-line/80 bg-surface/50 px-2 py-0.5 text-[11px] text-fg-muted">
                    {item.provider.verified && (
                      <span className="material-symbols-outlined text-[12px] text-accent">
                        verified
                      </span>
                    )}
                    {item.provider.name}
                  </span>
                  <span className="rounded-md border border-line/60 bg-surface/30 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-fg-dim">
                    {formatBillingCycle(item.cycle)}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-fg-dim">
                    <span className="material-symbols-outlined text-[12px]">
                      location_on
                    </span>
                    {item.region}
                  </span>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-mono text-[13px] font-semibold tabular-nums text-fg">
                  {formatPrice(item.lineTotal, item.currency)}
                </p>
                <p className="font-mono text-[10px] text-fg-dim">
                  {formatPrice(item.price, item.currency)} × {item.quantity}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-line pt-5">
          <span className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-fg-dim">
            Total
          </span>
          <span className="studio-display text-[28px] text-accent tabular-nums">
            {formatPrice(subtotal)}
          </span>
        </div>
      </div>

      {/* Step body */}
      {step === "review" && (
        <div className="flex items-center justify-between">
          <Link
            href="/cart"
            className="inline-flex items-center gap-2 rounded-lg border border-line px-4 py-2.5 text-[13px] font-semibold text-fg-muted transition-all hover:border-accent/50 hover:text-fg"
          >
            <span className="material-symbols-outlined text-[16px]">
              arrow_back
            </span>
            Kembali
          </Link>
          <button
            type="button"
            onClick={handleCheckout}
            disabled={submitting || auth.loading}
            className={`inline-flex items-center gap-2 rounded-lg px-6 py-3 text-[13px] font-semibold transition-all ${
              submitting || auth.loading
                ? "cursor-not-allowed border border-line text-fg-dim"
                : "bg-accent text-accent-fg hover:brightness-110"
            }`}
          >
            {submitting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-fg/20 border-t-fg" />
                Memproses…
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[16px]">lock</span>
                Buat Order &amp; Bayar
              </>
            )}
          </button>
        </div>
      )}

      {step === "payment" && (
        <DemoPayment
          orderId={order?.public_id ?? ""}
          total={subtotal}
          onSuccess={handlePaymentSuccess}
          onPending={handlePaymentPending}
          onError={() => {}}
        />
      )}

      <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-fg-dim">
          © 2026 JadeNode · Demo Payment Gateway
        </p>
        <span className="flex items-center gap-1.5">
          <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-success" />
          <span className="text-[11px] text-fg-dim">
            Checkout aman &amp; terenkripsi
          </span>
        </span>
      </div>
    </>,
  );
}
