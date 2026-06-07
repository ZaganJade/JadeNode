"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api, ApiException } from "@/lib/api";
import { formatPrice } from "@/lib/formatters";
import {
  PaymentMethodSheet,
  type PayableInvoice,
} from "@/features/checkout/components/payment-method-sheet";

// ─── Types (match InvoiceResource) ────────────────────────────────────────────

type InvoiceStatus = "pending" | "paid" | "cancelled" | "void";

interface InvoiceApi {
  public_id: string;
  invoice_number: string;
  status: InvoiceStatus;
  total_minor: number;
  currency: string;
  due_at: string | null;
  paid_at: string | null;
  created_at: string;
  order?: { public_id: string; order_number: string | null } | null;
}

interface InvoicesResponse {
  data: InvoiceApi[];
}

// ─── Status badge config ──────────────────────────────────────────────────────

const statusConfig: Record<InvoiceStatus, { label: string; style: string; icon: string }> =
  {
    pending: {
      label: "Menunggu",
      style: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      icon: "schedule",
    },
    paid: {
      label: "Dibayar",
      style: "bg-success-500/10 text-success-400 border-success-500/20",
      icon: "check_circle",
    },
    cancelled: {
      label: "Dibatalkan",
      style: "bg-error-500/10 text-error-400 border-error-500/20",
      icon: "cancel",
    },
    void: {
      label: "Void",
      style: "bg-neutral-500/10 text-neutral-400 border-neutral-500/20",
      icon: "block",
    },
  };

const FILTERS = [
  { key: "all", label: "Semua" },
  { key: "pending", label: "Menunggu" },
  { key: "paid", label: "Dibayar" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [payTarget, setPayTarget] = useState<PayableInvoice | null>(null);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<InvoicesResponse>("/api/v1/invoices");
      setInvoices(res.data ?? []);
      setError(null);
    } catch (err) {
      if (err instanceof ApiException && err.status === 401) return;
      setError(
        err instanceof Error ? err.message : "Gagal memuat daftar invoice.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const filtered = useMemo(() => {
    if (filter === "all") return invoices;
    return invoices.filter((i) => i.status === filter);
  }, [invoices, filter]);

  const pendingCount = useMemo(
    () => invoices.filter((i) => i.status === "pending").length,
    [invoices],
  );

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-8 w-40 animate-pulse rounded bg-[rgba(255,191,0,0.08)]" />
          <div className="mt-2 h-4 w-72 animate-pulse rounded bg-[rgba(255,191,0,0.05)]" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-2xl bg-[rgba(255,191,0,0.04)]"
            />
          ))}
        </div>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-[#F5F5F0]">Invoices</h1>
        <div className="rounded-2xl border border-error-500/20 bg-error-500/5 p-8 text-center backdrop-blur-[24px]">
          <p className="text-sm text-error-400">{error}</p>
          <button
            type="button"
            onClick={fetchInvoices}
            className="mt-4 rounded-full border border-[rgba(255,191,0,0.12)] bg-[rgba(25,20,0,0.6)] px-6 py-2.5 text-sm font-medium text-[#F5F5F0]/60 transition-colors hover:border-[rgba(255,191,0,0.3)] hover:text-[#F5F5F0]"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  // ── Main ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#F5F5F0]">Invoices</h1>
          <p className="mt-1 text-sm text-[#F5F5F0]/50">
            Lihat, bayar, dan kelola semua invoice Anda.
            {pendingCount > 0 && (
              <span className="ml-2 text-amber-400">
                {pendingCount} menunggu pembayaran
              </span>
            )}
          </p>
        </div>

        {/* Filter chips */}
        <div className="flex gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              aria-pressed={filter === f.key}
              className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-colors ${
                filter === f.key
                  ? "border-[rgba(255,191,0,0.4)] bg-[rgba(255,191,0,0.1)] text-[#FFBF00]"
                  : "border-[rgba(255,191,0,0.12)] text-[#F5F5F0]/50 hover:border-[rgba(255,191,0,0.25)] hover:text-[#F5F5F0]/80"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Empty */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-[rgba(255,191,0,0.08)] bg-[rgba(25,20,0,0.4)] p-12 text-center backdrop-blur-[24px]">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(255,191,0,0.06)]">
            <span className="material-symbols-outlined text-[32px] text-[#FFBF00]/40">
              receipt_long
            </span>
          </div>
          <h3 className="mt-4 text-lg font-semibold text-[#F5F5F0]">
            {filter === "all"
              ? "Belum Ada Invoice"
              : `Tidak ada invoice ${filter === "pending" ? "menunggu" : "dibayar"}`}
          </h3>
          <p className="mt-2 text-sm text-[#F5F5F0]/40">
            {filter === "all"
              ? "Invoice akan muncul setelah Anda membuat order."
              : "Coba filter lain untuk melihat invoice Anda."}
          </p>
          {filter === "all" && (
            <Link
              href="/marketplace"
              className="mt-6 inline-flex items-center rounded-full bg-[#FFBF00] px-6 py-2.5 text-sm font-semibold text-[#0D0B00] shadow-[0_0_20px_rgba(255,191,0,0.25)]"
            >
              Jelajahi Marketplace
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((invoice) => {
            const status = statusConfig[invoice.status] ?? statusConfig.pending;
            const isPending = invoice.status === "pending";

            return (
              <div
                key={invoice.public_id}
                className="rounded-2xl border border-[rgba(255,191,0,0.08)] bg-[rgba(25,20,0,0.4)] p-6 backdrop-blur-[24px] transition-colors hover:border-[rgba(255,191,0,0.18)]"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-[#F5F5F0]/40">
                        {invoice.invoice_number ?? invoice.public_id}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${status.style}`}
                      >
                        <span className="material-symbols-outlined text-[12px]">
                          {status.icon}
                        </span>
                        {status.label}
                      </span>
                    </div>

                    {invoice.order?.order_number && (
                      <p className="mt-1 text-xs text-[#F5F5F0]/40">
                        Order: {invoice.order.order_number}
                      </p>
                    )}

                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[#F5F5F0]/40">
                      <span>{formatDate(invoice.created_at)}</span>
                      {invoice.due_at && isPending && (
                        <>
                          <span>•</span>
                          <span className="text-amber-400/60">
                            Jatuh tempo: {formatDate(invoice.due_at)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Total + actions */}
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-bold text-[#FFBF00]">
                      {formatPrice(invoice.total_minor, invoice.currency)}
                    </span>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/invoices/${invoice.public_id}`}
                        className="rounded-full border border-[rgba(255,191,0,0.12)] px-4 py-2 text-xs font-medium text-[#F5F5F0]/60 transition-colors hover:border-[rgba(255,191,0,0.3)] hover:text-[#F5F5F0]"
                      >
                        Detail
                      </Link>
                      {isPending && (
                        <button
                          type="button"
                          onClick={() =>
                            setPayTarget({
                              public_id: invoice.public_id,
                              invoice_number:
                                invoice.invoice_number ?? invoice.public_id,
                              total: invoice.total_minor,
                              currency: invoice.currency,
                            })
                          }
                          className="inline-flex items-center gap-1.5 rounded-full bg-[#FFBF00] px-4 py-2 text-xs font-semibold text-[#0D0B00] shadow-[0_0_16px_rgba(255,191,0,0.25)] transition-transform hover:scale-[1.02]"
                        >
                          <span className="material-symbols-outlined text-[15px]">
                            lock
                          </span>
                          Bayar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Payment sheet */}
      {payTarget && (
        <PaymentMethodSheet
          invoice={payTarget}
          onClose={() => setPayTarget(null)}
          onPaid={() => {
            setPayTarget(null);
            fetchInvoices();
          }}
        />
      )}
    </div>
  );
}
