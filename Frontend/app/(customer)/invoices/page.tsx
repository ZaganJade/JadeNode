"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api, ApiException } from "@/lib/api";
import { formatPrice } from "@/lib/formatters";
import {
  PaymentMethodSheet,
  type PayableInvoice,
} from "@/features/checkout/components/payment-method-sheet";
import { RevealOnScroll } from "@/components/landing/reveal-on-scroll";

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
      style: "bg-[var(--color-amber)]/10 text-[var(--color-amber)] border-[var(--color-amber)]/20",
      icon: "schedule",
    },
    paid: {
      label: "Dibayar",
      style: "bg-[var(--color-success)]/10 text-[var(--color-success)] border-[var(--color-success)]/20",
      icon: "check_circle",
    },
    cancelled: {
      label: "Dibatalkan",
      style: "bg-[var(--color-error)]/10 text-[var(--color-error)] border-[var(--color-error)]/20",
      icon: "cancel",
    },
    void: {
      label: "Void",
      style: "bg-[var(--color-surface-3)] text-[var(--color-fg-dim)] border-[var(--color-line)]",
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
      <RevealOnScroll>
        <div className="mx-auto w-full max-w-[1040px] px-6 py-10">
      <div className="space-y-6">
        <div>
          <div className="h-8 w-40 animate-pulse rounded bg-[var(--color-accent-soft)]" />
          <div className="mt-2 h-4 w-72 animate-pulse rounded bg-[var(--color-surface-2)]" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-2xl bg-[var(--color-surface-2)]"
            />
          ))}
        </div>
      </div>
        </div>
      </RevealOnScroll>
        );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <RevealOnScroll>
        <div className="mx-auto w-full max-w-[1040px] px-6 py-10">
      <div className="space-y-6">
        <h1 className="text-[32px] font-bold leading-none tracking-tight text-[var(--color-fg)]">Invoices</h1>
        <div className="rounded-2xl border border-[var(--color-error)]/20 bg-[var(--color-error)]/[0.05] p-8 text-center backdrop-blur-[24px]">
          <p className="text-sm text-[var(--color-error)]">{error}</p>
          <button
            type="button"
            onClick={fetchInvoices}
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

  // ── Main ──────────────────────────────────────────────────────────────────
  return (
    <RevealOnScroll>
      <div className="mx-auto w-full max-w-[1040px] px-6 py-10">
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[32px] font-bold leading-none tracking-tight text-[var(--color-fg)]">Invoices</h1>
          <p className="mt-2 text-sm text-[var(--color-fg-muted)]">
            Lihat, bayar, dan kelola semua invoice Anda.
            {pendingCount > 0 && (
              <span className="ml-2 text-[var(--color-amber)]">
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
                  ? "border-[var(--color-accent)]/40 bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                  : "border-[var(--color-line)] text-[var(--color-fg-muted)] hover:border-[var(--color-accent)]/25 hover:text-[var(--color-fg)]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Empty */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface-2)] p-12 text-center backdrop-blur-[24px]">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-accent-soft)]">
            <span className="material-symbols-outlined text-[32px] text-[var(--color-accent)]/40">
              receipt_long
            </span>
          </div>
          <h3 className="mt-4 text-lg font-semibold text-[var(--color-fg)]">
            {filter === "all"
              ? "Belum Ada Invoice"
              : `Tidak ada invoice ${filter === "pending" ? "menunggu" : "dibayar"}`}
          </h3>
          <p className="mt-2 text-sm text-[var(--color-fg-dim)]">
            {filter === "all"
              ? "Invoice akan muncul setelah Anda membuat order."
              : "Coba filter lain untuk melihat invoice Anda."}
          </p>
          {filter === "all" && (
            <Link
              href="/marketplace"
              className="mt-6 inline-flex items-center rounded-full bg-[var(--color-accent)] px-6 py-2.5 text-sm font-semibold text-[#0D0B00] shadow-[0_0_20px_var(--color-accent-soft)]"
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
                className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface-2)] p-6 backdrop-blur-[24px] transition-colors hover:border-[var(--color-accent-soft)]"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-[var(--color-fg-dim)]">
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
                      <p className="mt-1 text-xs text-[var(--color-fg-dim)]">
                        Order: {invoice.order.order_number}
                      </p>
                    )}

                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[var(--color-fg-dim)]">
                      <span>{formatDate(invoice.created_at)}</span>
                      {invoice.due_at && isPending && (
                        <>
                          <span>•</span>
                          <span className="text-[var(--color-amber)]/60">
                            Jatuh tempo: {formatDate(invoice.due_at)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Total + actions */}
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-bold text-[var(--color-accent)]">
                      {formatPrice(invoice.total_minor, invoice.currency)}
                    </span>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/invoices/${invoice.public_id}`}
                        className="rounded-full border border-[var(--color-line)] px-4 py-2 text-xs font-medium text-[var(--color-fg-muted)] transition-colors hover:border-[var(--color-accent)]/30 hover:text-[var(--color-fg)]"
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
                          className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-accent)] px-4 py-2 text-xs font-semibold text-[#0D0B00] shadow-[0_0_16px_var(--color-accent-soft)] transition-transform hover:scale-[1.02]"
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
      </div>
    </RevealOnScroll>
    );
}
