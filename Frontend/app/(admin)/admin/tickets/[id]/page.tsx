"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api, ApiException } from "@/lib/api";

// ─── Types ──────────────────────────────────────────────────────────────────

type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
type TicketPriority = "low" | "medium" | "high" | "urgent";

interface TicketMessage {
  id: number;
  sender_type: "customer" | "admin";
  message: string;
  created_at: string;
}

interface TicketUser {
  id: number;
  name: string;
  email: string;
}

interface TicketDetail {
  public_id: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  last_reply_at: string | null;
  last_reply_by: string | null;
  messages_count: number;
  user: TicketUser;
  created_at: string;
}

interface TicketShowResponse {
  ticket: TicketDetail;
  messages: TicketMessage[];
}

// ─── Badge configs ──────────────────────────────────────────────────────────

const statusConfig: Record<TicketStatus, { label: string; variant: string }> = {
  open: { label: "Open", variant: "warning" },
  in_progress: { label: "In Progress", variant: "info" },
  resolved: { label: "Resolved", variant: "success" },
  closed: { label: "Closed", variant: "default" },
};

const priorityConfig: Record<TicketPriority, { label: string; variant: string }> = {
  low: { label: "Low", variant: "default" },
  medium: { label: "Medium", variant: "info" },
  high: { label: "High", variant: "warning" },
  urgent: { label: "Urgent", variant: "error" },
};

const badgeStyles: Record<string, string> = {
  default: "bg-neutral-500/10 text-neutral-400 border-neutral-500/20",
  info: "bg-info-500/10 text-info-400 border-info-500/20",
  success: "bg-success-500/10 text-success-400 border-success-500/20",
  warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  error: "bg-error-500/10 text-error-400 border-error-500/20",
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

export default function AdminTicketDetailPage() {
  const params = useParams<{ id: string }>();
  const ticketId = params.id;

  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchTicket = useCallback(async () => {
    try {
      const data = await api.get<TicketShowResponse>(
        `/api/v1/admin/tickets/${ticketId}`,
      );
      setTicket(data.ticket);
      setMessages(data.messages ?? []);
    } catch (err) {
      if (err instanceof ApiException && err.status === 404) {
        setError("Tiket tidak ditemukan.");
      } else {
        setError(
          err instanceof Error ? err.message : "Gagal memuat detail tiket.",
        );
      }
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    fetchTicket();
  }, [fetchTicket]);

  const handleReply = useCallback(async () => {
    if (!replyText.trim() || !ticket) return;
    setReplying(true);
    try {
      const data = await api.post<{ ticket_message: TicketMessage }>(
        `/api/v1/admin/tickets/${ticket.public_id}/reply`,
        { message: replyText },
      );
      setMessages((prev) => [...prev, data.ticket_message]);
      setReplyText("");
      fetchTicket();
    } catch (err) {
      setError(
        err instanceof ApiException
          ? err.message
          : "Gagal mengirim balasan.",
      );
    } finally {
      setReplying(false);
    }
  }, [replyText, ticket, fetchTicket]);

  const handleStatusChange = useCallback(
    async (newStatus: TicketStatus) => {
      if (!ticket) return;
      setUpdatingStatus(true);
      try {
        await api.put(`/api/v1/admin/tickets/${ticket.public_id}/status`, {
          status: newStatus,
        });
        fetchTicket();
      } catch (err) {
        setError(
          err instanceof ApiException
            ? err.message
            : "Gagal mengubah status.",
        );
      } finally {
        setUpdatingStatus(false);
      }
    },
    [ticket, fetchTicket],
  );

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 animate-pulse rounded bg-secondary-200" />
        <div className="h-[200px] animate-pulse rounded-lg bg-secondary-100" />
        <div className="h-[150px] animate-pulse rounded-lg bg-secondary-100" />
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (error || !ticket) {
    return (
      <div className="space-y-6">
        <Link
          href="/admin/tickets"
          className="text-sm text-primary-600 hover:text-primary-700"
        >
          ← Kembali ke Tickets
        </Link>
        <div className="rounded-lg border border-error-500/20 bg-error-500/5 p-8 text-center">
          <h2 className="text-lg font-semibold text-foreground">
            {error ?? "Gagal memuat detail tiket."}
          </h2>
        </div>
      </div>
    );
  }

  const status = statusConfig[ticket.status] ?? {
    label: ticket.status,
    variant: "default",
  };
  const priority = priorityConfig[ticket.priority] ?? {
    label: ticket.priority,
    variant: "default",
  };

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/admin/tickets"
        className="text-sm text-primary-600 hover:text-primary-700"
      >
        ← Kembali ke Tickets
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">
              {ticket.subject}
            </h1>
            <span
              className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${badgeStyles[status.variant]}`}
            >
              {status.label}
            </span>
            <span
              className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${badgeStyles[priority.variant]}`}
            >
              {priority.label}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-4 text-sm text-foreground-muted">
            <span>
              Customer: <strong className="text-foreground">{ticket.user.name}</strong>{" "}
              ({ticket.user.email})
            </span>
            <span>•</span>
            <span>Dibuat {formatDate(ticket.created_at)}</span>
          </div>
        </div>

        {/* Status change buttons */}
        <div className="flex items-center gap-2">
          {ticket.status !== "in_progress" && (
            <button
              type="button"
              onClick={() => handleStatusChange("in_progress")}
              disabled={updatingStatus}
              className="rounded-lg border border-info-500/20 bg-info-500/10 px-3 py-1.5 text-xs font-medium text-info-400 transition-colors hover:bg-info-500/20 disabled:opacity-50"
            >
              In Progress
            </button>
          )}
          {ticket.status !== "resolved" && (
            <button
              type="button"
              onClick={() => handleStatusChange("resolved")}
              disabled={updatingStatus}
              className="rounded-lg border border-success-500/20 bg-success-500/10 px-3 py-1.5 text-xs font-medium text-success-400 transition-colors hover:bg-success-500/20 disabled:opacity-50"
            >
              Resolved
            </button>
          )}
          {ticket.status !== "closed" && (
            <button
              type="button"
              onClick={() => handleStatusChange("closed")}
              disabled={updatingStatus}
              className="rounded-lg border border-neutral-500/20 bg-neutral-500/10 px-3 py-1.5 text-xs font-medium text-neutral-400 transition-colors hover:bg-neutral-500/20 disabled:opacity-50"
            >
              Closed
            </button>
          )}
        </div>
      </div>

      {/* ─── Message Thread ──────────────────────────────────────────────── */}
      <div className="rounded-lg border border-secondary-200 bg-white overflow-hidden">
        <div className="border-b border-secondary-200 bg-secondary-50 px-4 py-3">
          <h2 className="text-sm font-medium text-foreground">
            Pesan ({messages.length})
          </h2>
        </div>

        <div className="p-4 space-y-4">
          {messages.map((msg) => {
            const isAdmin = msg.sender_type === "admin";

            return (
              <div key={msg.id} className="flex gap-3">
                {/* Avatar */}
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold uppercase ${
                    isAdmin
                      ? "bg-primary-500/10 text-primary-600"
                      : "bg-secondary-200 text-secondary-600"
                  }`}
                >
                  {isAdmin ? "A" : "C"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">
                      {isAdmin ? "Admin" : ticket.user.name}
                    </span>
                    <span className="text-[10px] text-foreground-muted">
                      {formatDate(msg.created_at)}
                    </span>
                  </div>
                  <div
                    className={`mt-1 rounded-lg px-4 py-3 text-sm ${
                      isAdmin
                        ? "border border-primary-500/10 bg-primary-500/5 text-foreground"
                        : "bg-secondary-50 text-foreground"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.message}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Reply Form ──────────────────────────────────────────────────── */}
      {ticket.status !== "closed" && (
        <div className="rounded-lg border border-secondary-200 bg-white overflow-hidden">
          <div className="border-b border-secondary-200 bg-secondary-50 px-4 py-3">
            <h2 className="text-sm font-medium text-foreground">
              Balas Tiket
            </h2>
          </div>
          <div className="p-4 space-y-4">
            <textarea
              rows={4}
              placeholder="Tulis balasan Anda..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="block w-full rounded-lg border border-secondary-200 px-4 py-3 text-sm text-foreground placeholder:text-secondary-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleReply}
                disabled={replying || !replyText.trim()}
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
              >
                {replying ? "Mengirim..." : "Kirim Balasan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
