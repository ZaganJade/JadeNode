"use client";

import { useState, useEffect } from "react";

import Link from "next/link";
import { getSession, type Session } from "@/lib/auth";
import { RevealOnScroll } from "@/components/landing/reveal-on-scroll";

/* ═══════════════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════════════ */

function MIcon({
  name,
  size = 18,
  color,
  className = "",
}: {
  name: string;
  size?: number;
  color?: string;
  className?: string;
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

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr).getTime();
  const now = Date.now();
  return Math.max(0, Math.ceil((target - now) / 86400000));
}

/* ═══════════════════════════════════════════════════════════════════════
   SERVICE ROW
   ═══════════════════════════════════════════════════════════════════════ */

function ServiceRow({
  name,
  region,
  ip,
  status,
  periodEnd,
}: {
  name: string;
  region: string;
  ip: string;
  status: "active" | "stopped" | "provisioning";
  periodEnd: string;
}) {
  const statusMeta = {
    active: { color: "var(--color-success)", label: "Active" },
    stopped: { color: "var(--color-fg-dim)", label: "Stopped" },
    provisioning: { color: "var(--color-accent)", label: "Provisioning" },
  }[status];

  return (
    <li className="flex items-center gap-4 border-b border-[var(--color-line)]/60 px-5 py-4 last:border-0 transition-colors hover:bg-white/[0.015]">
      <span
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ background: statusMeta.color }}
        aria-label={statusMeta.label}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-[var(--color-fg)]">
          {name}
        </p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-[11px] text-[var(--color-fg-dim)]">
          <span className="font-mono">{ip}</span>
          <span>{region}</span>
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--color-fg-dim)]">
          Berakhir
        </p>
        <p className="mt-0.5 text-[12px] text-[var(--color-fg-muted)]">
          {periodEnd}
        </p>
      </div>
    </li>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   MOCK DATA
   ═══════════════════════════════════════════════════════════════════════ */

const NEXT_INVOICE = {
  name: "VPS Jakarta Pro",
  amount: "Rp 2.450.000",
  dueDateLabel: "15 Jul 2026",
  dueDateISO: "2026-07-15",
};

const SERVICES: Array<{
  name: string;
  region: string;
  ip: string;
  status: "active" | "stopped" | "provisioning";
  periodEnd: string;
}> = [
  {
    name: "VPS Jakarta Pro",
    region: "JKT-1",
    ip: "103.58.xx.xx",
    status: "active",
    periodEnd: "15 Jul 2026",
  },
  {
    name: "Dedicated Surabaya",
    region: "SUB-3",
    ip: "36.95.xx.xx",
    status: "active",
    periodEnd: "28 Feb 2027",
  },
  {
    name: "VPS Singapore Starter",
    region: "SGP-2",
    ip: "—",
    status: "provisioning",
    periodEnd: "12 Jul 2026",
  },
];

/* ═══════════════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════════════ */

export default function CustomerDashboardPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const s = await getSession();
        setSession(s);
      } catch {
        /* unauthenticated — page is gated upstream */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const firstName = session?.user?.name?.split(" ")[0] ?? "User";
  const isVerified = session?.user?.email_verified_at !== null;
  const daysLeft = daysUntil(NEXT_INVOICE.dueDateISO);
  const activeServices = SERVICES.filter((s) => s.status === "active").length;
  const totalServices = SERVICES.length;
  const activeRatio =
    totalServices > 0 ? Math.round((activeServices / totalServices) * 100) : 0;

  return (
    <RevealOnScroll>
      <div className="mx-auto w-full max-w-[1040px] px-6 py-10">
        {/* ────────────────────── HEADER ────────────────────── */}
        <header className="reveal-rise mb-10 flex items-end justify-between gap-6">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-fg-dim)]">
              JadeNode · Customer
            </p>
            <h1 className="mt-2 text-[36px] font-bold leading-none tracking-tight text-[var(--color-fg)]">
              Halo, {firstName}
            </h1>
          </div>
          <span className="hidden truncate rounded-full border border-[var(--color-line)] px-3 py-1.5 font-mono text-[10px] text-[var(--color-fg-dim)] sm:block">
            {session?.user?.email ?? "—"}
          </span>
        </header>

        {/* ─────────── VERIFICATION BANNER (compact, conditional) ─────────── */}
        {!loading && !isVerified && (
          <div className="reveal-rise mb-8 overflow-hidden rounded-xl border border-[var(--color-amber)]/25 bg-[var(--color-amber)]/[0.04]">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
              <div className="flex items-center gap-2">
                <MIcon name="mark_email_unread" size={16} color="var(--color-amber)" />
                <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[var(--color-amber)]">
                  Email Belum Terverifikasi
                </span>
              </div>
              <Link
                href="/verify-email"
                className="text-[12px] text-[var(--color-fg-muted)] underline-offset-2 hover:text-[var(--color-fg)] hover:underline"
              >
                Kirim ulang verifikasi →
              </Link>
            </div>
          </div>
        )}

        {/* ────────────── HERO STATS — 2 statistik utama ────────────── */}
        <section className="reveal-rise mb-12 grid gap-4 lg:grid-cols-3">
          {/* PRIMARY: Tagihan Berikutnya */}
          <div className="relative overflow-hidden rounded-2xl border border-[var(--color-accent)]/25 bg-gradient-to-br from-[var(--color-accent)]/[0.08] via-transparent to-transparent p-7 lg:col-span-2">
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
                  Tagihan Berikutnya
                </p>
              </div>
              <p className="mt-4 text-[56px] font-bold leading-none tracking-tight text-[var(--color-fg)]">
                {NEXT_INVOICE.amount}
              </p>
              <p className="mt-3 text-[13px] text-[var(--color-fg-muted)]">
                {NEXT_INVOICE.name}
              </p>
              <div className="mt-6 flex flex-wrap items-end gap-x-8 gap-y-3 border-t border-[var(--color-line)]/60 pt-5">
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-[var(--color-fg-dim)]">
                    Jatuh Tempo
                  </p>
                  <p className="mt-1 text-[15px] font-semibold text-[var(--color-fg)]">
                    {NEXT_INVOICE.dueDateLabel}
                  </p>
                </div>
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-[var(--color-fg-dim)]">
                    Sisa Waktu
                  </p>
                  <p
                    className="mt-1 text-[15px] font-semibold"
                    style={{
                      color:
                        daysLeft <= 7
                          ? "var(--color-amber)"
                          : "var(--color-fg)",
                    }}
                  >
                    {daysLeft} hari
                  </p>
                </div>
                <Link
                  href="/invoices"
                  className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-accent)]/30 bg-[var(--color-accent-soft)] px-4 py-2 text-[12px] font-medium text-[var(--color-accent)] transition-colors hover:bg-[var(--color-accent)]/15"
                >
                  Bayar sekarang
                  <MIcon name="arrow_forward" size={14} />
                </Link>
              </div>
            </div>
          </div>

          {/* SECONDARY: Layanan Aktif */}
          <div className="flex flex-col rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)]/60 p-7">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-steel)]" />
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-fg-dim)]">
                Layanan Aktif
              </p>
            </div>
            <p className="mt-4 text-[56px] font-bold leading-none tracking-tight text-[var(--color-fg)]">
              {activeServices}
            </p>
            <p className="mt-3 text-[13px] text-[var(--color-fg-muted)]">
              dari {totalServices} deployment
            </p>
            <div className="mt-auto pt-6">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[var(--color-fg-dim)]">
                  Berjalan
                </span>
                <span className="font-mono text-[10px] text-[var(--color-fg-muted)]">
                  {activeRatio}%
                </span>
              </div>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-[var(--color-line)]">
                <div
                  className="h-full rounded-full bg-[var(--color-success)] transition-all duration-700"
                  style={{ width: `${activeRatio}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ────────────── LAYANAN AKTIF — list ────────────── */}
        <section className="reveal-rise mb-10">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-[14px] font-semibold tracking-tight text-[var(--color-fg)]">
              Deployment Anda
            </h2>
            <Link
              href="/deployments"
              className="font-mono text-[10px] uppercase tracking-[0.15em] text-[var(--color-fg-dim)] transition-colors hover:text-[var(--color-accent)]"
            >
              Lihat semua →
            </Link>
          </div>
          <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)]/60">
            {SERVICES.length > 0 ? (
              <ul>
                {SERVICES.map((svc) => (
                  <ServiceRow key={svc.name} {...svc} />
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 py-12">
                <MIcon name="cloud_off" size={28} color="var(--color-fg-dim)" />
                <span className="text-[12px] text-[var(--color-fg-dim)]">
                  Belum ada deployment
                </span>
                <Link
                  href="/marketplace"
                  className="mt-1 inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-accent)]/30 px-3 py-1.5 text-[11px] font-medium text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10"
                >
                  Telusuri marketplace
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* ────────────── AKSES CEPAT ────────────── */}
        <section className="reveal-rise">
          <h2 className="mb-4 text-[14px] font-semibold tracking-tight text-[var(--color-fg)]">
            Akses Cepat
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              {
                icon: "add_shopping_cart",
                label: "Order Baru",
                href: "/marketplace",
              },
              { icon: "receipt_long", label: "Invoice", href: "/invoices" },
              {
                icon: "confirmation_number",
                label: "Tiket",
                href: "/tickets",
              },
              { icon: "settings", label: "Pengaturan", href: "/settings" },
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
        </section>
      </div>
    </RevealOnScroll>
  );
}
