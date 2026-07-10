"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api, ApiException } from "@/lib/api";
import { RevealOnScroll } from "@/components/landing/reveal-on-scroll";

// ─── Types ──────────────────────────────────────────────────────────────────

type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
type TicketPriority = "low" | "medium" | "high" | "urgent";

interface TicketMessage {
  id: number;
  sender_type: "customer" | "admin";
  message: string;
  created_at: string;
}

interface TicketDetail {
  public_id: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  last_reply_at: string | null;
  last_reply_by: string | null;
  messages_count: number;
  created_at: string;
}

interface TicketShowResponse {
  ticket: TicketDetail;
  messages: TicketMessage[];
}

// ─── Status/Priority badge config ───────────────────────────────────────────

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

export default function TicketDetailPage() {
  const params = useParams<{ id: string }>();
  const ticketId = params.id;

  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchTicket() {
      try {
        const data = await api.get<TicketShowResponse>(
          `/api/v1/tickets/${ticketId}`,
        );
        if (!cancelled) {
          setTicket(data.ticket);
          setMessages(data.messages ?? []);
        }
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiException && err.status === 404) {
          setError("Tiket tidak ditemukan.");
        } else {
          setError(
            err instanceof Error ? err.message : "Gagal memuat detail tiket.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchTicket();
    return () => {
      cancelled = true;
    };
  }, [ticketId]);

  const handleReply = useCallback(async () => {
    if (!replyText.trim() || !ticket) return;
    setReplying(true);
    try {
      const data = await api.post<{ ticket_message: TicketMessage }>(
        `/api/v1/tickets/${ticket.public_id}/reply`,
        { message: replyText },
      );
      setMessages((prev) => [...prev, data.ticket_message]);
      setReplyText("");
    } catch (err) {
      setError(
        err instanceof ApiException
          ? err.message
          : "Gagal mengirim balasan.",
      );
    } finally {
      setReplying(false);
    }
  }, [replyText, ticket]);

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
      </div>
        </div>
      </RevealOnScroll>
        );
  }

  // ── Error / not found ───────────────────────────────────────────────────
  if (error || !ticket) {
    return (
      <RevealOnScroll>
        <div className="mx-auto w-full max-w-[1040px] px-6 py-10">
      <div className="space-y-6">
        <Link
          href="/tickets"
          className="inline-flex items-center gap-1 text-sm text-[var(--color-accent)]/60 transition-colors hover:text-[var(--color-accent)]"
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
              d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
            />
          </svg>
          Kembali ke Support
        </Link>
        <div className="rounded-2xl border border-[var(--color-error)]/20 bg-[var(--color-error)]/[0.05] p-8 backdrop-blur-[24px] text-center">
          <h2 className="text-lg font-semibold text-[var(--color-fg)]">
            {error ?? "Gagal memuat detail tiket."}
          </h2>
        </div>
      </div>
        </div>
      </RevealOnScroll>
        );
  }

  const status = statusConfig[ticket.status] ?? {
    label: ticket.status,
    style: "bg-[var(--color-surface-3)] text-[var(--color-fg-dim)] border-[var(--color-line)]",
  };
  const priority = priorityConfig[ticket.priority] ?? {
    label: ticket.priority,
    style: "bg-[var(--color-surface-3)] text-[var(--color-fg-dim)] border-[var(--color-line)]",
  };

  const canReply = !["closed", "resolved"].includes(ticket.status);

  return (
    <RevealOnScroll>
      <div className="mx-auto w-full max-w-[1040px] px-6 py-10">
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/tickets"
        className="inline-flex items-center gap-1 text-sm text-[var(--color-accent)]/60 transition-colors hover:text-[var(--color-accent)]"
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
            d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
          />
        </svg>
        Kembali ke Support
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[32px] font-bold leading-none tracking-tight text-[var(--color-fg)]">
              {ticket.subject}
            </h1>
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
          <p className="mt-1 text-sm text-[var(--color-fg-dim)]">
            Dibuat pada {formatDate(ticket.created_at)}
          </p>
        </div>
      </div>

      {/* ─── Message Thread ──────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface-2)] p-6 backdrop-blur-[24px]">
        <h2 className="mb-6 font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--color-accent)]/60">
          Pesan ({messages.length})
        </h2>

        <div className="space-y-4">
          {messages.map((msg) => {
            const isAdmin = msg.sender_type === "admin";

            return (
              <div
                key={msg.id}
                className={`flex ${isAdmin ? "justify-start" : "justify-end"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-5 py-3.5 ${
                    isAdmin
                      ? "border border-[var(--color-line)] bg-[var(--color-surface-2)]"
                      : "bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20"
                  }`}
                >
                  <div className="mb-1 flex items-center gap-2">
                    <span
                      className={`text-[10px] font-medium uppercase tracking-wider ${
                        isAdmin
                          ? "text-[var(--color-accent)]/60"
                          : "text-[var(--color-accent)]/80"
                      }`}
                    >
                      {isAdmin ? "Admin" : "Anda"}
                    </span>
                    <span className="text-[10px] text-[var(--color-fg-dim)]">
                      {formatDate(msg.created_at)}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-[var(--color-fg)]">
                    {msg.message}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Reply Form ──────────────────────────────────────────────────── */}
      {canReply && (
        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface-2)] p-6 backdrop-blur-[24px]">
          <h2 className="mb-4 font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--color-accent)]/60">
            Balas Tiket
          </h2>
          <div className="space-y-4">
            <textarea
              rows={4}
              placeholder="Tulis balasan Anda..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="block w-full rounded-xl border border-[var(--color-accent-soft)] bg-[var(--color-surface-2)] px-4 py-3 text-sm text-[var(--color-fg)] placeholder-[var(--color-fg)]/30 transition-colors focus:border-[var(--color-accent)]/30 focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]/20"
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleReply}
                disabled={replying || !replyText.trim()}
                className="inline-flex items-center rounded-full bg-[var(--color-accent)] px-6 py-2.5 text-sm font-semibold text-[#0D0B00] shadow-[0_0_20px_var(--color-accent-soft)] transition-all hover:shadow-[0_0_30px_rgba(198,242,74,0.4)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {replying ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-[#0D0B00]/20 border-t-[#0D0B00]" />
                    Mengirim...
                  </>
                ) : (
                  "Kirim Balasan"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {!canReply && (
        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface-2)] p-6 backdrop-blur-[24px] text-center">
          <p className="text-sm text-[var(--color-fg-dim)]">
            Tiket ini sudah {ticket.status === "resolved" ? "terselesaikan" : "ditutup"}.
            Buat tiket baru jika membutuhkan bantuan tambahan.
          </p>
        </div>
      )}
    </div>
      </div>
    </RevealOnScroll>
    );
}
