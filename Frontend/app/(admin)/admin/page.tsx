"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { api, ApiException } from "@/lib/api";

/* ═══════════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════════ */

interface DashboardStats {
  users: { total: number; verified: number; new_this_month: number };
  providers: { total: number; active: number };
  listings: { total: number; active: number };
  orders: {
    total: number;
    this_month: number;
    paid: number;
    pending_payment: number;
    completed: number;
  };
  revenue: {
    currency: string;
    total_minor: number;
    this_month_minor: number;
    pending_minor: number;
  };
  payments: { total: number; paid: number; pending: number; failed: number };
  deployments: { active: number; pending_provisioning: number };
  provisioning: { overdue: number };
  tickets: { open: number };
  beta_requests: { pending: number };
  recent_activity: Array<{
    id: number;
    action: string;
    subject_type: string;
    user: { name: string; email: string } | null;
    created_at: string;
  }>;
}

/* ═══════════════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════════════ */

function formatIDR(minor: number): string {
  const rp = (minor ?? 0) / 100;
  if (rp >= 1_000_000_000)
    return `Rp ${(rp / 1_000_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} M`;
  if (rp >= 1_000_000)
    return `Rp ${(rp / 1_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} jt`;
  if (rp >= 1_000)
    return `Rp ${(rp / 1_000).toLocaleString("id-ID", { maximumFractionDigits: 0 })} rb`;
  return `Rp ${rp.toLocaleString("id-ID")}`;
}

function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);
  if (diffMin < 1) return "baru saja";
  if (diffMin < 60) return `${diffMin}m lalu`;
  if (diffHr < 24) return `${diffHr}j lalu`;
  return `${diffDay}h lalu`;
}

function MIcon({
  name,
  className = "",
  size = 18,
  color,
}: {
  name: string;
  className?: string;
  size?: number;
  color?: string;
}) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={{
        fontSize: size,
        color,
        fontVariationSettings: '"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20',
      }}
    >
      {name}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════════════ */

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState("");

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await api.get<DashboardStats>("/api/v1/admin/stats");
      setStats(data);
      setUpdatedAt(
        new Date().toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    } catch (err) {
      if (err instanceof ApiException) {
        setError(err.message || "Gagal memuat data.");
      } else {
        setError("Terjadi kesalahan jaringan.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  /* ── Loading ── */
  if (loading && !stats) {
    return (
      <div className="flex h-full min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3">
          <MIcon
            name="progress_activity"
            size={20}
            color="var(--color-accent)"
            className="animate-spin"
          />
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-fg-dim)]">
            Memuat...
          </span>
        </div>
      </div>
    );
  }

  /* ── Error ── */
  if (error && !stats) {
    return (
      <div className="flex h-full min-h-[60vh] items-center justify-center px-6">
        <div className="text-center">
          <MIcon name="error" size={40} color="var(--color-error)" />
          <p className="mt-4 text-[14px] text-[var(--color-fg)]">
            Gagal memuat data
          </p>
          <p className="mt-1 text-[12px] text-[var(--color-fg-muted)]">
            {error}
          </p>
          <button
            type="button"
            onClick={fetchStats}
            className="mt-4 rounded-lg border border-[var(--color-accent)] px-4 py-2 text-[12px] font-medium text-[var(--color-accent)] transition-colors hover:bg-[var(--color-accent)]/10"
          >
            Coba lagi
          </button>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  /* ── Derived ── */
  const pendingActions =
    (stats.tickets?.open ?? 0) +
    (stats.provisioning?.overdue ?? 0) +
    (stats.beta_requests?.pending ?? 0);

  const ordersThisMonth = stats.orders?.this_month ?? 0;
  const ordersPaid = stats.orders?.paid ?? 0;
  const paidRate =
    ordersThisMonth > 0 ? Math.round((ordersPaid / ordersThisMonth) * 100) : 0;

  return (
    <div className="mx-auto w-full max-w-[1040px] px-6 py-10">
      {/* ─────────────────────── HEADER ─────────────────────── */}
      <header
        className="mb-10 flex items-end justify-between gap-6"
        style={{ animation: "fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) both" }}
      >
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-fg-dim)]">
            JadeNode · Admin
          </p>
          <h1 className="mt-2 text-[36px] font-bold leading-none tracking-tight text-[var(--color-fg)]">
            Dashboard
          </h1>
        </div>
        <div className="flex items-center gap-2 pb-1">
          <span className="flex items-center gap-1.5 font-mono text-[10px] text-[var(--color-fg-dim)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-success)]" />
            {updatedAt || "—"}
          </span>
          <button
            type="button"
            onClick={fetchStats}
            disabled={loading}
            aria-label="Refresh dashboard"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-line)] text-[var(--color-fg-dim)] transition-colors hover:border-[var(--color-accent)]/40 hover:text-[var(--color-accent)] disabled:opacity-50"
          >
            <MIcon
              name="refresh"
              size={15}
              className={loading ? "animate-spin" : ""}
            />
          </button>
        </div>
      </header>

      {/* ─────────────── ACTION STRIP (compact, conditional) ─────────────── */}
      {pendingActions > 0 && (
        <div
          className="mb-8 overflow-hidden rounded-xl border border-[var(--color-amber)]/25 bg-[var(--color-amber)]/[0.04]"
          style={{
            animation: "fadeUp 0.5s 0.05s cubic-bezier(0.22,1,0.36,1) both",
          }}
        >
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
            <div className="flex items-center gap-2">
              <MIcon
                name="bolt"
                size={16}
                color="var(--color-amber)"
              />
              <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[var(--color-amber)]">
                Perlu Tindakan · {pendingActions}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px]">
              {(stats.tickets?.open ?? 0) > 0 && (
                <Link
                  href="/admin/tickets"
                  className="text-[var(--color-fg-muted)] underline-offset-2 hover:text-[var(--color-fg)] hover:underline"
                >
                  {stats.tickets.open} tiket
                </Link>
              )}
              {(stats.provisioning?.overdue ?? 0) > 0 && (
                <Link
                  href="/admin/provisioning"
                  className="text-[var(--color-fg-muted)] underline-offset-2 hover:text-[var(--color-fg)] hover:underline"
                >
                  {stats.provisioning.overdue} provisioning lewat SLA
                </Link>
              )}
              {(stats.beta_requests?.pending ?? 0) > 0 && (
                <Link
                  href="/admin/beta-access"
                  className="text-[var(--color-fg-muted)] underline-offset-2 hover:text-[var(--color-fg)] hover:underline"
                >
                  {stats.beta_requests.pending} permintaan beta
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────── HERO STATS — 2 statistik utama ─────────────── */}
      <section
        className="mb-12 grid gap-4 lg:grid-cols-3"
        style={{
          animation: "fadeUp 0.6s 0.1s cubic-bezier(0.22,1,0.36,1) both",
        }}
      >
        {/* PRIMARY: Pendapatan bulan ini */}
        <div className="relative overflow-hidden rounded-2xl border border-[var(--color-accent)]/25 bg-gradient-to-br from-[var(--color-accent)]/[0.08] via-transparent to-transparent p-7 lg:col-span-2">
          {/* Decorative grid */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "linear-gradient(var(--color-accent) 1px, transparent 1px), linear-gradient(90deg, var(--color-accent) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />
          <div className="relative">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-accent)]">
                Pendapatan · Bulan Ini
              </p>
            </div>
            <p className="mt-4 text-[56px] font-bold leading-none tracking-tight text-[var(--color-fg)]">
              {formatIDR(stats.revenue?.this_month_minor ?? 0)}
            </p>
            <div className="mt-6 flex flex-wrap items-end gap-x-8 gap-y-3 border-t border-[var(--color-line)]/60 pt-5">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-[var(--color-fg-dim)]">
                  Total Lifetime
                </p>
                <p className="mt-1 text-[15px] font-semibold text-[var(--color-fg)]">
                  {formatIDR(stats.revenue?.total_minor ?? 0)}
                </p>
              </div>
              {(stats.revenue?.pending_minor ?? 0) > 0 && (
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-[var(--color-fg-dim)]">
                    Menunggu Bayar
                  </p>
                  <p className="mt-1 text-[15px] font-semibold text-[var(--color-amber)]">
                    {formatIDR(stats.revenue?.pending_minor ?? 0)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SECONDARY: Order bulan ini */}
        <div className="flex flex-col rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)]/60 p-7">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-steel)]" />
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-fg-dim)]">
              Order · Bulan Ini
            </p>
          </div>
          <p className="mt-4 text-[56px] font-bold leading-none tracking-tight text-[var(--color-fg)]">
            {ordersThisMonth.toLocaleString("id-ID")}
          </p>
          <div className="mt-auto pt-6">
            {/* Progress bar — paid ratio */}
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[var(--color-fg-dim)]">
                Lunas
              </span>
              <span className="font-mono text-[10px] text-[var(--color-fg-muted)]">
                {ordersPaid}/{ordersThisMonth} · {paidRate}%
              </span>
            </div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-[var(--color-line)]">
              <div
                className="h-full rounded-full bg-[var(--color-success)] transition-all duration-700"
                style={{ width: `${paidRate}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────── ACTIVITY + QUICK ACCESS ─────────────── */}
      <section
        className="grid gap-6 lg:grid-cols-3"
        style={{
          animation: "fadeUp 0.6s 0.2s cubic-bezier(0.22,1,0.36,1) both",
        }}
      >
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-[14px] font-semibold tracking-tight text-[var(--color-fg)]">
              Aktivitas Terbaru
            </h2>
            <Link
              href="/admin/audit-logs"
              className="font-mono text-[10px] uppercase tracking-[0.15em] text-[var(--color-fg-dim)] transition-colors hover:text-[var(--color-accent)]"
            >
              Lihat semua →
            </Link>
          </div>
          <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)]/60">
            {stats.recent_activity.length > 0 ? (
              <ul>
                {stats.recent_activity.slice(0, 6).map((log) => (
                  <li
                    key={log.id}
                    className="flex items-center gap-4 border-b border-[var(--color-line)]/60 px-5 py-3.5 last:border-0"
                  >
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-fg-dim)]" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] text-[var(--color-fg)]">
                        {log.action
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (c) => c.toUpperCase())}
                      </p>
                      <p className="text-[11px] text-[var(--color-fg-dim)]">
                        {log.subject_type}
                        {log.user && (
                          <span> · {log.user.name}</span>
                        )}
                      </p>
                    </div>
                    <span className="shrink-0 font-mono text-[10px] text-[var(--color-fg-dim)]">
                      {formatRelativeTime(log.created_at)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex items-center justify-center py-12">
                <span className="text-[12px] text-[var(--color-fg-dim)]">
                  Belum ada aktivitas
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Access — 4 inti */}
        <div>
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-[14px] font-semibold tracking-tight text-[var(--color-fg)]">
              Akses Cepat
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              {
                icon: "inventory_2",
                label: "Produk",
                href: "/admin/products",
              },
              {
                icon: "construction",
                label: "Provisioning",
                href: "/admin/provisioning",
              },
              {
                icon: "support_agent",
                label: "Tiket",
                href: "/admin/tickets",
              },
              {
                icon: "payments",
                label: "Pembayaran",
                href: "/admin/payments",
              },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group flex flex-col gap-3 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)]/60 p-4 transition-all hover:border-[var(--color-accent)]/40 hover:bg-[var(--color-surface)]"
              >
                <MIcon
                  name={item.icon}
                  size={20}
                  className="text-[var(--color-fg-dim)] transition-colors group-hover:text-[var(--color-accent)]"
                />
                <span className="text-[12px] font-medium text-[var(--color-fg-muted)] transition-colors group-hover:text-[var(--color-fg)]">
                  {item.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
