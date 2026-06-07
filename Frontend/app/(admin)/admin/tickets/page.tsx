"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { api, ApiException } from "@/lib/api";
import { RevealOnScroll } from "@/components/landing/reveal-on-scroll";

type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
type TicketPriority = "low" | "medium" | "high" | "urgent";

interface TicketUser { id: number; name: string; email: string }
interface Ticket {
  public_id: string; subject: string; status: TicketStatus; priority: TicketPriority;
  last_reply_at: string | null; last_reply_by: string | null; messages_count: number;
  user: TicketUser; created_at: string;
}
interface TicketsResponse { data: Ticket[]; meta: { current_page: number; last_page: number; per_page: number; total: number } }

const STATUS_COLORS: Record<TicketStatus, { color: string; bg: string; border: string }> = {
  open: { color: "var(--color-amber)", bg: "rgba(245,179,71,0.08)", border: "rgba(245,179,71,0.18)" },
  in_progress: { color: "var(--color-accent)", bg: "var(--color-accent-soft)", border: "rgba(255,116,0,0.15)" },
  resolved: { color: "var(--color-success)", bg: "rgba(108,232,166,0.08)", border: "rgba(108,232,166,0.18)" },
  closed: { color: "var(--color-fg-dim)", bg: "rgba(255,255,255,0.03)", border: "rgba(255,255,255,0.06)" },
};

const PRIORITY_COLORS: Record<TicketPriority, { color: string; bg: string; border: string }> = {
  low: { color: "var(--color-fg-dim)", bg: "rgba(255,255,255,0.03)", border: "rgba(255,255,255,0.06)" },
  medium: { color: "var(--color-steel)", bg: "rgba(122,150,177,0.08)", border: "rgba(122,150,177,0.15)" },
  high: { color: "var(--color-amber)", bg: "rgba(245,179,71,0.08)", border: "rgba(245,179,71,0.18)" },
  urgent: { color: "var(--color-error)", bg: "rgba(255,122,122,0.08)", border: "rgba(255,122,122,0.18)" },
};

function formatDate(d: string | null) { if (!d) return "—"; try { return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }); } catch { return d; } }

export default function AdminTicketsPage() {
  const [data, setData] = useState<TicketsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  const fetchTickets = useCallback(async (page?: number) => {
    setLoading(true); setError("");
    try {
      const params: Record<string, string> = {};
      if (page) params.page = String(page);
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      setData(await api.get<TicketsResponse>("/api/v1/admin/tickets", { params }));
    } catch (err) { setError(err instanceof ApiException ? err.message : "Gagal memuat data tiket."); }
    finally { setLoading(false); }
  }, [statusFilter, priorityFilter]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  return (
    <RevealOnScroll>
      <div className="mx-auto w-full max-w-[1320px] px-6 py-8">
        <section className="reveal-rise mb-8">
          <p className="studio-eyebrow text-accent">Support</p>
          <h1 className="studio-display mt-3 text-[clamp(28px,4vw,44px)] text-[var(--color-fg)]">Support Tickets</h1>
          <p className="mt-2 text-[13px] text-[var(--color-fg-muted)]">Kelola tiket bantuan dari customer.</p>
        </section>

        {error && <div className="reveal-rise mb-6 flex items-center gap-2 rounded-2xl border border-[var(--color-error)]/20 bg-[var(--color-error)]/5 px-5 py-3"><span className="material-symbols-outlined text-[18px] text-[var(--color-error)]" style={{ fontVariationSettings: '"FILL" 0, "wght" 300' }}>error</span><p className="text-[13px] text-[var(--color-error)]">{error}</p></div>}

        {/* Filters */}
        <section className="reveal-rise mb-6 flex flex-wrap items-end gap-3 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)]/50 p-4">
          <div className="w-36">
            <label className="studio-eyebrow mb-1.5 block text-[7px] text-[var(--color-fg-dim)]">Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="block w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-bg)] px-2.5 py-2 text-[13px] text-[var(--color-fg)] focus:border-[var(--color-accent)]/40 focus:outline-none">
              <option value="">Semua Status</option><option value="open">Open</option><option value="in_progress">In Progress</option><option value="resolved">Resolved</option><option value="closed">Closed</option>
            </select>
          </div>
          <div className="w-36">
            <label className="studio-eyebrow mb-1.5 block text-[7px] text-[var(--color-fg-dim)]">Prioritas</label>
            <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="block w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-bg)] px-2.5 py-2 text-[13px] text-[var(--color-fg)] focus:border-[var(--color-accent)]/40 focus:outline-none">
              <option value="">Semua</option><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option>
            </select>
          </div>
          {data && <span className="ml-auto font-mono text-[11px] text-[var(--color-fg-dim)]">{data.meta.total} total</span>}
        </section>

        {/* Table */}
        <section className="reveal-rise overflow-x-auto rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)]/50">
          {loading && !data ? (
            <div className="flex items-center justify-center py-16"><div className="relative h-10 w-10"><div className="absolute inset-0 rounded-full border-2 border-[var(--color-line)]" /><div className="absolute inset-0 animate-spin rounded-full border-2 border-t-[var(--color-accent)]" /></div></div>
          ) : data && data.data.length > 0 ? (
            <>
              <table className="w-full text-left text-[13px]">
                <thead><tr className="border-b border-[var(--color-line)]">
                  {["Customer", "Subjek", "Prioritas", "Status", "Balasan Terakhir", "Tanggal"].map((h) => (<th key={h} className="whitespace-nowrap px-4 py-3 studio-eyebrow text-[8px] text-[var(--color-fg-dim)]">{h}</th>))}
                </tr></thead>
                <tbody className="divide-y divide-[var(--color-line)]">
                  {data.data.map((ticket) => {
                    const sc = STATUS_COLORS[ticket.status] ?? STATUS_COLORS.open;
                    const pc = PRIORITY_COLORS[ticket.priority] ?? PRIORITY_COLORS.low;
                    return (
                      <tr key={ticket.public_id} className="transition-colors hover:bg-white/[0.02]">
                        <td className="px-4 py-3">
                          <Link href={`/admin/tickets/${ticket.public_id}`} className="text-[13px] font-semibold text-[var(--color-fg)] transition-colors hover:text-[var(--color-accent)]">{ticket.user.name}</Link>
                          <p className="text-[10px] text-[var(--color-fg-dim)]">{ticket.user.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <Link href={`/admin/tickets/${ticket.public_id}`} className="text-[12px] font-medium text-[var(--color-fg)] transition-colors hover:text-[var(--color-accent)]">{ticket.subject}</Link>
                          <p className="text-[10px] text-[var(--color-fg-dim)]">{ticket.messages_count} pesan</p>
                        </td>
                        <td className="px-4 py-3"><span className="rounded-full border px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider" style={{ color: pc.color, backgroundColor: pc.bg, borderColor: pc.border }}>{ticket.priority}</span></td>
                        <td className="px-4 py-3"><span className="rounded-full border px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider" style={{ color: sc.color, backgroundColor: sc.bg, borderColor: sc.border }}>{ticket.status.replace("_", " ")}</span></td>
                        <td className="px-4 py-3 text-[11px] text-[var(--color-fg-muted)]">{formatDate(ticket.last_reply_at)}{ticket.last_reply_by && <p className="text-[9px] text-[var(--color-fg-dim)]">by {ticket.last_reply_by}</p>}</td>
                        <td className="px-4 py-3 text-[11px] text-[var(--color-fg-muted)]">{formatDate(ticket.created_at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {data.meta.last_page > 1 && (
                <div className="flex items-center justify-between border-t border-[var(--color-line)] px-5 py-3">
                  <button disabled={data.meta.current_page <= 1} onClick={() => fetchTickets(data.meta.current_page - 1)} className="rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-[11px] font-medium text-[var(--color-fg-muted)] disabled:opacity-50">Sebelumnya</button>
                  <span className="studio-eyebrow text-[8px] text-[var(--color-fg-dim)]">Halaman {data.meta.current_page} dari {data.meta.last_page}</span>
                  <button disabled={data.meta.current_page >= data.meta.last_page} onClick={() => fetchTickets(data.meta.current_page + 1)} className="rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-[11px] font-medium text-[var(--color-fg-muted)] disabled:opacity-50">Berikutnya</button>
                </div>
              )}
            </>
          ) : (
            <div className="py-12 text-center"><p className="text-[13px] text-[var(--color-fg-muted)]">Belum ada tiket support.</p></div>
          )}
        </section>
      </div>
    </RevealOnScroll>
  );
}
