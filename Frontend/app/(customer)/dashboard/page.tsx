"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { getSession, type Session } from "@/lib/auth";
import { RevealOnScroll } from "@/components/landing/reveal-on-scroll";
import { cn } from "@/lib/utils";

/* ═══════════════════════════════════════════════════════════════════════
   SVG CHART COMPONENTS — same rendering engine as admin, but with
   customer-specific data and palette.
   ═══════════════════════════════════════════════════════════════════════ */

/* ── Animated Spending Area Chart ──────────────────────────────────── */
function SpendingChart() {
  const [drawn, setDrawn] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setDrawn(true);
          io.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);

  const points = [
    { x: 0, y: 80 },
    { x: 60, y: 65 },
    { x: 120, y: 72 },
    { x: 180, y: 55 },
    { x: 240, y: 60 },
    { x: 300, y: 45 },
    { x: 360, y: 50 },
    { x: 420, y: 38 },
    { x: 480, y: 42 },
    { x: 540, y: 30 },
    { x: 600, y: 35 },
    { x: 660, y: 15 },
  ];
  const w = 660;
  const h = 140;
  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaD = `${pathD} L ${w} ${h} L 0 ${h} Z`;

  return (
    <div ref={ref} className="w-full">
      <svg viewBox={`0 0 ${w + 20} ${h + 20}`} className="w-full" style={{ overflow: "visible" }}>
        <defs>
          <linearGradient id="custAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="custLineGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.5" />
            <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="1" />
          </linearGradient>
        </defs>
        {[0, 35, 70, 105, 140].map((gy) => (
          <line key={gy} x1="0" y1={gy} x2={w} y2={gy} stroke="var(--color-line)" strokeWidth="0.5" />
        ))}
        <path d={areaD} fill="url(#custAreaGrad)" style={{ opacity: drawn ? 1 : 0, transition: "opacity 1.2s cubic-bezier(0.22,1,0.36,1)" }} />
        <path d={pathD} fill="none" stroke="url(#custLineGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={drawn ? "none" : "1000"} strokeDashoffset={drawn ? "0" : "1000"} style={{ transition: "stroke-dasharray 2s cubic-bezier(0.22,1,0.36,1), stroke-dashoffset 2s cubic-bezier(0.22,1,0.36,1)" }} />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="2.5" fill="var(--color-accent)" style={{ opacity: drawn ? 1 : 0, transition: `opacity 0.4s cubic-bezier(0.22,1,0.36,1) ${0.8 + i * 0.05}s` }} />
        ))}
        <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="5" fill="var(--color-accent)" opacity="0.2" className="pulse-dot" />
      </svg>
    </div>
  );
}

/* ── Donut Chart ───────────────────────────────────────────────────── */
function DonutChart({
  data,
  size = 130,
  strokeWidth = 24,
}: {
  data: { label: string; value: number; color: string }[];
  size?: number;
  strokeWidth?: number;
}) {
  const [drawn, setDrawn] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const total = data.reduce((s, d) => s + d.value, 0);

  useEffect(() => {
    if (!ref.current) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { setDrawn(true); io.disconnect(); }
      },
      { threshold: 0.3 },
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);

  let offset = 0;
  return (
    <div ref={ref} className="flex flex-col items-center gap-3">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-line)" strokeWidth={strokeWidth} />
        {data.map((seg, i) => {
          const len = (seg.value / total) * circ;
          offset += len;
          return (
            <circle
              key={seg.label}
              cx={size / 2} cy={size / 2} r={r}
              fill="none" stroke={seg.color} strokeWidth={strokeWidth}
              strokeDasharray={drawn ? `${len} ${circ - len}` : `0 ${circ}`}
              strokeDashoffset={-(offset - len)}
              strokeLinecap="butt"
              style={{ transition: `stroke-dasharray 1.2s cubic-bezier(0.22,1,0.36,1) ${i * 0.15}s` }}
            />
          );
        })}
      </svg>
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
        {data.map((seg) => (
          <div key={seg.label} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: seg.color }} />
            <span className="text-[10px] text-[var(--color-fg-muted)]">{seg.label}</span>
            <span className="font-mono text-[10px] font-semibold text-[var(--color-fg)]">
              {Math.round((seg.value / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Mini Sparkline (Uptime) ────────────────────────────────────────── */
function Sparkline() {
  const [drawn, setDrawn] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setDrawn(true); io.disconnect(); } }, { threshold: 0.5 });
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);

  const pts = Array.from({ length: 30 }, (_, i) => ({
    x: i * 14,
    y: 18 + Math.sin(i * 0.5) * 3 + (i === 7 || i === 22 ? -4 : 0),
  }));
  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  return (
    <div ref={ref}>
      <svg width={420} height={30} className="w-full">
        <path d={d} fill="none" stroke="var(--color-success)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
          strokeDasharray={drawn ? "none" : "600"} strokeDashoffset={drawn ? "0" : "600"}
          style={{ transition: "stroke-dasharray 2s cubic-bezier(0.22,1,0.36,1)" }} />
      </svg>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   KPI CARD
   ═══════════════════════════════════════════════════════════════════════ */

function KPICard({
  label,
  value,
  sub,
  icon,
  trend,
  delay,
}: {
  label: string;
  value: string;
  sub: string;
  icon: string;
  trend?: "up" | "down" | "neutral";
  delay: number;
}) {
  return (
    <div
      className="studio-card reveal-rise rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)]/50 p-5"
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="studio-eyebrow text-[8px] text-[var(--color-fg-dim)]">{label}</p>
          <p className="studio-display mt-2 text-[28px] text-[var(--color-fg)]">{value}</p>
          <p className="mt-1 text-[11px] text-[var(--color-fg-muted)]">{sub}</p>
        </div>
        <div className="grid h-10 w-10 place-items-center rounded-xl border border-[var(--color-line)] bg-black/40">
          <span
            className="material-symbols-outlined text-[20px] text-[var(--color-accent)]"
            style={{ fontVariationSettings: '"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20' }}
          >
            {icon}
          </span>
        </div>
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1.5 border-t border-[var(--color-line)]/80 pt-3">
          <span
            className={cn(
              "material-symbols-outlined text-[14px]",
              trend === "up" ? "text-[var(--color-success)]" : trend === "down" ? "text-[var(--color-error)]" : "text-[var(--color-fg-dim)]",
            )}
            style={{ fontVariationSettings: '"FILL" 0, "wght" 400, "GRAD" 0, "opsz" 20' }}
          >
            {trend === "up" ? "trending_up" : trend === "down" ? "trending_down" : "trending_flat"}
          </span>
          <span className="text-[10px] text-[var(--color-fg-muted)]">
            {trend === "up" ? "+8.2%" : trend === "down" ? "-2.1%" : "stabil"} vs bulan lalu
          </span>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   SERVICE CARD — deployment status row
   ═══════════════════════════════════════════════════════════════════════ */

function ServiceCard({
  name,
  region,
  ip,
  status,
  billingCycle,
  periodEnd,
}: {
  name: string;
  region: string;
  ip: string;
  status: string;
  billingCycle: string;
  periodEnd: string;
}) {
  const statusColors: Record<string, { color: string; bg: string; border: string }> = {
    active: { color: "var(--color-success)", bg: "rgba(108,232,166,0.08)", border: "rgba(108,232,166,0.15)" },
    stopped: { color: "var(--color-fg-dim)", bg: "rgba(255,255,255,0.03)", border: "rgba(255,255,255,0.06)" },
    provisioning: { color: "var(--color-accent)", bg: "var(--color-accent-soft)", border: "rgba(var(--accent-rgb),0.15)" },
  };
  const s = statusColors[status] ?? statusColors.stopped;

  return (
    <div className="studio-card group flex flex-col gap-4 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)]/50 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <h3 className="text-[14px] font-semibold text-[var(--color-fg)] truncate">{name}</h3>
          <span
            className="shrink-0 rounded-full border px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider"
            style={{ color: s.color, backgroundColor: s.bg, borderColor: s.border }}
          >
            {status}
          </span>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[var(--color-fg-muted)]">
          {ip && <span className="font-mono">{ip}</span>}
          <span>{region}</span>
          <span className="capitalize">{billingCycle}</span>
          <span>•</span>
          <span>berakhir {periodEnd}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-[16px] text-[var(--color-fg-dim)] transition-transform group-hover:translate-x-1 group-hover:text-[var(--color-accent)]" style={{ fontVariationSettings: '"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20' }}>
          chevron_right
        </span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   QUICK ACTION
   ═══════════════════════════════════════════════════════════════════════ */

function QuickAction({ icon, label, href, delay }: { icon: string; label: string; href: string; delay: number }) {
  return (
    <Link
      href={href}
      className="reveal-rise group relative grid place-items-center gap-2 overflow-hidden rounded-xl border border-[var(--color-line)]/80 bg-black/40 py-5 transition-all duration-[var(--dur-standard)] hover:border-[var(--color-accent)]/40"
      style={{ transitionDelay: `${delay}ms` }}
    >
      <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(var(--accent-rgb),0.08),transparent_70%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <span
        className="material-symbols-outlined relative text-[26px] text-[var(--color-accent)] transition-transform duration-200 group-hover:scale-110"
        style={{ fontVariationSettings: '"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 24' }}
      >
        {icon}
      </span>
      <span className="studio-eyebrow relative text-[9px] text-[var(--color-fg-muted)]">{label}</span>
    </Link>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   TRANSACTION ROW
   ═══════════════════════════════════════════════════════════════════════ */

function TransactionRow({
  icon,
  iconColor,
  title,
  desc,
  amount,
  amountColor,
  time,
}: {
  icon: string;
  iconColor: string;
  title: string;
  desc: string;
  amount: string;
  amountColor: string;
  time: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[var(--color-line)]/60 bg-[var(--color-surface)]/30 px-4 py-3 transition-all duration-200 hover:border-[var(--color-accent)]/20 hover:bg-white/[0.02]">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-[var(--color-line)]" style={{ background: `${iconColor}08` }}>
        <span className="material-symbols-outlined text-[16px]" style={{ color: iconColor, fontVariationSettings: '"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20' }}>
          {icon}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-[var(--color-fg)]">{title}</p>
        <p className="text-[10px] text-[var(--color-fg-muted)]">{desc}</p>
      </div>
      <div className="text-right">
        <span className="font-mono text-[13px] font-semibold" style={{ color: amountColor }}>{amount}</span>
        <p className="text-[9px] text-[var(--color-fg-dim)]">{time}</p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   EMAIL VERIFICATION BANNER
   ═══════════════════════════════════════════════════════════════════════ */

function VerificationBanner() {
  return (
    <div className="reveal-rise flex items-center gap-3 rounded-2xl border border-[var(--color-amber)]/20 bg-[var(--color-amber-soft)] px-5 py-4">
      <span className="material-symbols-outlined text-[20px] text-[var(--color-amber)]" style={{ fontVariationSettings: '"FILL" 0, "wght" 400, "GRAD" 0, "opsz" 20' }}>
        warning
      </span>
      <p className="flex-1 text-[13px] text-[var(--color-fg)]">
        Email kamu belum diverifikasi.{" "}
        <Link href="/verify-email" className="text-[var(--color-accent)] underline underline-offset-2 hover:no-underline">
          Kirim ulang verifikasi
        </Link>
      </p>
      <span className="material-symbols-outlined text-[16px] text-[var(--color-fg-dim)]" style={{ fontVariationSettings: '"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20' }}>
        close
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════════════ */

const BILLING_DATA = [
  { label: "Monthly", value: 68, color: "var(--color-accent)" },
  { label: "Yearly", value: 24, color: "var(--color-magenta)" },
  { label: "Hourly", value: 8, color: "var(--color-steel)" },
];

const MOCK_SERVICES = [
  { name: "VPS Jakarta Pro", region: "JKT-1", ip: "103.58.xx.xx", status: "active", billingCycle: "monthly", periodEnd: "15 Jul 2026" },
  { name: "Dedicated Surabaya", region: "SUB-3", ip: "36.95.xx.xx", status: "active", billingCycle: "yearly", periodEnd: "28 Feb 2027" },
  { name: "VPS Singapore Starter", region: "SGP-2", ip: "—", status: "provisioning", billingCycle: "monthly", periodEnd: "— provisioning" },
];

const MOCK_TRANSACTIONS = [
  { icon: "payments", iconColor: "var(--color-success)", title: "Pembayaran berhasil", desc: "Invoice INV-1247 — VPS Jakarta Pro", amount: "-Rp 2.450.000", amountColor: "var(--color-success)", time: "15 Jun" },
  { icon: "add_circle", iconColor: "var(--color-accent)", title: "Order baru", desc: "VPS Singapore Starter — Monthly", amount: "Rp 1.200.000", amountColor: "var(--color-fg)", time: "12 Jun" },
  { icon: "receipt_long", iconColor: "var(--color-steel)", title: "Invoice dibuat", desc: "INV-1248 — Dedicated Surabaya", amount: "Rp 54.000.000", amountColor: "var(--color-fg-muted)", time: "1 Jun" },
  { icon: "restart_alt", iconColor: "var(--color-accent)", title: "Restart deployment", desc: "VPS Jakarta Pro — manual restart", amount: "—", amountColor: "var(--color-fg-dim)", time: "28 Mei" },
  { icon: "payments", iconColor: "var(--color-success)", title: "Pembayaran berhasil", desc: "Invoice INV-1245 — VPS Jakarta Pro", amount: "-Rp 2.450.000", amountColor: "var(--color-success)", time: "15 Mei" },
];

export default function CustomerDashboardPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSession() {
      try {
        const s = await getSession();
        setSession(s);
      } catch {
        // Not authenticated
      } finally {
        setLoading(false);
      }
    }
    loadSession();
  }, []);

  const firstName = session?.user?.name?.split(" ")[0] ?? "User";
  const isVerified = session?.user?.email_verified_at !== null;

  return (
    <RevealOnScroll>
      <div className="mx-auto w-full max-w-[1320px] px-6 py-8">
        {/* ────────────────────── WELCOME HEADER ────────────────────── */}
        <section className="reveal-rise mb-8">
          <div className="flex items-start justify-between">
            <div>
              <p className="studio-eyebrow text-accent">Dashboard</p>
              <h1 className="studio-display mt-3 text-[clamp(28px,4vw,44px)] text-[var(--color-fg)]">
                Selamat datang, {firstName}
              </h1>
              <p className="mt-2 text-[13px] text-[var(--color-fg-muted)]">
                Ringkasan layanan, tagihan, dan aktivitas akun Anda.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="studio-eyebrow rounded-full border border-[var(--color-line)] px-3 py-1.5 text-[9px] text-[var(--color-fg-dim)]">
                {session?.user?.email ?? "user@jadenode.id"}
              </span>
            </div>
          </div>
        </section>

        {/* ────────────────────── EMAIL VERIFICATION ────────────────────── */}
        {!loading && !isVerified && (
          <section className="mb-6">
            <VerificationBanner />
          </section>
        )}

        {/* ────────────────────── KPI GRID ────────────────────── */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KPICard label="Active Services" value="3" sub="2 VPS · 1 Dedicated" icon="dns" trend="neutral" delay={0} />
          <KPICard label="Total Spending" value="Rp 12.4M" sub="year-to-date · 2026" icon="account_balance_wallet" trend="up" delay={80} />
          <KPICard label="Open Tickets" value="1" sub="menunggu respons" icon="confirmation_number" trend="neutral" delay={160} />
          <KPICard label="Next Invoice" value="15 Jul" sub="Rp 2.450.000 — VPS JKT" icon="calendar_clock" delay={240} />
        </section>

        {/* ────────────────────── QUICK ACTIONS ────────────────────── */}
        <section className="reveal-rise mt-8">
          <p className="studio-eyebrow mb-4 text-[9px] text-[var(--color-fg-dim)]">
            Aksi Cepat
          </p>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
            <QuickAction icon="add_shopping_cart" label="Order Baru" href="/marketplace" delay={0} />
            <QuickAction icon="receipt_long" label="Invoice" href="/invoices" delay={50} />
            <QuickAction icon="dns" label="Deployments" href="/deployments" delay={100} />
            <QuickAction icon="confirmation_number" label="Support" href="/tickets" delay={150} />
            <QuickAction icon="settings" label="Pengaturan" href="/settings" delay={200} />
          </div>
        </section>

        {/* ────────────────────── ANALYTICS BENTO ────────────────────── */}
        <section className="mt-10 grid gap-4 lg:grid-cols-2">
          {/* Spending Trend — Area Chart */}
          <article className="studio-card reveal-rise overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)]/50 p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <span className="studio-eyebrow text-[9px] text-[var(--color-fg-dim)]">
                  Spending Trend
                </span>
                <h3 className="studio-display mt-2 text-[22px] text-[var(--color-fg)]">
                  Pengeluaran bulanan
                </h3>
              </div>
              <span className="rounded-full border border-[var(--color-line)] px-3 py-1 font-mono text-[10px] text-[var(--color-fg-muted)]">
                12 bulan
              </span>
            </div>
            <SpendingChart />
            <div className="mt-4 flex items-center gap-4 border-t border-[var(--color-line)]/80 pt-3">
              <div>
                <span className="studio-display text-[18px] text-[var(--color-fg)]">Rp 2.45M</span>
                <span className="ml-1 text-[10px] text-[var(--color-fg-dim)]">bulan ini</span>
              </div>
              <span className="text-[10px] text-[var(--color-fg-dim)]">avg</span>
              <span className="studio-display text-[18px] text-[var(--color-fg-muted)]">Rp 1.8M</span>
              <span className="ml-1 text-[10px] text-[var(--color-fg-dim)]">/bulan</span>
            </div>
          </article>

          {/* Billing Cycle Distribution — Pie + Uptime */}
          <article className="studio-card reveal-rise overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)]/50 p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <span className="studio-eyebrow text-[9px] text-[var(--color-fg-dim)]">
                  Siklus &amp; Uptime
                </span>
                <h3 className="studio-display mt-2 text-[22px] text-[var(--color-fg)]">
                  Distribusi billing
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="pulse-dot h-2 w-2 rounded-full bg-[var(--color-success)]" />
                <span className="font-mono text-[10px] text-[var(--color-fg-muted)]">
                  99.9% uptime
                </span>
              </div>
            </div>
            <DonutChart data={BILLING_DATA} />
            <div className="mt-4">
              <p className="studio-eyebrow mb-2 text-[8px] text-[var(--color-fg-dim)]">
                Uptime — 30 hari terakhir
              </p>
              <Sparkline />
            </div>
          </article>
        </section>

        {/* ────────────────────── ACTIVE SERVICES ────────────────────── */}
        <section className="reveal-rise mt-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <span className="studio-eyebrow text-[9px] text-[var(--color-fg-dim)]">
                Layanan Aktif
              </span>
              <h3 className="studio-display mt-2 text-[22px] text-[var(--color-fg)]">
                Deployment Anda
              </h3>
            </div>
            <Link
              href="/deployments"
              className="studio-eyebrow inline-flex items-center gap-1.5 text-[var(--color-accent)] hover:underline"
            >
              Lihat semua
              <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: '"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20' }}>
                north_east
              </span>
            </Link>
          </div>
          <div className="grid gap-3">
            {MOCK_SERVICES.map((svc, i) => (
              <ServiceCard key={svc.name} {...svc} />
            ))}
          </div>
        </section>

        {/* ────────────────────── PAYMENT SUMMARY BENTO ────────────────────── */}
        <section className="mt-4 grid gap-4 lg:grid-cols-3">
          {/* Upcoming Payment */}
          <article className="studio-card reveal-rise rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)]/50 p-6">
            <span className="studio-eyebrow text-[9px] text-[var(--color-fg-dim)]">
              Pembayaran Berikutnya
            </span>
            <h3 className="studio-display mt-2 text-[20px] text-[var(--color-fg)]">
              Invoice mendatang
            </h3>
            <div className="mt-5 space-y-3">
              {[
                { name: "VPS Jakarta Pro", amount: "Rp 2.450.000", due: "15 Jul 2026" },
                { name: "VPS Singapore Starter", amount: "Rp 1.200.000", due: "12 Jul 2026" },
              ].map((inv, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl border border-[var(--color-line)]/80 bg-black/40 px-4 py-3">
                  <div>
                    <p className="text-[12px] font-medium text-[var(--color-fg)]">{inv.name}</p>
                    <p className="font-mono text-[9px] text-[var(--color-fg-dim)]">Jatuh tempo: {inv.due}</p>
                  </div>
                  <span className="studio-display text-[16px] text-[var(--color-accent)]">{inv.amount}</span>
                </div>
              ))}
            </div>
            <Link
              href="/invoices"
              className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-[var(--color-accent)]/20 bg-[var(--color-accent-soft)] py-2.5 text-[12px] font-medium text-[var(--color-accent)] transition-colors hover:bg-[var(--color-accent)]/20"
            >
              <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: '"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20' }}>
                receipt_long
              </span>
              Lihat semua invoice
            </Link>
          </article>

          {/* Recent Orders */}
          <article className="studio-card reveal-rise rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)]/50 p-6">
            <div className="mb-4 flex items-center justify-between">
              <span className="studio-eyebrow text-[9px] text-[var(--color-fg-dim)]">
                Pesanan Terbaru
              </span>
              <Link href="/orders" className="studio-eyebrow text-[8px] text-[var(--color-accent)] hover:underline">
                Semua
              </Link>
            </div>
            <div className="space-y-2">
              {[
                { id: "ORD-8472", name: "VPS Singapore Starter", status: "paid", statusColor: "var(--color-success)", amount: "Rp 1.200.000" },
                { id: "ORD-8451", name: "VPS Jakarta Pro", status: "active", statusColor: "var(--color-accent)", amount: "Rp 2.450.000" },
                { id: "ORD-8390", name: "Dedicated Surabaya", status: "active", statusColor: "var(--color-accent)", amount: "Rp 54.000.000" },
              ].map((order) => (
                <div key={order.id} className="flex items-center justify-between rounded-xl border border-[var(--color-line)]/60 bg-black/30 px-4 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-medium text-[var(--color-fg)] truncate">{order.name}</p>
                    <p className="font-mono text-[9px] text-[var(--color-fg-dim)]">{order.id}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[11px] font-semibold text-[var(--color-fg-muted)]">{order.amount}</span>
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: order.statusColor }} />
                  </div>
                </div>
              ))}
            </div>
          </article>

          {/* Support Ticket Quick View */}
          <article className="studio-card reveal-rise rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)]/50 p-6">
            <div className="mb-4 flex items-center justify-between">
              <span className="studio-eyebrow text-[9px] text-[var(--color-fg-dim)]">
                Tiket Support
              </span>
              <Link href="/tickets" className="studio-eyebrow text-[8px] text-[var(--color-accent)] hover:underline">
                Semua
              </Link>
            </div>
            <div className="space-y-2">
              {[
                { subject: "VPS restart gagal", status: "open", count: 1, color: "var(--color-error)", bg: "rgba(255,122,122,0.1)", border: "rgba(255,122,122,0.2)" },
                { subject: "Upgrade RAM Jakarta Pro", status: "resolved", count: 3, color: "var(--color-success)", bg: "rgba(108,232,166,0.1)", border: "rgba(108,232,166,0.2)" },
                { subject: "Billing clarification", status: "closed", count: 5, color: "var(--color-fg-dim)", bg: "rgba(255,255,255,0.03)", border: "rgba(255,255,255,0.06)" },
              ].map((t) => (
                <div
                  key={t.subject}
                  className="flex items-center justify-between rounded-xl border px-4 py-2.5 transition-colors hover:bg-white/[0.02]"
                  style={{ background: t.bg, borderColor: t.border }}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-medium text-[var(--color-fg)] truncate">{t.subject}</p>
                    <p className="text-[9px] text-[var(--color-fg-dim)]">{t.count} pesan · {t.status}</p>
                  </div>
                  <span className="material-symbols-outlined text-[16px] text-[var(--color-fg-dim)]" style={{ fontVariationSettings: '"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20' }}>
                    chevron_right
                  </span>
                </div>
              ))}
            </div>
            <Link
              href="/tickets/new"
              className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl bg-[var(--color-accent)] py-2.5 text-[12px] font-bold text-[var(--color-accent-fg)] transition-opacity hover:opacity-90"
            >
              <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: '"FILL" 0, "wght" 400, "GRAD" 0, "opsz" 20' }}>
                add
              </span>
              Buat Tiket Baru
            </Link>
          </article>
        </section>

        {/* ────────────────────── TRANSACTION HISTORY ────────────────────── */}
        <section className="reveal-rise mt-4">
          <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)]/50 p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <span className="studio-eyebrow text-[9px] text-[var(--color-fg-dim)]">
                  Riwayat Transaksi
                </span>
                <h3 className="studio-display mt-2 text-[22px] text-[var(--color-fg)]">
                  Aktivitas akun
                </h3>
              </div>
              <span className="rounded-full border border-[var(--color-line)] px-3 py-1 font-mono text-[10px] text-[var(--color-fg-muted)]">
                30 hari
              </span>
            </div>
            <div className="grid gap-2">
              {MOCK_TRANSACTIONS.map((tx, i) => (
                <TransactionRow key={i} {...tx} />
              ))}
            </div>
          </div>
        </section>

        {/* ────────────────────── RESOURCE USAGE ────────────────────── */}
        <section className="reveal-rise mt-4">
          <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)]/50 p-6">
            <span className="studio-eyebrow text-[9px] text-[var(--color-fg-dim)]">
              Pemakaian Resource
            </span>
            <h3 className="studio-display mt-2 text-[22px] text-[var(--color-fg)]">
              Utilisasi server
            </h3>
            <div className="mt-5 grid gap-6 sm:grid-cols-2">
              {[
                { label: "CPU Usage", value: 34, color: "var(--color-accent)" },
                { label: "Memory", value: 62, color: "var(--color-magenta)" },
                { label: "Disk I/O", value: 18, color: "var(--color-steel)" },
                { label: "Bandwidth", value: 45, color: "var(--color-accent)" },
              ].map((res) => (
                <div key={res.label}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] text-[var(--color-fg-muted)]">{res.label}</span>
                    <span className="font-mono text-[11px] font-semibold text-[var(--color-fg)]">{res.value}%</span>
                  </div>
                  <div className="studio-bar h-2 overflow-hidden rounded-full bg-white/[0.04]">
                    <span
                      className="block h-full rounded-full"
                      style={{
                        width: `${res.value}%`,
                        background: res.color,
                        transition: "width 1.6s cubic-bezier(0.22,1,0.36,1)",
                        transitionDelay: "600ms",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ────────────────────── FOOTER ────────────────────── */}
        <footer className="mt-12 border-t border-[var(--color-line)]/70 px-0 py-6">
          <div className="flex items-center justify-between">
            <span className="studio-eyebrow text-[9px] text-[var(--color-fg-dim)]">
              © 2026 JadeNode Marketplace · Customer Panel
            </span>
            <span className="flex items-center gap-2 text-[11px] text-[var(--color-fg-muted)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-success)]" />
              Semua layanan beroperasi normal
            </span>
          </div>
        </footer>
      </div>
    </RevealOnScroll>
  );
}
