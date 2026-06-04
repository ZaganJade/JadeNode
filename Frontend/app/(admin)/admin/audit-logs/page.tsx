"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogHeader,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { request, ApiException } from "@/lib/api";

interface AuditLogActor {
  id: number;
  name: string;
  email: string;
}

interface AuditLogEntry {
  id: number;
  public_id: string;
  actor: AuditLogActor | null;
  actor_type: string;
  action: string;
  target_type: string;
  target_id: string | null;
  metadata: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

interface AuditLogDetail extends AuditLogEntry {
  user_agent: string | null;
  request_id: string | null;
}

interface AuditListResponse {
  data: AuditLogEntry[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

const ACTOR_TYPE_LABELS: Record<string, string> = {
  user: "User",
  admin: "Admin",
  system: "System",
};

const ACTOR_TYPE_VARIANT: Record<string, "default" | "warning" | "error"> = {
  user: "default",
  admin: "warning",
  system: "error",
};

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function AdminAuditLogsPage() {
  const [data, setData] = useState<AuditListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [filterAction, setFilterAction] = useState("");
  const [filterTargetType, setFilterTargetType] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  // Detail drawer
  const [detail, setDetail] = useState<AuditLogDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchLogs = useCallback(
    async (page?: number) => {
      setLoading(true);
      setError("");
      try {
        const params: Record<string, string> = {};
        if (page) params.page = String(page);
        if (filterAction) params.action = filterAction;
        if (filterTargetType) params.target_type = filterTargetType;
        if (filterDateFrom) params.date_from = filterDateFrom;
        if (filterDateTo) params.date_to = filterDateTo;

        const result = await request<AuditListResponse>(
          "/api/v1/admin/audit-logs",
          { params },
        );
        setData(result);
      } catch (err) {
        if (err instanceof ApiException) {
          setError(err.message);
        } else {
          setError("Gagal memuat audit log.");
        }
      } finally {
        setLoading(false);
      }
    },
    [filterAction, filterTargetType, filterDateFrom, filterDateTo],
  );

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  async function openDetail(id: number) {
    setDetailLoading(true);
    try {
      const result = await request<{ data: AuditLogDetail }>(
        `/api/v1/admin/audit-logs/${id}`,
      );
      setDetail(result.data);
    } catch {
      // silently fail
    } finally {
      setDetailLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Audit Logs</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Riwayat semua aksi sensitif di platform.
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-foreground">Filter</h2>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1 block text-2xs font-medium text-foreground-muted">
                Action
              </label>
              <Input
                placeholder="listing.updated"
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-2xs font-medium text-foreground-muted">
                Target Type
              </label>
              <Input
                placeholder="deployment"
                value={filterTargetType}
                onChange={(e) => setFilterTargetType(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-2xs font-medium text-foreground-muted">
                Dari Tanggal
              </label>
              <Input
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-2xs font-medium text-foreground-muted">
                Sampai Tanggal
              </label>
              <Input
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
              />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Button size="sm" variant="primary" onClick={() => fetchLogs(1)}>
              Terapkan Filter
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setFilterAction("");
                setFilterTargetType("");
                setFilterDateFrom("");
                setFilterDateTo("");
              }}
            >
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Audit Log Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">
              Log Entries
            </h2>
            {data && (
              <span className="text-xs text-foreground-muted">
                {data.meta.total} total
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading && !data ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
            </div>
          ) : data && data.data.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Actor</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>IP</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.data.map((log) => (
                      <TableRow
                        key={log.id}
                        className="cursor-pointer hover:bg-surface-elevated"
                        onClick={() => openDetail(log.id)}
                      >
                        <TableCell className="whitespace-nowrap font-mono text-2xs text-foreground-muted">
                          {formatTimestamp(log.created_at)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {log.actor ? (
                            <span className="font-medium text-foreground">
                              {log.actor.name}
                            </span>
                          ) : (
                            <span className="text-foreground-dim">System</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              ACTOR_TYPE_VARIANT[log.actor_type] || "default"
                            }
                          >
                            {ACTOR_TYPE_LABELS[log.actor_type] ||
                              log.actor_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-amber-brand">
                          {log.action}
                        </TableCell>
                        <TableCell className="text-xs text-foreground-muted">
                          {log.target_type}
                          {log.target_id && (
                            <span className="ml-1 font-mono text-foreground-dim">
                              #{log.target_id}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-2xs text-foreground-dim">
                          {log.ip_address || "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {data.meta.last_page > 1 && (
                <div className="flex items-center justify-between border-t border-surface-glass-border px-4 py-3">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={data.meta.current_page <= 1}
                    onClick={() => fetchLogs(data.meta.current_page - 1)}
                  >
                    Sebelumnya
                  </Button>
                  <span className="text-xs text-foreground-muted">
                    Halaman {data.meta.current_page} dari{" "}
                    {data.meta.last_page}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={data.meta.current_page >= data.meta.last_page}
                    onClick={() => fetchLogs(data.meta.current_page + 1)}
                  >
                    Berikutnya
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="p-8 text-center">
              <p className="text-sm text-foreground-muted">
                Tidak ada audit log ditemukan.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Dialog open={!!detail} onClose={() => setDetail(null)}>
        <DialogHeader>
          <h3 className="text-lg font-semibold text-foreground">
            Audit Log Detail
          </h3>
        </DialogHeader>
        <DialogContent>
          {detailLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
            </div>
          ) : detail ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-2xs font-semibold uppercase tracking-wider text-foreground-muted">
                    Public ID
                  </p>
                  <p className="mt-0.5 font-mono text-sm text-foreground">
                    {detail.public_id}
                  </p>
                </div>
                <div>
                  <p className="text-2xs font-semibold uppercase tracking-wider text-foreground-muted">
                    Timestamp
                  </p>
                  <p className="mt-0.5 text-sm text-foreground">
                    {formatTimestamp(detail.created_at)}
                  </p>
                </div>
                <div>
                  <p className="text-2xs font-semibold uppercase tracking-wider text-foreground-muted">
                    Actor
                  </p>
                  <p className="mt-0.5 text-sm text-foreground">
                    {detail.actor
                      ? `${detail.actor.name} (${detail.actor.email})`
                      : "System"}
                  </p>
                </div>
                <div>
                  <p className="text-2xs font-semibold uppercase tracking-wider text-foreground-muted">
                    Actor Type
                  </p>
                  <p className="mt-0.5">
                    <Badge
                      variant={
                        ACTOR_TYPE_VARIANT[detail.actor_type] || "default"
                      }
                    >
                      {ACTOR_TYPE_LABELS[detail.actor_type] ||
                        detail.actor_type}
                    </Badge>
                  </p>
                </div>
                <div>
                  <p className="text-2xs font-semibold uppercase tracking-wider text-foreground-muted">
                    Action
                  </p>
                  <p className="mt-0.5 font-mono text-sm text-amber-brand">
                    {detail.action}
                  </p>
                </div>
                <div>
                  <p className="text-2xs font-semibold uppercase tracking-wider text-foreground-muted">
                    Target
                  </p>
                  <p className="mt-0.5 text-sm text-foreground">
                    {detail.target_type}
                    {detail.target_id && ` #${detail.target_id}`}
                  </p>
                </div>
                <div>
                  <p className="text-2xs font-semibold uppercase tracking-wider text-foreground-muted">
                    IP Address
                  </p>
                  <p className="mt-0.5 font-mono text-sm text-foreground">
                    {detail.ip_address || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-2xs font-semibold uppercase tracking-wider text-foreground-muted">
                    Request ID
                  </p>
                  <p className="mt-0.5 font-mono text-xs text-foreground-dim">
                    {detail.request_id || "—"}
                  </p>
                </div>
              </div>
              {detail.user_agent && (
                <div>
                  <p className="text-2xs font-semibold uppercase tracking-wider text-foreground-muted">
                    User Agent
                  </p>
                  <p className="mt-0.5 break-all text-xs text-foreground-dim">
                    {detail.user_agent}
                  </p>
                </div>
              )}
              {detail.metadata &&
                Object.keys(detail.metadata).length > 0 && (
                  <div>
                    <p className="text-2xs font-semibold uppercase tracking-wider text-foreground-muted">
                      Metadata
                    </p>
                    <pre className="mt-1 overflow-auto rounded-lg bg-background/50 p-3 font-mono text-xs text-foreground-dim">
                      {JSON.stringify(detail.metadata, null, 2)}
                    </pre>
                  </div>
                )}
            </div>
          ) : null}
        </DialogContent>
        <DialogFooter>
          <Button size="sm" variant="outline" onClick={() => setDetail(null)}>
            Tutup
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
