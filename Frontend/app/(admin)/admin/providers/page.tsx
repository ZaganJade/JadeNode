"use client";

import { useMemo, useState } from "react";
import { RevealOnScroll } from "@/components/landing/reveal-on-scroll";
import { cn } from "@/lib/utils";
import {
  PageHeader,
  StatCard,
  BentoCard,
  AreaChart,
  DonutChart,
  ProgressBar,
  slaColor,
} from "@/components/admin/studio-ui";

/* ═══════════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════════ */

type ProviderStatus = "active" | "inactive" | "suspended";
type VerificationStatus = "verified" | "pending" | "rejected";

interface ProviderRegion {
  city: string;
  country: string;
  nodes: number;
  status: "online" | "degraded" | "offline";
}

interface Provider {
  id: number;
  public_id: string;
  name: string;
  slug: string;
  status: ProviderStatus;
  verification_status: VerificationStatus;
  country: string;
  region_coverage: string;
  datacenters: ProviderRegion[];
  total_nodes: number;
  uptime_30d: number;
  sla_compliance: number;
  contact_email: string;
  api_endpoint: string;
  is_first_party: boolean;
  listings_count: number;
  joined_at: string;
}

/* ═══════════════════════════════════════════════════════════════════════
   ASIA REGION DATA — comprehensive for Country class scope
   ═══════════════════════════════════════════════════════════════════════ */

const ASIA_COUNTRIES = [
  { code: "ID", name: "Indonesia", cities: ["Jakarta", "Surabaya", "Bandung"] },
  { code: "SG", name: "Singapore", cities: ["Singapore"] },
  { code: "MY", name: "Malaysia", cities: ["Kuala Lumpur"] },
  { code: "TH", name: "Thailand", cities: ["Bangkok"] },
  { code: "VN", name: "Vietnam", cities: ["Ho Chi Minh", "Hanoi"] },
  { code: "PH", name: "Philippines", cities: ["Manila"] },
  { code: "JP", name: "Japan", cities: ["Tokyo", "Osaka"] },
  { code: "KR", name: "South Korea", cities: ["Seoul"] },
  { code: "IN", name: "India", cities: ["Mumbai", "Chennai", "Bangalore"] },
  { code: "HK", name: "Hong Kong", cities: ["Hong Kong"] },
  { code: "TW", name: "Taiwan", cities: ["Taipei"] },
  { code: "AE", name: "UAE", cities: ["Dubai"] },
];

const REGION_OPTIONS = ["Southeast Asia", "East Asia", "South Asia", "Middle East", "Multi-Region"];

/* ═══════════════════════════════════════════════════════════════════════
   MOCK DATA — 12 providers across Asia
   ═══════════════════════════════════════════════════════════════════════ */

const MOCK_PROVIDERS: Provider[] = [
  {
    id: 1, public_id: "PRV-01HJKTA7", name: "AlphaCloud Indonesia", slug: "alphacloud-id",
    status: "active", verification_status: "verified", country: "Indonesia", region_coverage: "Southeast Asia",
    datacenters: [
      { city: "Jakarta", country: "ID", nodes: 86, status: "online" },
      { city: "Surabaya", country: "ID", nodes: 42, status: "online" },
      { city: "Bandung", country: "ID", nodes: 18, status: "online" },
    ],
    total_nodes: 146, uptime_30d: 99.97, sla_compliance: 99.8,
    contact_email: "ops@alphacloud.id", api_endpoint: "https://api.alphacloud.id/v1",
    is_first_party: true, listings_count: 24, joined_at: "2024-03-15",
  },
  {
    id: 2, public_id: "PRV-01HSGP42", name: "SingNet Cloud", slug: "singnet-cloud",
    status: "active", verification_status: "verified", country: "Singapore", region_coverage: "Southeast Asia",
    datacenters: [
      { city: "Singapore", country: "SG", nodes: 112, status: "online" },
    ],
    total_nodes: 112, uptime_30d: 99.99, sla_compliance: 99.9,
    contact_email: "noc@singnetcloud.sg", api_endpoint: "https://api.singnetcloud.sg/v1",
    is_first_party: false, listings_count: 18, joined_at: "2024-05-22",
  },
  {
    id: 3, public_id: "PRV-01HMYK29", name: "MyTera Hosting", slug: "mytera-my",
    status: "active", verification_status: "verified", country: "Malaysia", region_coverage: "Southeast Asia",
    datacenters: [
      { city: "Kuala Lumpur", country: "MY", nodes: 64, status: "online" },
    ],
    total_nodes: 64, uptime_30d: 99.92, sla_compliance: 98.7,
    contact_email: "support@mytera.my", api_endpoint: "https://api.mytera.my/v1",
    is_first_party: false, listings_count: 12, joined_at: "2024-08-10",
  },
  {
    id: 4, public_id: "PRV-01HTHA8", name: "ThaiCloud Asia", slug: "thicloud-th",
    status: "active", verification_status: "verified", country: "Thailand", region_coverage: "Southeast Asia",
    datacenters: [
      { city: "Bangkok", country: "TH", nodes: 54, status: "online" },
    ],
    total_nodes: 54, uptime_30d: 99.88, sla_compliance: 97.2,
    contact_email: "noc@thicloud.th", api_endpoint: "https://api.thicloud.th/v1",
    is_first_party: false, listings_count: 8, joined_at: "2024-09-01",
  },
  {
    id: 5, public_id: "PRV-01HVNA3", name: "VNDCloud", slug: "vndcloud-vn",
    status: "active", verification_status: "pending", country: "Vietnam", region_coverage: "Southeast Asia",
    datacenters: [
      { city: "Ho Chi Minh", country: "VN", nodes: 38, status: "online" },
      { city: "Hanoi", country: "VN", nodes: 22, status: "degraded" },
    ],
    total_nodes: 60, uptime_30d: 98.45, sla_compliance: 94.1,
    contact_email: "ops@vndcloud.vn", api_endpoint: "https://api.vndcloud.vn/v1",
    is_first_party: false, listings_count: 6, joined_at: "2025-01-15",
  },
  {
    id: 6, public_id: "PRV-01HPHA9", name: "PhilServer Corp", slug: "philserver-ph",
    status: "active", verification_status: "pending", country: "Philippines", region_coverage: "Southeast Asia",
    datacenters: [
      { city: "Manila", country: "PH", nodes: 32, status: "online" },
    ],
    total_nodes: 32, uptime_30d: 99.10, sla_compliance: 96.3,
    contact_email: "admin@philserver.ph", api_endpoint: "https://api.philserver.ph/v1",
    is_first_party: false, listings_count: 5, joined_at: "2025-02-20",
  },
  {
    id: 7, public_id: "PRV-01HJPA1", name: "SakuraNet Japan", slug: "sakuranet-jp",
    status: "active", verification_status: "verified", country: "Japan", region_coverage: "East Asia",
    datacenters: [
      { city: "Tokyo", country: "JP", nodes: 148, status: "online" },
      { city: "Osaka", country: "JP", nodes: 64, status: "online" },
    ],
    total_nodes: 212, uptime_30d: 99.99, sla_compliance: 99.95,
    contact_email: "noc@sakuranet.jp", api_endpoint: "https://api.sakuranet.jp/v1",
    is_first_party: false, listings_count: 32, joined_at: "2024-01-10",
  },
  {
    id: 8, public_id: "PRV-01HKRA5", name: "SeoulByte Infra", slug: "seoulbyte-kr",
    status: "active", verification_status: "verified", country: "South Korea", region_coverage: "East Asia",
    datacenters: [
      { city: "Seoul", country: "KR", nodes: 96, status: "online" },
    ],
    total_nodes: 96, uptime_30d: 99.98, sla_compliance: 99.7,
    contact_email: "ops@seoulbyte.kr", api_endpoint: "https://api.seoulbyte.kr/v1",
    is_first_party: false, listings_count: 14, joined_at: "2024-06-18",
  },
  {
    id: 9, public_id: "PRV-01HINA7", name: "BharatCloud", slug: "bharatcloud-in",
    status: "active", verification_status: "verified", country: "India", region_coverage: "South Asia",
    datacenters: [
      { city: "Mumbai", country: "IN", nodes: 124, status: "online" },
      { city: "Chennai", country: "IN", nodes: 56, status: "online" },
      { city: "Bangalore", country: "IN", nodes: 78, status: "online" },
    ],
    total_nodes: 258, uptime_30d: 99.94, sla_compliance: 99.2,
    contact_email: "noc@bharatcloud.in", api_endpoint: "https://api.bharatcloud.in/v1",
    is_first_party: false, listings_count: 22, joined_at: "2024-04-05",
  },
  {
    id: 10, public_id: "PRV-01HHKA2", name: "DragonCloud HK", slug: "dragoncloud-hk",
    status: "active", verification_status: "verified", country: "Hong Kong", region_coverage: "East Asia",
    datacenters: [
      { city: "Hong Kong", country: "HK", nodes: 88, status: "online" },
    ],
    total_nodes: 88, uptime_30d: 99.96, sla_compliance: 99.5,
    contact_email: "ops@dragoncloud.hk", api_endpoint: "https://api.dragoncloud.hk/v1",
    is_first_party: false, listings_count: 16, joined_at: "2024-07-12",
  },
  {
    id: 11, public_id: "PRV-01HTWA4", name: "FormosaNet", slug: "formosanet-tw",
    status: "inactive", verification_status: "rejected", country: "Taiwan", region_coverage: "East Asia",
    datacenters: [
      { city: "Taipei", country: "TW", nodes: 44, status: "offline" },
    ],
    total_nodes: 44, uptime_30d: 0, sla_compliance: 0,
    contact_email: "admin@formosanet.tw", api_endpoint: "https://api.formosanet.tw/v1",
    is_first_party: false, listings_count: 0, joined_at: "2025-03-01",
  },
  {
    id: 12, public_id: "PRV-01HUAE6", name: "GulfStack Technologies", slug: "gulfstack-ae",
    status: "active", verification_status: "pending", country: "UAE", region_coverage: "Middle East",
    datacenters: [
      { city: "Dubai", country: "AE", nodes: 72, status: "online" },
    ],
    total_nodes: 72, uptime_30d: 99.91, sla_compliance: 98.4,
    contact_email: "noc@gulfstack.ae", api_endpoint: "https://api.gulfstack.ae/v1",
    is_first_party: false, listings_count: 10, joined_at: "2025-04-20",
  },
];

/* ═══════════════════════════════════════════════════════════════════════
   STATUS CONFIGS
   ═══════════════════════════════════════════════════════════════════════ */

const statusConfig: Record<ProviderStatus, { label: string; color: string; bg: string; border: string }> = {
  active: { label: "Active", color: "var(--color-success)", bg: "rgba(108,232,166,0.08)", border: "rgba(108,232,166,0.15)" },
  inactive: { label: "Inactive", color: "var(--color-fg-dim)", bg: "rgba(255,255,255,0.03)", border: "rgba(255,255,255,0.06)" },
  suspended: { label: "Suspended", color: "var(--color-error)", bg: "rgba(255,122,122,0.08)", border: "rgba(255,122,122,0.15)" },
};

const verificationConfig: Record<VerificationStatus, { label: string; color: string; bg: string; border: string }> = {
  verified: { label: "Verified", color: "var(--color-success)", bg: "rgba(108,232,166,0.08)", border: "rgba(108,232,166,0.15)" },
  pending: { label: "Pending", color: "var(--color-amber)", bg: "rgba(245,179,71,0.08)", border: "rgba(245,179,71,0.15)" },
  rejected: { label: "Rejected", color: "var(--color-error)", bg: "rgba(255,122,122,0.08)", border: "rgba(255,122,122,0.15)" },
};

const dcStatusConfig: Record<string, { color: string }> = {
  online: { color: "var(--color-success)" },
  degraded: { color: "var(--color-amber)" },
  offline: { color: "var(--color-error)" },
};

const REGION_BAR_COLORS = ["var(--color-accent)", "var(--color-steel)", "var(--color-magenta)", "var(--color-amber)", "var(--color-success)"];

function Badge({ label, color, bg, border }: { label: string; color: string; bg: string; border: string }) {
  return (
    <span className="rounded-full border px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider" style={{ color, backgroundColor: bg, borderColor: border }}>
      {label}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════════════ */

export default function AdminProvidersPage() {
  const [search, setSearch] = useState("");
  const [filterCountry, setFilterCountry] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterVerification, setFilterVerification] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Filter logic
  const filtered = MOCK_PROVIDERS.filter((p) => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.slug.includes(search.toLowerCase())) return false;
    if (filterCountry && p.country !== filterCountry) return false;
    if (filterStatus && p.status !== filterStatus) return false;
    if (filterVerification && p.verification_status !== filterVerification) return false;
    return true;
  });

  // Derived analytics (the landing's bento data-viz, grounded in provider data)
  const analytics = useMemo(() => {
    const totalNodes = MOCK_PROVIDERS.reduce((s, p) => s + p.total_nodes, 0);
    const activeList = MOCK_PROVIDERS.filter((p) => p.status === "active");
    const activeCount = activeList.length;
    const verifiedCount = MOCK_PROVIDERS.filter((p) => p.verification_status === "verified").length;
    const avgUptime = activeList.reduce((s, p) => s + p.uptime_30d, 0) / (activeCount || 1);

    const regionMap = new Map<string, number>();
    for (const p of MOCK_PROVIDERS) regionMap.set(p.region_coverage, (regionMap.get(p.region_coverage) ?? 0) + p.total_nodes);
    const regions = [...regionMap.entries()].sort((a, b) => b[1] - a[1]);

    const verifMix = (["verified", "pending", "rejected"] as VerificationStatus[]).map((v) => ({
      label: verificationConfig[v].label,
      value: MOCK_PROVIDERS.filter((p) => p.verification_status === v).length,
      color: verificationConfig[v].color,
    }));

    const statusMix = (["active", "inactive", "suspended"] as ProviderStatus[]).map((s) => ({
      label: statusConfig[s].label,
      value: MOCK_PROVIDERS.filter((p) => p.status === s).length,
      color: statusConfig[s].color,
    })).filter((s) => s.value > 0);

    const slaTop = [...MOCK_PROVIDERS]
      .filter((p) => p.sla_compliance > 0)
      .sort((a, b) => b.sla_compliance - a.sla_compliance)
      .slice(0, 6);

    const fleetSeries = [612, 668, 712, 781, 842, 905, 974, 1042, 1108, 1176, 1228, totalNodes];

    return { totalNodes, activeCount, verifiedCount, avgUptime, regions, verifMix, statusMix, slaTop, fleetSeries };
  }, []);

  const fleetLabels = ["Jul", "", "Sep", "", "Nov", "", "Jan", "", "Mar", "", "Mei", "Jun"];
  const inputCls = "rounded-lg border border-[var(--color-line)] bg-black/40 px-3 py-2 text-[13px] text-[var(--color-fg)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]/20";

  return (
    <RevealOnScroll>
      <div className="relative mx-auto w-full max-w-[1320px] px-6 py-8">
        {/* Header */}
        <PageHeader
          eyebrow="Provider Management"
          title="Infrastruktur Provider"
          subtitle="Kelola provider infrastruktur di seluruh Asia — verifikasi, monitoring kapasitas, dan kepatuhan SLA dalam satu kanvas."
          status={`${MOCK_PROVIDERS.length} provider · ${analytics.totalNodes.toLocaleString("id-ID")} node`}
        />

        {/* KPI grid */}
        <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Provider" value={MOCK_PROVIDERS.length} icon="business" sub={`${analytics.activeCount} aktif`} trend="up" trendValue="+2" delay={0} />
          <StatCard label="Total Node" value={analytics.totalNodes.toLocaleString("id-ID")} icon="dns" sub="di 12 negara" accent trend="up" trendValue="+12.4%" delay={80} />
          <StatCard label="Avg Uptime" value={`${analytics.avgUptime.toFixed(2)}%`} icon="speed" sub="30 hari · provider aktif" trend="flat" trendValue="0%" delay={160} />
          <StatCard label="Verified" value={analytics.verifiedCount} icon="verified" sub="Lolos due-diligence" accent trend="up" trendValue="+1" delay={240} />
        </section>

        {/* Bento row 1: fleet growth + verification donut */}
        <section className="mb-4 grid gap-4 lg:grid-cols-3">
          <BentoCard eyebrow="Kapasitas · 12 bulan" title="Pertumbuhan Fleet Node" className="lg:col-span-2" delay={0}>
            <AreaChart values={analytics.fleetSeries} height={170} labels={fleetLabels} />
            <div className="mt-5 grid grid-cols-3 gap-4 border-t border-[var(--color-line)]/80 pt-4">
              <div>
                <p className="studio-eyebrow text-[8px] text-[var(--color-fg-dim)]">Node Sekarang</p>
                <p className="studio-display mt-1 text-[18px] text-[var(--color-accent)]">{analytics.totalNodes.toLocaleString("id-ID")}</p>
              </div>
              <div>
                <p className="studio-eyebrow text-[8px] text-[var(--color-fg-dim)]">12 Bulan Lalu</p>
                <p className="studio-display mt-1 text-[18px] text-[var(--color-fg-muted)]">612</p>
              </div>
              <div>
                <p className="studio-eyebrow text-[8px] text-[var(--color-fg-dim)]">Pertumbuhan</p>
                <p className="studio-display mt-1 text-[18px] text-[var(--color-success)]">+{Math.round(((analytics.totalNodes - 612) / 612) * 100)}%</p>
              </div>
            </div>
          </BentoCard>

          <BentoCard eyebrow="Compliance" title="Status Verifikasi" delay={120}>
            <DonutChart data={analytics.verifMix} centerValue={String(analytics.verifiedCount)} centerLabel="Verified" />
          </BentoCard>
        </section>

        {/* Bento row 2: region distribution + SLA + status mix */}
        <section className="mb-8 grid gap-4 lg:grid-cols-3">
          <BentoCard eyebrow="Geografi" title="Distribusi Node / Region" delay={0}>
            <div className="space-y-3">
              {analytics.regions.map(([region, nodes], i) => (
                <ProgressBar
                  key={region}
                  label={region}
                  pct={(nodes / analytics.totalNodes) * 100}
                  rightLabel={String(nodes)}
                  color={REGION_BAR_COLORS[i % REGION_BAR_COLORS.length]}
                  delay={i * 120}
                  labelWidth={118}
                />
              ))}
            </div>
          </BentoCard>

          <BentoCard eyebrow="Reliability" title="SLA Compliance — Top" delay={120}>
            <div className="space-y-3">
              {analytics.slaTop.map((p, i) => (
                <ProgressBar
                  key={p.id}
                  label={p.name}
                  pct={p.sla_compliance}
                  rightLabel={`${p.sla_compliance}%`}
                  color={slaColor(p.sla_compliance)}
                  delay={i * 100}
                  labelWidth={118}
                />
              ))}
            </div>
          </BentoCard>

          <BentoCard eyebrow="Fleet" title="Status Provider" delay={240}>
            <DonutChart data={analytics.statusMix} centerValue={String(MOCK_PROVIDERS.length)} centerLabel="Providers" />
          </BentoCard>
        </section>

        {/* Filter Bar */}
        <div className="reveal-rise mb-6 flex flex-wrap items-end gap-3 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)]/50 p-4">
          <div className="flex-1 min-w-[200px]">
            <label className="mb-1 block studio-eyebrow text-[8px] text-[var(--color-fg-dim)]">Cari</label>
            <input type="text" placeholder="Nama provider..." value={search} onChange={(e) => setSearch(e.target.value)} className={cn(inputCls, "w-full")} />
          </div>
          <div className="w-44">
            <label className="mb-1 block studio-eyebrow text-[8px] text-[var(--color-fg-dim)]">Negara</label>
            <select value={filterCountry} onChange={(e) => setFilterCountry(e.target.value)} className={cn(inputCls, "w-full")}>
              <option value="">Semua</option>
              {ASIA_COUNTRIES.map((c) => <option key={c.code} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          <div className="w-36">
            <label className="mb-1 block studio-eyebrow text-[8px] text-[var(--color-fg-dim)]">Status</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={cn(inputCls, "w-full")}>
              <option value="">Semua</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
          <div className="w-40">
            <label className="mb-1 block studio-eyebrow text-[8px] text-[var(--color-fg-dim)]">Verifikasi</label>
            <select value={filterVerification} onChange={(e) => setFilterVerification(e.target.value)} className={cn(inputCls, "w-full")}>
              <option value="">Semua</option>
              <option value="verified">Verified</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Provider List */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="reveal-rise flex flex-col items-center justify-center rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)]/50 py-16">
              <span className="material-symbols-outlined text-[48px] text-[var(--color-fg-dim)]">search_off</span>
              <h3 className="studio-display mt-4 text-[20px] text-[var(--color-fg)]">Tidak ada provider ditemukan</h3>
              <p className="mt-2 text-[13px] text-[var(--color-fg-muted)]">Coba ubah filter pencarian.</p>
            </div>
          ) : filtered.map((provider, idx) => {
            const isExpanded = expandedId === provider.id;
            const sc = statusConfig[provider.status];
            const vc = verificationConfig[provider.verification_status];
            return (
              <article
                key={provider.id}
                className="studio-card reveal-rise rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)]/50 overflow-hidden"
                style={{ transitionDelay: `${idx * 50}ms` }}
              >
                {/* Main Row */}
                <div
                  className="flex cursor-pointer items-center gap-4 p-5"
                  onClick={() => setExpandedId(isExpanded ? null : provider.id)}
                >
                  {/* Provider Icon */}
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-[var(--color-line)] bg-black/40">
                    <span className="material-symbols-outlined text-[24px] text-[var(--color-accent)]" style={{ fontVariationSettings: '"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 24' }}>business</span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-[15px] font-semibold text-[var(--color-fg)] truncate">{provider.name}</h3>
                      <Badge {...sc} />
                      <Badge {...vc} />
                      {provider.is_first_party && (
                        <span className="rounded-full border border-[var(--color-accent)]/20 bg-[var(--color-accent)]/5 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-wider text-[var(--color-accent)]">First Party</span>
                      )}
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[var(--color-fg-muted)]">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: '"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20' }}>public</span>
                        {provider.country}
                      </span>
                      <span>{provider.region_coverage}</span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: '"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20' }}>dns</span>
                        {provider.total_nodes} node
                      </span>
                      <span className="font-mono">{provider.uptime_30d}% uptime</span>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="hidden sm:flex items-center gap-6">
                    <div className="text-right">
                      <p className="studio-display text-[18px] text-[var(--color-fg)]">{provider.listings_count}</p>
                      <p className="studio-eyebrow text-[7px] text-[var(--color-fg-dim)]">LISTING</p>
                    </div>
                    <div className="text-right">
                      <p className="studio-display text-[18px]" style={{ color: provider.sla_compliance >= 99 ? "var(--color-success)" : provider.sla_compliance >= 95 ? "var(--color-amber)" : "var(--color-error)" }}>{provider.sla_compliance}%</p>
                      <p className="studio-eyebrow text-[7px] text-[var(--color-fg-dim)]">SLA</p>
                    </div>
                  </div>

                  {/* Expand Arrow */}
                  <span className={cn("material-symbols-outlined text-[18px] text-[var(--color-fg-dim)] transition-transform duration-200", isExpanded && "rotate-180")} style={{ fontVariationSettings: '"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20' }}>expand_more</span>
                </div>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div className="border-t border-[var(--color-line)] bg-black/20 px-5 py-5">
                    <div className="grid gap-6 lg:grid-cols-3">
                      {/* Contact & API */}
                      <div>
                        <p className="studio-eyebrow text-[8px] text-[var(--color-fg-dim)] mb-3">Kontak & API</p>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-[12px] text-[var(--color-fg-muted)]">
                            <span className="material-symbols-outlined text-[14px] text-[var(--color-fg-dim)]" style={{ fontVariationSettings: '"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20' }}>mail</span>
                            <span className="font-mono text-[11px]">{provider.contact_email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[12px] text-[var(--color-fg-muted)]">
                            <span className="material-symbols-outlined text-[14px] text-[var(--color-fg-dim)]" style={{ fontVariationSettings: '"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20' }}>api</span>
                            <span className="font-mono text-[11px]">{provider.api_endpoint}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[12px] text-[var(--color-fg-muted)]">
                            <span className="material-symbols-outlined text-[14px] text-[var(--color-fg-dim)]" style={{ fontVariationSettings: '"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20' }}>calendar_today</span>
                            <span>Bergabung: {new Date(provider.joined_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</span>
                          </div>
                        </div>
                      </div>

                      {/* Datacenter Nodes */}
                      <div>
                        <p className="studio-eyebrow text-[8px] text-[var(--color-fg-dim)] mb-3">Datacenter & Node</p>
                        <div className="space-y-2">
                          {provider.datacenters.map((dc) => (
                            <div key={dc.city} className="flex items-center justify-between rounded-lg border border-[var(--color-line)]/60 bg-black/30 px-3 py-2">
                              <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full" style={{ background: dcStatusConfig[dc.status]?.color ?? "var(--color-fg-dim)" }} />
                                <span className="text-[12px] font-medium text-[var(--color-fg)]">{dc.city}</span>
                                <span className="font-mono text-[9px] text-[var(--color-fg-dim)]">{dc.country}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="studio-display text-[14px] text-[var(--color-fg)]">{dc.nodes}</span>
                                <span className="text-[9px] text-[var(--color-fg-dim)]">node</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Actions */}
                      <div>
                        <p className="studio-eyebrow text-[8px] text-[var(--color-fg-dim)] mb-3">Aksi</p>
                        <div className="space-y-2">
                          {provider.verification_status === "pending" && (
                            <>
                              <button className="flex w-full items-center gap-2 rounded-lg border border-[var(--color-success)]/20 bg-[rgba(108,232,166,0.08)] px-3 py-2 text-[12px] font-medium text-[var(--color-success)] transition-colors hover:bg-[rgba(108,232,166,0.15)]">
                                <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: '"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20' }}>check_circle</span>
                                Approve Verifikasi
                              </button>
                              <button className="flex w-full items-center gap-2 rounded-lg border border-[var(--color-error)]/20 bg-[rgba(255,122,122,0.08)] px-3 py-2 text-[12px] font-medium text-[var(--color-error)] transition-colors hover:bg-[rgba(255,122,122,0.15)]">
                                <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: '"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20' }}>cancel</span>
                                Tolak Verifikasi
                              </button>
                            </>
                          )}
                          {provider.status === "active" && (
                            <button className="flex w-full items-center gap-2 rounded-lg border border-[var(--color-amber)]/20 bg-[rgba(245,179,71,0.08)] px-3 py-2 text-[12px] font-medium text-[var(--color-amber)] transition-colors hover:bg-[rgba(245,179,71,0.15)]">
                              <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: '"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20' }}>block</span>
                              Suspend Provider
                            </button>
                          )}
                          {provider.status === "suspended" && (
                            <button className="flex w-full items-center gap-2 rounded-lg border border-[var(--color-success)]/20 bg-[rgba(108,232,166,0.08)] px-3 py-2 text-[12px] font-medium text-[var(--color-success)] transition-colors hover:bg-[rgba(108,232,166,0.15)]">
                              <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: '"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20' }}>play_circle</span>
                              Aktivasi Ulang
                            </button>
                          )}
                          {provider.status === "inactive" && (
                            <button className="flex w-full items-center gap-2 rounded-lg border border-[var(--color-accent)]/20 bg-[var(--color-accent-soft)] px-3 py-2 text-[12px] font-medium text-[var(--color-accent)] transition-colors hover:bg-[var(--color-accent)]/20">
                              <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: '"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20' }}>power_settings_new</span>
                              Activate Provider
                            </button>
                          )}
                          <button className="flex w-full items-center gap-2 rounded-lg border border-[var(--color-line)] px-3 py-2 text-[12px] font-medium text-[var(--color-fg-muted)] transition-colors hover:bg-white/[0.03]">
                            <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: '"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20' }}>visibility</span>
                            Lihat Detail
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

        {/* Footer */}
        <footer className="mt-8 border-t border-[var(--color-line)]/70 py-4">
          <div className="flex items-center justify-between">
            <span className="studio-eyebrow text-[9px] text-[var(--color-fg-dim)]">
              {filtered.length} provider ditampilkan · {MOCK_PROVIDERS.length} total
            </span>
            <span className="flex items-center gap-2 text-[11px] text-[var(--color-fg-muted)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-success)]" />
              {ASIA_COUNTRIES.length} negara tercakup
            </span>
          </div>
        </footer>
      </div>
    </RevealOnScroll>
  );
}
