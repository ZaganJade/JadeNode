"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiException } from "@/lib/api";
import { formatPrice } from "@/lib/formatters";

// ─── Types ──────────────────────────────────────────────────────────────────

type OrderStatus =
  | "pending_payment"
  | "paid"
  | "cancelled"
  | "expired"
  | "processing"
  | "completed";

interface OrderItem {
  product_name: string;
  specs: Record<string, string | number | undefined | null>;
  billing_cycle: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
}

interface Order {
  public_id: string;
  order_number: string;
  status: OrderStatus;
  total: number;
  currency: string;
  items: OrderItem[];
  created_at: string;
}

interface OrdersResponse {
  data: Order[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

// ─── Status badge config ────────────────────────────────────────────────────

const statusConfig: Record<
  OrderStatus,
  { label: string; style: string }
> = {
  pending_payment: {
    label: "Menunggu Pembayaran",
    style:
      "bg-amber-500/10 text-amber-400 border-amber-500/20",
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

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await api.get<OrdersResponse>("/api/v1/orders");
        setOrders(res.data ?? []);
      } catch (err) {
        if (err instanceof ApiException && err.status === 401) {
          // Not authenticated — handled by middleware
          return;
        }
        setError(
          err instanceof Error ? err.message : "Gagal memuat daftar order.",
        );
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, []);

  // ── Loading skeleton ────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-8 w-48 animate-pulse rounded bg-[rgba(255,191,0,0.08)]" />
          <div className="mt-2 h-4 w-72 animate-pulse rounded bg-[rgba(255,191,0,0.05)]" />
        </div>

        {/* Table skeleton */}
        <div className="rounded-2xl border border-[rgba(255,191,0,0.08)] bg-[rgba(25,20,0,0.4)] p-6 backdrop-blur-[24px]">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-14 animate-pulse rounded-lg bg-[rgba(255,191,0,0.04)]"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Error ───────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#F5F5F0]">Orders</h1>
        </div>
        <div className="rounded-2xl border border-error-500/20 bg-error-500/5 p-8 backdrop-blur-[24px] text-center">
          <p className="text-sm text-error-400">{error}</p>
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

  // ── Main render ─────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#F5F5F0]">Orders</h1>
        <p className="mt-1 text-sm text-[#F5F5F0]/50">
          Kelola dan pantau semua pesanan Anda.
        </p>
      </div>

      {/* Empty state */}
      {orders.length === 0 && (
        <div className="rounded-2xl border border-[rgba(255,191,0,0.08)] bg-[rgba(25,20,0,0.4)] p-12 backdrop-blur-[24px] text-center">
          <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-[rgba(255,191,0,0.06)]">
            <svg
              className="h-8 w-8 text-[#FFBF00]/40"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
              />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-semibold text-[#F5F5F0]">
            Belum Ada Order
          </h3>
          <p className="mt-2 text-sm text-[#F5F5F0]/40">
            Setelah Anda melakukan pemesanan, order akan tampil di sini.
          </p>
          <Link
            href="/marketplace"
            className="mt-6 inline-flex items-center rounded-full bg-[#FFBF00] px-6 py-2.5 text-sm font-semibold text-[#0D0B00] shadow-[0_0_20px_rgba(255,191,0,0.25)]"
          >
            Jelajahi Marketplace
          </Link>
        </div>
      )}

      {/* Orders list */}
      {orders.length > 0 && (
        <div className="space-y-3">
          {orders.map((order) => {
            const status = statusConfig[order.status] ?? {
              label: order.status,
              style:
                "bg-neutral-500/10 text-neutral-400 border-neutral-500/20",
            };
            const primaryItem = order.items?.[0];

            return (
              <Link
                key={order.public_id}
                href={`/orders/${order.public_id}`}
                className="group block"
              >
                <div className="rounded-2xl border border-[rgba(255,191,0,0.08)] bg-[rgba(25,20,0,0.4)] p-6 backdrop-blur-[24px] transition-colors hover:border-[rgba(255,191,0,0.18)]">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    {/* Left: order info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs text-[#F5F5F0]/40">
                          {order.order_number ?? order.public_id}
                        </span>
                        <span
                          className={`rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${status.style}`}
                        >
                          {status.label}
                        </span>
                      </div>

                      <h3 className="mt-2 text-sm font-semibold text-[#F5F5F0] truncate">
                        {primaryItem?.product_name ?? "Order"}
                      </h3>

                      <div className="mt-1 flex items-center gap-3 text-xs text-[#F5F5F0]/40">
                        <span>{formatDate(order.created_at)}</span>
                        {primaryItem?.billing_cycle && (
                          <>
                            <span>•</span>
                            <span className="capitalize">
                              {primaryItem.billing_cycle}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Right: total + arrow */}
                    <div className="flex items-center gap-4">
                      <span className="text-lg font-bold text-[#FFBF00]">
                        {formatPrice(order.total, order.currency)}
                      </span>
                      <svg
                        className="h-4 w-4 text-[#F5F5F0]/20 transition-transform group-hover:translate-x-1 group-hover:text-[#FFBF00]/60"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M8.25 4.5l7.5 7.5-7.5 7.5"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
