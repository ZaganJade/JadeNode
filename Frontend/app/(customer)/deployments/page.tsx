"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiException } from "@/lib/api";
import { RevealOnScroll } from "@/components/landing/reveal-on-scroll";

// ─── Types ──────────────────────────────────────────────────────────────────

type DeploymentStatus =
  | "pending_provisioning"
  | "provisioning"
  | "active"
  | "stopped"
  | "suspended"
  | "failed"
  | "deleted";

interface Deployment {
  public_id: string;
  product_name: string;
  status: DeploymentStatus;
  ip_address: string | null;
  region: string;
  billing_cycle: string;
  period_start: string | null;
  period_end: string | null;
  created_at: string;
}

interface DeploymentsResponse {
  data: Deployment[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

// ─── Status badge config with Kinetic colors ────────────────────────────────

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
    color: "var(--color-accent)",
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

// ─── Format date ────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
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

function formatBillingCycle(cycle: string): string {
  const labels: Record<string, string> = {
    monthly: "Per Bulan",
    yearly: "Per Tahun",
    hourly: "Per Jam",
  };
  return labels[cycle] ?? cycle;
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function DeploymentsPage() {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDeployments() {
      try {
        const res = await api.get<DeploymentsResponse>("/api/v1/deployments");
        setDeployments(res.data ?? []);
      } catch (err) {
        if (err instanceof ApiException && err.status === 401) {
          return;
        }
        setError(
          err instanceof Error ? err.message : "Gagal memuat daftar deployment.",
        );
      } finally {
        setLoading(false);
      }
    }

    fetchDeployments();
  }, []);

  // ── Loading skeleton ────────────────────────────────────────────────────
  if (loading) {
    return (
      <RevealOnScroll>
        <div className="mx-auto w-full max-w-[1040px] px-6 py-10">
      <div className="space-y-6">
        <div>
          <div className="h-8 w-52 animate-pulse rounded bg-[var(--color-accent-soft)]" />
          <div className="mt-2 h-4 w-80 animate-pulse rounded bg-[var(--color-surface-2)]" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-2xl bg-[var(--color-surface-2)]"
            />
          ))}
        </div>
      </div>
        </div>
      </RevealOnScroll>
        );
  }

  // ── Error ───────────────────────────────────────────────────────────────
  if (error) {
    return (
      <RevealOnScroll>
        <div className="mx-auto w-full max-w-[1040px] px-6 py-10">
      <div className="space-y-6">
        <div>
          <h1 className="text-[32px] font-bold leading-none tracking-tight text-[var(--color-fg)]">Deployments</h1>
        </div>
        <div className="rounded-2xl border border-[#ffb5ab]/20 bg-[#ffb5ab]/5 p-8 backdrop-blur-[24px] text-center">
          <p className="text-sm text-[#ffb5ab]">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 rounded-full border border-[var(--color-line)] bg-[var(--color-surface-2)] px-6 py-2.5 text-sm font-medium text-[var(--color-fg-muted)] transition-colors hover:border-[var(--color-accent)]/30 hover:text-[var(--color-fg)]"
          >
            Coba Lagi
          </button>
        </div>
      </div>
        </div>
      </RevealOnScroll>
        );
  }

  // ── Main render ─────────────────────────────────────────────────────────
  return (
    <RevealOnScroll>
      <div className="mx-auto w-full max-w-[1040px] px-6 py-10">
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-[32px] font-bold leading-none tracking-tight text-[var(--color-fg)]">Deployments</h1>
        <p className="mt-2 text-sm text-[var(--color-fg-muted)]">
          Kelola dan pantau semua deployment layanan Anda.
        </p>
      </div>

      {/* Empty state */}
      {deployments.length === 0 && (
        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface-2)] p-12 backdrop-blur-[24px] text-center">
          <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-[var(--color-accent-soft)]">
            <svg
              className="h-8 w-8 text-[var(--color-accent)]/40"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7m0 0a3 3 0 01-3 3m0 3h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008zm-3 6h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008z"
              />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-semibold text-[var(--color-fg)]">
            Belum Ada Deployment
          </h3>
          <p className="mt-2 text-sm text-[var(--color-fg-dim)]">
            Setelah order dibayar, deployment akan tampil di sini.
          </p>
          <Link
            href="/marketplace"
            className="mt-6 inline-flex items-center rounded-full bg-[var(--color-accent)] px-6 py-2.5 text-sm font-semibold text-[#0D0B00] shadow-[0_0_20px_var(--color-accent-soft)]"
          >
            Jelajahi Marketplace
          </Link>
        </div>
      )}

      {/* Deployment cards */}
      {deployments.length > 0 && (
        <div className="space-y-3">
          {deployments.map((deployment) => {
            const status = statusConfig[deployment.status] ?? statusConfig.pending_provisioning;

            return (
              <Link
                key={deployment.public_id}
                href={`/deployments/${deployment.public_id}`}
                className="group block"
              >
                <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface-2)] p-6 backdrop-blur-[24px] transition-colors hover:border-[var(--color-accent-soft)]">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    {/* Left: deployment info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <h3 className="text-sm font-semibold text-[var(--color-fg)] truncate">
                          {deployment.product_name}
                        </h3>
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

                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--color-fg-dim)]">
                        {deployment.ip_address && (
                          <span className="font-mono">{deployment.ip_address}</span>
                        )}
                        <span>{deployment.region}</span>
                        <span>{formatBillingCycle(deployment.billing_cycle)}</span>
                      </div>

                      {/* Period */}
                      {deployment.period_start && deployment.period_end && (
                        <div className="mt-1 flex items-center gap-1 text-[10px] text-[var(--color-fg)]/25">
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                          </svg>
                          <span>
                            {formatDate(deployment.period_start)} — {formatDate(deployment.period_end)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Right: arrow */}
                    <svg
                      className="h-5 w-5 shrink-0 text-[var(--color-fg)]/15 transition-transform group-hover:translate-x-1 group-hover:text-[var(--color-accent)]/60"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8.25 4.5l7.5 7.5-7.5 7.5"
                      />
                    </svg>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
      </div>
    </RevealOnScroll>
    );
}
