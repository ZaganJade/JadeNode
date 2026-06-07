"use client";

import { useState, useEffect, useCallback } from "react";
import { api, ApiException } from "@/lib/api";
import { RevealOnScroll } from "@/components/landing/reveal-on-scroll";

type ActionStatus = "pending" | "processing" | "completed" | "failed";
type ActionType = "start" | "stop" | "restart";

interface ResourceAction {
  public_id: string; deployment_id: string; deployment_name: string;
  customer_name: string; action_type: ActionType; status: ActionStatus;
  requested_at: string; processed_at: string | null; processed_by: string | null;
}

interface ResourceActionsResponse {
  data: ResourceAction[];
  meta: { current_page: number; last_page: number; per_page: number; total: number };
}

const STATUS_COLORS: Record<ActionStatus, { color: string; bg: string; border: string }> = {
  pending: { color: "var(--color-amber)", bg: "rgba(245,179,71,0.08)", border: "rgba(245,179,71,0.18)" },
  processing: { color: "var(--color-accent)", bg: "var(--color-accent-soft)", border: "rgba(255,116,0,0.15)" },
  completed: { color: "var(--color-success)", bg: "rgba(108,232,166,0.08)", border: "rgba(108,232,166,0.18)" },
  failed: { color: "var(--color-error)", bg: "rgba(255,122,122,0.08)", border: "rgba(255,122,122,0.18)" },
};

const ACTION_ICONS: Record<ActionType, string> = { start: "play_arrow", stop: "stop", restart: "restart_alt" };
const ACTION_LABELS: Record<ActionType, string> = { start: "Start", stop: "Stop", restart: "Restart" };

function formatDateTime(d: string) { try { return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }); } catch { return d; } }

export default function AdminResourceActionsPage() {
  const [actions, setActions] = useState<ResourceAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<ResourceActionsResponse["meta"] | null>(null);
  const [processAction, setProcessAction] = useState<ResourceAction | null>(null);
  const [processResult, setProcessResult] = useState<"completed" | "failed">("completed");
  const [processLoading, setProcessLoading] = useState(false);

  const fetchActions = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params: Record<string, string> = { page: String(page) };
      if (statusFilter) params.status = statusFilter;
      const res = await api.get<ResourceActionsResponse>("/api/v1/admin/resource-actions", { params });
      setActions(res.data ?? []); setMeta(res.meta);
    } catch (err) { setError(err instanceof ApiException ? err.message : "Gagal memuat resource actions."); }
    finally { setLoading(false); }
  }, [page, statusFilter]);

  useEffect(() => { fetchActions(); }, [fetchActions]);

  async function handleProcess() {
    if (!processAction) return; setProcessLoading(true);
    try { await api.post(`/api/v1/admin/resource-actions/${processAction.public_id}/process`, { status: processResult }); setProcessAction(null); fetchActions(); }
    catch (err) { setError(err instanceof ApiException ? err.message : "Gagal memproses aksi."); }
    finally { setProcessLoading(false); }
  }

  return (
    <RevealOnScroll>
      <div className="mx-auto w-full max-w-[1320px] px-6 py-8">
        <section className="reveal-rise mb-8">
          <p className="studio-eyebrow text-accent">Resource Actions</p>
          <h1 className="studio-display mt-3 text-[clamp(28px,4vw,44px)] text-[var(--color-fg)]">Resource Actions</h1>
          <p className="mt-2 text-[13px] text-[var(--color-fg-muted)]">Antrian aksi resource (start, stop, restart) yang perlu diproses.</p>
        </section>

        {error && <div className="reveal-rise mb-4 flex items-center gap-2 rounded-2xl border border-[var(--color-error)]/20 bg-[var(--color-error)]/5 px-5 py-3"><span className="material-symbols-outlined text-[18px] text-[var(--color-error)]" style={{ fontVariationSettings: '"FILL" 0, "wght" 300' }}>error</span><p className="text-[13px] text-[var(--color-error)]">{error}</p></div>}

        <section className="reveal-rise mb-6 flex flex-wrap items-end gap-3 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)]/50 p-4">
          <div className="w-36">
            <label className="studio-eyebrow mb-1.5 block text-[7px] text-[var(--color-fg-dim)]">Status</label>
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="block w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-bg)] px-2.5 py-2 text-[13px] text-[var(--color-fg)] focus:border-[var(--color-accent)]/40 focus:outline-none">
              <option value="">Semua</option><option value="pending">Pending</option><option value="processing">Processing</option><option value="completed">Completed</option><option value="failed">Failed</option>
            </select>
          </div>
        </section>

        <section className="reveal-rise overflow-x-auto rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)]/50">
          {loading && actions.length === 0 ? (
            <div className="flex items-center justify-center py-16"><div className="relative h-10 w-10"><div className="absolute inset-0 rounded-full border-2 border-[var(--color-line)]" /><div className="absolute inset-0 animate-spin rounded-full border-2 border-t-[var(--color-accent)]" /></div></div>
          ) : actions.length === 0 ? (
            <div className="py-12 text-center"><p className="text-[13px] text-[var(--color-fg-muted)]">Tidak ada resource action.</p></div>
          ) : (
            <>
              <table className="w-full text-left text-[13px]">
                <thead><tr className="border-b border-[var(--color-line)]">
                  {["Deployment", "Customer", "Action", "Status", "Requested", ""].map((h) => (<th key={h} className="whitespace-nowrap px-4 py-3 studio-eyebrow text-[8px] text-[var(--color-fg-dim)]">{h}</th>))}
                </tr></thead>
                <tbody className="divide-y divide-[var(--color-line)]">
                  {actions.map((action) => {
                    const sc = STATUS_COLORS[action.status];
                    return (
                      <tr key={action.public_id} className="transition-colors hover:bg-white/[0.02]">
                        <td className="px-4 py-3"><div className="text-[12px] font-medium text-[var(--color-fg)]">{action.deployment_name}</div><div className="font-mono text-[10px] text-[var(--color-fg-dim)]">{action.deployment_id.slice(0, 12)}...</div></td>
                        <td className="px-4 py-3 text-[12px] text-[var(--color-fg-muted)]">{action.customer_name}</td>
                        <td className="px-4 py-3"><span className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-line)] bg-black/40 px-2.5 py-1 text-[10px] font-mono font-medium text-[var(--color-fg-muted)]"><span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: '"FILL" 0, "wght" 300' }}>{ACTION_ICONS[action.action_type]}</span>{ACTION_LABELS[action.action_type]}</span></td>
                        <td className="px-4 py-3"><span className="rounded-full border px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider" style={{ color: sc.color, backgroundColor: sc.bg, borderColor: sc.border }}>{action.status}</span></td>
                        <td className="px-4 py-3 text-[11px] text-[var(--color-fg-muted)]">{formatDateTime(action.requested_at)}</td>
                        <td className="px-4 py-3 text-right">
                          {(action.status === "pending" || action.status === "processing") && <button onClick={() => { setProcessAction(action); setProcessResult("completed"); }} className="rounded-lg bg-[var(--color-accent-soft)] border border-[var(--color-accent)]/20 px-2.5 py-1 text-[10px] font-medium text-[var(--color-accent)]">Process</button>}
                          {(action.status === "completed" || action.status === "failed") && action.processed_by && <span className="text-[10px] text-[var(--color-fg-dim)]">by {action.processed_by}</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {meta && meta.last_page > 1 && (
                <div className="flex items-center justify-between border-t border-[var(--color-line)] px-5 py-3">
                  <button disabled={meta.current_page <= 1} onClick={() => setPage(meta.current_page - 1)} className="rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-[11px] font-medium text-[var(--color-fg-muted)] disabled:opacity-50">Sebelumnya</button>
                  <span className="studio-eyebrow text-[8px] text-[var(--color-fg-dim)]">{meta.current_page} / {meta.last_page} · {meta.total} action</span>
                  <button disabled={meta.current_page >= meta.last_page} onClick={() => setPage(meta.current_page + 1)} className="rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-[11px] font-medium text-[var(--color-fg-muted)] disabled:opacity-50">Berikutnya</button>
                </div>
              )}
            </>
          )}
        </section>

        {processAction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="mx-4 w-full max-w-sm rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-6">
              <h3 className="text-[14px] font-bold text-[var(--color-fg)]">Process Resource Action</h3>
              <p className="mt-1 text-[11px] text-[var(--color-fg-dim)]">{ACTION_LABELS[processAction.action_type]} · {processAction.deployment_name}</p>
              <div className="mt-4 space-y-2">
                <p className="studio-eyebrow text-[7px] text-[var(--color-fg-dim)]">Result</p>
                <div className="flex gap-2">
                  <button onClick={() => setProcessResult("completed")} className={`flex-1 rounded-lg border px-3 py-2 text-[12px] font-medium transition-colors ${processResult === "completed" ? "border-[var(--color-success)]/40 bg-[var(--color-success)]/15 text-[var(--color-success)]" : "border-[var(--color-line)] bg-black/40 text-[var(--color-fg-muted)]"}`}>Completed</button>
                  <button onClick={() => setProcessResult("failed")} className={`flex-1 rounded-lg border px-3 py-2 text-[12px] font-medium transition-colors ${processResult === "failed" ? "border-[var(--color-error)]/40 bg-[var(--color-error)]/15 text-[var(--color-error)]" : "border-[var(--color-line)] bg-black/40 text-[var(--color-fg-muted)]"}`}>Failed</button>
                </div>
              </div>
              <div className="mt-6 flex items-center justify-end gap-2">
                <button onClick={() => setProcessAction(null)} className="rounded-lg border border-[var(--color-line)] px-4 py-2 text-[12px] font-medium text-[var(--color-fg-muted)]">Batal</button>
                <button onClick={handleProcess} disabled={processLoading} className={`rounded-lg px-4 py-2 text-[12px] font-semibold disabled:opacity-50 ${processResult === "completed" ? "border bg-[var(--color-success)]/15 border-[var(--color-success)]/25 text-[var(--color-success)]" : "border bg-[var(--color-error)]/15 border-[var(--color-error)]/25 text-[var(--color-error)]"}`}>{processLoading ? "Memproses..." : "Confirm"}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RevealOnScroll>
  );
}
