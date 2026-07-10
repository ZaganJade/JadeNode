"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api, ApiException } from "@/lib/api";
import { formatPrice } from "@/lib/formatters";
import { RevealOnScroll } from "@/components/landing/reveal-on-scroll";

// ─── Types ──────────────────────────────────────────────────────────────────

type InvoiceStatus = "pending" | "paid" | "cancelled" | "void";

interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

interface PaymentInfo {
  method: string;
  paid_at: string;
  amount: number;
  currency: string;
  reference: string | null;
}

interface InvoiceDetail {
  public_id: string;
  invoice_number: string;
  status: InvoiceStatus;
  subtotal: number;
  total: number;
  currency: string;
  order_public_id: string;
  order_number: string | null;
  due_date: string | null;
  paid_at: string | null;
  items: InvoiceItem[];
  payment: PaymentInfo | null;
  created_at: string;
  updated_at: string;
}

// ─── Status badge config ────────────────────────────────────────────────────

const statusConfig: Record<
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

// ─── Format date ────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function InvoiceDetailPage() {
  const params = useParams<{ id: string }>();
  const invoiceId = params.id;

  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch invoice ───────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function fetchInvoice() {
      try {
        const data = await api.get<InvoiceDetail>(
          `/api/v1/invoices/${invoiceId}`,
        );
        if (!cancelled) setInvoice(data);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiException && err.status === 404) {
          setError("Invoice tidak ditemukan.");
        } else {
          setError(
            err instanceof Error
              ? err.message
              : "Gagal memuat detail invoice.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchInvoice();
    return () => {
      cancelled = true;
    };
  }, [invoiceId]);

  // ── Loading skeleton ────────────────────────────────────────────────────
  if (loading) {
    return (
      <RevealOnScroll>
        <div className="mx-auto w-full max-w-[1040px] px-6 py-10">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 animate-pulse rounded bg-[var(--color-accent-soft)]" />
          <div className="h-8 w-48 animate-pulse rounded bg-[var(--color-accent-soft)]" />
        </div>
        <div className="h-[250px] animate-pulse rounded-2xl bg-[var(--color-accent-soft)]" />
        <div className="h-[100px] animate-pulse rounded-2xl bg-[var(--color-surface-2)]" />
      </div>
        </div>
      </RevealOnScroll>
        );
  }

  // ── Error / not found ───────────────────────────────────────────────────
  if (error || !invoice) {
    return (
      <RevealOnScroll>
        <div className="mx-auto w-full max-w-[1040px] px-6 py-10">
      <div className="space-y-6">
        <Link
          href="/invoices"
          className="inline-flex items-center gap-1 text-sm text-[var(--color-accent)]/60 transition-colors hover:text-[var(--color-accent)]"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Kembali ke Invoices
        </Link>
        <div className="rounded-2xl border border-[var(--color-error)]/20 bg-[var(--color-error)]/[0.05] p-8 backdrop-blur-[24px] text-center">
          <h2 className="text-lg font-semibold text-[var(--color-fg)]">
            {error ?? "Gagal memuat detail invoice."}
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

  const statusInfo = statusConfig[invoice.status] ?? statusConfig.pending;
  const isPaid = invoice.status === "paid";

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <RevealOnScroll>
      <div className="mx-auto w-full max-w-[1040px] px-6 py-10">
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/invoices"
        className="inline-flex items-center gap-1 text-sm text-[var(--color-accent)]/60 transition-colors hover:text-[var(--color-accent)]"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        Kembali ke Invoices
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[32px] font-bold leading-none tracking-tight text-[var(--color-fg)]">
              Invoice #{invoice.invoice_number ?? invoice.public_id}
            </h1>
            <span
              className={`rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${statusInfo.style}`}
            >
              {statusInfo.label}
            </span>
          </div>
          <p className="mt-1 text-sm text-[var(--color-fg-dim)]">
            Dibuat pada {formatDate(invoice.created_at)}
          </p>
        </div>

        <div className="text-right">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--color-accent)]/50">
            Total
          </p>
          <p className="text-2xl font-bold text-[var(--color-accent)]">
            {formatPrice(invoice.total, invoice.currency)}
          </p>
        </div>
      </div>

      {/* ─── Order Info ───────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface-2)] p-6 backdrop-blur-[24px]">
        <h2 className="mb-4 font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--color-accent)]/60">
          Informasi Order
        </h2>

        <div className="space-y-3">
          {invoice.order_number && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--color-fg-muted)]">Nomor Order</span>
              <Link
                href={`/orders/${invoice.order_public_id}`}
                className="font-mono text-xs text-[var(--color-accent)] hover:underline"
              >
                {invoice.order_number}
              </Link>
            </div>
          )}

          {invoice.due_date && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--color-fg-muted)]">Jatuh Tempo</span>
              <span
                className={
                  invoice.status === "pending"
                    ? "text-[var(--color-amber)]"
                    : "text-[var(--color-fg)]"
                }
              >
                {formatDate(invoice.due_date)}
              </span>
            </div>
          )}

          {invoice.paid_at && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--color-fg-muted)]">Dibayar pada</span>
              <span className="text-[var(--color-success)]">
                {formatDate(invoice.paid_at)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ─── Items Breakdown ──────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface-2)] p-6 backdrop-blur-[24px]">
        <h2 className="mb-4 font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--color-accent)]/60">
          Rincian
        </h2>

        <div className="space-y-3">
          {invoice.items.map((item, idx) => (
            <div
              key={idx}
              className="flex items-start justify-between text-sm"
            >
              <div>
                <p className="text-[var(--color-fg)]">{item.description}</p>
                {item.quantity > 1 && (
                  <p className="text-xs text-[var(--color-fg-dim)]">
                    {formatPrice(item.unit_price, invoice.currency)} &times;{" "}
                    {item.quantity}
                  </p>
                )}
              </div>
              <span className="font-medium text-[var(--color-fg)]">
                {formatPrice(item.subtotal, invoice.currency)}
              </span>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="mt-4 border-t border-[var(--color-line)] pt-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--color-fg-muted)]">Subtotal</span>
            <span className="text-[var(--color-fg)]">
              {formatPrice(invoice.subtotal, invoice.currency)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--color-accent)]/60">
              Total
            </span>
            <span className="text-xl font-bold text-[var(--color-accent)]">
              {formatPrice(invoice.total, invoice.currency)}
            </span>
          </div>
        </div>
      </div>

      {/* ─── Payment Info (for paid invoices) ─────────────────────────────── */}
      {isPaid && invoice.payment && (
        <div className="rounded-2xl border border-[var(--color-success)]/10 bg-[var(--color-success)]/5 p-6 backdrop-blur-[24px]">
          <h2 className="mb-4 font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--color-success)]/60">
            Informasi Pembayaran
          </h2>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--color-fg-muted)]">Metode</span>
              <span className="text-[var(--color-fg)]">
                {invoice.payment.method ?? "Midtrans Snap"}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--color-fg-muted)]">Waktu Pembayaran</span>
              <span className="text-[var(--color-success)]">
                {formatDate(invoice.payment.paid_at)}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--color-fg-muted)]">Jumlah Dibayar</span>
              <span className="font-semibold text-[var(--color-fg)]">
                {formatPrice(invoice.payment.amount, invoice.payment.currency)}
              </span>
            </div>

            {invoice.payment.reference && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--color-fg-muted)]">Referensi</span>
                <span className="font-mono text-xs text-[var(--color-fg-muted)]">
                  {invoice.payment.reference}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Actions ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3">
        {isPaid && (
          <span
            title="PDF generation coming soon"
            className="pointer-events-none inline-flex items-center gap-2 rounded-full bg-[var(--color-accent)] px-6 py-2.5 text-sm font-semibold text-[#0D0B00] opacity-50 cursor-not-allowed"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
              />
            </svg>
            Unduh PDF
            <span className="text-[10px] font-normal opacity-70">(segera)</span>
          </span>
        )}

        {invoice.status === "pending" && invoice.order_public_id && (
          <Link
            href={`/orders/${invoice.order_public_id}`}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--color-line)] bg-[var(--color-surface-2)] px-6 py-2.5 text-sm font-medium text-[var(--color-fg-muted)] transition-colors hover:border-[var(--color-accent)]/30 hover:text-[var(--color-fg)]"
          >
            Bayar Sekarang
          </Link>
        )}

        {invoice.order_public_id && (
          <Link
            href={`/orders/${invoice.order_public_id}`}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--color-line)] bg-transparent px-6 py-2.5 text-sm font-medium text-[var(--color-fg-dim)] transition-colors hover:border-[var(--color-accent-soft)] hover:text-[var(--color-fg-muted)]"
          >
            Lihat Order
          </Link>
        )}
      </div>
    </div>
      </div>
    </RevealOnScroll>
    );
}
