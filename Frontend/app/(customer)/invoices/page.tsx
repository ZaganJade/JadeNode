"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiException } from "@/lib/api";
import { formatPrice } from "@/lib/formatters";

// ─── Types ──────────────────────────────────────────────────────────────────

type InvoiceStatus = "pending" | "paid" | "cancelled" | "void";

interface Invoice {
  public_id: string;
  invoice_number: string;
  status: InvoiceStatus;
  total: number;
  currency: string;
  order_public_id: string;
  order_number: string | null;
  due_date: string | null;
  paid_at: string | null;
  created_at: string;
}

interface InvoicesResponse {
  data: Invoice[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

// ─── Status badge config ────────────────────────────────────────────────────

const statusConfig: Record<
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

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchInvoices() {
      try {
        const res = await api.get<InvoicesResponse>("/api/v1/invoices");
        setInvoices(res.data ?? []);
      } catch (err) {
        if (err instanceof ApiException && err.status === 401) {
          return;
        }
        setError(
          err instanceof Error ? err.message : "Gagal memuat daftar invoice.",
        );
      } finally {
        setLoading(false);
      }
    }

    fetchInvoices();
  }, []);

  // ── Loading skeleton ────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-8 w-40 animate-pulse rounded bg-[rgba(255,191,0,0.08)]" />
          <div className="mt-2 h-4 w-72 animate-pulse rounded bg-[rgba(255,191,0,0.05)]" />
        </div>
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
          <h1 className="text-2xl font-bold text-[#F5F5F0]">Invoices</h1>
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
        <h1 className="text-2xl font-bold text-[#F5F5F0]">Invoices</h1>
        <p className="mt-1 text-sm text-[#F5F5F0]/50">
          Lihat dan kelola semua invoice Anda.
        </p>
      </div>

      {/* Empty state */}
      {invoices.length === 0 && (
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
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
              />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-semibold text-[#F5F5F0]">
            Belum Ada Invoice
          </h3>
          <p className="mt-2 text-sm text-[#F5F5F0]/40">
            Invoice akan muncul setelah Anda membuat order.
          </p>
          <Link
            href="/marketplace"
            className="mt-6 inline-flex items-center rounded-full bg-[#FFBF00] px-6 py-2.5 text-sm font-semibold text-[#0D0B00] shadow-[0_0_20px_rgba(255,191,0,0.25)]"
          >
            Jelajahi Marketplace
          </Link>
        </div>
      )}

      {/* Invoices list */}
      {invoices.length > 0 && (
        <div className="space-y-3">
          {invoices.map((invoice) => {
            const status = statusConfig[invoice.status] ?? statusConfig.pending;

            return (
              <Link
                key={invoice.public_id}
                href={`/invoices/${invoice.public_id}`}
                className="group block"
              >
                <div className="rounded-2xl border border-[rgba(255,191,0,0.08)] bg-[rgba(25,20,0,0.4)] p-6 backdrop-blur-[24px] transition-colors hover:border-[rgba(255,191,0,0.18)]">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    {/* Left: invoice info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs text-[#F5F5F0]/40">
                          {invoice.invoice_number ?? invoice.public_id}
                        </span>
                        <span
                          className={`rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${status.style}`}
                        >
                          {status.label}
                        </span>
                      </div>

                      {invoice.order_number && (
                        <p className="mt-1 text-xs text-[#F5F5F0]/40">
                          Order: {invoice.order_number}
                        </p>
                      )}

                      <div className="mt-1 flex items-center gap-3 text-xs text-[#F5F5F0]/40">
                        <span>{formatDate(invoice.created_at)}</span>
                        {invoice.due_date && invoice.status === "pending" && (
                          <>
                            <span>•</span>
                            <span className="text-amber-400/60">
                              Jatuh tempo: {formatDate(invoice.due_date)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Right: total + arrow */}
                    <div className="flex items-center gap-4">
                      <span className="text-lg font-bold text-[#FFBF00]">
                        {formatPrice(invoice.total, invoice.currency)}
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
