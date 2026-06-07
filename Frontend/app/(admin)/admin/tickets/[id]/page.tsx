"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api, ApiException } from "@/lib/api";
import { RevealOnScroll } from "@/components/landing/reveal-on-scroll";

type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
type TicketPriority = "low" | "medium" | "high" | "urgent";

interface TicketMessage { id: number; sender_type: "customer" | "admin"; message: string; created_at: string }
interface TicketUser { id: number; name: string; email: string }
interface TicketDetail { public_id: string; subject: string; status: TicketStatus; priority: TicketPriority; last_reply_at: string | null; last_reply_by: string | null; messages_count: number; user: TicketUser; created_at: string }
interface TicketShowResponse { ticket: TicketDetail; messages: TicketMessage[] }

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
      const data = await api.get<TicketShowResponse>(`/api/v1/admin/tickets/${ticketId}`);
      setTicket(data.ticket); setMessages(data.messages ?? []);
    } catch (err) {
      if (err instanceof ApiException && err.status === 404) setError("Tiket tidak ditemukan.");
      else setError(err instanceof Error ? err.message : "Gagal memuat detail tiket.");
    } finally { setLoading(false); }
  }, [ticketId]);

  useEffect(() => { fetchTicket(); }, [fetchTicket]);

  const handleReply = useCallback(async () => {
    if (!replyText.trim() || !ticket) return; setReplying(true);
    try { const data = await api.post<{ ticket_message: TicketMessage }>(`/api/v1/admin/tickets/${ticket.public_id}/reply`, { message: replyText }); setMessages((p) => [...p, data.ticket_message]); setReplyText(""); fetchTicket(); }
    catch (err) { setError(err instanceof ApiException ? err.message : "Gagal mengirim balasan."); }
    finally { setReplying(false); }
  }, [replyText, ticket, fetchTicket]);

  const handleStatusChange = useCallback(async (newStatus: TicketStatus) => {
    if (!ticket) return; setUpdatingStatus(true);
    try { await api.put(`/api/v1/admin/tickets/${ticket.public_id}/status`, { status: newStatus }); fetchTicket(); }
    catch (err) { setError(err instanceof ApiException ? err.message : "Gagal mengubah status."); }
    finally { setUpdatingStatus(false); }
  }, [ticket, fetchTicket]);

  if (loading) return (<div className="p-8 space-y-6"><div className="h-8 w-64 rounded-lg bg-[var(--color-surface)] animate-pulse" /><div className="h-[200px] rounded-xl bg-[var(--color-surface)] animate-pulse" /><div className="h-[150px] rounded-xl bg-[var(--color-surface)] animate-pulse" /></div>);
  if (error || !ticket) return (<RevealOnScroll><div className="mx-auto w-full max-w-[1320px] px-6 py-8"><Link href="/admin/tickets" className="inline-flex items-center gap-1 text-[13px] text-[var(--color-accent)] hover:underline"><span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: '"FILL" 0, "wght" 300' }}>arrow_back</span>Kembali ke Tickets</Link><div className="mt-8 rounded-2xl border border-[var(--color-error)]/20 bg-[var(--color-error)]/5 p-8 text-center"><p className="text-[14px] text-[var(--color-error)]">{error ?? "Gagal memuat detail tiket."}</p></div></div></RevealOnScroll>);

  const sc = STATUS_COLORS[ticket.status] ?? STATUS_COLORS.open;
  const pc = PRIORITY_COLORS[ticket.priority] ?? PRIORITY_COLORS.low;

  return (
    <RevealOnScroll>
      <div className="mx-auto w-full max-w-[1320px] px-6 py-8">
        <Link href="/admin/tickets" className="reveal-rise inline-flex items-center gap-1 text-[13px] text-[var(--color-accent)] hover:underline"><span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: '"FILL" 0, "wght" 300' }}>arrow_back</span>Kembali ke Tickets</Link>

        {/* Header */}
        <div className="reveal-rise mt-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="studio-display text-[clamp(24px,3.5vw,36px)] text-[var(--color-fg)]">{ticket.subject}</h1>
              <span className="rounded-full border px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider" style={{ color: sc.color, backgroundColor: sc.bg, borderColor: sc.border }}>{ticket.status.replace("_", " ")}</span>
              <span className="rounded-full border px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider" style={{ color: pc.color, backgroundColor: pc.bg, borderColor: pc.border }}>{ticket.priority}</span>
            </div>
            <div className="mt-2 flex items-center gap-4 text-[12px] text-[var(--color-fg-muted)]">
              <span>Customer: <strong className="text-[var(--color-fg)]">{ticket.user.name}</strong> ({ticket.user.email})</span>
              <span>·</span>
              <span>Dibuat {formatDate(ticket.created_at)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {ticket.status !== "in_progress" && <button onClick={() => handleStatusChange("in_progress")} disabled={updatingStatus} className="rounded-lg border border-[var(--color-accent)]/20 bg-[var(--color-accent-soft)] px-3 py-1.5 text-[11px] font-medium text-[var(--color-accent)] disabled:opacity-50">In Progress</button>}
            {ticket.status !== "resolved" && <button onClick={() => handleStatusChange("resolved")} disabled={updatingStatus} className="rounded-lg bg-[var(--color-success)]/15 border border-[var(--color-success)]/20 px-3 py-1.5 text-[11px] font-medium text-[var(--color-success)] disabled:opacity-50">Resolved</button>}
            {ticket.status !== "closed" && <button onClick={() => handleStatusChange("closed")} disabled={updatingStatus} className="rounded-lg border border-[var(--color-line)] bg-white/[0.03] px-3 py-1.5 text-[11px] font-medium text-[var(--color-fg-muted)] disabled:opacity-50">Closed</button>}
          </div>
        </div>

        {/* Message Thread */}
        <div className="reveal-rise mt-6 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)]/50 overflow-hidden">
          <div className="border-b border-[var(--color-line)] px-5 py-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-[var(--color-accent)]" style={{ fontVariationSettings: '"FILL" 0, "wght" 300' }}>chat</span>
            <h2 className="studio-eyebrow text-[8px] text-[var(--color-fg-dim)]">Pesan ({messages.length})</h2>
          </div>
          <div className="p-5 space-y-4">
            {messages.map((msg) => {
              const isAdmin = msg.sender_type === "admin";
              return (
                <div key={msg.id} className="flex gap-3">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold uppercase ${isAdmin ? "bg-[var(--color-accent-soft)] text-[var(--color-accent)] border border-[var(--color-accent)]/20" : "bg-white/[0.05] text-[var(--color-fg-muted)] border border-[var(--color-line)]"}`}>{isAdmin ? "A" : "C"}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-semibold text-[var(--color-fg)]">{isAdmin ? "Admin" : ticket.user.name}</span>
                      <span className="text-[10px] text-[var(--color-fg-dim)]">{formatDate(msg.created_at)}</span>
                    </div>
                    <div className={`mt-1.5 rounded-xl px-4 py-3 text-[13px] leading-relaxed ${isAdmin ? "border border-[var(--color-accent)]/10 bg-[var(--color-accent)]/[0.03] text-[var(--color-fg)]" : "bg-white/[0.03] text-[var(--color-fg)] border border-[var(--color-line)]/50"}`}>
                      <p className="whitespace-pre-wrap">{msg.message}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Reply Form */}
        {ticket.status !== "closed" && (
          <div className="reveal-rise mt-4 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)]/50 overflow-hidden">
            <div className="border-b border-[var(--color-line)] px-5 py-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-[var(--color-accent)]" style={{ fontVariationSettings: '"FILL" 0, "wght" 300' }}>edit</span>
              <h2 className="studio-eyebrow text-[8px] text-[var(--color-fg-dim)]">Balas Tiket</h2>
            </div>
            <div className="p-5 space-y-4">
              <textarea rows={4} placeholder="Tulis balasan Anda..." value={replyText} onChange={(e) => setReplyText(e.target.value)} className="block w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)] px-4 py-3 text-[13px] text-[var(--color-fg)] placeholder:text-[var(--color-fg-dim)] focus:border-[var(--color-accent)]/40 focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]/15 resize-none" />
              <div className="flex justify-end">
                <button onClick={handleReply} disabled={replying || !replyText.trim()} className="rounded-lg bg-[var(--color-accent)] px-5 py-2.5 text-[13px] font-bold text-[var(--color-accent-fg)] transition-opacity hover:opacity-90 disabled:opacity-50">
                  {replying ? "Mengirim..." : "Kirim Balasan"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RevealOnScroll>
  );
}
