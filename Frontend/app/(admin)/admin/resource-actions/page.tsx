"use client";

import { useState, useEffect, useCallback } from "react";
import { api, ApiException } from "@/lib/api";

// ─── Types ──────────────────────────────────────────────────────────────────

type ActionStatus = "pending" | "processing" | "completed" | "failed";
type ActionType = "start" | "stop" | "restart";

interface ResourceAction {
  public_id: string;
  deployment_id: string;
  deployment_name: string;
  customer_name: string;
  action_type: ActionType;
  status: ActionStatus;
  requested_at: string;
  processed_at: string | null;
  processed_by: string | null;
}

interface ResourceActionsResponse {
  data: ResourceAction[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

// ─── Status badge config ────────────────────────────────────────────────────

const actionStatusConfig: Record<
  ActionStatus,
  { label: string; style: string }
> = {
  pending: {
    label: "Pending",
    style: "bg-[#7cd0ff]/10 text-[#7cd0ff] border-[#7cd0ff]/20",
  },
  processing: {
    label: "Processing",
    style: "bg-[#FFBF00]/10 text-[#FFBF00] border-[#FFBF00]/20",
  },
  completed: {
    label: "Completed",
    style: "bg-[#4be277]/10 text-[#4be277] border-[#4be277]/20",
  },
  failed: {
    label: "Failed",
    style: "bg-[#ffb5ab]/10 text-[#ffb5ab] border-[#ffb5ab]/20",
  },
};

const actionTypeLabels: Record<ActionType, string> = {
  start: "Start",
  stop: "Stop",
  restart: "Restart",
};

// ─── Format date ────────────────────────────────────────────────────────────

function formatDateTime(dateStr: string): string {
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

export default function AdminResourceActionsPage() {
  const [actions, setActions] = useState<ResourceAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<ResourceActionsResponse["meta"] | null>(null);

  // Process action modal
  const [processAction, setProcessAction] = useState<ResourceAction | null>(null);
  const [processResult, setProcessResult] = useState<"completed" | "failed">("completed");
  const [processLoading, setProcessLoading] = useState(false);

  // ── Fetch actions ───────────────────────────────────────────────────────
  const fetchActions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params: Record<string, string> = { page: String(page) };
      if (statusFilter) params.status = statusFilter;

      const res = await api.get<ResourceActionsResponse>(
        "/api/v1/admin/resource-actions",
        { params },
      );
      setActions(res.data ?? []);
      setMeta(res.meta);
    } catch (err) {
      if (err instanceof ApiException) {
        setError(err.message);
      } else {
        setError("Gagal memuat resource actions.");
      }
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchActions();
  }, [fetchActions]);

  // ── Process action ──────────────────────────────────────────────────────
  async function handleProcess() {
    if (!processAction) return;
    setProcessLoading(true);

    try {
      await api.post(
        `/api/v1/admin/resource-actions/${processAction.public_id}/process`,
        { status: processResult },
      );
      setProcessAction(null);
      fetchActions();
    } catch (err) {
      setError(
        err instanceof ApiException
          ? err.message
          : "Gagal memproses aksi.",
      );
    } finally {
      setProcessLoading(false);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-foreground">
          Resource Actions
        </h1>
        <p className="mt-0.5 text-xs text-foreground-muted">
          Antrian aksi resource (start, stop, restart) yang perlu diproses.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-[#ffb5ab]/20 bg-[#ffb5ab]/5 px-4 py-3">
          <p className="text-xs text-[#ffb5ab]">{error}</p>
        </div>
      )}

      {/* Filter bar */}
      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-surface-glass-border bg-surface-glass p-3">
        <div className="w-36">
          <label className="mb-1 block text-2xs font-medium uppercase tracking-wider text-foreground-muted">
            Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="block w-full rounded border border-surface-glass-border bg-background px-2.5 py-1.5 text-sm text-foreground focus:border-amber-brand focus:outline-none focus:ring-1 focus:ring-amber-brand/20"
          >
            <option value="">Semua</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-surface-glass-border bg-surface-glass">
        {loading && actions.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-brand border-t-transparent" />
          </div>
        ) : actions.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-foreground-muted">
              Tidak ada resource action.
            </p>
          </div>
        ) : (
          <>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-surface-glass-border">
                  <th className="whitespace-nowrap px-3 py-2 text-2xs font-semibold uppercase tracking-wider text-foreground-muted">
                    Deployment
                  </th>
                  <th className="whitespace-nowrap px-3 py-2 text-2xs font-semibold uppercase tracking-wider text-foreground-muted">
                    Customer
                  </th>
                  <th className="whitespace-nowrap px-3 py-2 text-2xs font-semibold uppercase tracking-wider text-foreground-muted">
                    Action
                  </th>
                  <th className="whitespace-nowrap px-3 py-2 text-2xs font-semibold uppercase tracking-wider text-foreground-muted">
                    Status
                  </th>
                  <th className="whitespace-nowrap px-3 py-2 text-2xs font-semibold uppercase tracking-wider text-foreground-muted">
                    Requested
                  </th>
                  <th className="whitespace-nowrap px-3 py-2 text-2xs font-semibold uppercase tracking-wider text-foreground-muted text-right">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-glass-border">
                {actions.map((action) => {
                  const statusConf = actionStatusConfig[action.status];

                  return (
                    <tr
                      key={action.public_id}
                      className="transition-colors hover:bg-surface-elevated/50"
                    >
                      {/* Deployment */}
                      <td className="whitespace-nowrap px-3 py-2">
                        <div className="text-xs font-medium text-foreground">
                          {action.deployment_name}
                        </div>
                        <div className="font-mono text-2xs text-foreground-dim">
                          {action.deployment_id.slice(0, 12)}...
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="whitespace-nowrap px-3 py-2 text-xs text-foreground-muted">
                        {action.customer_name}
                      </td>

                      {/* Action type */}
                      <td className="whitespace-nowrap px-3 py-2">
                        <span className="inline-flex items-center rounded-md border border-surface-glass-border bg-surface-glass px-2 py-0.5 text-2xs font-mono font-medium text-foreground-muted">
                          {actionTypeLabels[action.action_type] ?? action.action_type}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="whitespace-nowrap px-3 py-2">
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-2xs font-semibold uppercase tracking-wider ${statusConf.style}`}
                        >
                          {statusConf.label}
                        </span>
                      </td>

                      {/* Requested */}
                      <td className="whitespace-nowrap px-3 py-2">
                        <span className="text-2xs text-foreground-muted">
                          {formatDateTime(action.requested_at)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="whitespace-nowrap px-3 py-2 text-right">
                        {(action.status === "pending" || action.status === "processing") && (
                          <button
                            type="button"
                            onClick={() => {
                              setProcessAction(action);
                              setProcessResult("completed");
                            }}
                            className="rounded bg-[#FFBF00]/15 border border-[#FFBF00]/25 px-2.5 py-0.5 text-2xs font-medium text-[#FFBF00] transition-colors hover:bg-[#FFBF00]/25"
                          >
                            Process
                          </button>
                        )}
                        {(action.status === "completed" || action.status === "failed") && (
                          <div>
                            {action.processed_by && (
                              <span className="text-2xs text-foreground-dim">
                                by {action.processed_by}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
            {meta && meta.last_page > 1 && (
              <div className="flex items-center justify-between border-t border-surface-glass-border px-4 py-2">
                <button
                  type="button"
                  disabled={meta.current_page <= 1}
                  onClick={() => setPage(meta.current_page - 1)}
                  className="rounded border border-surface-glass-border bg-surface-glass px-3 py-1 text-2xs font-medium text-foreground-muted transition-colors hover:border-amber-brand/20 disabled:opacity-50"
                >
                  Sebelumnya
                </button>
                <span className="text-2xs text-foreground-muted">
                  {meta.current_page} / {meta.last_page} · {meta.total} action
                </span>
                <button
                  type="button"
                  disabled={meta.current_page >= meta.last_page}
                  onClick={() => setPage(meta.current_page + 1)}
                  className="rounded border border-surface-glass-border bg-surface-glass px-3 py-1 text-2xs font-medium text-foreground-muted transition-colors hover:border-amber-brand/20 disabled:opacity-50"
                >
                  Berikutnya
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ─── Process Modal ────────────────────────────────────────────────── */}
      {processAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-xl border border-surface-glass-border bg-surface-glass p-6 shadow-elevated">
            <h3 className="text-sm font-bold text-foreground">
              Process Resource Action
            </h3>
            <p className="mt-1 text-2xs text-foreground-dim">
              {actionTypeLabels[processAction.action_type]} · {processAction.deployment_name}
            </p>

            <div className="mt-4 space-y-2">
              <p className="text-2xs font-medium uppercase tracking-wider text-foreground-muted">
                Result
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setProcessResult("completed")}
                  className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                    processResult === "completed"
                      ? "border-[#4be277]/40 bg-[#4be277]/15 text-[#4be277]"
                      : "border-surface-glass-border bg-surface-glass text-foreground-muted"
                  }`}
                >
                  Completed
                </button>
                <button
                  type="button"
                  onClick={() => setProcessResult("failed")}
                  className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                    processResult === "failed"
                      ? "border-[#ffb5ab]/40 bg-[#ffb5ab]/15 text-[#ffb5ab]"
                      : "border-surface-glass-border bg-surface-glass text-foreground-muted"
                  }`}
                >
                  Failed
                </button>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setProcessAction(null)}
                className="rounded-lg border border-surface-glass-border px-4 py-2 text-xs font-medium text-foreground-muted transition-colors hover:text-foreground"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleProcess}
                disabled={processLoading}
                className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all disabled:opacity-50 ${
                  processResult === "completed"
                    ? "bg-[#4be277]/15 border border-[#4be277]/25 text-[#4be277] hover:bg-[#4be277]/25"
                    : "bg-[#ffb5ab]/15 border border-[#ffb5ab]/25 text-[#ffb5ab] hover:bg-[#ffb5ab]/25"
                }`}
              >
                {processLoading ? "Memproses..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
