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
   TYPES — Multi-currency Asia scope
   ═══════════════════════════════════════════════════════════════════════ */

type PaymentStatus = "pending" | "success" | "failed" | "refunded" | "disputed";
type PaymentMethod = "midtrans" | "manual_transfer" | "bank_transfer";

interface Payment {
  id: number;
  public_id: string;
  order_number: string;
  user_name: string;
  user_email: string;
  amount: number;
  currency: string;
  payment_method: PaymentMethod;
  status: PaymentStatus;
  gateway_ref: string | null;
  description: string;
  paid_at: string | null;
  created_at: string;
}

/* ═══════════════════════════════════════════════════════════════════════
   ASIA CURRENCIES
   ═══════════════════════════════════════════════════════════════════════ */

const CURRENCIES = ["IDR", "USD", "SGD", "MYR", "THB", "VND", "PHP", "JPY", "KRW", "INR", "HKD", "TWD", "AED"];

const CURRENCY_SYMBOLS: Record<string, string> = {
  IDR: "Rp", USD: "$", SGD: "S$", MYR: "RM", THB: "฿", VND: "₫",
  PHP: "₱", JPY: "¥", KRW: "₩", INR: "₹", HKD: "HK$", TWD: "NT$", AED: "د.إ",
};

/* ═══════════════════════════════════════════════════════════════════════
   MOCK DATA
   ═══════════════════════════════════════════════════════════════════════ */

const MOCK_PAYMENTS: Payment[] = [
  { id: 1, public_id: "PAY-01A2B3", order_number: "ORD-8472", user_name: "Alia Rahmawati", user_email: "alia@kirana-commerce.id", amount: 2450000, currency: "IDR", payment_method: "midtrans", status: "success", gateway_ref: "MID-SG-2847291", description: "VPS Jakarta Pro — Monthly", paid_at: "2026-06-05T08:30:00Z", created_at: "2026-06-05T08:28:00Z" },
  { id: 2, public_id: "PAY-03C4D5", order_number: "ORD-8451", user_name: "Bagas Pranata", user_email: "bagas@lokalogistics.com", amount: 54000000, currency: "IDR", payment_method: "manual_transfer", status: "success", gateway_ref: null, description: "Dedicated Surabaya — Yearly", paid_at: "2026-06-01T14:00:00Z", created_at: "2026-06-01T10:00:00Z" },
  { id: 3, public_id: "PAY-05E6F7", order_number: "ORD-8473", user_name: "Sofia Wijaya", user_email: "sofia@nimbusmedia.sg", amount: 3200, currency: "SGD", payment_method: "midtrans", status: "success", gateway_ref: "MID-SG-9182736", description: "VPS Singapore Starter — Monthly", paid_at: "2026-06-04T02:20:00Z", created_at: "2026-06-04T02:18:00Z" },
  { id: 4, public_id: "PAY-07G8H9", order_number: "ORD-8474", user_name: "Maria Santos", user_email: "maria@philsolutions.ph", amount: 8500, currency: "PHP", payment_method: "midtrans", status: "pending", gateway_ref: null, description: "VPS Manila Starter — Monthly", paid_at: null, created_at: "2026-06-05T09:00:00Z" },
  { id: 5, public_id: "PAY-09I0J1", order_number: "ORD-8460", user_name: "Takeshi Yamamoto", user_email: "takeshi@sakuranet.jp", amount: 45000, currency: "JPY", payment_method: "bank_transfer", status: "success", gateway_ref: "BT-JP-827361", description: "Dedicated Tokyo — Monthly", paid_at: "2026-05-28T18:00:00Z", created_at: "2026-05-28T16:00:00Z" },
  { id: 6, public_id: "PAY-11K2L3", order_number: "ORD-8455", user_name: "Priya Sharma", user_email: "priya@bharatcloud.in", amount: 15000, currency: "INR", payment_method: "midtrans", status: "failed", gateway_ref: "MID-IN-1928374", description: "VPS Mumbai Pro — Monthly", paid_at: null, created_at: "2026-05-30T09:30:00Z" },
  { id: 7, public_id: "PAY-13M4N5", order_number: "ORD-8440", user_name: "Kowit Tanakorn", user_email: "kowit@thicloud.th", amount: 12000, currency: "THB", payment_method: "bank_transfer", status: "refunded", gateway_ref: "BT-TH-472819", description: "VPS Bangkok — Monthly", paid_at: "2026-05-15T12:00:00Z", created_at: "2026-05-15T10:00:00Z" },
  { id: 8, public_id: "PAY-15O6P7", order_number: "ORD-8438", user_name: "Ahmed Al-Rashid", user_email: "ahmed@gulfstack.ae", amount: 2000, currency: "AED", payment_method: "midtrans", status: "disputed", gateway_ref: "MID-AE-5829103", description: "VPS Dubai Pro — Monthly", paid_at: "2026-05-20T16:00:00Z", created_at: "2026-05-20T15:50:00Z" },
  { id: 9, public_id: "PAY-17Q8R9", order_number: "ORD-8465", user_name: "Rizki Fauzan", user_email: "rizki@startup-vn.com", amount: 3500000, currency: "VND", payment_method: "manual_transfer", status: "pending", gateway_ref: null, description: "VPS Ho Chi Minh — Monthly", paid_at: null, created_at: "2026-06-04T22:00:00Z" },
  { id: 10, public_id: "PAY-19S0T1", order_number: "ORD-8470", user_name: "Wei Chen", user_email: "wei@dragoncloud.hk", amount: 1500, currency: "HKD", payment_method: "midtrans", status: "success", gateway_ref: "MID-HK-7382910", description: "VPS Hong Kong — Monthly", paid_at: "2026-06-03T11:30:00Z", created_at: "2026-06-03T11:28:00Z" },
];

/* ═══════════════════════════════════════════════════════════════════════
   CONFIGS
   ═══════════════════════════════════════════════════════════════════════ */

const statusConfig: Record<PaymentStatus, { label: string; color: string; bg: string; border: string }> = {
  success: { label: "Success", color: "var(--color-success)", bg: "rgba(108,232,166,0.08)", border: "rgba(108,232,166,0.15)" },
  pending: { label: "Pending", color: "var(--color-amber)", bg: "rgba(245,179,71,0.08)", border: "rgba(245,179,71,0.15)" },
  failed: { label: "Failed", color: "var(--color-error)", bg: "rgba(255,122,122,0.08)", border: "rgba(255,122,122,0.15)" },
  refunded: { label: "Refunded", color: "var(--color-steel)", bg: "rgba(122,150,177,0.08)", border: "rgba(122,150,177,0.15)" },
  disputed: { label: "Disputed", color: "var(--color-magenta)", bg: "rgba(246,84,158,0.08)", border: "rgba(246,84,158,0.15)" },
};

const methodConfig: Record<PaymentMethod, { label: string; icon: string }> = {
  midtrans: { label: "Midtrans", icon: "credit_card" },
  manual_transfer: { label: "Manual Transfer", icon: "account_balance" },
  bank_transfer: { label: "Bank Transfer", icon: "bank" },
};

function Badge({ label, color, bg, border }: { label: string; color: string; bg: string; border: string }) {
  return <span className="rounded-full border px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider" style={{ color, backgroundColor: bg, borderColor: border }}>{label}</span>;
}

function formatAmount(amount: number, currency: string): string {
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency;
  return `${symbol} ${new Intl.NumberFormat("id-ID").format(amount)}`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

/* ═══════════════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════════════ */

export default function AdminPaymentsPage() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterMethod, setFilterMethod] = useState("");
  const [filterCurrency, setFilterCurrency] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const filtered = MOCK_PAYMENTS.filter((p) => {
    if (search && !p.user_name.toLowerCase().includes(search.toLowerCase()) && !p.order_number.toLowerCase().includes(search.toLowerCase()) && !p.public_id.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterStatus && p.status !== filterStatus) return false;
    if (filterMethod && p.payment_method !== filterMethod) return false;
    if (filterCurrency && p.currency !== filterCurrency) return false;
    return true;
  });

  const totalIDR = MOCK_PAYMENTS.filter(p => p.status === "success" && p.currency === "IDR").reduce((s, p) => s + p.amount, 0);
  const successCount = MOCK_PAYMENTS.filter(p => p.status === "success").length;
  const pendingCount = MOCK_PAYMENTS.filter(p => p.status === "pending").length;
  const disputedCount = MOCK_PAYMENTS.filter(p => p.status === "disputed").length;
  const currenciesUsed = [...new Set(MOCK_PAYMENTS.map(p => p.currency))].length;

  // Derived analytics — the landing's bento data-viz, grounded in payment data
  const analytics = useMemo(() => {
    const total = MOCK_PAYMENTS.length;
    const statusMix = (["success", "pending", "failed", "refunded", "disputed"] as PaymentStatus[])
      .map((s) => ({ label: statusConfig[s].label, value: MOCK_PAYMENTS.filter((p) => p.status === s).length, color: statusConfig[s].color }))
      .filter((d) => d.value > 0);

    const methodColors: Record<PaymentMethod, string> = {
      midtrans: "var(--color-accent)",
      manual_transfer: "var(--color-steel)",
      bank_transfer: "var(--color-magenta)",
    };
    const methodMix = (["midtrans", "manual_transfer", "bank_transfer"] as PaymentMethod[])
      .map((m) => ({ label: methodConfig[m].label, value: MOCK_PAYMENTS.filter((p) => p.payment_method === m).length, color: methodColors[m] }))
      .filter((d) => d.value > 0);

    const currencyCount = new Map<string, number>();
    for (const p of MOCK_PAYMENTS) currencyCount.set(p.currency, (currencyCount.get(p.currency) ?? 0) + 1);
    const currencyBars = [...currencyCount.entries()].sort((a, b) => b[1] - a[1]);
    const maxCurrency = Math.max(...currencyBars.map(([, c]) => c), 1);

    const successRate = Math.round((successCount / (total || 1)) * 100);
    const refundedCount = MOCK_PAYMENTS.filter((p) => p.status === "refunded").length;
    const failedCount = MOCK_PAYMENTS.filter((p) => p.status === "failed").length;

    return { statusMix, methodMix, currencyBars, maxCurrency, successRate, refundedCount, failedCount };
  }, [successCount]);

  const inputCls = "rounded-lg border border-[var(--color-line)] bg-black/40 px-3 py-2 text-[13px] text-[var(--color-fg)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]/20";

  return (
    <RevealOnScroll>
      <div className="relative mx-auto w-full max-w-[1320px] px-6 py-8">
        {/* Header */}
        <PageHeader
          eyebrow="Payment Management"
          title="Pembayaran"
          subtitle="Transaksi multi-currency di seluruh Asia — monitoring, refund, dan dispute resolution."
          status={`${MOCK_PAYMENTS.length} transaksi · ${currenciesUsed} mata uang`}
        />

        {/* KPI grid */}
        <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard label="Total Transaksi" value={MOCK_PAYMENTS.length} icon="receipt_long" sub="Semua status" compact delay={0} />
          <StatCard label="Berhasil" value={successCount} icon="check_circle" sub={`${analytics.successRate}% success rate`} accent compact delay={70} />
          <StatCard label="Pending" value={pendingCount} icon="hourglass_top" sub="Menunggu bayar" compact delay={140} />
          <StatCard label="Disputed" value={disputedCount} icon="gavel" sub="Perlu resolusi" compact delay={210} />
          <StatCard label="Mata Uang" value={currenciesUsed} icon="currency_exchange" sub={`dari ${CURRENCIES.length} didukung`} compact delay={280} />
        </section>

        {/* Bento row 1: currency volume + status mix */}
        <section className="mb-4 grid gap-4 lg:grid-cols-3">
          <BentoCard eyebrow="Geografi · Currency" title="Transaksi per Mata Uang" className="lg:col-span-2" delay={0}>
            <div className="space-y-3">
              {analytics.currencyBars.map(([cur, count], i) => (
                <ProgressBar
                  key={cur}
                  label={`${CURRENCY_SYMBOLS[cur] ?? ""} ${cur}`}
                  pct={(count / analytics.maxCurrency) * 100}
                  rightLabel={`${count} tx`}
                  color="var(--color-accent)"
                  delay={i * 90}
                  labelWidth={96}
                />
              ))}
            </div>
            <div className="mt-5 flex items-center justify-between border-t border-[var(--color-line)]/80 pt-4">
              <div>
                <p className="studio-eyebrow text-[8px] text-[var(--color-fg-dim)]">Total Volume IDR (Berhasil)</p>
                <p className="studio-display mt-1 text-[22px] text-[var(--color-accent)]">{formatAmount(totalIDR, "IDR")}</p>
              </div>
              <span className="studio-eyebrow text-[9px] text-[var(--color-fg-dim)]">Mendukung {CURRENCIES.length} mata uang Asia</span>
            </div>
          </BentoCard>

          <BentoCard eyebrow="Distribusi" title="Status Transaksi" delay={120}>
            <DonutChart data={analytics.statusMix} centerValue={String(MOCK_PAYMENTS.length)} centerLabel="Transaksi" />
          </BentoCard>
        </section>

        {/* Bento row 2: method + summary + health */}
        <section className="mb-8 grid gap-4 lg:grid-cols-3">
          <BentoCard eyebrow="Channel" title="Metode Pembayaran" delay={0}>
            <DonutChart data={analytics.methodMix} centerValue={String(MOCK_PAYMENTS.length)} centerLabel="Total" />
          </BentoCard>

          <BentoCard eyebrow="Ringkasan" title="Volume & Status" delay={120}>
            <div className="space-y-2.5">
              {[
                { label: "Volume IDR (sukses)", value: formatAmount(totalIDR, "IDR"), color: "var(--color-accent)" },
                { label: "Pending", value: String(pendingCount), color: "var(--color-amber)" },
                { label: "Refunded", value: String(analytics.refundedCount), color: "var(--color-steel)" },
                { label: "Failed", value: String(analytics.failedCount), color: analytics.failedCount > 0 ? "var(--color-error)" : "var(--color-fg-muted)" },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between rounded-lg border border-[var(--color-line)]/60 bg-black/30 px-3 py-2.5">
                  <span className="text-[12px] text-[var(--color-fg-muted)]">{row.label}</span>
                  <span className="studio-display text-[14px]" style={{ color: row.color }}>{row.value}</span>
                </div>
              ))}
            </div>
          </BentoCard>

          <BentoCard eyebrow="Kesehatan" title="Tingkat Keberhasilan" delay={240}>
            <div className="flex flex-col items-center justify-center py-4">
              <p className="studio-display text-[48px] leading-none text-[var(--color-success)]">{analytics.successRate}%</p>
              <p className="studio-eyebrow mt-2 text-[8px] text-[var(--color-fg-dim)]">Success Rate</p>
              <div className="mt-5 w-full">
                <ProgressBar label="Sukses" pct={analytics.successRate} rightLabel={`${successCount}/${MOCK_PAYMENTS.length}`} color="var(--color-success)" labelWidth={56} />
              </div>
            </div>
          </BentoCard>
        </section>

        {/* Filter Bar */}
        <div className="reveal-rise mb-6 flex flex-wrap items-end gap-3 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)]/50 p-4">
          <div className="flex-1 min-w-[200px]">
            <label className="mb-1 block studio-eyebrow text-[8px] text-[var(--color-fg-dim)]">Cari</label>
            <input type="text" placeholder="Order, nama, atau ID..." value={search} onChange={(e) => setSearch(e.target.value)} className={cn(inputCls, "w-full")} />
          </div>
          <div className="w-32">
            <label className="mb-1 block studio-eyebrow text-[8px] text-[var(--color-fg-dim)]">Status</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={cn(inputCls, "w-full")}>
              <option value="">Semua</option>
              <option value="success">Success</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
              <option value="disputed">Disputed</option>
            </select>
          </div>
          <div className="w-40">
            <label className="mb-1 block studio-eyebrow text-[8px] text-[var(--color-fg-dim)]">Metode</label>
            <select value={filterMethod} onChange={(e) => setFilterMethod(e.target.value)} className={cn(inputCls, "w-full")}>
              <option value="">Semua</option>
              <option value="midtrans">Midtrans</option>
              <option value="manual_transfer">Manual Transfer</option>
              <option value="bank_transfer">Bank Transfer</option>
            </select>
          </div>
          <div className="w-28">
            <label className="mb-1 block studio-eyebrow text-[8px] text-[var(--color-fg-dim)]">Currency</label>
            <select value={filterCurrency} onChange={(e) => setFilterCurrency(e.target.value)} className={cn(inputCls, "w-full")}>
              <option value="">Semua</option>
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Payment List */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="reveal-rise flex flex-col items-center justify-center rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)]/50 py-16">
              <span className="material-symbols-outlined text-[48px] text-[var(--color-fg-dim)]">search_off</span>
              <h3 className="studio-display mt-4 text-[20px] text-[var(--color-fg)]">Tidak ada pembayaran ditemukan</h3>
            </div>
          ) : filtered.map((payment, idx) => {
            const sc = statusConfig[payment.status];
            const mc = methodConfig[payment.payment_method];
            const isExpanded = expandedId === payment.id;
            return (
              <article key={payment.id} className="studio-card reveal-rise rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)]/50 overflow-hidden" style={{ transitionDelay: `${idx * 40}ms` }}>
                <div className="flex cursor-pointer items-center gap-4 p-5" onClick={() => setExpandedId(isExpanded ? null : payment.id)}>
                  {/* Payment Icon */}
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-[var(--color-line)] bg-black/40">
                    <span className="material-symbols-outlined text-[22px] text-[var(--color-accent)]" style={{ fontVariationSettings: '"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 24' }}>{mc.icon}</span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[11px] text-[var(--color-fg-dim)]">{payment.order_number}</span>
                      <Badge {...sc} />
                      <span className="rounded-full border border-[var(--color-line)] px-2 py-0.5 text-[8px] font-mono text-[var(--color-fg-dim)]">{payment.currency}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[var(--color-fg-muted)]">
                      <span className="font-medium text-[var(--color-fg)]">{payment.user_name}</span>
                      <span>{mc.label}</span>
                      <span>{formatDate(payment.created_at)}</span>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="text-right">
                    <p className="studio-display text-[18px] text-[var(--color-fg)]">{formatAmount(payment.amount, payment.currency)}</p>
                    <p className="text-[9px] text-[var(--color-fg-dim)]">{payment.description}</p>
                  </div>

                  <span className={cn("material-symbols-outlined text-[18px] text-[var(--color-fg-dim)] transition-transform duration-200", isExpanded && "rotate-180")} style={{ fontVariationSettings: '"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20' }}>expand_more</span>
                </div>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div className="border-t border-[var(--color-line)] bg-black/20 px-5 py-5">
                    <div className="grid gap-6 lg:grid-cols-3">
                      {/* Transaction Details */}
                      <div>
                        <p className="studio-eyebrow text-[8px] text-[var(--color-fg-dim)] mb-3">Detail Transaksi</p>
                        <div className="space-y-2 text-[12px]">
                          <div className="flex items-center justify-between rounded-lg border border-[var(--color-line)]/60 bg-black/30 px-3 py-2">
                            <span className="text-[var(--color-fg-muted)]">Payment ID</span>
                            <span className="font-mono text-[10px] text-[var(--color-fg)]">{payment.public_id}</span>
                          </div>
                          <div className="flex items-center justify-between rounded-lg border border-[var(--color-line)]/60 bg-black/30 px-3 py-2">
                            <span className="text-[var(--color-fg-muted)]">Gateway Ref</span>
                            <span className="font-mono text-[10px] text-[var(--color-fg)]">{payment.gateway_ref ?? "—"}</span>
                          </div>
                          <div className="flex items-center justify-between rounded-lg border border-[var(--color-line)]/60 bg-black/30 px-3 py-2">
                            <span className="text-[var(--color-fg-muted)]">Dibayar</span>
                            <span className="text-[10px] text-[var(--color-fg)]">{formatDate(payment.paid_at)}</span>
                          </div>
                          <div className="flex items-center justify-between rounded-lg border border-[var(--color-line)]/60 bg-black/30 px-3 py-2">
                            <span className="text-[var(--color-fg-muted)]">Customer</span>
                            <span className="text-[10px] text-[var(--color-fg)]">{payment.user_email}</span>
                          </div>
                        </div>
                      </div>

                      {/* Timeline */}
                      <div>
                        <p className="studio-eyebrow text-[8px] text-[var(--color-fg-dim)] mb-3">Timeline</p>
                        <div className="space-y-3">
                          {[
                            { time: formatDate(payment.created_at), event: "Invoice dibuat", icon: "receipt", color: "var(--color-fg-muted)" },
                            payment.paid_at && { time: formatDate(payment.paid_at), event: "Pembayaran diterima", icon: "check_circle", color: "var(--color-success)" },
                            payment.status === "refunded" && { time: formatDate(payment.paid_at), event: "Refund diproses", icon: "undo", color: "var(--color-steel)" },
                            payment.status === "disputed" && { time: formatDate(payment.paid_at), event: "Dispute diajukan", icon: "gavel", color: "var(--color-magenta)" },
                          ].filter(Boolean).map((step, i) => (
                            <div key={i} className="flex items-center gap-2 text-[11px]">
                              <span className="material-symbols-outlined text-[14px]" style={{ color: (step as { color: string }).color, fontVariationSettings: '"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20' }}>{(step as { icon: string }).icon}</span>
                              <span className="text-[var(--color-fg-muted)]">{(step as { event: string }).event}</span>
                              <span className="ml-auto font-mono text-[9px] text-[var(--color-fg-dim)]">{(step as { time: string }).time}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Actions */}
                      <div>
                        <p className="studio-eyebrow text-[8px] text-[var(--color-fg-dim)] mb-3">Aksi</p>
                        <div className="space-y-2">
                          {payment.status === "success" && (
                            <button className="flex w-full items-center gap-2 rounded-lg border border-[var(--color-steel)]/20 bg-[rgba(122,150,177,0.08)] px-3 py-2 text-[12px] font-medium text-[var(--color-steel)] transition-colors hover:bg-[rgba(122,150,177,0.15)]">
                              <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: '"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20' }}>undo</span>
                              Proses Refund
                            </button>
                          )}
                          {payment.status === "disputed" && (
                            <>
                              <button className="flex w-full items-center gap-2 rounded-lg border border-[var(--color-success)]/20 bg-[rgba(108,232,166,0.08)] px-3 py-2 text-[12px] font-medium text-[var(--color-success)] transition-colors hover:bg-[rgba(108,232,166,0.15)]">
                                <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: '"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20' }}>check_circle</span>
                                Resolve Dispute (Favor Customer)
                              </button>
                              <button className="flex w-full items-center gap-2 rounded-lg border border-[var(--color-error)]/20 bg-[rgba(255,122,122,0.08)] px-3 py-2 text-[12px] font-medium text-[var(--color-error)] transition-colors hover:bg-[rgba(255,122,122,0.15)]">
                                <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: '"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20' }}>cancel</span>
                                Reject Dispute
                              </button>
                            </>
                          )}
                          {payment.status === "pending" && (
                            <button className="flex w-full items-center gap-2 rounded-lg border border-[var(--color-accent)]/20 bg-[var(--color-accent-soft)] px-3 py-2 text-[12px] font-medium text-[var(--color-accent)] transition-colors hover:bg-[var(--color-accent)]/20">
                              <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: '"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20' }}>send</span>
                              Kirim Reminder
                            </button>
                          )}
                          <button className="flex w-full items-center gap-2 rounded-lg border border-[var(--color-line)] px-3 py-2 text-[12px] font-medium text-[var(--color-fg-muted)] transition-colors hover:bg-white/[0.03]">
                            <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: '"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20' }}>visibility</span>
                            Lihat Invoice
                          </button>
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
          <span className="studio-eyebrow text-[9px] text-[var(--color-fg-dim)]">{filtered.length} transaksi ditampilkan · {MOCK_PAYMENTS.length} total</span>
        </footer>
      </div>
    </RevealOnScroll>
  );
}
