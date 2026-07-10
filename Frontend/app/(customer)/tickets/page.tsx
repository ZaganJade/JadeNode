"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiException } from "@/lib/api";
import { RevealOnScroll } from "@/components/landing/reveal-on-scroll";

// ─── Types ──────────────────────────────────────────────────────────────────

type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
type TicketPriority = "low" | "medium" | "high" | "urgent";

interface Ticket {
  public_id: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  last_reply_at: string | null;
  last_reply_by: string | null;
  messages_count: number;
  created_at: string;
}

interface TicketsResponse {
  data: Ticket[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

// ─── Status badge config ────────────────────────────────────────────────────

const statusConfig: Record<TicketStatus, { label: string; style: string }> = {
  open: {
    label: "Open",
    style: "bg-[var(--color-amber)]/10 text-[var(--color-amber)] border-[var(--color-amber)]/20",
  },
  in_progress: {
    label: "Diproses",
    style: "bg-[var(--color-steel)]/10 text-[var(--color-steel)] border-[var(--color-steel)]/20",
  },
  resolved: {
    label: "Terselesaikan",
    style: "bg-[var(--color-success)]/10 text-[var(--color-success)] border-[var(--color-success)]/20",
  },
  closed: {
    label: "Ditutup",
    style: "bg-[var(--color-surface-3)] text-[var(--color-fg-dim)] border-[var(--color-line)]",
  },
};

const priorityConfig: Record<TicketPriority, { label: string; style: string }> = {
  low: {
    label: "Low",
    style: "bg-[var(--color-surface-3)] text-[var(--color-fg-dim)] border-[var(--color-line)]",
  },
  medium: {
    label: "Medium",
    style: "bg-[var(--color-steel)]/10 text-[var(--color-steel)] border-[var(--color-steel)]/20",
  },
  high: {
    label: "High",
    style: "bg-[var(--color-amber)]/10 text-[var(--color-amber)] border-[var(--color-amber)]/20",
  },
  urgent: {
    label: "Urgent",
    style: "bg-[var(--color-error)]/10 text-[var(--color-error)] border-[var(--color-error)]/20",
  },
};

// ─── Format date ────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
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

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTickets() {
      try {
        const res = await api.get<TicketsResponse>("/api/v1/tickets");
        setTickets(res.data ?? []);
      } catch (err) {
        if (err instanceof ApiException && err.status === 401) {
          return;
        }
        setError(
          err instanceof Error ? err.message : "Gagal memuat tiket support.",
        );
      } finally {
        setLoading(false);
      }
    }

    fetchTickets();
  }, []);

  // ── Loading skeleton ────────────────────────────────────────────────────
  if (loading) {
    return (
      <RevealOnScroll>
        <div className="mx-auto w-full max-w-[1040px] px-6 py-10">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-48 animate-pulse rounded bg-[var(--color-accent-soft)]" />
            <div className="mt-2 h-4 w-72 animate-pulse rounded bg-[var(--color-surface-2)]" />
          </div>
          <div className="h-10 w-36 animate-pulse rounded-full bg-[var(--color-accent-soft)]" />
        </div>
        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface-2)] p-6 backdrop-blur-[24px]">
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-lg bg-[var(--color-surface-2)]"
              />
            ))}
          </div>
        </div>
      </div>
        </div>
      </RevealOnScroll>
        );
  }

  // ── Error ───────────────────────────────────────────────────────────────
  if (error) {
    return (
      <RevealOnScroll>
        <div className="mx-auto w-full max-w-[1040px] px-6 py-10">
      <div className="space-y-6">
        <div>
          <h1 className="text-[32px] font-bold leading-none tracking-tight text-[var(--color-fg)]">Support</h1>
        </div>
        <div className="rounded-2xl border border-[var(--color-error)]/20 bg-[var(--color-error)]/[0.05] p-8 backdrop-blur-[24px] text-center">
          <p className="text-sm text-[var(--color-error)]">{error}</p>
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

  // ── Main render ─────────────────────────────────────────────────────────
  return (
    <RevealOnScroll>
      <div className="mx-auto w-full max-w-[1040px] px-6 py-10">
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[32px] font-bold leading-none tracking-tight text-[var(--color-fg)]">Support</h1>
          <p className="mt-2 text-sm text-[var(--color-fg-muted)]">
            Kelola tiket bantuan Anda.
          </p>
        </div>
        <Link
          href="/tickets/new"
          className="inline-flex items-center rounded-full bg-[var(--color-accent)] px-6 py-2.5 text-sm font-semibold text-[#0D0B00] shadow-[0_0_20px_var(--color-accent-soft)] transition-all hover:shadow-[0_0_30px_rgba(198,242,74,0.4)]"
        >
          <svg
            className="mr-2 h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          Buat Tiket
        </Link>
      </div>

      {/* Empty state */}
      {tickets.length === 0 && (
        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface-2)] p-12 backdrop-blur-[24px] text-center">
          <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-[var(--color-accent-soft)]">
            <svg
              className="h-8 w-8 text-[var(--color-accent)]/40"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"
              />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-semibold text-[var(--color-fg)]">
            Belum Ada Tiket
          </h3>
          <p className="mt-2 text-sm text-[var(--color-fg-dim)]">
            Jika Anda membutuhkan bantuan, buat tiket baru dan tim kami akan
            segera membantu.
          </p>
          <Link
            href="/tickets/new"
            className="mt-6 inline-flex items-center rounded-full bg-[var(--color-accent)] px-6 py-2.5 text-sm font-semibold text-[#0D0B00] shadow-[0_0_20px_var(--color-accent-soft)]"
          >
            Buat Tiket Baru
          </Link>
        </div>
      )}

      {/* Tickets list */}
      {tickets.length > 0 && (
        <div className="space-y-3">
          {tickets.map((ticket) => {
            const status = statusConfig[ticket.status] ?? {
              label: ticket.status,
              style:
                "bg-[var(--color-surface-3)] text-[var(--color-fg-dim)] border-[var(--color-line)]",
            };
            const priority = priorityConfig[ticket.priority] ?? {
              label: ticket.priority,
              style:
                "bg-[var(--color-surface-3)] text-[var(--color-fg-dim)] border-[var(--color-line)]",
            };

            return (
              <Link
                key={ticket.public_id}
                href={`/tickets/${ticket.public_id}`}
                className="group block"
              >
                <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface-2)] p-6 backdrop-blur-[24px] transition-colors hover:border-[var(--color-accent-soft)]">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    {/* Left: ticket info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <span
                          className={`rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${status.style}`}
                        >
                          {status.label}
                        </span>
                        <span
                          className={`rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${priority.style}`}
                        >
                          {priority.label}
                        </span>
                      </div>

                      <h3 className="mt-2 text-sm font-semibold text-[var(--color-fg)] truncate">
                        {ticket.subject}
                      </h3>

                      <div className="mt-1 flex items-center gap-3 text-xs text-[var(--color-fg-dim)]">
                        <span>{formatDate(ticket.created_at)}</span>
                        <span>•</span>
                        <span>{ticket.messages_count} pesan</span>
                      </div>
                    </div>

                    {/* Right: last reply + arrow */}
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-[10px] text-[var(--color-fg-dim)] uppercase tracking-wider">
                          Balasan Terakhir
                        </p>
                        <p className="text-xs text-[var(--color-fg-muted)]">
                          {formatDate(ticket.last_reply_at)}
                        </p>
                      </div>
                      <svg
                        className="h-4 w-4 text-[var(--color-fg)]/20 transition-transform group-hover:translate-x-1 group-hover:text-[var(--color-accent)]/60"
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
      </div>
    </RevealOnScroll>
    );
}
