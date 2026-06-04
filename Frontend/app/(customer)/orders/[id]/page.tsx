"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api, ApiException } from "@/lib/api";
import { formatPrice, formatBillingCycle } from "@/lib/formatters";
import { PaymentStep } from "@/features/checkout/components/payment-step";

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

interface PayResponse {
  snap_token: string;
  redirect_url?: string;
}

// ─── Status badge config ────────────────────────────────────────────────────

const orderStatusConfig: Record<
  OrderStatus,
  { label: string; style: string }
> = {
  pending_payment: {
    label: "Menunggu Pembayaran",
    style: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  paid: {
    label: "Dibayar",
    style: "bg-success-500/10 text-success-400 border-success-500/20",
  },
  processing: {
    label: "Diproses",
    style: "bg-info-500/10 text-info-400 border-info-500/20",
  },
  completed: {
    label: "Selesai",
    style: "bg-success-500/10 text-success-400 border-success-500/20",
  },
  cancelled: {
    label: "Dibatalkan",
    style: "bg-error-500/10 text-error-400 border-error-500/20",
  },
  expired: {
    label: "Kadaluarsa",
    style: "bg-neutral-500/10 text-neutral-400 border-neutral-500/20",
  },
};

const invoiceStatusConfig: Record<
  InvoiceStatus,
  { label: string; style: string }
> = {
  pending: {
    label: "Menunggu",
    style: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  paid: {
    label: "Dibayar",
    style: "bg-success-500/10 text-success-400 border-success-500/20",
  },
  cancelled: {
    label: "Dibatalkan",
    style: "bg-error-500/10 text-error-400 border-error-500/20",
  },
  void: {
    label: "Void",
    style: "bg-neutral-500/10 text-neutral-400 border-neutral-500/20",
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
  const [snapToken, setSnapToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payLoading, setPayLoading] = useState(false);

  // ── Fetch order ─────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function fetchOrder() {
      try {
        const data = await api.get<OrderDetail>(
          `/api/v1/orders/${orderId}`,
        );
        if (!cancelled) setOrder(data);
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
  const handlePay = useCallback(async () => {
    if (!order) return;
    setPayLoading(true);
    try {
      const data = await api.post<PayResponse>(
        `/api/v1/orders/${order.public_id}/pay`,
      );
      setSnapToken(data.snap_token);
    } catch (err) {
      setError(
        err instanceof ApiException
          ? err.message
          : "Gagal memulai pembayaran.",
      );
    } finally {
      setPayLoading(false);
    }
  }, [order]);

  // ── Payment success ─────────────────────────────────────────────────────
  const handlePaymentSuccess = useCallback(() => {
    // Refresh order data
    if (order) {
      api
        .get<OrderDetail>(`/api/v1/orders/${order.public_id}`)
        .then(setOrder);
    }
  }, [order]);

  // ── Loading skeleton ────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 animate-pulse rounded bg-[rgba(255,191,0,0.08)]" />
          <div className="h-8 w-64 animate-pulse rounded bg-[rgba(255,191,0,0.08)]" />
        </div>
        <div className="h-[200px] animate-pulse rounded-2xl bg-[rgba(255,191,0,0.06)]" />
        <div className="h-[150px] animate-pulse rounded-2xl bg-[rgba(255,191,0,0.04)]" />
        <div className="h-[100px] animate-pulse rounded-2xl bg-[rgba(255,191,0,0.06)]" />
      </div>
    );
  }

  // ── Error / not found ───────────────────────────────────────────────────
  if (error || !order) {
    return (
      <div className="space-y-6">
        <Link
          href="/orders"
          className="inline-flex items-center gap-1 text-sm text-[#FFBF00]/60 transition-colors hover:text-[#FFBF00]"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Kembali ke Orders
        </Link>
        <div className="rounded-2xl border border-error-500/20 bg-error-500/5 p-8 backdrop-blur-[24px] text-center">
          <h2 className="text-lg font-semibold text-[#F5F5F0]">
            {error ?? "Gagal memuat detail order."}
          </h2>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 rounded-full border border-[rgba(255,191,0,0.12)] bg-[rgba(25,20,0,0.6)] px-6 py-2.5 text-sm font-medium text-[#F5F5F0]/60 transition-colors hover:border-[rgba(255,191,0,0.3)] hover:text-[#F5F5F0]"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  const statusInfo = orderStatusConfig[order.status] ?? {
    label: order.status,
    style: "bg-neutral-500/10 text-neutral-400 border-neutral-500/20",
  };

  const canPay = order.status === "pending_payment";

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/orders"
        className="inline-flex items-center gap-1 text-sm text-[#FFBF00]/60 transition-colors hover:text-[#FFBF00]"
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
            <h1 className="text-2xl font-bold text-[#F5F5F0]">
              Order #{order.order_number ?? order.public_id}
            </h1>
            <span
              className={`rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${statusInfo.style}`}
            >
              {statusInfo.label}
            </span>
          </div>
          <p className="mt-1 text-sm text-[#F5F5F0]/40">
            Dibuat pada {formatDate(order.created_at)}
          </p>
        </div>

        <div className="text-right">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-[#FFBF00]/50">
            Total
          </p>
          <p className="text-2xl font-bold text-[#FFBF00]">
            {formatPrice(order.total, order.currency)}
          </p>
        </div>
      </div>

      {/* ─── Order Items ─────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-[rgba(255,191,0,0.08)] bg-[rgba(25,20,0,0.4)] p-6 backdrop-blur-[24px]">
        <h2 className="mb-4 font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-[#FFBF00]/60">
          Item Order
        </h2>

        <div className="space-y-4">
          {order.items.map((item, idx) => (
            <div key={idx}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-[#F5F5F0]">
                    {item.product_name}
                  </h3>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#F5F5F0]/40">
                    <span>{formatBillingCycle(item.billing_cycle)}</span>
                    {item.region && (
                      <>
                        <span>•</span>
                        <span>{item.region}</span>
                      </>
                    )}
                  </div>
                </div>
                <span className="text-sm font-medium text-[#F5F5F0]">
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
                        className="rounded-lg border border-[rgba(255,191,0,0.06)] bg-[rgba(25,20,0,0.3)] px-3 py-2"
                      >
                        <p className="font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-[#FFBF00]/50">
                          {specLabels[key] ?? key}
                        </p>
                        <p className="text-xs font-medium text-[#F5F5F0]">
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
          <div className="mt-4 flex items-center gap-2 border-t border-[rgba(255,191,0,0.06)] pt-4">
            <span className="text-xs text-[#F5F5F0]/40">Provider:</span>
            <div className="flex items-center gap-1.5 text-xs text-[#F5F5F0]/70">
              {order.provider.verified && (
                <svg className="h-3 w-3 text-[#FFBF00]" fill="currentColor" viewBox="0 0 20 20">
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
        <div className="rounded-2xl border border-[rgba(255,191,0,0.08)] bg-[rgba(25,20,0,0.4)] p-6 backdrop-blur-[24px]">
          <h2 className="mb-4 font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-[#FFBF00]/60">
            Invoice
          </h2>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#F5F5F0]/50">Nomor Invoice</span>
              <Link
                href={`/invoices/${order.invoice.public_id}`}
                className="font-mono text-xs text-[#FFBF00] hover:underline"
              >
                {order.invoice.invoice_number ?? order.invoice.public_id}
              </Link>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-[#F5F5F0]/50">Status</span>
              <span
                className={`rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                  (invoiceStatusConfig[order.invoice.status] ?? invoiceStatusConfig.pending).style
                }`}
              >
                {(invoiceStatusConfig[order.invoice.status] ?? invoiceStatusConfig.pending).label}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-[#F5F5F0]/50">Total</span>
              <span className="font-semibold text-[#FFBF00]">
                {formatPrice(order.invoice.total, order.invoice.currency)}
              </span>
            </div>

            {order.invoice.due_date && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#F5F5F0]/50">Jatuh Tempo</span>
                <span className="text-[#F5F5F0]">
                  {formatDate(order.invoice.due_date)}
                </span>
              </div>
            )}

            {order.invoice.paid_at && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#F5F5F0]/50">Dibayar pada</span>
                <span className="text-success-400">
                  {formatDate(order.invoice.paid_at)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Payment Section ──────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-[rgba(255,191,0,0.08)] bg-[rgba(25,20,0,0.4)] p-6 backdrop-blur-[24px]">
        <h2 className="mb-4 font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-[#FFBF00]/60">
          Pembayaran
        </h2>

        {canPay && !snapToken && (
          <div className="flex flex-col items-center gap-4 py-4">
            <p className="text-sm text-[#F5F5F0]/50">
              Order ini belum dibayar. Klik tombol di bawah untuk membayar via Midtrans Snap.
            </p>
            <button
              type="button"
              onClick={handlePay}
              disabled={payLoading}
              className="inline-flex items-center rounded-full bg-[#FFBF00] px-6 py-2.5 text-sm font-semibold text-[#0D0B00] shadow-[0_0_20px_rgba(255,191,0,0.25)] transition-all hover:shadow-[0_0_30px_rgba(255,191,0,0.4)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {payLoading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-[#0D0B00]/20 border-t-[#0D0B00]" />
                  Memproses...
                </>
              ) : (
                "Bayar Sekarang"
              )}
            </button>
          </div>
        )}

        {snapToken && (
          <PaymentStep
            snapToken={snapToken}
            orderId={order.public_id}
            onSuccess={handlePaymentSuccess}
            onPending={() => {
              router.push(`/orders/${order.public_id}`);
            }}
            onError={() => {}}
            onClose={() => {}}
          />
        )}

        {!canPay && !snapToken && (
          <div className="text-sm text-[#F5F5F0]/50">
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
          <div className="mt-4 border-t border-[rgba(255,191,0,0.06)] pt-4">
            <h3 className="mb-3 font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-[#FFBF00]/50">
              Riwayat Pembayaran
            </h3>
            <div className="space-y-2">
              {order.payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between rounded-lg bg-[rgba(25,20,0,0.3)] px-4 py-3 text-sm"
                >
                  <div>
                    <span className="text-[#F5F5F0]/70">
                      {payment.method ?? "Midtrans Snap"}
                    </span>
                    <span className="ml-2 text-xs text-[#F5F5F0]/40">
                      {formatDate(payment.created_at)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[#F5F5F0]">
                      {formatPrice(payment.amount, payment.currency)}
                    </span>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] uppercase ${
                        payment.status === "paid"
                          ? "border-success-500/20 bg-success-500/10 text-success-400"
                          : payment.status === "pending"
                            ? "border-amber-500/20 bg-amber-500/10 text-amber-400"
                            : "border-error-500/20 bg-error-500/10 text-error-400"
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
        <div className="rounded-2xl border border-[rgba(255,191,0,0.08)] bg-[rgba(25,20,0,0.4)] p-6 backdrop-blur-[24px]">
          <h2 className="mb-4 font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-[#FFBF00]/60">
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
                        ? "border-[#FFBF00] bg-[#FFBF00]/20"
                        : "border-[rgba(255,191,0,0.2)] bg-transparent"
                    }`}
                  />
                  {idx < order.timeline.length - 1 && (
                    <div className="h-8 w-px bg-[rgba(255,191,0,0.1)]" />
                  )}
                </div>

                {/* Content */}
                <div className="pb-6">
                  <p
                    className={`text-sm font-medium ${
                      event.timestamp ? "text-[#F5F5F0]" : "text-[#F5F5F0]/40"
                    }`}
                  >
                    {event.label}
                  </p>
                  {event.timestamp && (
                    <p className="mt-0.5 text-xs text-[#F5F5F0]/30">
                      {formatDate(event.timestamp)}
                    </p>
                  )}
                  {event.description && (
                    <p className="mt-1 text-xs text-[#F5F5F0]/40">
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
  );
}
