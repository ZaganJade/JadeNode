"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { api, ApiException } from "@/lib/api";

/* ═══════════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════════ */

interface DashboardStats {
  users: {
    total: number;
    admins: number;
    verified: number;
    new_this_month: number;
  };
  providers: {
    total: number;
    active: number;
    verified: number;
  };
  listings: {
    total: number;
    active: number;
  };
  orders: {
    total: number;
    this_month: number;
    paid: number;
    pending_payment: number;
    completed: number;
    cancelled: number;
  };
  revenue: {
    currency: string;
    total_minor: number;
    this_month_minor: number;
    pending_minor: number;
  };
  payments: {
    total: number;
    paid: number;
    pending: number;
    failed: number;
    expired: number;
    cancelled: number;
  };
  deployments: {
    total: number;
    active: number;
    pending_provisioning: number;
    suspended: number;
    expired: number;
    cancelled: number;
  };
  provisioning: {
    total: number;
    pending: number;
    in_progress: number;
    completed: number;
    failed: number;
    overdue: number;
  };
  tickets: {
    total: number;
    open: number;
    in_progress: number;
    resolved: number;
    closed: number;
  };
  beta_requests: {
    pending: number;
  };
  recent_activity: Array<{
    id: number;
    action: string;
    subject_type: string;
    payload: Record<string, unknown> | null;
    user: { name: string; email: string } | null;
    created_at: string;
  }>;
  users_per_day: Array<{ date: string; count: number }>;
  revenue_per_day: Array<{ date: string; total_minor: number }>;
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

/* ═══════════════════════════════════════════════════════════════════════
   STAT CARD — the core building block
   ═══════════════════════════════════════════════════════════════════════ */

function StatCard({
  icon,
  label,
  value,
  sub,
  color = "var(--color-accent)",
  delay = 0,
}: {
  icon: string;
  label: string;
  value: string;
  sub?: string;
  color?: string;
  delay?: number;
}) {
  return (
    <div
      className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)]/60 p-5 transition-all duration-300 hover:border-[var(--color-line-strong)]"
      style={{
        animationDelay: `${delay}ms`,
        animation: "fadeUp 0.6s cubic-bezier(0.22,1,0.36,1) both",
      }}
    >
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--color-line)]">
        <span
          className="material-symbols-outlined text-[18px]"
          style={{
            color,
            fontVariationSettings: '"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20',
          }}
        >
          {icon}
        </span>
      </div>
      <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[var(--color-fg-dim)]">
        {label}
      </p>
      <p className="mt-1.5 text-[28px] font-bold leading-tight tracking-tight text-[var(--color-fg)]">
        {value}
      </p>
      {sub && (
        <p className="mt-1 text-[11px] text-[var(--color-fg-muted)]">{sub}</p>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   ALERT BANNER — for things needing attention
   ═══════════════════════════════════════════════════════════════════════ */

function AlertBanner({
  icon,
  message,
  href,
  variant = "warn",
}: {
  icon: string;
  message: string;
  href: string;
  variant?: "warn" | "info";
}) {
  const borderColor =
    variant === "warn"
      ? "rgba(255,122,122,0.35)"
      : "rgba(198,242,74,0.3)";
  const bgColor =
    variant === "warn" ? "rgba(255,122,122,0.06)" : "rgba(198,242,74,0.05)";
  const textColor =
    variant === "warn" ? "var(--color-error)" : "var(--color-accent)";

  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors hover:brightness-110"
      style={{
        borderColor,
        background: bgColor,
      }}
    >
      <span
        className="material-symbols-outlined text-[18px]"
        style={{
          color: textColor,
          fontVariationSettings: '"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20',
        }}
      >
        {icon}
      </span>
      <span className="text-[12px] font-medium" style={{ color: textColor }}>
        {message}
      </span>
      <span
        className="material-symbols-outlined ml-auto text-[16px] text-[var(--color-fg-dim)]"
        style={{ fontVariationSettings: '"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20' }}
      >
        north_east
      </span>
    </Link>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   ACTIVITY ITEM
   ═══════════════════════════════════════════════════════════════════════ */

function ActivityRow({
  action,
  subject,
  user,
  time,
}: {
  action: string;
  subject: string;
  user: string | null;
  time: string;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-[var(--color-line)]/60 py-3 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] text-[var(--color-fg)]">
          {action.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
        </p>
        <p className="text-[11px] text-[var(--color-fg-muted)]">
          {subject}
          {user && <span className="text-[var(--color-fg-dim)]"> — {user}</span>}
        </p>
      </div>
      <span className="shrink-0 font-mono text-[10px] text-[var(--color-fg-dim)]">
        {time}
      </span>
    </div>
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
          <span
            className="material-symbols-outlined text-[20px] text-[var(--color-accent)]"
            style={{ animation: "spin 1s linear infinite" }}
          >
            progress_activity
          </span>
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
          <span className="material-symbols-outlined text-[40px] text-[var(--color-error)]">
            error
          </span>
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

  return (
    <div className="mx-auto w-full max-w-[1120px] px-6 py-8">
      {/* ────────────── HEADER ────────────── */}
      <header
        className="mb-8"
        style={{ animation: "fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) both" }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[32px] font-bold tracking-tight text-[var(--color-fg)]">
              Dashboard
            </h1>
            <p className="mt-1 text-[13px] text-[var(--color-fg-muted)]">
              Ringkasan operasional JadeNode
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 font-mono text-[10px] text-[var(--color-fg-dim)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-success)]" />
              {updatedAt || "—"}
            </span>
            <button
              type="button"
              onClick={fetchStats}
              className="flex items-center gap-1.5 rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-[11px] text-[var(--color-fg-dim)] transition-colors hover:border-[var(--color-accent)]/40 hover:text-[var(--color-accent)]"
            >
              <span
                className={`material-symbols-outlined text-[14px] ${loading ? "animate-spin" : ""}`}
                style={{
                  fontVariationSettings:
                    '"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20',
                }}
              >
                refresh
              </span>
              Refresh
            </button>
          </div>
        </div>
      </header>

      {/* ────────────── ALERTS ────────────── */}
      {(stats.beta_requests?.pending ?? 0) > 0 ||
      (stats.provisioning?.overdue ?? 0) > 0 ||
      (stats.tickets?.open ?? 0) > 0 ? (
        <div
          className="mb-6 space-y-2"
          style={{
            animation: "fadeUp 0.5s 0.1s cubic-bezier(0.22,1,0.36,1) both",
          }}
        >
          {(stats.beta_requests?.pending ?? 0) > 0 && (
            <AlertBanner
              icon="science"
              message={`${stats.beta_requests!.pending} permintaan beta menunggu review`}
              href="/admin/beta-access"
              variant="info"
            />
          )}
          {(stats.provisioning?.overdue ?? 0) > 0 && (
            <AlertBanner
              icon="warning"
              message={`${stats.provisioning!.overdue} provisioning task melewati SLA`}
              href="/admin/provisioning"
              variant="warn"
            />
          )}
          {(stats.tickets?.open ?? 0) > 0 && (
            <AlertBanner
              icon="support_agent"
              message={`${stats.tickets!.open} tiket support terbuka`}
              href="/admin/tickets"
              variant="warn"
            />
          )}
        </div>
      ) : null}

      {/* ────────────── REVENUE HERO ────────────── */}
      <div
        className="mb-6 overflow-hidden rounded-2xl border border-[var(--color-accent)]/20 bg-gradient-to-br from-[var(--color-accent)]/8 via-transparent to-transparent p-6"
        style={{
          animation: "fadeUp 0.6s 0.15s cubic-bezier(0.22,1,0.36,1) both",
        }}
      >
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[var(--color-accent)]">
          Pendapatan bulan ini
        </p>
        <p className="mt-2 text-[44px] font-bold leading-none tracking-tight text-[var(--color-fg)]">
          {formatIDR(stats.revenue?.this_month_minor ?? 0)}
        </p>
        <div className="mt-5 flex flex-wrap gap-6 border-t border-[var(--color-line)]/60 pt-4">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--color-fg-dim)]">
              Total pendapatan
            </p>
            <p className="mt-1 text-[18px] font-semibold text-[var(--color-fg)]">
              {formatIDR(stats.revenue?.total_minor ?? 0)}
            </p>
          </div>
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--color-fg-dim)]">
              Menunggu bayar
            </p>
            <p className="mt-1 text-[18px] font-semibold text-[var(--color-amber)]">
              {formatIDR(stats.revenue?.pending_minor ?? 0)}
            </p>
          </div>
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--color-fg-dim)]">
              Order bulan ini
            </p>
            <p className="mt-1 text-[18px] font-semibold text-[var(--color-fg)]">
              {stats.orders?.this_month ?? 0}
            </p>
          </div>
        </div>
      </div>

      {/* ────────────── STAT CARDS GRID ────────────── */}
      <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon="group"
          label="Pengguna"
          value={(stats.users?.total ?? 0).toLocaleString("id-ID")}
          sub={`${stats.users?.verified ?? 0} verified · ${stats.users?.new_this_month ?? 0} baru bulan ini`}
          color="var(--color-steel)"
          delay={200}
        />
        <StatCard
          icon="dns"
          label="Deployment Aktif"
          value={(stats.deployments?.active ?? 0).toLocaleString("id-ID")}
          sub={`${stats.deployments?.pending_provisioning ?? 0} provisioning · ${stats.deployments?.total ?? 0} total`}
          color="var(--color-success)"
          delay={280}
        />
        <StatCard
          icon="inventory_2"
          label="Listing Aktif"
          value={(stats.listings?.active ?? 0).toLocaleString("id-ID")}
          sub={`${stats.listings?.total ?? 0} total · ${stats.providers?.active ?? 0} provider`}
          color="var(--color-accent)"
          delay={360}
        />
        <StatCard
          icon="payments"
          label="Pembayaran Sukses"
          value={`${
            stats.payments?.total
              ? Math.round(
                  ((stats.payments?.paid ?? 0) / stats.payments.total) * 100,
                )
              : 0
          }%`}
          sub={`${stats.payments?.paid ?? 0} lunas dari ${stats.payments?.total ?? 0}`}
          color="var(--color-amber)"
          delay={440}
        />
      </section>

      {/* ────────────── BOTTOM ROW: Activity + Quick Links ────────────── */}
      <section
        className="grid gap-4 lg:grid-cols-3"
        style={{
          animation: "fadeUp 0.6s 0.5s cubic-bezier(0.22,1,0.36,1) both",
        }}
      >
        {/* Recent Activity */}
        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)]/60 p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[16px] font-semibold text-[var(--color-fg)]">
              Aktivitas Terbaru
            </h2>
            <Link
              href="/admin/audit-logs"
              className="flex items-center gap-1 text-[11px] font-medium text-[var(--color-accent)] transition-colors hover:underline"
            >
              Lihat semua
              <span
                className="material-symbols-outlined text-[14px]"
                style={{
                  fontVariationSettings:
                    '"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20',
                }}
              >
                north_east
              </span>
            </Link>
          </div>
          {stats.recent_activity.length > 0 ? (
            <div>
              {stats.recent_activity.slice(0, 8).map((log) => (
                <ActivityRow
                  key={log.id}
                  action={log.action}
                  subject={log.subject_type}
                  user={log.user?.name ?? null}
                  time={formatRelativeTime(log.created_at)}
                />
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <span className="text-[12px] text-[var(--color-fg-dim)]">
                Belum ada aktivitas
              </span>
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)]/60 p-5">
          <h2 className="mb-4 text-[16px] font-semibold text-[var(--color-fg)]">
            Menu Cepat
          </h2>
          <div className="space-y-1">
            {[
              { icon: "add_circle", label: "Kelola Produk", href: "/admin/products" },
              { icon: "construction", label: "Provisioning", href: "/admin/provisioning" },
              { icon: "support_agent", label: "Support Tiket", href: "/admin/tickets" },
              { icon: "group", label: "Kelola Users", href: "/admin/users" },
              { icon: "shield", label: "Providers", href: "/admin/providers" },
              { icon: "receipt_long", label: "Audit Log", href: "/admin/audit-logs" },
              { icon: "science", label: "Beta Access", href: "/admin/beta-access" },
              { icon: "payments", label: "Pembayaran", href: "/admin/payments" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] text-[var(--color-fg-muted)] transition-colors hover:bg-white/[0.03] hover:text-[var(--color-fg)]"
              >
                <span
                  className="material-symbols-outlined text-[18px] text-[var(--color-fg-dim)] transition-colors group-hover:text-[var(--color-accent)]"
                  style={{
                    fontVariationSettings:
                      '"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20',
                  }}
                >
                  {item.icon}
                </span>
                {item.label}
                <span
                  className="material-symbols-outlined ml-auto text-[14px] text-[var(--color-fg-dim)] opacity-0 transition-opacity group-hover:opacity-100"
                  style={{
                    fontVariationSettings:
                      '"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20',
                  }}
                >
                  chevron_right
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
