"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogHeader,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  adminListBetaRequests,
  adminReviewBetaRequest,
  type BetaAccessRequestData,
  type BetaAccessListResponse,
} from "@/lib/auth";
import { ApiException } from "@/lib/api";
import { RevealOnScroll } from "@/components/landing/reveal-on-scroll";

const STATUS_COLORS: Record<string, { color: string; bg: string; border: string }> = {
  pending: { color: "var(--color-amber)", bg: "rgba(245,179,71,0.08)", border: "rgba(245,179,71,0.18)" },
  approved: { color: "var(--color-success)", bg: "rgba(108,232,166,0.08)", border: "rgba(108,232,166,0.18)" },
  rejected: { color: "var(--color-error)", bg: "rgba(255,122,122,0.08)", border: "rgba(255,122,122,0.18)" },
};

export default function AdminBetaAccessPage() {
  const [data, setData] = useState<BetaAccessListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviewDialog, setReviewDialog] = useState<{
    open: boolean; request: BetaAccessRequestData | null;
    action: "approved" | "rejected" | null; reason: string; submitting: boolean;
  }>({ open: false, request: null, action: null, reason: "", submitting: false });

  const fetchRequests = useCallback(async (page?: number) => {
    setLoading(true); setError("");
    try { setData(await adminListBetaRequests(page)); }
    catch (err) { setError(err instanceof ApiException ? err.message : "Gagal memuat data."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  function openReviewDialog(request: BetaAccessRequestData, action: "approved" | "rejected") {
    setReviewDialog({ open: true, request, action, reason: "", submitting: false });
  }

  async function submitReview() {
    if (!reviewDialog.request || !reviewDialog.action) return;
    setReviewDialog((p) => ({ ...p, submitting: true }));
    try {
      await adminReviewBetaRequest(reviewDialog.request.id, reviewDialog.action, reviewDialog.action === "rejected" ? reviewDialog.reason || undefined : undefined);
      setReviewDialog((p) => ({ ...p, open: false }));
      fetchRequests(data?.meta.current_page);
    } catch (err) {
      setReviewDialog((p) => ({ ...p, submitting: false }));
      setError(err instanceof ApiException ? err.message : "Gagal memproses review.");
    }
  }

  return (
    <RevealOnScroll>
      <div className="mx-auto w-full max-w-[1320px] px-6 py-8">
        <section className="reveal-rise mb-8">
          <p className="studio-eyebrow text-accent">Beta Access</p>
          <h1 className="studio-display mt-3 text-[clamp(28px,4vw,44px)] text-[var(--color-fg)]">Beta Access Requests</h1>
          <p className="mt-2 text-[13px] text-[var(--color-fg-muted)]">Kelola permintaan akses beta dari customer.</p>
        </section>

        {error && (
          <div className="reveal-rise mb-6 flex items-center gap-2 rounded-2xl border border-[var(--color-error)]/20 bg-[var(--color-error)]/5 px-5 py-3">
            <span className="material-symbols-outlined text-[18px] text-[var(--color-error)]" style={{ fontVariationSettings: '"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20' }}>error</span>
            <p className="text-[13px] text-[var(--color-error)]">{error}</p>
          </div>
        )}

        {/* Stats */}
        {data && (
          <section className="reveal-rise grid gap-4 sm:grid-cols-3 mb-6">
            {[
              { label: "Pending", value: data.data.filter((r) => r.status === "pending").length, icon: "schedule", color: "var(--color-amber)" },
              { label: "Approved", value: data.data.filter((r) => r.status === "approved").length, icon: "check_circle", color: "var(--color-success)" },
              { label: "Total", value: data.meta.total, icon: "group", color: "var(--color-accent)" },
            ].map((s, i) => (
              <div key={s.label} className="studio-card rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)]/50 p-4 flex items-center gap-3" style={{ transitionDelay: `${i * 80}ms` }}>
                <div className="grid h-9 w-9 place-items-center rounded-lg border border-[var(--color-line)] bg-black/40">
                  <span className="material-symbols-outlined text-[18px]" style={{ color: s.color, fontVariationSettings: '"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20' }}>{s.icon}</span>
                </div>
                <div>
                  <p className="studio-display text-[22px] text-[var(--color-fg)]">{s.value}</p>
                  <p className="studio-eyebrow text-[7px] text-[var(--color-fg-dim)]">{s.label}</p>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Table */}
        <section className="reveal-rise overflow-x-auto rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)]/50">
          {loading && !data ? (
            <div className="flex items-center justify-center py-16">
              <div className="relative h-10 w-10"><div className="absolute inset-0 rounded-full border-2 border-[var(--color-line)]" /><div className="absolute inset-0 animate-spin rounded-full border-2 border-t-[var(--color-accent)]" /></div>
            </div>
          ) : data && data.data.length > 0 ? (
            <>
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="border-b border-[var(--color-line)]">
                    {["User", "Email", "Alasan", "Status", "Tanggal", ""].map((h) => (
                      <th key={h} className="whitespace-nowrap px-4 py-3 studio-eyebrow text-[8px] text-[var(--color-fg-dim)]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-line)]">
                  {data.data.map((req) => {
                    const sc = STATUS_COLORS[req.status] ?? STATUS_COLORS.pending;
                    return (
                      <tr key={req.id} className="transition-colors hover:bg-white/[0.02]">
                        <td className="px-4 py-3 text-[13px] font-semibold text-[var(--color-fg)]">{req.user.name}</td>
                        <td className="px-4 py-3 font-mono text-[12px] text-[var(--color-fg-muted)]">{req.user.email}</td>
                        <td className="px-4 py-3 max-w-[200px] truncate text-[12px] text-[var(--color-fg-muted)]">{req.reason || "—"}</td>
                        <td className="px-4 py-3">
                          <span className="rounded-full border px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider" style={{ color: sc.color, backgroundColor: sc.bg, borderColor: sc.border }}>{req.status}</span>
                        </td>
                        <td className="px-4 py-3 text-[11px] text-[var(--color-fg-muted)]">{new Date(req.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</td>
                        <td className="px-4 py-3 text-right">
                          {req.status === "pending" ? (
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => openReviewDialog(req, "approved")} className="rounded-lg bg-[var(--color-success)]/15 border border-[var(--color-success)]/20 px-3 py-1.5 text-[11px] font-medium text-[var(--color-success)]">Approve</button>
                              <button onClick={() => openReviewDialog(req, "rejected")} className="rounded-lg border border-[var(--color-error)]/20 bg-[var(--color-error)]/10 px-3 py-1.5 text-[11px] font-medium text-[var(--color-error)]">Reject</button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-[var(--color-fg-dim)]">Reviewed</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {data.meta.last_page > 1 && (
                <div className="flex items-center justify-between border-t border-[var(--color-line)] px-5 py-3">
                  <Button size="sm" variant="outline" disabled={data.meta.current_page <= 1} onClick={() => fetchRequests(data.meta.current_page - 1)}>Sebelumnya</Button>
                  <span className="studio-eyebrow text-[8px] text-[var(--color-fg-dim)]">Halaman {data.meta.current_page} dari {data.meta.last_page}</span>
                  <Button size="sm" variant="outline" disabled={data.meta.current_page >= data.meta.last_page} onClick={() => fetchRequests(data.meta.current_page + 1)}>Berikutnya</Button>
                </div>
              )}
            </>
          ) : (
            <div className="py-12 text-center"><p className="text-[13px] text-[var(--color-fg-muted)]">Belum ada permintaan beta access.</p></div>
          )}
        </section>

        {/* Review Dialog */}
        <Dialog open={reviewDialog.open} onClose={() => setReviewDialog((p) => ({ ...p, open: false }))}>
          <DialogHeader>
            <h3 className="text-lg font-semibold text-[var(--color-fg)]">{reviewDialog.action === "approved" ? "Setujui Permintaan" : "Tolak Permintaan"}</h3>
          </DialogHeader>
          <DialogContent>
            {reviewDialog.request && (
              <div className="space-y-4">
                <p className="text-[13px] text-[var(--color-fg-muted)]">{reviewDialog.action === "approved" ? `Setujui beta access untuk ${reviewDialog.request.user.name}?` : `Tolak beta access untuk ${reviewDialog.request.user.name}?`}</p>
                {reviewDialog.action === "rejected" && (
                  <div className="space-y-1">
                    <label htmlFor="admin_reason" className="block text-[12px] font-medium text-[var(--color-fg)]">Alasan penolakan</label>
                    <textarea id="admin_reason" rows={3} maxLength={500} placeholder="Berikan alasan penolakan..." value={reviewDialog.reason} onChange={(e) => setReviewDialog((p) => ({ ...p, reason: e.target.value }))} className="block w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-bg)] px-3 py-2 text-[13px] text-[var(--color-fg)] placeholder:text-[var(--color-fg-dim)] focus:border-[var(--color-accent)] focus:outline-none resize-none" />
                  </div>
                )}
              </div>
            )}
          </DialogContent>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setReviewDialog((p) => ({ ...p, open: false }))} disabled={reviewDialog.submitting}>Batal</Button>
            <Button variant={reviewDialog.action === "approved" ? "primary" : "danger"} size="sm" loading={reviewDialog.submitting} onClick={submitReview}>{reviewDialog.action === "approved" ? "Setujui" : "Tolak"}</Button>
          </DialogFooter>
        </Dialog>
      </div>
    </RevealOnScroll>
  );
}
