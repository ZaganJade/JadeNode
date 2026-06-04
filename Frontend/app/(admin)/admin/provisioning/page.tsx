"use client";

import { useState, useEffect, useCallback } from "react";
import { api, ApiException } from "@/lib/api";

// ─── Types ──────────────────────────────────────────────────────────────────

type TaskStatus = "pending" | "provisioning" | "completed" | "failed";

interface ProvisioningTask {
  public_id: string;
  customer_name: string;
  customer_email: string;
  product_name: string;
  provider_name: string;
  sla_due_at: string | null;
  status: TaskStatus;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

interface ProvisioningListResponse {
  data: ProvisioningTask[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

// ─── Status badge config ────────────────────────────────────────────────────

const taskStatusConfig: Record<
  TaskStatus,
  { label: string; style: string }
> = {
  pending: {
    label: "Pending",
    style: "bg-[#7cd0ff]/10 text-[#7cd0ff] border-[#7cd0ff]/20",
  },
  provisioning: {
    label: "Provisioning",
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

function isOverdue(slaDueAt: string | null): boolean {
  if (!slaDueAt) return false;
  return new Date(slaDueAt) < new Date();
}

function formatTimeUntil(dateStr: string): string {
  const now = new Date();
  const target = new Date(dateStr);
  const diff = target.getTime() - now.getTime();

  if (diff <= 0) return "Overdue";

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function AdminProvisioningPage() {
  const [tasks, setTasks] = useState<ProvisioningTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<ProvisioningListResponse["meta"] | null>(null);

  // Action modals
  const [actionTask, setActionTask] = useState<ProvisioningTask | null>(null);
  const [actionType, setActionType] = useState<"start" | "complete" | "fail" | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Complete form
  const [completeHostname, setCompleteHostname] = useState("");
  const [completeIp, setCompleteIp] = useState("");
  const [completeCredential, setCompleteCredential] = useState("");

  // Fail form
  const [failReason, setFailReason] = useState("");

  // ── Fetch tasks ─────────────────────────────────────────────────────────
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params: Record<string, string> = { page: String(page) };
      if (statusFilter) params.status = statusFilter;

      const res = await api.get<ProvisioningListResponse>(
        "/api/v1/admin/provisioning",
        { params },
      );
      setTasks(res.data ?? []);
      setMeta(res.meta);
    } catch (err) {
      if (err instanceof ApiException) {
        setError(err.message);
      } else {
        setError("Gagal memuat provisioning queue.");
      }
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // ── Open action ─────────────────────────────────────────────────────────
  function openAction(task: ProvisioningTask, type: "start" | "complete" | "fail") {
    setActionTask(task);
    setActionType(type);
    setCompleteHostname("");
    setCompleteIp("");
    setCompleteCredential("");
    setFailReason("");
  }

  function closeAction() {
    setActionTask(null);
    setActionType(null);
  }

  // ── Execute action ──────────────────────────────────────────────────────
  async function executeAction() {
    if (!actionTask || !actionType) return;
    setActionLoading(true);

    try {
      if (actionType === "start") {
        await api.post(`/api/v1/admin/provisioning/${actionTask.public_id}/start`);
      } else if (actionType === "complete") {
        await api.post(`/api/v1/admin/provisioning/${actionTask.public_id}/complete`, {
          hostname: completeHostname || undefined,
          ip_address: completeIp || undefined,
          credential: completeCredential || undefined,
        });
      } else if (actionType === "fail") {
        await api.post(`/api/v1/admin/provisioning/${actionTask.public_id}/fail`, {
          reason: failReason,
        });
      }

      closeAction();
      fetchTasks();
    } catch (err) {
      setError(
        err instanceof ApiException
          ? err.message
          : "Gagal melakukan aksi.",
      );
    } finally {
      setActionLoading(false);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-foreground">
          Provisioning Queue
        </h1>
        <p className="mt-0.5 text-xs text-foreground-muted">
          Kelola tugas provisioning deployment.
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
            <option value="provisioning">Provisioning</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-surface-glass-border bg-surface-glass">
        {loading && tasks.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-brand border-t-transparent" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-foreground-muted">
              Tidak ada provisioning task.
            </p>
          </div>
        ) : (
          <>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-surface-glass-border">
                  <th className="whitespace-nowrap px-3 py-2 text-2xs font-semibold uppercase tracking-wider text-foreground-muted">
                    Task ID
                  </th>
                  <th className="whitespace-nowrap px-3 py-2 text-2xs font-semibold uppercase tracking-wider text-foreground-muted">
                    Customer
                  </th>
                  <th className="whitespace-nowrap px-3 py-2 text-2xs font-semibold uppercase tracking-wider text-foreground-muted">
                    Product
                  </th>
                  <th className="whitespace-nowrap px-3 py-2 text-2xs font-semibold uppercase tracking-wider text-foreground-muted">
                    Provider
                  </th>
                  <th className="whitespace-nowrap px-3 py-2 text-2xs font-semibold uppercase tracking-wider text-foreground-muted">
                    SLA Due
                  </th>
                  <th className="whitespace-nowrap px-3 py-2 text-2xs font-semibold uppercase tracking-wider text-foreground-muted">
                    Status
                  </th>
                  <th className="whitespace-nowrap px-3 py-2 text-2xs font-semibold uppercase tracking-wider text-foreground-muted">
                    Assigned
                  </th>
                  <th className="whitespace-nowrap px-3 py-2 text-2xs font-semibold uppercase tracking-wider text-foreground-muted text-right">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-glass-border">
                {tasks.map((task) => {
                  const overdue = isOverdue(task.sla_due_at);
                  const statusConf = taskStatusConfig[task.status];

                  return (
                    <tr
                      key={task.public_id}
                      className={`transition-colors hover:bg-surface-elevated/50 ${
                        overdue && (task.status === "pending" || task.status === "provisioning")
                          ? "bg-[#ffb5ab]/[0.03]"
                          : ""
                      }`}
                    >
                      {/* Task ID */}
                      <td className="whitespace-nowrap px-3 py-2 font-mono text-2xs text-foreground-dim">
                        {task.public_id.slice(0, 12)}...
                      </td>

                      {/* Customer */}
                      <td className="whitespace-nowrap px-3 py-2">
                        <div className="text-xs font-medium text-foreground">
                          {task.customer_name}
                        </div>
                        <div className="text-2xs text-foreground-dim">
                          {task.customer_email}
                        </div>
                      </td>

                      {/* Product */}
                      <td className="whitespace-nowrap px-3 py-2 text-xs text-foreground-muted">
                        {task.product_name}
                      </td>

                      {/* Provider */}
                      <td className="whitespace-nowrap px-3 py-2 text-xs text-foreground-muted">
                        {task.provider_name}
                      </td>

                      {/* SLA Due */}
                      <td className="whitespace-nowrap px-3 py-2">
                        {task.sla_due_at ? (
                          <div>
                            <span
                              className={`font-mono text-2xs ${
                                overdue
                                  ? "text-[#ffb5ab] font-semibold"
                                  : "text-foreground-muted"
                              }`}
                            >
                              {formatDateTime(task.sla_due_at)}
                            </span>
                            {overdue && (task.status === "pending" || task.status === "provisioning") && (
                              <div className="flex items-center gap-1 mt-0.5">
                                <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#ffb5ab] animate-pulse" />
                                <span className="text-2xs text-[#ffb5ab]">
                                  {formatTimeUntil(task.sla_due_at)}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-2xs text-foreground-dim">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="whitespace-nowrap px-3 py-2">
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-2xs font-semibold uppercase tracking-wider ${statusConf.style}`}
                        >
                          {statusConf.label}
                        </span>
                      </td>

                      {/* Assigned */}
                      <td className="whitespace-nowrap px-3 py-2 text-2xs text-foreground-dim">
                        {task.assigned_to ?? "—"}
                      </td>

                      {/* Actions */}
                      <td className="whitespace-nowrap px-3 py-2 text-right">
                        {task.status === "pending" && (
                          <button
                            type="button"
                            onClick={() => openAction(task, "start")}
                            className="rounded bg-[#FFBF00]/15 border border-[#FFBF00]/25 px-2 py-0.5 text-2xs font-medium text-[#FFBF00] transition-colors hover:bg-[#FFBF00]/25"
                          >
                            Start
                          </button>
                        )}
                        {task.status === "provisioning" && (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => openAction(task, "complete")}
                              className="rounded bg-[#4be277]/15 border border-[#4be277]/25 px-2 py-0.5 text-2xs font-medium text-[#4be277] transition-colors hover:bg-[#4be277]/25"
                            >
                              Complete
                            </button>
                            <button
                              type="button"
                              onClick={() => openAction(task, "fail")}
                              className="rounded bg-[#ffb5ab]/15 border border-[#ffb5ab]/25 px-2 py-0.5 text-2xs font-medium text-[#ffb5ab] transition-colors hover:bg-[#ffb5ab]/25"
                            >
                              Fail
                            </button>
                          </div>
                        )}
                        {(task.status === "completed" || task.status === "failed") && (
                          <span className="text-2xs text-foreground-dim">
                            {formatDateTime(task.updated_at)}
                          </span>
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
                  {meta.current_page} / {meta.last_page} · {meta.total} task
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

      {/* ─── Action Modal Overlay ─────────────────────────────────────────── */}
      {actionTask && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-xl border border-surface-glass-border bg-surface-glass p-6 shadow-elevated">
            <h3 className="text-sm font-bold text-foreground">
              {actionType === "start" && "Start Provisioning"}
              {actionType === "complete" && "Complete Provisioning"}
              {actionType === "fail" && "Fail Provisioning"}
            </h3>
            <p className="mt-1 text-2xs text-foreground-dim">
              Task: {actionTask.public_id} · {actionTask.product_name}
            </p>

            {/* Complete form */}
            {actionType === "complete" && (
              <div className="mt-4 space-y-3">
                <div>
                  <label className="block mb-1 text-2xs font-medium uppercase tracking-wider text-foreground-muted">
                    Hostname
                  </label>
                  <input
                    type="text"
                    value={completeHostname}
                    onChange={(e) => setCompleteHostname(e.target.value)}
                    placeholder="server-01.example.com"
                    className="block w-full rounded border border-surface-glass-border bg-background px-2.5 py-1.5 text-sm text-foreground placeholder:text-foreground-dim focus:border-amber-brand focus:outline-none focus:ring-1 focus:ring-amber-brand/20"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-2xs font-medium uppercase tracking-wider text-foreground-muted">
                    IP Address
                  </label>
                  <input
                    type="text"
                    value={completeIp}
                    onChange={(e) => setCompleteIp(e.target.value)}
                    placeholder="192.168.1.1"
                    className="block w-full rounded border border-surface-glass-border bg-background px-2.5 py-1.5 text-sm text-foreground placeholder:text-foreground-dim focus:border-amber-brand focus:outline-none focus:ring-1 focus:ring-amber-brand/20"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-2xs font-medium uppercase tracking-wider text-foreground-muted">
                    Credential
                  </label>
                  <input
                    type="text"
                    value={completeCredential}
                    onChange={(e) => setCompleteCredential(e.target.value)}
                    placeholder="Initial password"
                    className="block w-full rounded border border-surface-glass-border bg-background px-2.5 py-1.5 text-sm text-foreground placeholder:text-foreground-dim focus:border-amber-brand focus:outline-none focus:ring-1 focus:ring-amber-brand/20"
                  />
                </div>
              </div>
            )}

            {/* Fail form */}
            {actionType === "fail" && (
              <div className="mt-4">
                <label className="block mb-1 text-2xs font-medium uppercase tracking-wider text-foreground-muted">
                  Alasan Gagal
                </label>
                <textarea
                  value={failReason}
                  onChange={(e) => setFailReason(e.target.value)}
                  placeholder="Jelaskan alasan kegagalan provisioning..."
                  rows={3}
                  className="block w-full rounded border border-surface-glass-border bg-background px-2.5 py-1.5 text-sm text-foreground placeholder:text-foreground-dim focus:border-amber-brand focus:outline-none focus:ring-1 focus:ring-amber-brand/20 resize-none"
                />
              </div>
            )}

            {/* Start confirmation */}
            {actionType === "start" && (
              <p className="mt-4 text-xs text-foreground-muted">
                Mulai provisioning untuk deployment ini?
              </p>
            )}

            {/* Actions */}
            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeAction}
                className="rounded-lg border border-surface-glass-border px-4 py-2 text-xs font-medium text-foreground-muted transition-colors hover:text-foreground"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={executeAction}
                disabled={actionLoading || (actionType === "fail" && !failReason.trim())}
                className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all disabled:opacity-50 ${
                  actionType === "fail"
                    ? "bg-[#ffb5ab]/15 border border-[#ffb5ab]/25 text-[#ffb5ab] hover:bg-[#ffb5ab]/25"
                    : actionType === "complete"
                      ? "bg-[#4be277]/15 border border-[#4be277]/25 text-[#4be277] hover:bg-[#4be277]/25"
                      : "bg-[#FFBF00] text-[#0D0B00] hover:shadow-[0_0_12px_rgba(255,191,0,0.2)]"
                }`}
              >
                {actionLoading
                  ? "Memproses..."
                  : actionType === "start"
                    ? "Start"
                    : actionType === "complete"
                      ? "Complete"
                      : "Fail"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
