"use client";

import { useState, useEffect, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  requestBetaAccess,
  getBetaAccessStatus,
  type BetaAccessStatus,
} from "@/lib/auth";
import { ApiException } from "@/lib/api";
import { CheckCircle2, Clock, XCircle } from "lucide-react";

export function BetaAccessRequestForm() {
  const [statusData, setStatusData] = useState<BetaAccessStatus | null>(null);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingStatus, setFetchingStatus] = useState(true);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    async function fetchStatus() {
      try {
        const data = await getBetaAccessStatus();
        setStatusData(data);
      } catch {
        // User might not be authenticated — silently ignore
      } finally {
        setFetchingStatus(false);
      }
    }
    fetchStatus();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setErrors({});
    setLoading(true);

    try {
      const result = await requestBetaAccess(reason || undefined);
      setStatusData({
        status: result.request.status,
        request: result.request,
      });
      setReason("");
    } catch (err) {
      if (err instanceof ApiException) {
        if (
          err.status === 422 &&
          typeof err.detail === "object" &&
          err.detail !== null
        ) {
          const detail = err.detail as Record<string, unknown>;
          if ("errors" in detail) {
            setErrors(detail.errors as Record<string, string[]>);
          } else {
            setError(err.message);
          }
        } else {
          setError(err.message);
        }
      } else {
        setError("Terjadi kesalahan. Silakan coba lagi.");
      }
    } finally {
      setLoading(false);
    }
  }

  if (fetchingStatus) {
    return (
      <Card className="w-full max-w-lg">
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Approved state
  if (statusData?.status === "approved") {
    return (
      <Card className="w-full max-w-lg">
        <CardContent>
          <div className="flex flex-col items-center py-6 text-center">
            <CheckCircle2 className="mb-4 h-12 w-12 text-success-500" />
            <h2 className="text-xl font-bold text-foreground">
              Beta Access Disetujui
            </h2>
            <p className="mt-2 text-sm text-foreground-muted">
              Kamu sekarang bisa melakukan checkout untuk membeli layanan di
              JadeNode Marketplace.
            </p>
            <Badge variant="success" className="mt-4">
              Approved
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Pending state
  if (statusData?.status === "pending") {
    return (
      <Card className="w-full max-w-lg">
        <CardContent>
          <div className="flex flex-col items-center py-6 text-center">
            <Clock className="mb-4 h-12 w-12 text-warning-500" />
            <h2 className="text-xl font-bold text-foreground">
              Menunggu Review
            </h2>
            <p className="mt-2 text-sm text-foreground-muted">
              Permintaan beta access kamu sedang ditinjau oleh admin. Kami akan
              memberitahu kamu melalui email setelah ada keputusan.
            </p>
            <Badge variant="warning" className="mt-4">
              Pending
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Rejected state — show reason and allow re-request
  if (statusData?.status === "rejected") {
    return (
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">
              Ajukan Beta Access
            </h1>
            <p className="mt-2 text-sm text-secondary-500">
              Permintaan sebelumnya ditolak. Kamu bisa mengajukan kembali.
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {statusData.request?.admin_reason && (
              <Alert variant="error">
                <div>
                  <p className="font-medium">Alasan penolakan:</p>
                  <p className="mt-1">{statusData.request.admin_reason}</p>
                </div>
              </Alert>
            )}

            <RejectedNotice />

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label
                  htmlFor="reason"
                  className="block text-sm font-medium text-foreground"
                >
                  Alasan (opsional)
                </label>
                <textarea
                  id="reason"
                  rows={3}
                  maxLength={500}
                  placeholder="Ceritakan mengapa kamu membutuhkan akses beta..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="block w-full rounded-lg border border-secondary-200 px-3 py-2 text-sm transition-colors placeholder:text-secondary-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
                {errors.reason && (
                  <p className="text-xs text-error-600">{errors.reason[0]}</p>
                )}
              </div>
              <Button type="submit" loading={loading} className="w-full">
                {loading ? "Memproses..." : "Ajukan Kembali"}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No request — show form
  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">
            Ajukan Beta Access
          </h1>
          <p className="mt-2 text-sm text-secondary-500">
            JadeNode sedang dalam tahap beta privat. Ajukan akses untuk bisa
            melakukan checkout.
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {error && <Alert variant="error">{error}</Alert>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label
                htmlFor="reason"
                className="block text-sm font-medium text-foreground"
              >
                Alasan (opsional)
              </label>
              <textarea
                id="reason"
                rows={4}
                maxLength={500}
                placeholder="Ceritakan mengapa kamu membutuhkan akses beta..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="block w-full rounded-lg border border-secondary-200 px-3 py-2 text-sm transition-colors placeholder:text-secondary-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
              {errors.reason && (
                <p className="text-xs text-error-600">{errors.reason[0]}</p>
              )}
            </div>
            <Button type="submit" loading={loading} className="w-full">
              {loading ? "Memproses..." : "Ajukan Beta Access"}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}

function RejectedNotice() {
  return (
    <div className="flex items-start gap-2 rounded-lg bg-error-50 p-3">
      <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-error-500" />
      <p className="text-sm text-error-700">
        Permintaan beta access sebelumnya ditolak. Kamu bisa mengajukan
        permintaan baru.
      </p>
    </div>
  );
}
