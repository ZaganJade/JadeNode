"use client";

import { useState, useEffect, useCallback } from "react";
import { api, ApiException } from "@/lib/api";
import { RevealOnScroll } from "@/components/landing/reveal-on-scroll";

type TaskStatus = "pending" | "provisioning" | "completed" | "failed";

interface ProvisioningTask {
  public_id: string; customer_name: string; customer_email: string;
  product_name: string; provider_name: string; sla_due_at: string | null;
  status: TaskStatus; assigned_to: string | null; created_at: string; updated_at: string;
}

interface ProvisioningListResponse {
  data: ProvisioningTask[];
  meta: { current_page: number; last_page: number; per_page: number; total: number };
}

const STATUS_COLORS: Record<TaskStatus, { color: string; bg: string; border: string }> = {
  pending: { color: "var(--color-amber)", bg: "rgba(245,179,71,0.08)", border: "rgba(245,179,71,0.18)" },
  provisioning: { color: "var(--color-accent)", bg: "var(--color-accent-soft)", border: "rgba(255,116,0,0.15)" },
  completed: { color: "var(--color-success)", bg: "rgba(108,232,166,0.08)", border: "rgba(108,232,166,0.18)" },
  failed: { color: "var(--color-error)", bg: "rgba(255,122,122,0.08)", border: "rgba(255,122,122,0.18)" },
};

function formatDateTime(d: string) { try { return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }); } catch { return d; } }
function isOverdue(s: string | null) { return s ? new Date(s) < new Date() : false; }
function formatTimeUntil(d: string) { const diff = new Date(d).getTime() - Date.now(); if (diff <= 0) return "Overdue"; const h = Math.floor(diff / 3600000); const m = Math.floor((diff % 3600000) / 60000); return h > 0 ? `${h}h ${m}m` : `${m}m`; }

export default function AdminProvisioningPage() {
  const [tasks, setTasks] = useState<ProvisioningTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<ProvisioningListResponse["meta"] | null>(null);
  const [actionTask, setActionTask] = useState<ProvisioningTask | null>(null);
  const [actionType, setActionType] = useState<"start" | "complete" | "fail" | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [completeHostname, setCompleteHostname] = useState("");
  const [completeIp, setCompleteIp] = useState("");
  const [completeCredential, setCompleteCredential] = useState("");
  const [failReason, setFailReason] = useState("");

  const fetchTasks = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params: Record<string, string> = { page: String(page) };
      if (statusFilter) params.status = statusFilter;
      const res = await api.get<ProvisioningListResponse>("/api/v1/admin/provisioning-tasks", { params });
      setTasks(res.data ?? []); setMeta(res.meta);
    } catch (err) { setError(err instanceof ApiException ? err.message : "Gagal memuat provisioning queue."); }
    finally { setLoading(false); }
  }, [page, statusFilter]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  function openAction(task: ProvisioningTask, type: "start" | "complete" | "fail") { setActionTask(task); setActionType(type); setCompleteHostname(""); setCompleteIp(""); setCompleteCredential(""); setFailReason(""); }
  function closeAction() { setActionTask(null); setActionType(null); }

  async function executeAction() {
    if (!actionTask || !actionType) return; setActionLoading(true);
    try {
      if (actionType === "start") await api.post(`/api/v1/admin/provisioning-tasks/${actionTask.public_id}/start`);
      else if (actionType === "complete") await api.post(`/api/v1/admin/provisioning-tasks/${actionTask.public_id}/complete`, { hostname: completeHostname || undefined, ip_address: completeIp || undefined, credential: completeCredential || undefined });
      else if (actionType === "fail") await api.post(`/api/v1/admin/provisioning-tasks/${actionTask.public_id}/fail`, { reason: failReason });
      closeAction(); fetchTasks();
    } catch (err) { setError(err instanceof ApiException ? err.message : "Gagal melakukan aksi."); }
    finally { setActionLoading(false); }
  }

  const inputCls = "block w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-bg)] px-3 py-2 text-[13px] text-[var(--color-fg)] placeholder:text-[var(--color-fg-dim)] focus:border-[var(--color-accent)]/40 focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]/15";

  return (
    <RevealOnScroll>
      <div className="mx-auto w-full max-w-[1320px] px-6 py-8">
        <section className="reveal-rise mb-8">
          <p className="studio-eyebrow text-accent">Provisioning</p>
          <h1 className="studio-display mt-3 text-[clamp(28px,4vw,44px)] text-[var(--color-fg)]">Provisioning Queue</h1>
          <p className="mt-2 text-[13px] text-[var(--color-fg-muted)]">Kelola tugas provisioning deployment.</p>
        </section>

        {error && <div className="reveal-rise mb-4 flex items-center gap-2 rounded-2xl border border-[var(--color-error)]/20 bg-[var(--color-error)]/5 px-5 py-3"><span className="material-symbols-outlined text-[18px] text-[var(--color-error)]" style={{ fontVariationSettings: '"FILL" 0, "wght" 300' }}>error</span><p className="text-[13px] text-[var(--color-error)]">{error}</p></div>}

        {/* Filter */}
        <section className="reveal-rise mb-6 flex flex-wrap items-end gap-3 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)]/50 p-4">
          <div className="w-36">
            <label className="studio-eyebrow mb-1.5 block text-[7px] text-[var(--color-fg-dim)]">Status</label>
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="block w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-bg)] px-2.5 py-2 text-[13px] text-[var(--color-fg)] focus:border-[var(--color-accent)]/40 focus:outline-none">
              <option value="">Semua</option><option value="pending">Pending</option><option value="provisioning">Provisioning</option><option value="completed">Completed</option><option value="failed">Failed</option>
            </select>
          </div>
        </section>

        {/* Table */}
        <section className="reveal-rise overflow-x-auto rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)]/50">
          {loading && tasks.length === 0 ? (
            <div className="flex items-center justify-center py-16"><div className="relative h-10 w-10"><div className="absolute inset-0 rounded-full border-2 border-[var(--color-line)]" /><div className="absolute inset-0 animate-spin rounded-full border-2 border-t-[var(--color-accent)]" /></div></div>
          ) : tasks.length === 0 ? (
            <div className="py-12 text-center"><p className="text-[13px] text-[var(--color-fg-muted)]">Tidak ada provisioning task.</p></div>
          ) : (
            <>
              <table className="w-full text-left text-[13px]">
                <thead><tr className="border-b border-[var(--color-line)]">
                  {["Task ID", "Customer", "Product", "Provider", "SLA Due", "Status", "Assigned", ""].map((h) => (<th key={h} className="whitespace-nowrap px-4 py-3 studio-eyebrow text-[8px] text-[var(--color-fg-dim)]">{h}</th>))}
                </tr></thead>
                <tbody className="divide-y divide-[var(--color-line)]">
                  {tasks.map((task) => {
                    const overdue = isOverdue(task.sla_due_at);
                    const sc = STATUS_COLORS[task.status];
                    return (
                      <tr key={task.public_id} className={`transition-colors hover:bg-white/[0.02] ${overdue && (task.status === "pending" || task.status === "provisioning") ? "bg-[var(--color-error)]/[0.03]" : ""}`}>
                        <td className="px-4 py-3 font-mono text-[11px] text-[var(--color-fg-dim)]">{task.public_id.slice(0, 12)}...</td>
                        <td className="px-4 py-3"><div className="text-[12px] font-medium text-[var(--color-fg)]">{task.customer_name}</div><div className="text-[10px] text-[var(--color-fg-dim)]">{task.customer_email}</div></td>
                        <td className="px-4 py-3 text-[12px] text-[var(--color-fg-muted)]">{task.product_name}</td>
                        <td className="px-4 py-3 text-[12px] text-[var(--color-fg-muted)]">{task.provider_name}</td>
                        <td className="px-4 py-3">
                          {task.sla_due_at ? (
                            <div>
                              <span className={`font-mono text-[11px] ${overdue ? "text-[var(--color-error)] font-semibold" : "text-[var(--color-fg-muted)]"}`}>{formatDateTime(task.sla_due_at)}</span>
                              {overdue && (task.status === "pending" || task.status === "provisioning") && <div className="flex items-center gap-1 mt-0.5"><span className="h-1.5 w-1.5 rounded-full bg-[var(--color-error)] animate-pulse" /><span className="text-[10px] text-[var(--color-error)]">{formatTimeUntil(task.sla_due_at)}</span></div>}
                            </div>
                          ) : <span className="text-[10px] text-[var(--color-fg-dim)]">—</span>}
                        </td>
                        <td className="px-4 py-3"><span className="rounded-full border px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider" style={{ color: sc.color, backgroundColor: sc.bg, borderColor: sc.border }}>{task.status}</span></td>
                        <td className="px-4 py-3 text-[10px] text-[var(--color-fg-dim)]">{task.assigned_to ?? "—"}</td>
                        <td className="px-4 py-3 text-right">
                          {task.status === "pending" && <button onClick={() => openAction(task, "start")} className="rounded-lg bg-[var(--color-accent-soft)] border border-[var(--color-accent)]/20 px-2.5 py-1 text-[10px] font-medium text-[var(--color-accent)]">Start</button>}
                          {task.status === "provisioning" && <div className="flex items-center justify-end gap-1"><button onClick={() => openAction(task, "complete")} className="rounded-lg bg-[var(--color-success)]/15 border border-[var(--color-success)]/20 px-2.5 py-1 text-[10px] font-medium text-[var(--color-success)]">Complete</button><button onClick={() => openAction(task, "fail")} className="rounded-lg border border-[var(--color-error)]/20 bg-[var(--color-error)]/10 px-2.5 py-1 text-[10px] font-medium text-[var(--color-error)]">Fail</button></div>}
                          {(task.status === "completed" || task.status === "failed") && <span className="text-[10px] text-[var(--color-fg-dim)]">{formatDateTime(task.updated_at)}</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {meta && meta.last_page > 1 && (
                <div className="flex items-center justify-between border-t border-[var(--color-line)] px-5 py-3">
                  <button disabled={meta.current_page <= 1} onClick={() => setPage(meta.current_page - 1)} className="rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-[11px] font-medium text-[var(--color-fg-muted)] disabled:opacity-50">Sebelumnya</button>
                  <span className="studio-eyebrow text-[8px] text-[var(--color-fg-dim)]">{meta.current_page} / {meta.last_page} · {meta.total} task</span>
                  <button disabled={meta.current_page >= meta.last_page} onClick={() => setPage(meta.current_page + 1)} className="rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-[11px] font-medium text-[var(--color-fg-muted)] disabled:opacity-50">Berikutnya</button>
                </div>
              )}
            </>
          )}
        </section>

        {/* Action Modal */}
        {actionTask && actionType && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="mx-4 w-full max-w-md rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-6">
              <h3 className="text-[14px] font-bold text-[var(--color-fg)]">{actionType === "start" ? "Start Provisioning" : actionType === "complete" ? "Complete Provisioning" : "Fail Provisioning"}</h3>
              <p className="mt-1 text-[11px] text-[var(--color-fg-dim)]">Task: {actionTask.public_id} · {actionTask.product_name}</p>
              {actionType === "complete" && (
                <div className="mt-4 space-y-3">
                  <div><label className="studio-eyebrow block mb-1 text-[7px] text-[var(--color-fg-dim)]">Hostname</label><input type="text" value={completeHostname} onChange={(e) => setCompleteHostname(e.target.value)} placeholder="server-01.example.com" className={inputCls} /></div>
                  <div><label className="studio-eyebrow block mb-1 text-[7px] text-[var(--color-fg-dim)]">IP Address</label><input type="text" value={completeIp} onChange={(e) => setCompleteIp(e.target.value)} placeholder="192.168.1.1" className={inputCls} /></div>
                  <div><label className="studio-eyebrow block mb-1 text-[7px] text-[var(--color-fg-dim)]">Credential</label><input type="text" value={completeCredential} onChange={(e) => setCompleteCredential(e.target.value)} placeholder="Initial password" className={inputCls} /></div>
                </div>
              )}
              {actionType === "fail" && (<div className="mt-4"><label className="studio-eyebrow block mb-1 text-[7px] text-[var(--color-fg-dim)]">Alasan Gagal</label><textarea value={failReason} onChange={(e) => setFailReason(e.target.value)} placeholder="Jelaskan alasan..." rows={3} className={`${inputCls} resize-none`} /></div>)}
              {actionType === "start" && <p className="mt-4 text-[12px] text-[var(--color-fg-muted)]">Mulai provisioning untuk deployment ini?</p>}
              <div className="mt-6 flex items-center justify-end gap-2">
                <button onClick={closeAction} className="rounded-lg border border-[var(--color-line)] px-4 py-2 text-[12px] font-medium text-[var(--color-fg-muted)]">Batal</button>
                <button onClick={executeAction} disabled={actionLoading || (actionType === "fail" && !failReason.trim())} className={`rounded-lg px-4 py-2 text-[12px] font-semibold disabled:opacity-50 ${actionType === "fail" ? "border bg-[var(--color-error)]/15 border-[var(--color-error)]/25 text-[var(--color-error)]" : actionType === "complete" ? "border bg-[var(--color-success)]/15 border-[var(--color-success)]/25 text-[var(--color-success)]" : "bg-[var(--color-accent)] text-[var(--color-accent-fg)]"}`}>{actionLoading ? "Memproses..." : actionType === "start" ? "Start" : actionType === "complete" ? "Complete" : "Fail"}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RevealOnScroll>
  );
}
