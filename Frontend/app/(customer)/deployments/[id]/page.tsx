"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api, ApiException } from "@/lib/api";
import { formatBillingCycle } from "@/lib/formatters";
import { DeploymentStatusTimeline } from "@/features/deployments/components/deployment-status-timeline";
import { CredentialReveal } from "@/features/deployments/components/credential-reveal";
import { SshKeyManager } from "@/features/deployments/components/ssh-key-manager";
import type { DeploymentState } from "@/features/deployments/components/deployment-status-timeline";

// ─── Types ──────────────────────────────────────────────────────────────────

type DeploymentStatus = DeploymentState;

interface Spec {
  key: string;
  label: string;
  value: string;
}

interface SshKey {
  id: string;
  name: string;
  fingerprint: string;
  public_key: string;
  created_at: string;
}

interface DeploymentDetail {
  public_id: string;
  product_name: string;
  status: DeploymentStatus;
  ip_address: string | null;
  hostname: string | null;
  region: string;
  billing_cycle: string;
  period_start: string | null;
  period_end: string | null;
  auto_renew: boolean;
  cancel_at_period_end: boolean;
  specs: Spec[];
  has_credential: boolean;
  ssh_keys: SshKey[];
  timestamps: Partial<Record<DeploymentStatus, string | null>>;
  created_at: string;
  updated_at: string;
}

// ─── Status badge config ────────────────────────────────────────────────────

const statusConfig: Record<
  DeploymentStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  pending_provisioning: {
    label: "Pending",
    color: "#7cd0ff",
    bg: "rgba(124, 208, 255, 0.10)",
    border: "rgba(124, 208, 255, 0.20)",
  },
  provisioning: {
    label: "Provisioning",
    color: "#FFBF00",
    bg: "rgba(255, 191, 0, 0.10)",
    border: "rgba(255, 191, 0, 0.20)",
  },
  active: {
    label: "Active",
    color: "#4be277",
    bg: "rgba(75, 226, 119, 0.10)",
    border: "rgba(75, 226, 119, 0.20)",
  },
  stopped: {
    label: "Stopped",
    color: "#a8a29e",
    bg: "rgba(168, 162, 158, 0.10)",
    border: "rgba(168, 162, 158, 0.20)",
  },
  suspended: {
    label: "Suspended",
    color: "#f59e0b",
    bg: "rgba(245, 158, 11, 0.10)",
    border: "rgba(245, 158, 11, 0.20)",
  },
  failed: {
    label: "Failed",
    color: "#ffb5ab",
    bg: "rgba(255, 181, 171, 0.10)",
    border: "rgba(255, 181, 171, 0.20)",
  },
  deleted: {
    label: "Deleted",
    color: "#78716c",
    bg: "rgba(120, 113, 108, 0.10)",
    border: "rgba(120, 113, 108, 0.20)",
  },
};

// ─── Known spec icon labels ─────────────────────────────────────────────────

const specIconMap: Record<string, string> = {
  cpu: "CPU",
  vcpu: "vCPU",
  cores: "Cores",
  ram: "RAM",
  memory: "RAM",
  storage: "Storage",
  disk: "Storage",
  bandwidth: "Bandwidth",
  network: "Network",
};

// ─── Format date ────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
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

function formatShortDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function DeploymentDetailPage() {
  const params = useParams<{ id: string }>();
  const deploymentId = params.id;

  const [deployment, setDeployment] = useState<DeploymentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState(false);

  // ── Fetch deployment ────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function fetchDeployment() {
      try {
        const data = await api.get<DeploymentDetail>(
          `/api/v1/deployments/${deploymentId}`,
        );
        if (!cancelled) setDeployment(data);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiException && err.status === 404) {
          setError("Deployment tidak ditemukan.");
        } else {
          setError(
            err instanceof Error ? err.message : "Gagal memuat detail deployment.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchDeployment();
    return () => {
      cancelled = true;
    };
  }, [deploymentId]);

  // ── Resource action ─────────────────────────────────────────────────────
  const handleAction = useCallback(
    async (action: string) => {
      if (!deployment) return;
      setActionLoading(action);

      try {
        await api.post(
          `/api/v1/deployments/${deployment.public_id}/action`,
          { action_type: action },
        );
        // Refresh deployment data
        const data = await api.get<DeploymentDetail>(
          `/api/v1/deployments/${deployment.public_id}`,
        );
        setDeployment(data);
      } catch (err) {
        setError(
          err instanceof ApiException
            ? err.message
            : "Gagal melakukan aksi.",
        );
      } finally {
        setActionLoading(null);
      }
    },
    [deployment],
  );

  // ── Cancel at period end ────────────────────────────────────────────────
  const handleCancelAtPeriodEnd = useCallback(async () => {
    if (!deployment) return;
    setCancelLoading(true);

    try {
      await api.post(
        `/api/v1/deployments/${deployment.public_id}/cancel-at-period-end`,
      );
      const data = await api.get<DeploymentDetail>(
        `/api/v1/deployments/${deployment.public_id}`,
      );
      setDeployment(data);
      setCancelConfirm(false);
    } catch (err) {
      setError(
        err instanceof ApiException
          ? err.message
          : "Gagal membatalkan deployment.",
      );
    } finally {
      setCancelLoading(false);
    }
  }, [deployment]);

  // ── Loading skeleton ────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 animate-pulse rounded bg-[rgba(255,191,0,0.08)]" />
          <div className="h-8 w-64 animate-pulse rounded bg-[rgba(255,191,0,0.08)]" />
        </div>
        <div className="h-[120px] animate-pulse rounded-2xl bg-[rgba(255,191,0,0.06)]" />
        <div className="h-[80px] animate-pulse rounded-2xl bg-[rgba(255,191,0,0.04)]" />
        <div className="h-[150px] animate-pulse rounded-2xl bg-[rgba(255,191,0,0.06)]" />
      </div>
    );
  }

  // ── Error ───────────────────────────────────────────────────────────────
  if (error || !deployment) {
    return (
      <div className="space-y-6">
        <Link
          href="/deployments"
          className="inline-flex items-center gap-1 text-sm text-[#FFBF00]/60 transition-colors hover:text-[#FFBF00]"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Kembali ke Deployments
        </Link>
        <div className="rounded-2xl border border-[#ffb5ab]/20 bg-[#ffb5ab]/5 p-8 backdrop-blur-[24px] text-center">
          <h2 className="text-lg font-semibold text-[#F5F5F0]">
            {error ?? "Gagal memuat detail deployment."}
          </h2>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 rounded-full border border-[rgba(255,191,0,0.12)] bg-[rgba(25,20,0,0.6)] px-6 py-2.5 text-sm font-medium text-[#F5F5F0]/60 transition-colors hover:border-[rgba(255,191,0,0.3)] hover:text-[#F5F5F0]"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  const status = statusConfig[deployment.status] ?? statusConfig.pending_provisioning;
  const isActive = deployment.status === "active";
  const isStopped = deployment.status === "stopped";
  const canStartStop = isActive || isStopped;

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/deployments"
        className="inline-flex items-center gap-1 text-sm text-[#FFBF00]/60 transition-colors hover:text-[#FFBF00]"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        Kembali ke Deployments
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[#F5F5F0]">
              {deployment.product_name}
            </h1>
            <span
              className="shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
              style={{
                color: status.color,
                backgroundColor: status.bg,
                borderColor: status.border,
              }}
            >
              {status.label}
            </span>
          </div>
          <p className="mt-1 text-sm text-[#F5F5F0]/40">
            Deployment ID: <span className="font-mono">{deployment.public_id}</span>
          </p>
        </div>

        {/* Actions */}
        {canStartStop && (
          <div className="flex items-center gap-2">
            {isActive && (
              <button
                type="button"
                onClick={() => handleAction("stop")}
                disabled={actionLoading !== null}
                className="rounded-lg border border-[rgba(255,191,0,0.12)] bg-[rgba(25,20,0,0.6)] px-4 py-2 text-xs font-medium text-[#F5F5F0]/60 transition-colors hover:border-[rgba(255,191,0,0.3)] hover:text-[#F5F5F0] disabled:opacity-50"
              >
                {actionLoading === "stop" ? "..." : "Stop"}
              </button>
            )}
            {isStopped && (
              <button
                type="button"
                onClick={() => handleAction("start")}
                disabled={actionLoading !== null}
                className="rounded-lg bg-[#4be277]/15 border border-[#4be277]/25 px-4 py-2 text-xs font-medium text-[#4be277] transition-colors hover:bg-[#4be277]/25 disabled:opacity-50"
              >
                {actionLoading === "start" ? "..." : "Start"}
              </button>
            )}
            <button
              type="button"
              onClick={() => handleAction("restart")}
              disabled={actionLoading !== null}
              className="rounded-lg border border-[rgba(255,191,0,0.12)] bg-[rgba(25,20,0,0.6)] px-4 py-2 text-xs font-medium text-[#FFBF00] transition-colors hover:bg-[rgba(255,191,0,0.08)] disabled:opacity-50"
            >
              {actionLoading === "restart" ? "..." : "Restart"}
            </button>
          </div>
        )}
      </div>

      {/* Error banner */}
      {error && (
        <div className="rounded-lg border border-[#ffb5ab]/20 bg-[#ffb5ab]/5 px-4 py-3">
          <p className="text-xs text-[#ffb5ab]">{error}</p>
        </div>
      )}

      {/* ─── Status Timeline ──────────────────────────────────────────────── */}
      <DeploymentStatusTimeline
        currentState={deployment.status}
        timestamps={deployment.timestamps}
      />

      {/* ─── Specs ────────────────────────────────────────────────────────── */}
      {deployment.specs && deployment.specs.length > 0 && (
        <div className="rounded-2xl border border-[rgba(255,191,0,0.08)] bg-[rgba(25,20,0,0.4)] p-6 backdrop-blur-[24px]">
          <h3 className="mb-4 font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-[#FFBF00]/60">
            Spesifikasi
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {deployment.specs.map((spec) => (
              <div
                key={spec.key}
                className="rounded-lg border border-[rgba(255,191,0,0.06)] bg-[rgba(25,20,0,0.3)] px-4 py-3"
              >
                <p className="font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-[#FFBF00]/50">
                  {specIconMap[spec.key] ?? spec.label ?? spec.key}
                </p>
                <p className="mt-1 text-sm font-medium text-[#F5F5F0]">
                  {spec.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Access ───────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <h3 className="font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-[#FFBF00]/60">
          Akses
        </h3>

        {/* IP/Hostname */}
        {(deployment.ip_address || deployment.hostname) && (
          <div className="rounded-xl border border-[rgba(255,191,0,0.08)] bg-[rgba(25,20,0,0.4)] p-4 backdrop-blur-[24px]">
            <div className="grid gap-4 sm:grid-cols-2">
              {deployment.ip_address && (
                <div>
                  <p className="font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-[#FFBF00]/50">
                    IP Address
                  </p>
                  <p className="mt-1 font-mono text-sm text-[#F5F5F0]">
                    {deployment.ip_address}
                  </p>
                </div>
              )}
              {deployment.hostname && (
                <div>
                  <p className="font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-[#FFBF00]/50">
                    Hostname
                  </p>
                  <p className="mt-1 font-mono text-sm text-[#F5F5F0]">
                    {deployment.hostname}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Credential reveal */}
        {deployment.has_credential && (
          <CredentialReveal
            credentialEndpoint={`/api/v1/deployments/${deployment.public_id}/credential`}
            label="Access Credential"
          />
        )}

        {/* SSH Keys */}
        <SshKeyManager
          initialKeys={deployment.ssh_keys ?? []}
          apiBase={`/api/v1/deployments/${deployment.public_id}/ssh-keys`}
        />
      </div>

      {/* ─── Billing ─────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-[rgba(255,191,0,0.08)] bg-[rgba(25,20,0,0.4)] p-6 backdrop-blur-[24px]">
        <h3 className="mb-4 font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-[#FFBF00]/60">
          Billing
        </h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#F5F5F0]/50">Siklus</span>
            <span className="text-[#F5F5F0]">
              {formatBillingCycle(deployment.billing_cycle)}
            </span>
          </div>

          {deployment.period_start && deployment.period_end && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#F5F5F0]/50">Periode</span>
              <span className="text-[#F5F5F0]">
                {formatShortDate(deployment.period_start)} — {formatShortDate(deployment.period_end)}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between text-sm">
            <span className="text-[#F5F5F0]/50">Auto-renewal</span>
            <span
              className={
                deployment.cancel_at_period_end
                  ? "text-[#ffb5ab]"
                  : deployment.auto_renew
                    ? "text-[#4be277]"
                    : "text-[#F5F5F0]/40"
              }
            >
              {deployment.cancel_at_period_end
                ? "Dibatalkan di akhir periode"
                : deployment.auto_renew
                  ? "Aktif"
                  : "Nonaktif"}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-[#F5F5F0]/50">Dibuat</span>
            <span className="text-[#F5F5F0]">{formatDate(deployment.created_at)}</span>
          </div>
        </div>

        {/* Cancel at period end */}
        {isActive && !deployment.cancel_at_period_end && (
          <div className="mt-4 border-t border-[rgba(255,191,0,0.06)] pt-4">
            {cancelConfirm ? (
              <div className="space-y-3">
                <p className="text-xs text-[#ffb5ab]">
                  Deployment akan tetap aktif sampai akhir periode billing dan tidak akan diperpanjang otomatis.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCancelAtPeriodEnd}
                    disabled={cancelLoading}
                    className="rounded-lg bg-[#ffb5ab]/15 border border-[#ffb5ab]/25 px-4 py-2 text-xs font-medium text-[#ffb5ab] transition-colors hover:bg-[#ffb5ab]/25 disabled:opacity-50"
                  >
                    {cancelLoading ? "Memproses..." : "Ya, Batalkan Renewal"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCancelConfirm(false)}
                    className="rounded-lg border border-[rgba(255,191,0,0.12)] bg-[rgba(25,20,0,0.6)] px-4 py-2 text-xs font-medium text-[#F5F5F0]/60 transition-colors hover:text-[#F5F5F0]"
                  >
                    Kembali
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setCancelConfirm(true)}
                className="text-xs text-[#F5F5F0]/30 transition-colors hover:text-[#ffb5ab]"
              >
                Batalkan di Akhir Periode
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
