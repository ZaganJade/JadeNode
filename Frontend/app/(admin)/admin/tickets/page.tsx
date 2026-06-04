"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { api, ApiException } from "@/lib/api";

// ─── Types ──────────────────────────────────────────────────────────────────

type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
type TicketPriority = "low" | "medium" | "high" | "urgent";

interface TicketUser {
  id: number;
  name: string;
  email: string;
}

interface Ticket {
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

interface TicketsResponse {
  data: Ticket[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
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

export default function AdminTicketsPage() {
  const [data, setData] = useState<TicketsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  const fetchTickets = useCallback(
    async (page?: number) => {
      setLoading(true);
      setError("");
      try {
        const params: Record<string, string> = {};
        if (page) params.page = String(page);
        if (statusFilter) params.status = statusFilter;
        if (priorityFilter) params.priority = priorityFilter;

        const result = await api.get<TicketsResponse>(
          "/api/v1/admin/tickets",
          { params },
        );
        setData(result);
      } catch (err) {
        if (err instanceof ApiException) {
          setError(err.message);
        } else {
          setError("Gagal memuat data tiket.");
        }
      } finally {
        setLoading(false);
      }
    },
    [statusFilter, priorityFilter],
  );

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Support Tickets
        </h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Kelola tiket bantuan dari customer.
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-secondary-200 bg-white px-3 py-2 text-sm text-foreground focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
        >
          <option value="">Semua Status</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="rounded-lg border border-secondary-200 bg-white px-3 py-2 text-sm text-foreground focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
        >
          <option value="">Semua Prioritas</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>

        {data && (
          <span className="ml-auto text-xs text-foreground-muted">
            {data.meta.total} total
          </span>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-error-500/20 bg-error-500/5 px-4 py-3 text-sm text-error-400">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border border-secondary-200 bg-white overflow-hidden">
        {loading && !data ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
          </div>
        ) : data && data.data.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-secondary-200 bg-secondary-50">
                    <th className="px-4 py-3 text-left font-medium text-foreground-muted">
                      Customer
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-foreground-muted">
                      Subjek
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-foreground-muted">
                      Prioritas
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-foreground-muted">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-foreground-muted">
                      Balasan Terakhir
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-foreground-muted">
                      Tanggal
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary-100">
                  {data.data.map((ticket) => {
                    const status = statusConfig[ticket.status] ?? {
                      label: ticket.status,
                      variant: "default",
                    };
                    const priority = priorityConfig[ticket.priority] ?? {
                      label: ticket.priority,
                      variant: "default",
                    };

                    return (
                      <tr
                        key={ticket.public_id}
                        className="transition-colors hover:bg-secondary-50"
                      >
                        <td className="px-4 py-3">
                          <Link
                            href={`/admin/tickets/${ticket.public_id}`}
                            className="font-medium text-foreground hover:text-primary-600"
                          >
                            {ticket.user.name}
                          </Link>
                          <p className="text-xs text-foreground-muted">
                            {ticket.user.email}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/admin/tickets/${ticket.public_id}`}
                            className="font-medium text-foreground hover:text-primary-600"
                          >
                            {ticket.subject}
                          </Link>
                          <p className="text-xs text-foreground-muted">
                            {ticket.messages_count} pesan
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${badgeStyles[priority.variant]}`}
                          >
                            {priority.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${badgeStyles[status.variant]}`}
                          >
                            {status.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-foreground-muted">
                          {formatDate(ticket.last_reply_at)}
                          {ticket.last_reply_by && (
                            <p className="text-[10px] uppercase">
                              by {ticket.last_reply_by}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-foreground-muted">
                          {formatDate(ticket.created_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data.meta.last_page > 1 && (
              <div className="flex items-center justify-between border-t border-secondary-200 px-4 py-3">
                <button
                  type="button"
                  disabled={data.meta.current_page <= 1}
                  onClick={() => fetchTickets(data.meta.current_page - 1)}
                  className="rounded-lg border border-secondary-200 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary-50 disabled:opacity-50"
                >
                  Sebelumnya
                </button>
                <span className="text-xs text-foreground-muted">
                  Halaman {data.meta.current_page} dari {data.meta.last_page}
                </span>
                <button
                  type="button"
                  disabled={data.meta.current_page >= data.meta.last_page}
                  onClick={() => fetchTickets(data.meta.current_page + 1)}
                  className="rounded-lg border border-secondary-200 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary-50 disabled:opacity-50"
                >
                  Berikutnya
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="p-8 text-center">
            <p className="text-sm text-foreground-muted">
              Belum ada tiket support.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
