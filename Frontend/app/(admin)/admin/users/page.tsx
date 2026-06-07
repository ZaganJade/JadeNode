"use client";

import { useMemo, useState } from "react";
import { RevealOnScroll } from "@/components/landing/reveal-on-scroll";
import { cn } from "@/lib/utils";
import {
  PageHeader,
  StatCard,
  BentoCard,
  DonutChart,
  ProgressBar,
} from "@/components/admin/studio-ui";

/* ═══════════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════════ */

type UserRole = "customer" | "admin" | "provider";
type BetaStatus = "none" | "pending" | "approved" | "rejected";

interface User {
  id: number;
  public_id: string;
  name: string;
  email: string;
  role: UserRole;
  email_verified: boolean;
  beta_access_status: BetaStatus;
  country: string | null;
  phone: string | null;
  total_orders: number;
  total_spending: number;
  active_deployments: number;
  last_login_at: string | null;
  created_at: string;
  suspended: boolean;
}

/* ═══════════════════════════════════════════════════════════════════════
   MOCK DATA
   ═══════════════════════════════════════════════════════════════════════ */

const MOCK_USERS: User[] = [
  { id: 1, public_id: "USR-001A2B", name: "Alia Rahmawati", email: "alia@kirana-commerce.id", role: "customer", email_verified: true, beta_access_status: "approved", country: "Indonesia", phone: "+62 812-3456-7890", total_orders: 12, total_spending: 32400000, active_deployments: 3, last_login_at: "2026-06-05T08:30:00Z", created_at: "2025-03-15", suspended: false },
  { id: 2, public_id: "USR-003C4D", name: "Bagas Pranata", email: "bagas@lokalogistics.com", role: "customer", email_verified: true, beta_access_status: "approved", country: "Indonesia", phone: "+62 878-9012-3456", total_orders: 8, total_spending: 18700000, active_deployments: 2, last_login_at: "2026-06-04T14:22:00Z", created_at: "2025-04-20", suspended: false },
  { id: 3, public_id: "USR-005E6F", name: "Sofia Wijaya", email: "sofia@nimbusmedia.sg", role: "customer", email_verified: true, beta_access_status: "approved", country: "Singapore", phone: "+65 9123-4567", total_orders: 5, total_spending: 54200000, active_deployments: 4, last_login_at: "2026-06-05T02:15:00Z", created_at: "2025-06-10", suspended: false },
  { id: 4, public_id: "USR-007G8H", name: "Takeshi Yamamoto", email: "takeshi@sakuranet.jp", role: "provider", email_verified: true, beta_access_status: "none", country: "Japan", phone: "+81 90-1234-5678", total_orders: 0, total_spending: 0, active_deployments: 0, last_login_at: "2026-06-03T18:00:00Z", created_at: "2024-01-10", suspended: false },
  { id: 5, public_id: "USR-009I0J", name: "Priya Sharma", email: "priya@bharatcloud.in", role: "provider", email_verified: true, beta_access_status: "none", country: "India", phone: "+91 98765-43210", total_orders: 0, total_spending: 0, active_deployments: 0, last_login_at: "2026-06-04T09:45:00Z", created_at: "2024-04-05", suspended: false },
  { id: 6, public_id: "USR-011K2L", name: "Admin Zagan", email: "admin@jadenode.id", role: "admin", email_verified: true, beta_access_status: "none", country: "Indonesia", phone: null, total_orders: 0, total_spending: 0, active_deployments: 0, last_login_at: "2026-06-05T10:00:00Z", created_at: "2024-01-01", suspended: false },
  { id: 7, public_id: "USR-013M4N", name: "Rizki Fauzan", email: "rizki@startup-vn.com", role: "customer", email_verified: false, beta_access_status: "pending", country: "Vietnam", phone: "+84 91-234-5678", total_orders: 0, total_spending: 0, active_deployments: 0, last_login_at: null, created_at: "2026-05-28", suspended: false },
  { id: 8, public_id: "USR-015O6P", name: "Wei Chen", email: "wei@dragoncloud.hk", role: "provider", email_verified: true, beta_access_status: "none", country: "Hong Kong", phone: "+852 9123-4567", total_orders: 0, total_spending: 0, active_deployments: 0, last_login_at: "2026-06-02T11:30:00Z", created_at: "2024-07-12", suspended: false },
  { id: 9, public_id: "USR-017Q8R", name: "Maria Santos", email: "maria@philsolutions.ph", role: "customer", email_verified: true, beta_access_status: "rejected", country: "Philippines", phone: "+63 917-123-4567", total_orders: 1, total_spending: 2400000, active_deployments: 0, last_login_at: "2026-04-15T07:00:00Z", created_at: "2025-11-03", suspended: true },
  { id: 10, public_id: "USR-019S0T", name: "Ahmed Al-Rashid", email: "ahmed@gulfstack.ae", role: "provider", email_verified: true, beta_access_status: "none", country: "UAE", phone: "+971 50-123-4567", total_orders: 0, total_spending: 0, active_deployments: 0, last_login_at: "2026-06-01T16:00:00Z", created_at: "2025-04-20", suspended: false },
  { id: 11, public_id: "USR-021U2V", name: "Park Joon-ho", email: "joonho@seoulbyte.kr", role: "provider", email_verified: true, beta_access_status: "none", country: "South Korea", phone: "+82 10-1234-5678", total_orders: 0, total_spending: 0, active_deployments: 0, last_login_at: "2026-06-03T12:00:00Z", created_at: "2024-06-18", suspended: false },
  { id: 12, public_id: "USR-023W4X", name: "Kowit Tanakorn", email: "kowit@thicloud.th", role: "provider", email_verified: true, beta_access_status: "none", country: "Thailand", phone: "+66 81-234-5678", total_orders: 0, total_spending: 0, active_deployments: 0, last_login_at: "2026-06-04T06:30:00Z", created_at: "2024-09-01", suspended: false },
];

/* ═══════════════════════════════════════════════════════════════════════
   CONFIGS
   ═══════════════════════════════════════════════════════════════════════ */

const roleConfig: Record<UserRole, { label: string; color: string; bg: string; border: string; icon: string }> = {
  customer: { label: "Customer", color: "var(--color-accent)", bg: "var(--color-accent-soft)", border: "rgba(var(--accent-rgb),0.15)", icon: "person" },
  admin: { label: "Admin", color: "var(--color-magenta)", bg: "rgba(246,84,158,0.08)", border: "rgba(246,84,158,0.15)", icon: "admin_panel_settings" },
  provider: { label: "Provider", color: "var(--color-steel)", bg: "rgba(122,150,177,0.08)", border: "rgba(122,150,177,0.15)", icon: "business" },
};

const betaConfig: Record<BetaStatus, { label: string; color: string; bg: string; border: string }> = {
  approved: { label: "Approved", color: "var(--color-success)", bg: "rgba(108,232,166,0.08)", border: "rgba(108,232,166,0.15)" },
  pending: { label: "Pending", color: "var(--color-amber)", bg: "rgba(245,179,71,0.08)", border: "rgba(245,179,71,0.15)" },
  rejected: { label: "Rejected", color: "var(--color-error)", bg: "rgba(255,122,122,0.08)", border: "rgba(255,122,122,0.15)" },
  none: { label: "None", color: "var(--color-fg-dim)", bg: "rgba(255,255,255,0.03)", border: "rgba(255,255,255,0.06)" },
};

function Badge({ label, color, bg, border }: { label: string; color: string; bg: string; border: string }) {
  return <span className="rounded-full border px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider" style={{ color, backgroundColor: bg, borderColor: border }}>{label}</span>;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

function formatCompactIDR(amount: number): string {
  if (amount >= 1_000_000) return `Rp ${(amount / 1_000_000).toFixed(1).replace(".", ",")} jt`;
  if (amount >= 1_000) return `Rp ${(amount / 1_000).toFixed(0)} rb`;
  return `Rp ${amount}`;
}

const ROLE_DONUT_COLORS: Record<UserRole, string> = {
  customer: "var(--color-accent)",
  provider: "var(--color-steel)",
  admin: "var(--color-magenta)",
};

/* ═══════════════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════════════ */

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterVerified, setFilterVerified] = useState("");
  const [filterBeta, setFilterBeta] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const filtered = MOCK_USERS.filter((u) => {
    if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterRole && u.role !== filterRole) return false;
    if (filterVerified === "yes" && !u.email_verified) return false;
    if (filterVerified === "no" && u.email_verified) return false;
    if (filterBeta && u.beta_access_status !== filterBeta) return false;
    return true;
  });

  const customerCount = MOCK_USERS.filter(u => u.role === "customer").length;
  const providerCount = MOCK_USERS.filter(u => u.role === "provider").length;
  const pendingBeta = MOCK_USERS.filter(u => u.beta_access_status === "pending").length;
  const suspendedCount = MOCK_USERS.filter(u => u.suspended).length;

  // Derived analytics — the landing's bento data-viz, grounded in user data
  const analytics = useMemo(() => {
    const adminCount = MOCK_USERS.filter((u) => u.role === "admin").length;
    const verified = MOCK_USERS.filter((u) => u.email_verified).length;
    const customers = MOCK_USERS.filter((u) => u.role === "customer");
    const totalSpending = MOCK_USERS.reduce((s, u) => s + u.total_spending, 0);
    const totalOrders = MOCK_USERS.reduce((s, u) => s + u.total_orders, 0);
    const totalDeploys = MOCK_USERS.reduce((s, u) => s + u.active_deployments, 0);

    const roleMix = (["customer", "provider", "admin"] as UserRole[])
      .map((r) => ({ label: roleConfig[r].label, value: MOCK_USERS.filter((u) => u.role === r).length, color: ROLE_DONUT_COLORS[r] }))
      .filter((d) => d.value > 0);

    const verifMix = [
      { label: "Verified", value: verified, color: "var(--color-success)" },
      { label: "Unverified", value: MOCK_USERS.length - verified, color: "var(--color-error)" },
    ];

    const betaMix = (["approved", "pending", "rejected"] as BetaStatus[])
      .map((b) => ({ label: betaConfig[b].label, value: customers.filter((u) => u.beta_access_status === b).length, color: betaConfig[b].color }))
      .filter((d) => d.value > 0);

    const topSpenders = [...customers].sort((a, b) => b.total_spending - a.total_spending).slice(0, 5);

    return { adminCount, verified, totalSpending, totalOrders, totalDeploys, roleMix, verifMix, betaMix, topSpenders, betaApproved: customers.filter((u) => u.beta_access_status === "approved").length };
  }, []);

  const inputCls = "rounded-lg border border-[var(--color-line)] bg-black/40 px-3 py-2 text-[13px] text-[var(--color-fg)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]/20";

  return (
    <RevealOnScroll>
      <div className="relative mx-auto w-full max-w-[1320px] px-6 py-8">
        {/* Header */}
        <PageHeader
          eyebrow="User Management"
          title="Manajemen Pengguna"
          subtitle="Kelola semua pengguna platform — customer, provider, dan admin di seluruh Asia."
          status={`${MOCK_USERS.length} pengguna · ${customerCount} customer`}
        />

        {/* KPI grid */}
        <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard label="Total Users" value={MOCK_USERS.length} icon="group" sub="Semua role" compact delay={0} />
          <StatCard label="Customers" value={customerCount} icon="person" sub="Pengguna aktif" accent compact delay={70} />
          <StatCard label="Providers" value={providerCount} icon="business" sub="Mitra infrastruktur" compact delay={140} />
          <StatCard label="Pending Beta" value={pendingBeta} icon="hourglass_top" sub="Menunggu review" compact delay={210} />
          <StatCard label="Suspended" value={suspendedCount} icon="block" sub="Akun dibekukan" compact delay={280} />
        </section>

        {/* Bento row 1: top spenders + role mix */}
        <section className="mb-4 grid gap-4 lg:grid-cols-3">
          <BentoCard eyebrow="Revenue" title="Top Customer · Spending" className="lg:col-span-2" delay={0}>
            <div className="space-y-3">
              {analytics.topSpenders.map((u, i) => (
                <ProgressBar
                  key={u.id}
                  label={u.name}
                  pct={(u.total_spending / (analytics.topSpenders[0]?.total_spending || 1)) * 100}
                  rightLabel={formatCompactIDR(u.total_spending)}
                  color="var(--color-accent)"
                  delay={i * 100}
                  labelWidth={130}
                />
              ))}
            </div>
            <div className="mt-5 grid grid-cols-3 gap-4 border-t border-[var(--color-line)]/80 pt-4">
              <div>
                <p className="studio-eyebrow text-[8px] text-[var(--color-fg-dim)]">Total Spending</p>
                <p className="studio-display mt-1 text-[18px] text-[var(--color-accent)]">{formatCompactIDR(analytics.totalSpending)}</p>
              </div>
              <div>
                <p className="studio-eyebrow text-[8px] text-[var(--color-fg-dim)]">Total Order</p>
                <p className="studio-display mt-1 text-[18px] text-[var(--color-fg)]">{analytics.totalOrders}</p>
              </div>
              <div>
                <p className="studio-eyebrow text-[8px] text-[var(--color-fg-dim)]">Active Deploy</p>
                <p className="studio-display mt-1 text-[18px] text-[var(--color-success)]">{analytics.totalDeploys}</p>
              </div>
            </div>
          </BentoCard>

          <BentoCard eyebrow="Komposisi" title="Distribusi Role" delay={120}>
            <DonutChart data={analytics.roleMix} centerValue={String(MOCK_USERS.length)} centerLabel="Users" />
          </BentoCard>
        </section>

        {/* Bento row 2: verification + beta + summary */}
        <section className="mb-8 grid gap-4 lg:grid-cols-3">
          <BentoCard eyebrow="Trust" title="Verifikasi Email" delay={0}>
            <DonutChart data={analytics.verifMix} centerValue={`${Math.round((analytics.verified / MOCK_USERS.length) * 100)}%`} centerLabel="Verified" />
          </BentoCard>

          <BentoCard eyebrow="Program" title="Beta Access · Customer" delay={120}>
            {analytics.betaMix.length > 0 ? (
              <DonutChart data={analytics.betaMix} centerValue={String(analytics.betaApproved)} centerLabel="Approved" />
            ) : (
              <p className="py-8 text-center text-[12px] text-[var(--color-fg-muted)]">Belum ada data beta access.</p>
            )}
          </BentoCard>

          <BentoCard eyebrow="Ringkasan" title="Aktivitas Platform" delay={240}>
            <div className="space-y-2.5">
              {[
                { label: "Total Spending", value: formatCompactIDR(analytics.totalSpending), color: "var(--color-accent)" },
                { label: "Total Order", value: String(analytics.totalOrders), color: "var(--color-fg)" },
                { label: "Active Deployment", value: String(analytics.totalDeploys), color: "var(--color-success)" },
                { label: "Akun Suspended", value: String(suspendedCount), color: suspendedCount > 0 ? "var(--color-error)" : "var(--color-fg-muted)" },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between rounded-lg border border-[var(--color-line)]/60 bg-black/30 px-3 py-2.5">
                  <span className="text-[12px] text-[var(--color-fg-muted)]">{row.label}</span>
                  <span className="studio-display text-[15px]" style={{ color: row.color }}>{row.value}</span>
                </div>
              ))}
            </div>
          </BentoCard>
        </section>

        {/* Filter Bar */}
        <div className="reveal-rise mb-6 flex flex-wrap items-end gap-3 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)]/50 p-4">
          <div className="flex-1 min-w-[200px]">
            <label className="mb-1 block studio-eyebrow text-[8px] text-[var(--color-fg-dim)]">Cari</label>
            <input type="text" placeholder="Nama atau email..." value={search} onChange={(e) => setSearch(e.target.value)} className={cn(inputCls, "w-full")} />
          </div>
          <div className="w-32">
            <label className="mb-1 block studio-eyebrow text-[8px] text-[var(--color-fg-dim)]">Role</label>
            <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className={cn(inputCls, "w-full")}>
              <option value="">Semua</option>
              <option value="customer">Customer</option>
              <option value="provider">Provider</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="w-36">
            <label className="mb-1 block studio-eyebrow text-[8px] text-[var(--color-fg-dim)]">Verifikasi</label>
            <select value={filterVerified} onChange={(e) => setFilterVerified(e.target.value)} className={cn(inputCls, "w-full")}>
              <option value="">Semua</option>
              <option value="yes">Verified</option>
              <option value="no">Unverified</option>
            </select>
          </div>
          <div className="w-36">
            <label className="mb-1 block studio-eyebrow text-[8px] text-[var(--color-fg-dim)]">Beta Access</label>
            <select value={filterBeta} onChange={(e) => setFilterBeta(e.target.value)} className={cn(inputCls, "w-full")}>
              <option value="">Semua</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
              <option value="none">None</option>
            </select>
          </div>
        </div>

        {/* User List */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="reveal-rise flex flex-col items-center justify-center rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)]/50 py-16">
              <span className="material-symbols-outlined text-[48px] text-[var(--color-fg-dim)]">search_off</span>
              <h3 className="studio-display mt-4 text-[20px] text-[var(--color-fg)]">Tidak ada user ditemukan</h3>
            </div>
          ) : filtered.map((user, idx) => {
            const rc = roleConfig[user.role];
            const bc = betaConfig[user.beta_access_status];
            const isExpanded = expandedId === user.id;
            return (
              <article key={user.id} className="studio-card reveal-rise rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)]/50 overflow-hidden" style={{ transitionDelay: `${idx * 40}ms` }}>
                <div className="flex cursor-pointer items-center gap-4 p-5" onClick={() => setExpandedId(isExpanded ? null : user.id)}>
                  {/* Avatar */}
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-[var(--color-line)] bg-black/40">
                    <span className="material-symbols-outlined text-[22px]" style={{ color: rc.color, fontVariationSettings: '"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 24' }}>{rc.icon}</span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className={cn("text-[14px] font-semibold truncate", user.suspended ? "text-[var(--color-fg-dim)] line-through" : "text-[var(--color-fg)]")}>{user.name}</h3>
                      <Badge label={rc.label} color={rc.color} bg={rc.bg} border={rc.border} />
                      {user.beta_access_status !== "none" && <Badge {...bc} />}
                      {!user.email_verified && <Badge label="Unverified" color="var(--color-error)" bg="rgba(255,122,122,0.08)" border="rgba(255,122,122,0.15)" />}
                      {user.suspended && <Badge label="Suspended" color="var(--color-error)" bg="rgba(255,122,122,0.08)" border="rgba(255,122,122,0.15)" />}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[var(--color-fg-muted)]">
                      <span className="font-mono text-[10px]">{user.email}</span>
                      {user.country && <span>{user.country}</span>}
                      <span>Bergabung {formatDate(user.created_at)}</span>
                    </div>
                  </div>

                  {/* Metrics */}
                  {user.role === "customer" && (
                    <div className="hidden sm:flex items-center gap-5">
                      <div className="text-right">
                        <p className="studio-display text-[16px] text-[var(--color-fg)]">{user.total_orders}</p>
                        <p className="studio-eyebrow text-[7px] text-[var(--color-fg-dim)]">ORDER</p>
                      </div>
                      <div className="text-right">
                        <p className="studio-display text-[16px] text-[var(--color-accent)]">{user.active_deployments}</p>
                        <p className="studio-eyebrow text-[7px] text-[var(--color-fg-dim)]">DEPLOY</p>
                      </div>
                    </div>
                  )}

                  <span className={cn("material-symbols-outlined text-[18px] text-[var(--color-fg-dim)] transition-transform duration-200", isExpanded && "rotate-180")} style={{ fontVariationSettings: '"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20' }}>expand_more</span>
                </div>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div className="border-t border-[var(--color-line)] bg-black/20 px-5 py-5">
                    <div className="grid gap-6 lg:grid-cols-3">
                      {/* Profile */}
                      <div>
                        <p className="studio-eyebrow text-[8px] text-[var(--color-fg-dim)] mb-3">Profil</p>
                        <div className="space-y-2 text-[12px]">
                          <div className="flex items-center gap-2 text-[var(--color-fg-muted)]">
                            <span className="material-symbols-outlined text-[14px] text-[var(--color-fg-dim)]" style={{ fontVariationSettings: '"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20' }}>badge</span>
                            <span className="font-mono text-[10px]">{user.public_id}</span>
                          </div>
                          {user.phone && (
                            <div className="flex items-center gap-2 text-[var(--color-fg-muted)]">
                              <span className="material-symbols-outlined text-[14px] text-[var(--color-fg-dim)]" style={{ fontVariationSettings: '"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20' }}>phone</span>
                              <span className="font-mono text-[10px]">{user.phone}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-[var(--color-fg-muted)]">
                            <span className="material-symbols-outlined text-[14px] text-[var(--color-fg-dim)]" style={{ fontVariationSettings: '"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20' }}>schedule</span>
                            <span>Login terakhir: {user.last_login_at ? formatDate(user.last_login_at) : "Belum pernah"}</span>
                          </div>
                        </div>
                      </div>

                      {/* Customer Metrics */}
                      {user.role === "customer" && (
                        <div>
                          <p className="studio-eyebrow text-[8px] text-[var(--color-fg-dim)] mb-3">Metrik</p>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="rounded-lg border border-[var(--color-line)]/60 bg-black/30 px-3 py-2">
                              <p className="studio-display text-[18px] text-[var(--color-fg)]">{user.total_orders}</p>
                              <p className="text-[9px] text-[var(--color-fg-dim)]">Total Orders</p>
                            </div>
                            <div className="rounded-lg border border-[var(--color-line)]/60 bg-black/30 px-3 py-2">
                              <p className="studio-display text-[18px] text-[var(--color-accent)]">{formatCurrency(user.total_spending)}</p>
                              <p className="text-[9px] text-[var(--color-fg-dim)]">Total Spending</p>
                            </div>
                            <div className="rounded-lg border border-[var(--color-line)]/60 bg-black/30 px-3 py-2">
                              <p className="studio-display text-[18px] text-[var(--color-success)]">{user.active_deployments}</p>
                              <p className="text-[9px] text-[var(--color-fg-dim)]">Active Deploy</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div>
                        <p className="studio-eyebrow text-[8px] text-[var(--color-fg-dim)] mb-3">Aksi</p>
                        <div className="space-y-2">
                          {!user.email_verified && (
                            <button className="flex w-full items-center gap-2 rounded-lg border border-[var(--color-accent)]/20 bg-[var(--color-accent-soft)] px-3 py-2 text-[12px] font-medium text-[var(--color-accent)] transition-colors hover:bg-[var(--color-accent)]/20">
                              <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: '"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20' }}>mark_email_read</span>
                              Verifikasi Email
                            </button>
                          )}
                          {user.beta_access_status === "pending" && (
                            <>
                              <button className="flex w-full items-center gap-2 rounded-lg border border-[var(--color-success)]/20 bg-[rgba(108,232,166,0.08)] px-3 py-2 text-[12px] font-medium text-[var(--color-success)] transition-colors hover:bg-[rgba(108,232,166,0.15)]">
                                <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: '"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20' }}>check</span>
                                Approve Beta Access
                              </button>
                              <button className="flex w-full items-center gap-2 rounded-lg border border-[var(--color-error)]/20 bg-[rgba(255,122,122,0.08)] px-3 py-2 text-[12px] font-medium text-[var(--color-error)] transition-colors hover:bg-[rgba(255,122,122,0.15)]">
                                <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: '"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20' }}>close</span>
                                Tolak Beta Access
                              </button>
                            </>
                          )}
                          {!user.suspended ? (
                            <button className="flex w-full items-center gap-2 rounded-lg border border-[var(--color-amber)]/20 bg-[rgba(245,179,71,0.08)] px-3 py-2 text-[12px] font-medium text-[var(--color-amber)] transition-colors hover:bg-[rgba(245,179,71,0.15)]">
                              <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: '"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20' }}>block</span>
                              Suspend User
                            </button>
                          ) : (
                            <button className="flex w-full items-center gap-2 rounded-lg border border-[var(--color-success)]/20 bg-[rgba(108,232,166,0.08)] px-3 py-2 text-[12px] font-medium text-[var(--color-success)] transition-colors hover:bg-[rgba(108,232,166,0.15)]">
                              <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: '"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20' }}>play_circle</span>
                              Unsuspend
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>

        <footer className="mt-8 border-t border-[var(--color-line)]/70 py-4">
          <span className="studio-eyebrow text-[9px] text-[var(--color-fg-dim)]">{filtered.length} user ditampilkan · {MOCK_USERS.length} total</span>
        </footer>
      </div>
    </RevealOnScroll>
  );
}
