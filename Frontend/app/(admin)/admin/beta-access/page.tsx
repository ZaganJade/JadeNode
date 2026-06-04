"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
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
import {
  adminListBetaRequests,
  adminReviewBetaRequest,
  type BetaAccessRequestData,
  type BetaAccessListResponse,
} from "@/lib/auth";
import { ApiException } from "@/lib/api";

const STATUS_BADGE_VARIANT: Record<
  string,
  "default" | "success" | "warning" | "error"
> = {
  pending: "warning",
  approved: "success",
  rejected: "error",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

export default function AdminBetaAccessPage() {
  const [data, setData] = useState<BetaAccessListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Review dialog state
  const [reviewDialog, setReviewDialog] = useState<{
    open: boolean;
    request: BetaAccessRequestData | null;
    action: "approved" | "rejected" | null;
    reason: string;
    submitting: boolean;
  }>({
    open: false,
    request: null,
    action: null,
    reason: "",
    submitting: false,
  });

  const fetchRequests = useCallback(async (page?: number) => {
    setLoading(true);
    setError("");
    try {
      const result = await adminListBetaRequests(page);
      setData(result);
    } catch (err) {
      if (err instanceof ApiException) {
        setError(err.message);
      } else {
        setError("Gagal memuat data.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  function openReviewDialog(
    request: BetaAccessRequestData,
    action: "approved" | "rejected",
  ) {
    setReviewDialog({
      open: true,
      request,
      action,
      reason: "",
      submitting: false,
    });
  }

  async function submitReview() {
    if (!reviewDialog.request || !reviewDialog.action) return;

    setReviewDialog((prev) => ({ ...prev, submitting: true }));

    try {
      await adminReviewBetaRequest(
        reviewDialog.request.id,
        reviewDialog.action,
        reviewDialog.action === "rejected" ? reviewDialog.reason || undefined : undefined,
      );
      setReviewDialog((prev) => ({ ...prev, open: false }));
      fetchRequests(data?.meta.current_page);
    } catch (err) {
      if (err instanceof ApiException) {
        setReviewDialog((prev) => ({ ...prev, submitting: false }));
        setError(err.message);
      } else {
        setReviewDialog((prev) => ({ ...prev, submitting: false }));
        setError("Gagal memproses review.");
      }
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Beta Access Requests
        </h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Kelola permintaan akses beta dari customer.
        </p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">
              Permintaan Beta Access
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Alasan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">
                        {request.user.name}
                      </TableCell>
                      <TableCell className="text-foreground-muted">
                        {request.user.email}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-foreground-muted">
                        {request.reason || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            STATUS_BADGE_VARIANT[request.status] || "default"
                          }
                        >
                          {STATUS_LABEL[request.status] || request.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-foreground-muted">
                        {new Date(request.created_at).toLocaleDateString(
                          "id-ID",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          },
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {request.status === "pending" ? (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() =>
                                openReviewDialog(request, "approved")
                              }
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() =>
                                openReviewDialog(request, "rejected")
                              }
                            >
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-foreground-muted">
                            Reviewed
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {data.meta.last_page > 1 && (
                <div className="flex items-center justify-between border-t border-secondary-200 px-4 py-3">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={data.meta.current_page <= 1}
                    onClick={() => fetchRequests(data.meta.current_page - 1)}
                  >
                    Sebelumnya
                  </Button>
                  <span className="text-xs text-foreground-muted">
                    Halaman {data.meta.current_page} dari {data.meta.last_page}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={data.meta.current_page >= data.meta.last_page}
                    onClick={() => fetchRequests(data.meta.current_page + 1)}
                  >
                    Berikutnya
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="p-8 text-center">
              <p className="text-sm text-foreground-muted">
                Belum ada permintaan beta access.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Confirmation Dialog */}
      <Dialog
        open={reviewDialog.open}
        onClose={() =>
          setReviewDialog((prev) => ({ ...prev, open: false }))
        }
      >
        <DialogHeader>
          <h3 className="text-lg font-semibold text-foreground">
            {reviewDialog.action === "approved"
              ? "Setujui Permintaan"
              : "Tolak Permintaan"}
          </h3>
        </DialogHeader>
        <DialogContent>
          {reviewDialog.request && (
            <div className="space-y-4">
              <p className="text-sm text-foreground-muted">
                {reviewDialog.action === "approved"
                  ? `Setujui beta access untuk ${reviewDialog.request.user.name}?`
                  : `Tolak beta access untuk ${reviewDialog.request.user.name}?`}
              </p>
              {reviewDialog.action === "rejected" && (
                <div className="space-y-1">
                  <label
                    htmlFor="admin_reason"
                    className="block text-sm font-medium text-foreground"
                  >
                    Alasan penolakan
                  </label>
                  <textarea
                    id="admin_reason"
                    rows={3}
                    maxLength={500}
                    placeholder="Berikan alasan penolakan..."
                    value={reviewDialog.reason}
                    onChange={(e) =>
                      setReviewDialog((prev) => ({
                        ...prev,
                        reason: e.target.value,
                      }))
                    }
                    className="block w-full rounded-lg border border-secondary-200 px-3 py-2 text-sm transition-colors placeholder:text-secondary-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  />
                </div>
              )}
            </div>
          )}
        </DialogContent>
        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setReviewDialog((prev) => ({ ...prev, open: false }))
            }
            disabled={reviewDialog.submitting}
          >
            Batal
          </Button>
          <Button
            variant={
              reviewDialog.action === "approved" ? "primary" : "danger"
            }
            size="sm"
            loading={reviewDialog.submitting}
            onClick={submitReview}
          >
            {reviewDialog.action === "approved" ? "Setujui" : "Tolak"}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
