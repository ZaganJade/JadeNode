"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api, ApiException } from "@/lib/api";
import { formatPrice, formatBillingCycle } from "@/lib/formatters";
import { DemoPayment } from "@/features/checkout/components/demo-payment";
import { RevealOnScroll } from "@/components/landing/reveal-on-scroll";

// ─── Types ──────────────────────────────────────────────────────────────────

type OrderStatus =
  | "pending_payment"
  | "paid"
  | "cancelled"
  | "expired"
  | "processing"
  | "completed";

type InvoiceStatus = "pending" | "paid" | "cancelled" | "void";

type PaymentStatus = "pending" | "paid" | "failed" | "expired";

interface OrderItem {
  product_name: string;
  specs: Record<string, string | number | undefined | null>;
  billing_cycle: string;
  region: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
}

interface Provider {
  name: string;
  verified: boolean;
}

interface Invoice {
  public_id: string;
  invoice_number: string;
  status: InvoiceStatus;
  total: number;
  currency: string;
  due_date: string | null;
  paid_at: string | null;
}

interface Payment {
  id: string;
  method: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  paid_at: string | null;
  created_at: string;
}

interface TimelineEvent {
  status: string;
  label: string;
  timestamp: string | null;
  description?: string;
}

interface OrderDetail {
  public_id: string;
  order_number: string;
  status: OrderStatus;
  total: number;
  currency: string;
  provider: Provider;
  items: OrderItem[];
  invoice: Invoice | null;
  payments: Payment[];
  timeline: TimelineEvent[];
  created_at: string;
  updated_at: string;
}

// ─── Status badge config ────────────────────────────────────────────────────

const orderStatusConfig: Record<
  OrderStatus,
  { label: string; style: string }
> = {
  pending_payment: {
    label: "Menunggu Pembayaran",
    style: "bg-[var(--color-amber)]/10 text-[var(--color-amber)] border-[var(--color-amber)]/20",
  },
  paid: {
    label: "Dibayar",
    style: "bg-[var(--color-success)]/10 text-[var(--color-success)] border-[var(--color-success)]/20",
  },
  processing: {
    label: "Diproses",
    style: "bg-[var(--color-steel)]/10 text-[var(--color-steel)] border-[var(--color-steel)]/20",
  },
  completed: {
    label: "Selesai",
    style: "bg-[var(--color-success)]/10 text-[var(--color-success)] border-[var(--color-success)]/20",
  },
  cancelled: {
    label: "Dibatalkan",
    style: "bg-[var(--color-error)]/10 text-[var(--color-error)] border-[var(--color-error)]/20",
  },
  expired: {
    label: "Kadaluarsa",
    style: "bg-[var(--color-surface-3)] text-[var(--color-fg-dim)] border-[var(--color-line)]",
  },
};

const invoiceStatusConfig: Record<
  InvoiceStatus,
  { label: string; style: string }
> = {
  pending: {
    label: "Menunggu",
    style: "bg-[var(--color-amber)]/10 text-[var(--color-amber)] border-[var(--color-amber)]/20",
  },
  paid: {
    label: "Dibayar",
    style: "bg-[var(--color-success)]/10 text-[var(--color-success)] border-[var(--color-success)]/20",
  },
  cancelled: {
    label: "Dibatalkan",
    style: "bg-[var(--color-error)]/10 text-[var(--color-error)] border-[var(--color-error)]/20",
  },
  void: {
    label: "Void",
    style: "bg-[var(--color-surface-3)] text-[var(--color-fg-dim)] border-[var(--color-line)]",
  },
};

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

// ─── Format date ────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const orderId = params.id;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [showDemoPay, setShowDemoPay] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch order ─────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function fetchOrder() {
      try {
        const res = await api.get<{ order: OrderDetail }>(
          `/api/v1/orders/${orderId}`,
        );
        if (!cancelled) setOrder(res.order);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiException && err.status === 404) {
          setError("Order tidak ditemukan.");
        } else {
          setError(
            err instanceof Error ? err.message : "Gagal memuat detail order.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchOrder();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  // ── Pay handler ─────────────────────────────────────────────────────────
  // Demo mode: show the DemoPayment component instead of calling the
  // Midtrans /pay endpoint (unavailable in this portfolio build).
  const handlePay = useCallback(() => {
    setShowDemoPay(true);
  }, []);

  // ── Payment success ─────────────────────────────────────────────────────
  // Demo mode: optimistically mark the order as paid locally so the UI
  // reflects the payment without a backend round-trip.
  const handlePaymentSuccess = useCallback(() => {
    setOrder((prev) =>
      prev
        ? {
            ...prev,
            status: "paid",
            invoice: prev.invoice
              ? { ...prev.invoice, status: "paid", paid_at: new Date().toISOString() }
              : prev.invoice,
          }
        : prev,
    );
    setShowDemoPay(false);
  }, []);

  // ── Loading skeleton ────────────────────────────────────────────────────
  if (loading) {
    return (
      <RevealOnScroll>
        <div className="mx-auto w-full max-w-[1040px] px-6 py-10">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 animate-pulse rounded bg-[var(--color-accent-soft)]" />
          <div className="h-8 w-64 animate-pulse rounded bg-[var(--color-accent-soft)]" />
        </div>
        <div className="h-[200px] animate-pulse rounded-2xl bg-[var(--color-accent-soft)]" />
        <div className="h-[150px] animate-pulse rounded-2xl bg-[var(--color-surface-2)]" />
        <div className="h-[100px] animate-pulse rounded-2xl bg-[var(--color-accent-soft)]" />
      </div>
        </div>
      </RevealOnScroll>
        );
  }

  // ── Error / not found ───────────────────────────────────────────────────
  if (error || !order) {
    return (
      <RevealOnScroll>
        <div className="mx-auto w-full max-w-[1040px] px-6 py-10">
      <div className="space-y-6">
        <Link
          href="/orders"
          className="inline-flex items-center gap-1 text-sm text-[var(--color-accent)]/60 transition-colors hover:text-[var(--color-accent)]"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Kembali ke Orders
        </Link>
        <div className="rounded-2xl border border-[var(--color-error)]/20 bg-[var(--color-error)]/[0.05] p-8 backdrop-blur-[24px] text-center">
          <h2 className="text-lg font-semibold text-[var(--color-fg)]">
            {error ?? "Gagal memuat detail order."}
          </h2>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 rounded-full border border-[var(--color-line)] bg-[var(--color-surface-2)] px-6 py-2.5 text-sm font-medium text-[var(--color-fg-muted)] transition-colors hover:border-[var(--color-accent)]/30 hover:text-[var(--color-fg)]"
          >
            Coba Lagi
          </button>
        </div>
      </div>
        </div>
      </RevealOnScroll>
        );
  }

  const statusInfo = orderStatusConfig[order.status] ?? {
    label: order.status,
    style: "bg-[var(--color-surface-3)] text-[var(--color-fg-dim)] border-[var(--color-line)]",
  };

  const canPay = order.status === "pending_payment";

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <RevealOnScroll>
      <div className="mx-auto w-full max-w-[1040px] px-6 py-10">
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/orders"
        className="inline-flex items-center gap-1 text-sm text-[var(--color-accent)]/60 transition-colors hover:text-[var(--color-accent)]"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        Kembali ke Orders
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[32px] font-bold leading-none tracking-tight text-[var(--color-fg)]">
              Order #{order.order_number ?? order.public_id}
            </h1>
            <span
              className={`rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${statusInfo.style}`}
            >
              {statusInfo.label}
            </span>
          </div>
          <p className="mt-1 text-sm text-[var(--color-fg-dim)]">
            Dibuat pada {formatDate(order.created_at)}
          </p>
        </div>

        <div className="text-right">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--color-accent)]/50">
            Total
          </p>
          <p className="text-2xl font-bold text-[var(--color-accent)]">
            {formatPrice(order.total, order.currency)}
          </p>
        </div>
      </div>

      {/* ─── Order Items ─────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface-2)] p-6 backdrop-blur-[24px]">
        <h2 className="mb-4 font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--color-accent)]/60">
          Item Order
        </h2>

        <div className="space-y-4">
          {order.items.map((item, idx) => (
            <div key={idx}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--color-fg)]">
                    {item.product_name}
                  </h3>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--color-fg-dim)]">
                    <span>{formatBillingCycle(item.billing_cycle)}</span>
                    {item.region && (
                      <>
                        <span>•</span>
                        <span>{item.region}</span>
                      </>
                    )}
                  </div>
                </div>
                <span className="text-sm font-medium text-[var(--color-fg)]">
                  {formatPrice(item.subtotal, order.currency)}
                </span>
              </div>

              {/* Specs */}
              {item.specs && Object.keys(item.specs).length > 0 && (
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {Object.entries(item.specs)
                    .filter(([, v]) => v != null && v !== "")
                    .map(([key, val]) => (
                      <div
                        key={key}
                        className="rounded-lg border border-[var(--color-surface-2)] bg-[rgba(25,20,0,0.3)] px-3 py-2"
                      >
                        <p className="font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--color-accent)]/50">
                          {specLabels[key] ?? key}
                        </p>
                        <p className="text-xs font-medium text-[var(--color-fg)]">
                          {String(val)}
                        </p>
                      </div>
                    ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Provider */}
        {order.provider && (
          <div className="mt-4 flex items-center gap-2 border-t border-[var(--color-surface-2)] pt-4">
            <span className="text-xs text-[var(--color-fg-dim)]">Provider:</span>
            <div className="flex items-center gap-1.5 text-xs text-[var(--color-fg-muted)]">
              {order.provider.verified && (
                <svg className="h-3 w-3 text-[var(--color-accent)]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
              <span>{order.provider.name}</span>
            </div>
          </div>
        )}
      </div>

      {/* ─── Invoice Section ──────────────────────────────────────────────── */}
      {order.invoice && (
        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface-2)] p-6 backdrop-blur-[24px]">
          <h2 className="mb-4 font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--color-accent)]/60">
            Invoice
          </h2>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--color-fg-muted)]">Nomor Invoice</span>
              <Link
                href={`/invoices/${order.invoice.public_id}`}
                className="font-mono text-xs text-[var(--color-accent)] hover:underline"
              >
                {order.invoice.invoice_number ?? order.invoice.public_id}
              </Link>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--color-fg-muted)]">Status</span>
              <span
                className={`rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                  (invoiceStatusConfig[order.invoice.status] ?? invoiceStatusConfig.pending).style
                }`}
              >
                {(invoiceStatusConfig[order.invoice.status] ?? invoiceStatusConfig.pending).label}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--color-fg-muted)]">Total</span>
              <span className="font-semibold text-[var(--color-accent)]">
                {formatPrice(order.invoice.total, order.invoice.currency)}
              </span>
            </div>

            {order.invoice.due_date && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--color-fg-muted)]">Jatuh Tempo</span>
                <span className="text-[var(--color-fg)]">
                  {formatDate(order.invoice.due_date)}
                </span>
              </div>
            )}

            {order.invoice.paid_at && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--color-fg-muted)]">Dibayar pada</span>
                <span className="text-[var(--color-success)]">
                  {formatDate(order.invoice.paid_at)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Payment Section ──────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface-2)] p-6 backdrop-blur-[24px]">
        <h2 className="mb-4 font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--color-accent)]/60">
          Pembayaran
        </h2>

        {canPay && !showDemoPay && (
          <div className="flex flex-col items-center gap-4 py-4">
            <p className="text-sm text-[var(--color-fg-muted)]">
              Order ini belum dibayar. Klik tombol di bawah untuk membayar.
            </p>
            <button
              type="button"
              onClick={handlePay}
              className="inline-flex items-center rounded-full bg-[var(--color-accent)] px-6 py-2.5 text-sm font-semibold text-[var(--color-accent-fg)] transition-all hover:brightness-110"
            >
              Bayar Sekarang
            </button>
          </div>
        )}

        {showDemoPay && (
          <DemoPayment
            orderId={order.public_id}
            total={order.total}
            currency={order.currency}
            onSuccess={handlePaymentSuccess}
            onPending={() => {
              router.push(`/orders/${order.public_id}`);
            }}
            onError={() => {}}
          />
        )}

        {!canPay && !showDemoPay && (
          <div className="text-sm text-[var(--color-fg-muted)]">
            {order.status === "paid" || order.status === "completed"
              ? "Pembayaran telah diterima."
              : order.status === "cancelled"
                ? "Order ini telah dibatalkan."
                : order.status === "expired"
                  ? "Order ini telah kadaluarsa."
                  : `Status: ${statusInfo.label}`}
          </div>
        )}

        {/* Payment history */}
        {order.payments && order.payments.length > 0 && (
          <div className="mt-4 border-t border-[var(--color-surface-2)] pt-4">
            <h3 className="mb-3 font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--color-accent)]/50">
              Riwayat Pembayaran
            </h3>
            <div className="space-y-2">
              {order.payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between rounded-lg bg-[rgba(25,20,0,0.3)] px-4 py-3 text-sm"
                >
                  <div>
                    <span className="text-[var(--color-fg-muted)]">
                      {payment.method ?? "Midtrans Snap"}
                    </span>
                    <span className="ml-2 text-xs text-[var(--color-fg-dim)]">
                      {formatDate(payment.created_at)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[var(--color-fg)]">
                      {formatPrice(payment.amount, payment.currency)}
                    </span>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] uppercase ${
                        payment.status === "paid"
                          ? "border-[var(--color-success)]/20 bg-[var(--color-success)]/10 text-[var(--color-success)]"
                          : payment.status === "pending"
                            ? "border-[var(--color-amber)]/20 bg-[var(--color-amber)]/10 text-[var(--color-amber)]"
                            : "border-[var(--color-error)]/20 bg-[var(--color-error)]/10 text-[var(--color-error)]"
                      }`}
                    >
                      {payment.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ─── Timeline ─────────────────────────────────────────────────────── */}
      {order.timeline && order.timeline.length > 0 && (
        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface-2)] p-6 backdrop-blur-[24px]">
          <h2 className="mb-4 font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--color-accent)]/60">
            Timeline
          </h2>

          <div className="relative space-y-0">
            {order.timeline.map((event, idx) => (
              <div key={idx} className="flex gap-4">
                {/* Dot + line */}
                <div className="flex flex-col items-center">
                  <div
                    className={`h-3 w-3 rounded-full border-2 ${
                      event.timestamp
                        ? "border-[var(--color-accent)] bg-[var(--color-accent)]/20"
                        : "border-[var(--color-accent-soft)] bg-transparent"
                    }`}
                  />
                  {idx < order.timeline.length - 1 && (
                    <div className="h-8 w-px bg-[var(--color-accent)]/10" />
                  )}
                </div>

                {/* Content */}
                <div className="pb-6">
                  <p
                    className={`text-sm font-medium ${
                      event.timestamp ? "text-[var(--color-fg)]" : "text-[var(--color-fg-dim)]"
                    }`}
                  >
                    {event.label}
                  </p>
                  {event.timestamp && (
                    <p className="mt-0.5 text-xs text-[var(--color-fg-dim)]">
                      {formatDate(event.timestamp)}
                    </p>
                  )}
                  {event.description && (
                    <p className="mt-1 text-xs text-[var(--color-fg-dim)]">
                      {event.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
      </div>
    </RevealOnScroll>
    );
}
