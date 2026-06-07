"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogHeader,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import { request, ApiException } from "@/lib/api";
import { RevealOnScroll } from "@/components/landing/reveal-on-scroll";
import {
  PageHeader,
  StatCard,
  BentoCard,
  DonutChart,
  ProgressBar,
} from "@/components/admin/studio-ui";

interface AuditLogActor { id: number; name: string; email: string }
interface AuditLogEntry {
  id: number; public_id: string; actor: AuditLogActor | null; actor_type: string;
  action: string; target_type: string; target_id: string | null;
  metadata: Record<string, unknown> | null; ip_address: string | null; created_at: string;
}
interface AuditLogDetail extends AuditLogEntry { user_agent: string | null; request_id: string | null }
interface AuditListResponse { data: AuditLogEntry[]; meta: { current_page: number; last_page: number; per_page: number; total: number } }

const ACTOR_COLORS: Record<string, { color: string; bg: string; border: string }> = {
  user: { color: "var(--color-steel)", bg: "rgba(122,150,177,0.08)", border: "rgba(122,150,177,0.15)" },
  admin: { color: "var(--color-accent)", bg: "var(--color-accent-soft)", border: "rgba(255,116,0,0.15)" },
  system: { color: "var(--color-magenta)", bg: "rgba(246,84,158,0.08)", border: "rgba(246,84,158,0.15)" },
};

const ACTOR_LABELS: Record<string, string> = { user: "User", admin: "Admin", system: "System" };

function formatTimestamp(iso: string) {
  return new Date(iso).toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export default function AdminAuditLogsPage() {
  const [data, setData] = useState<AuditListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterAction, setFilterAction] = useState("");
  const [filterTargetType, setFilterTargetType] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [detail, setDetail] = useState<AuditLogDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchLogs = useCallback(async (page?: number) => {
    setLoading(true); setError("");
    try {
      const params: Record<string, string> = {};
      if (page) params.page = String(page);
      if (filterAction) params.action = filterAction;
      if (filterTargetType) params.target_type = filterTargetType;
      if (filterDateFrom) params.date_from = filterDateFrom;
      if (filterDateTo) params.date_to = filterDateTo;
      setData(await request<AuditListResponse>("/api/v1/admin/audit-logs", { params }));
    } catch (err) { setError(err instanceof ApiException ? err.message : "Gagal memuat audit log."); }
    finally { setLoading(false); }
  }, [filterAction, filterTargetType, filterDateFrom, filterDateTo]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  async function openDetail(id: number) {
    setDetailLoading(true);
    try { setDetail((await request<{ data: AuditLogDetail }>(`/api/v1/admin/audit-logs/${id}`)).data); }
    catch { /* silently fail */ }
    finally { setDetailLoading(false); }
  }

  const inputCls = "block w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-bg)] px-3 py-2 text-[13px] text-[var(--color-fg)] placeholder:text-[var(--color-fg-dim)] focus:border-[var(--color-accent)]/40 focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]/15";

  // Derived analytics from the loaded page — landing's bento data-viz
  const analytics = useMemo(() => {
    const entries = data?.data ?? [];
    const actorMix = (["user", "admin", "system"])
      .map((t) => ({ label: ACTOR_LABELS[t] ?? t, value: entries.filter((e) => e.actor_type === t).length, color: ACTOR_COLORS[t]?.color ?? "var(--color-fg-dim)" }))
      .filter((d) => d.value > 0);

    const actionCount = new Map<string, number>();
    for (const e of entries) actionCount.set(e.action, (actionCount.get(e.action) ?? 0) + 1);
    const actionBars = [...actionCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
    const maxAction = Math.max(...actionBars.map(([, c]) => c), 1);

    const distinctActions = actionCount.size;
    const distinctActors = new Set(entries.filter((e) => e.actor).map((e) => e.actor!.id)).size;

    return { entries, actorMix, actionBars, maxAction, distinctActions, distinctActors };
  }, [data]);

  return (
    <RevealOnScroll>
      <div className="relative mx-auto w-full max-w-[1320px] px-6 py-8">
        <PageHeader
          eyebrow="Audit"
          title="Audit Logs"
          subtitle="Riwayat semua aksi sensitif di platform — siapa melakukan apa, kapan, dan dari mana."
          status={data ? `${data.meta.total.toLocaleString("id-ID")} entri tercatat` : "Memuat…"}
        />

        {/* KPI grid */}
        <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Log" value={(data?.meta.total ?? 0).toLocaleString("id-ID")} icon="receipt_long" sub="Seluruh riwayat" delay={0} />
          <StatCard label="Di Halaman Ini" value={analytics.entries.length} icon="visibility" sub="Entri ditampilkan" delay={80} />
          <StatCard label="Jenis Aksi" value={analytics.distinctActions} icon="bolt" sub="Action unik (halaman)" accent delay={160} />
          <StatCard label="Aktor Unik" value={analytics.distinctActors} icon="group" sub="Pelaku (halaman)" delay={240} />
        </section>

        {/* Bento: top actions + actor type */}
        {analytics.entries.length > 0 && (
          <section className="mb-8 grid gap-4 lg:grid-cols-3">
            <BentoCard eyebrow="Halaman ini" title="Aksi Teratas" className="lg:col-span-2" delay={0}>
              <div className="space-y-3">
                {analytics.actionBars.map(([action, count], i) => (
                  <ProgressBar
                    key={action}
                    label={action}
                    pct={(count / analytics.maxAction) * 100}
                    rightLabel={`${count}×`}
                    color="var(--color-accent)"
                    delay={i * 90}
                    labelWidth={180}
                  />
                ))}
              </div>
            </BentoCard>

            <BentoCard eyebrow="Halaman ini" title="Tipe Aktor" delay={120}>
              {analytics.actorMix.length > 0 ? (
                <DonutChart data={analytics.actorMix} centerValue={String(analytics.entries.length)} centerLabel="Entri" />
              ) : (
                <p className="py-8 text-center text-[12px] text-[var(--color-fg-muted)]">Belum ada data aktor.</p>
              )}
            </BentoCard>
          </section>
        )}

        {error && <div className="reveal-rise mb-6 flex items-center gap-2 rounded-2xl border border-[var(--color-error)]/20 bg-[var(--color-error)]/5 px-5 py-3"><span className="material-symbols-outlined text-[18px] text-[var(--color-error)]" style={{ fontVariationSettings: '"FILL" 0, "wght" 300' }}>error</span><p className="text-[13px] text-[var(--color-error)]">{error}</p></div>}

        {/* Filters */}
        <section className="reveal-rise mb-6 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)]/50 p-5">
          <p className="studio-eyebrow mb-3 text-[8px] text-[var(--color-fg-dim)]">Filter</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div><label className="studio-eyebrow mb-1 block text-[7px] text-[var(--color-fg-dim)]">Action</label><input placeholder="listing.updated" value={filterAction} onChange={(e) => setFilterAction(e.target.value)} className={inputCls} /></div>
            <div><label className="studio-eyebrow mb-1 block text-[7px] text-[var(--color-fg-dim)]">Target Type</label><input placeholder="deployment" value={filterTargetType} onChange={(e) => setFilterTargetType(e.target.value)} className={inputCls} /></div>
            <div><label className="studio-eyebrow mb-1 block text-[7px] text-[var(--color-fg-dim)]">Dari Tanggal</label><input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} className={inputCls} /></div>
            <div><label className="studio-eyebrow mb-1 block text-[7px] text-[var(--color-fg-dim)]">Sampai Tanggal</label><input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} className={inputCls} /></div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <Button size="sm" variant="primary" onClick={() => fetchLogs(1)}><span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: '"FILL" 0, "wght" 300' }}>filter_list</span>Terapkan</Button>
            <Button size="sm" variant="outline" onClick={() => { setFilterAction(""); setFilterTargetType(""); setFilterDateFrom(""); setFilterDateTo(""); }}>Reset</Button>
          </div>
        </section>

        {/* Table */}
        <section className="reveal-rise overflow-x-auto rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)]/50">
          {loading && !data ? (
            <div className="flex items-center justify-center py-16"><div className="relative h-10 w-10"><div className="absolute inset-0 rounded-full border-2 border-[var(--color-line)]" /><div className="absolute inset-0 animate-spin rounded-full border-2 border-t-[var(--color-accent)]" /></div></div>
          ) : data && data.data.length > 0 ? (
            <>
              <div className="px-5 py-3 border-b border-[var(--color-line)] flex items-center justify-between">
                <span className="studio-eyebrow text-[8px] text-[var(--color-fg-dim)]">Log Entries</span>
                <span className="font-mono text-[11px] text-[var(--color-fg-dim)]">{data.meta.total} total</span>
              </div>
              <table className="w-full text-left text-[13px]">
                <thead><tr className="border-b border-[var(--color-line)]">
                  {["Timestamp", "Actor", "Type", "Action", "Target", "IP"].map((h) => (<th key={h} className="whitespace-nowrap px-4 py-3 studio-eyebrow text-[8px] text-[var(--color-fg-dim)]">{h}</th>))}
                </tr></thead>
                <tbody className="divide-y divide-[var(--color-line)]">
                  {data.data.map((log) => {
                    const ac = ACTOR_COLORS[log.actor_type] ?? ACTOR_COLORS.user;
                    return (
                      <tr key={log.id} className="transition-colors hover:bg-white/[0.02] cursor-pointer" onClick={() => openDetail(log.id)}>
                        <td className="px-4 py-3 font-mono text-[11px] text-[var(--color-fg-dim)]">{formatTimestamp(log.created_at)}</td>
                        <td className="px-4 py-3 text-[12px] font-medium text-[var(--color-fg)]">{log.actor ? log.actor.name : <span className="text-[var(--color-fg-dim)]">System</span>}</td>
                        <td className="px-4 py-3"><span className="rounded-full border px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider" style={{ color: ac.color, backgroundColor: ac.bg, borderColor: ac.border }}>{ACTOR_LABELS[log.actor_type] ?? log.actor_type}</span></td>
                        <td className="px-4 py-3 font-mono text-[12px] text-[var(--color-accent)]">{log.action}</td>
                        <td className="px-4 py-3 text-[12px] text-[var(--color-fg-muted)]">{log.target_type}{log.target_id && <span className="ml-1 font-mono text-[10px] text-[var(--color-fg-dim)]">#{log.target_id}</span>}</td>
                        <td className="px-4 py-3 font-mono text-[10px] text-[var(--color-fg-dim)]">{log.ip_address || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {data.meta.last_page > 1 && (
                <div className="flex items-center justify-between border-t border-[var(--color-line)] px-5 py-3">
                  <Button size="sm" variant="outline" disabled={data.meta.current_page <= 1} onClick={() => fetchLogs(data.meta.current_page - 1)}>Sebelumnya</Button>
                  <span className="studio-eyebrow text-[8px] text-[var(--color-fg-dim)]">Halaman {data.meta.current_page} dari {data.meta.last_page}</span>
                  <Button size="sm" variant="outline" disabled={data.meta.current_page >= data.meta.last_page} onClick={() => fetchLogs(data.meta.current_page + 1)}>Berikutnya</Button>
                </div>
              )}
            </>
          ) : (
            <div className="py-12 text-center"><p className="text-[13px] text-[var(--color-fg-muted)]">Tidak ada audit log ditemukan.</p></div>
          )}
        </section>

        {/* Detail Modal */}
        <Dialog open={!!detail} onClose={() => setDetail(null)}>
          <DialogHeader><h3 className="text-lg font-semibold text-[var(--color-fg)]">Audit Log Detail</h3></DialogHeader>
          <DialogContent>
            {detailLoading ? (
              <div className="flex items-center justify-center py-8"><div className="relative h-10 w-10"><div className="absolute inset-0 rounded-full border-2 border-[var(--color-line)]" /><div className="absolute inset-0 animate-spin rounded-full border-2 border-t-[var(--color-accent)]" /></div></div>
            ) : detail ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Public ID", value: detail.public_id },
                    { label: "Timestamp", value: formatTimestamp(detail.created_at) },
                    { label: "Actor", value: detail.actor ? `${detail.actor.name} (${detail.actor.email})` : "System" },
                    { label: "Action", value: detail.action, isMono: true, isAccent: true },
                    { label: "Target", value: `${detail.target_type}${detail.target_id ? ` #${detail.target_id}` : ""}` },
                    { label: "IP Address", value: detail.ip_address || "—", isMono: true },
                    { label: "Request ID", value: detail.request_id || "—", isMono: true },
                  ].map((f) => (
                    <div key={f.label}>
                      <p className="studio-eyebrow text-[7px] text-[var(--color-fg-dim)]">{f.label}</p>
                      <p className={`mt-0.5 text-[13px] ${f.isMono ? "font-mono" : ""} ${f.isAccent ? "text-[var(--color-accent)]" : "text-[var(--color-fg)]"}`}>{f.value}</p>
                    </div>
                  ))}
                  <div>
                    <p className="studio-eyebrow text-[7px] text-[var(--color-fg-dim)]">Actor Type</p>
                    <div className="mt-0.5"><Badge variant="default">{ACTOR_LABELS[detail.actor_type] ?? detail.actor_type}</Badge></div>
                  </div>
                </div>
                {detail.user_agent && <div><p className="studio-eyebrow text-[7px] text-[var(--color-fg-dim)]">User Agent</p><p className="mt-0.5 break-all text-[11px] text-[var(--color-fg-dim)]">{detail.user_agent}</p></div>}
                {detail.metadata && Object.keys(detail.metadata).length > 0 && (
                  <div><p className="studio-eyebrow text-[7px] text-[var(--color-fg-dim)]">Metadata</p><pre className="mt-1 overflow-auto rounded-xl bg-black/40 border border-[var(--color-line)] p-3 font-mono text-[11px] text-[var(--color-fg-dim)]">{JSON.stringify(detail.metadata, null, 2)}</pre></div>
                )}
              </div>
            ) : null}
          </DialogContent>
          <DialogFooter><Button size="sm" variant="outline" onClick={() => setDetail(null)}>Tutup</Button></DialogFooter>
        </Dialog>
      </div>
    </RevealOnScroll>
  );
}
