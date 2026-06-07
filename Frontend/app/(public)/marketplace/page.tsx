"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { RevealOnScroll } from "@/components/landing/reveal-on-scroll";
import { StudioNav } from "@/components/landing/studio/studio-nav";
import { ScrollRail } from "@/components/landing/studio/scroll-rail";
import { NetworkPaths } from "@/components/landing/studio/network-paths";
import { RegionGlobe } from "@/components/landing/studio/region-globe";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";

// ─── Types (match backend ResourceProductResource) ──────────────────────────

interface ProductSpec {
  cpu: string;
  ram: string;
  storage: string;
  [key: string]: string | number | undefined | null;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  resource_type: string; // "Vps" / "Dedicated" (ucfirst from backend)
  region: string;
  specs: ProductSpec;
  price: number;
  billing_cycle: string;
  currency: string;
  availability: "available" | "limited" | "waitlist" | "unavailable";
  provisioning_sla: string;
  image?: string | null;
  provider: {
    name: string;
    verified: boolean;
  };
}

interface ListingResponse {
  data: Product[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

// ─── Static data — Marketplace-scope content (not a copy of the landing) ────

// Time-aware eyebrow line — matches the editorial voice of the landing.
// Kept as a server-deterministic value (no Date.now) so SSR == client
// for the static label. The visible live clock below is hydrated on the
// client only.
const GREETING_EYEBROW = "Marketplace · katalog publik terbuka";

const QUICK_FACTS = [
  { value: "5+", label: "Listing aktif" },
  { value: "2", label: "Resource type" },
  { value: "12–48", label: "Provisioning SLA" },
];

const ADDON_TYPES = [
  {
    icon: "backup",
    name: "Backup Plan",
    desc: "Snapshot terjadwal untuk VPS & Dedicated Server yang sudah aktif.",
  },
  {
    icon: "lan",
    name: "Public IP",
    desc: "Tambahan alamat IPv4 publik untuk Deployment yang sudah berjalan.",
  },
];

const DX_FEATURES = [
  { icon: "code", label: "OpenAPI 3.1 contract", value: "REST + Webhooks" },
  { icon: "key", label: "Autentikasi", value: "Sanctum Bearer" },
  { icon: "replay", label: "Idempotency", value: "Idempotency-Key" },
  { icon: "fingerprint", label: "Public IDs", value: "ULID" },
];

const CODE_EXAMPLE = `$ curl https://api.jadenode.id/v1/marketplace/listings \\
  -H "Authorization: Bearer $JN_TOKEN" \\
  -H "Accept: application/json" \\
  -G --data-urlencode "resource_type=vps" \\
     --data-urlencode "region=Jakarta"`;

const FOOTER_COLUMNS = [
  {
    label: "Marketplace",
    items: [
      { text: "Listing VPS", href: "/marketplace?resource_type=vps" },
      { text: "Dedicated Server", href: "/marketplace?resource_type=dedicated" },
      { text: "Add-on (Backup & IP)", href: "#addons" },
      { text: "Provider terverifikasi", href: "#providers" },
    ],
  },
  {
    label: "Customer",
    items: [
      { text: "Order", href: "/customer/orders" },
      { text: "Invoice", href: "/customer/invoices" },
      { text: "Wallet & Top-up", href: "/customer/invoices" },
      { text: "Deployment aktif", href: "/customer/deployments" },
    ],
  },
  {
    label: "Developer",
    items: [
      { text: "API Docs", href: "/docs" },
      { text: "Webhooks", href: "#developers" },
      { text: "Idempotency-Key", href: "#developers" },
      { text: "SDK", href: "#developers" },
    ],
  },
];

// ─── Subcomponents (mirror the landing's editorial language) ────────────────

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="studio-eyebrow text-accent">{children}</p>;
}

// Animated counter — identical timing to the landing
function AnimatedCounter({ value, duration = 1000 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let startTime: number | null = null;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setDisplay(Math.floor(progress * value));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value, duration]);
  return <span>{display.toLocaleString("id-ID")}</span>;
}

// Price formatter (backend returns major unit; e.g. 50000 → Rp 50.000)
function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

// ─── Product image with fallback icon ──────────────────────────────────────
function ProductImage({ src, alt, iconName, isHovered }: { src: string | null | undefined; alt: string; iconName: string; isHovered: boolean }) {
  const [imgError, setImgError] = useState(false);
  const hasImage = src && !imgError;

  return (
    <div className="relative grid aspect-square place-items-center overflow-hidden rounded-xl border border-line/80 bg-gradient-to-br from-white/[0.04] to-transparent">
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{
          background:
            "radial-gradient(60% 60% at 50% 40%, rgba(255,116,0,0.16), transparent 70%)",
          opacity: isHovered ? 0.85 : 0.5,
        }}
      />
      {hasImage ? (
        <img
          src={src}
          alt={alt}
          onError={() => setImgError(true)}
          className="relative h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <span className="material-symbols-outlined relative text-[64px] text-fg/70 transition-transform duration-500 group-hover:scale-110">
          {iconName}
        </span>
      )}
    </div>
  );
}

// ─── Product Card (studio card style, marketplace-scope content) ────────────

function ProductCard({ listing, index }: { listing: Product; index: number }) {
  const [isHovered, setIsHovered] = useState(false);

  // Icon map mirrors the existing landing catalog explorer
  const RESOURCE_ICON: Record<string, string> = {
    vps: "dns",
    dedicated: "developer_board",
    "dedicated server": "developer_board",
    storage: "database",
    network: "lan",
    gpu: "memory",
  };
  const iconName =
    RESOURCE_ICON[listing.resource_type.toLowerCase()] ?? "deployed_code";

  // Availability tone — matches landing catalog (orange for limited, red for sold)
  const tone = (() => {
    if (listing.availability === "limited")
      return { dot: "#ff7400", label: "TERBATAS" };
    if (listing.availability === "waitlist")
      return { dot: "#ffb347", label: "WAITLIST" };
    if (listing.availability === "unavailable")
      return { dot: "#ff7a7a", label: "HABIS" };
    return { dot: "#6ce8a6", label: "TERSEDIA" };
  })();

  // Parse the values to extract numeric parts for the mono label rows
  const cpuValue = listing.specs.cpu;
  const ramValue = listing.specs.ram;
  const storageValue = listing.specs.storage;

  return (
    <article
      className="studio-card group relative flex flex-col rounded-2xl border border-line bg-surface/50 p-3"
      style={{ animationDelay: `${index * 80}ms` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Visual — product image with fallback icon */}
      <ProductImage
        src={listing.image ? `/${listing.image}` : null}
        alt={listing.name}
        iconName={iconName}
        isHovered={isHovered}
      />
        {/* Resource type pill (top-left, mirrors landing cards) */}
        <span className="absolute left-3 top-3 z-10 rounded-md border border-accent/30 bg-accent/10 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-accent">
          {listing.resource_type}
        </span>
        {/* Status dot (top-right) */}
        <span
          className="absolute right-3 top-3 z-10 h-2 w-2 rounded-full"
          style={{
            background: tone.dot,
            boxShadow: `0 0 8px 1px ${tone.dot}`,
          }}
        />

      {/* Body */}
      <div className="flex flex-1 flex-col px-1.5 pt-4">
        {/* Provider + region */}
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-fg-dim">
            {listing.provider.name}
            {listing.provider.verified && (
              <span className="material-symbols-outlined text-[12px] text-accent">
                verified
              </span>
            )}
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-fg-dim">
            {listing.region}
          </p>
        </div>
        <p className="mt-0.5 truncate font-mono text-[11px] uppercase tracking-[0.12em] text-accent">
          {listing.slug}
        </p>
        <h3 className="studio-display mt-2 text-[19px] font-bold leading-tight text-fg">
          {listing.name}
        </h3>
        {listing.description && (
          <p className="mt-1 line-clamp-2 text-[12px] text-fg-muted">
            {listing.description}
          </p>
        )}

        {/* Specs — mono label/value rows */}
        <div className="mt-3 space-y-1.5">
          <div className="flex items-center justify-between font-mono text-[11px]">
            <span className="text-fg-dim">CPU</span>
            <span className="text-fg">{cpuValue}</span>
          </div>
          <div className="flex items-center justify-between font-mono text-[11px]">
            <span className="text-fg-dim">RAM</span>
            <span className="text-fg">{ramValue}</span>
          </div>
          <div className="flex items-center justify-between font-mono text-[11px]">
            <span className="text-fg-dim">Storage</span>
            <span className="text-fg">{storageValue}</span>
          </div>
        </div>

        {/* Footer: price + CTA */}
        <div className="mt-auto pt-4">
          <div className="flex items-center justify-between border-t border-line/80 pt-3">
            <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-fg-muted">
              {tone.label}
            </span>
            <span className="font-mono text-[11px] tabular-nums text-fg">
              {formatRupiah(listing.price)}
              <span className="ml-1 text-fg-dim">
                /{listing.billing_cycle === "monthly" ? "bln" : "thn"}
              </span>
            </span>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Link
              href={listing.availability === "unavailable" ? "#" : `/marketplace/${listing.slug}`}
              className={`group/btn flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border text-[12px] font-semibold transition-all ${
                listing.availability === "unavailable"
                  ? "border-line text-fg-dim cursor-not-allowed"
                  : "border-line-strong text-fg hover:border-accent hover:bg-accent hover:text-accent-fg"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">
                {listing.availability === "unavailable" ? "block" : "arrow_forward"}
              </span>
              {listing.availability === "unavailable" ? "Stok habis" : "Lihat detail"}
            </Link>
            <AddToCartButton
              variant="icon"
              disabled={listing.availability === "unavailable"}
              item={{
                slug: listing.slug,
                name: listing.name,
                image: listing.image ? `/${listing.image}` : null,
                resource_type: listing.resource_type,
                region: listing.region,
                provider: listing.provider,
                specs: listing.specs,
                availability: listing.availability,
                currency: listing.currency,
                pricing: [{ cycle: listing.billing_cycle, price: listing.price }],
                cycle: listing.billing_cycle,
              }}
            />
          </div>
        </div>
      </div>
    </article>
  );
}

// ─── Filter Bar (studio glassy bar) ─────────────────────────────────────────

function FilterBar({
  filters,
  onChange,
  resultCount,
}: {
  filters: {
    search: string;
    resource_type: string;
    region: string;
    billing_cycle: string;
  };
  onChange: (f: typeof filters) => void;
  resultCount: number;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const resourceTypes = [
    { value: "vps", label: "VPS" },
    { value: "dedicated", label: "Dedicated Server" },
  ];

  const regions = [
    { value: "Jakarta", label: "Jakarta" },
    { value: "Singapore", label: "Singapore" },
    { value: "Tokyo", label: "Tokyo" },
  ];

  const billingCycles = [
    { value: "monthly", label: "Bulanan" },
    { value: "yearly", label: "Tahunan" },
  ];

  const activeFilterCount = Object.values(filters).filter((v) => v !== "").length;

  return (
    <div className="sticky top-24 z-40 mb-10">
      <div className="rounded-2xl border border-line/80 bg-surface/70 backdrop-blur-xl">
        {/* Search bar */}
        <div className="p-4 border-b border-line/40">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-fg-dim text-[20px]">
              search
            </span>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => onChange({ ...filters, search: e.target.value })}
              placeholder="Cari listing VPS / Dedicated / provider…"
              className="w-full rounded-xl bg-white/[0.03] border border-line/60 py-3 pl-12 pr-4 text-[13px] text-fg placeholder:text-fg-dim focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all font-mono"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden rounded border border-line-strong px-1.5 py-px font-mono text-[10px] text-fg-muted md:block">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Filter selects */}
        <div className={`${isExpanded ? "block" : "hidden"} p-4 space-y-3`}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                value: filters.resource_type,
                on: (v: string) => onChange({ ...filters, resource_type: v }),
                options: resourceTypes,
                placeholder: "Semua Resource Type",
              },
              {
                value: filters.region,
                on: (v: string) => onChange({ ...filters, region: v }),
                options: regions,
                placeholder: "Semua Region",
              },
              {
                value: filters.billing_cycle,
                on: (v: string) => onChange({ ...filters, billing_cycle: v }),
                options: billingCycles,
                placeholder: "Semua Billing Cycle",
              },
            ].map((sel, i) => (
              <select
                key={i}
                value={sel.value}
                onChange={(e) => sel.on(e.target.value)}
                className="rounded-lg bg-white/[0.03] border border-line/60 px-3 py-2 text-[13px] text-fg focus:border-accent/50 focus:outline-none transition-all font-mono"
              >
                <option value="">{sel.placeholder}</option>
                {sel.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            ))}
          </div>
        </div>

        {/* Toggle + result count */}
        <div className="px-4 py-3 flex items-center justify-between border-t border-line/40">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-[13px] text-fg-muted hover:text-fg transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">tune</span>
            <span>Filter</span>
            {activeFilterCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-md bg-accent/20 text-accent text-[10px] font-medium font-mono">
                {activeFilterCount}
              </span>
            )}
          </button>

          <div className="flex items-center gap-4">
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-fg-dim">
              {resultCount} listing
            </span>
            <button
              onClick={() =>
                onChange({ search: "", resource_type: "", region: "", billing_cycle: "" })
              }
              className="text-[12px] text-fg-muted hover:text-accent transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Product Card Skeleton (matches studio style) ───────────────────────────

function ProductCardSkeleton() {
  return (
    <div className="relative flex flex-col rounded-2xl border border-line/60 bg-surface/50 p-3 animate-pulse">
      <div className="aspect-square w-full rounded-xl border border-line/80 bg-white/[0.04]" />
      <div className="flex flex-1 flex-col px-1.5 pt-4">
        <div className="h-3 w-20 bg-fg-dim/20 rounded mb-2" />
        <div className="h-3 w-32 bg-fg-dim/10 rounded mb-2" />
        <div className="h-5 w-3/4 bg-fg-dim/20 rounded mb-2" />
        <div className="h-3 w-1/2 bg-fg-dim/10 rounded" />
        <div className="mt-auto pt-4">
          <div className="h-px bg-line/80" />
          <div className="h-8 w-full bg-fg-dim/10 rounded-lg mt-3" />
        </div>
      </div>
    </div>
  );
}

// ─── Greetings section (compact, NetworkPaths bg, editorial tone) ───────────

function Greetings() {
  // Client clock (avoid SSR/CSR mismatch by using a placeholder first)
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  function greetingFor(d: Date | null): { word: string; subtitle: string } {
    if (!d) return { word: "Halo.", subtitle: "Marketplace JadeNode" };
    const h = d.getHours();
    if (h >= 4 && h < 11) return { word: "Selamat pagi.", subtitle: "Marketplace JadeNode" };
    if (h >= 11 && h < 15) return { word: "Selamat siang.", subtitle: "Marketplace JadeNode" };
    if (h >= 15 && h < 18) return { word: "Selamat sore.", subtitle: "Marketplace JadeNode" };
    return { word: "Selamat malam.", subtitle: "Marketplace JadeNode" };
  }

  function fmtDate(d: Date | null): string {
    if (!d) return "—";
    return d.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }

  function fmtClock(d: Date | null): string {
    if (!d) return "--:-- WIB";
    return (
      d.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }) + " WIB"
    );
  }

  const g = greetingFor(now);

  return (
    <section
      aria-label="Greetings"
      className="relative isolate overflow-hidden border-b border-line/60"
    >
      {/* Signature NetworkPaths background — identical motif to the landing hero */}
      <div className="studio-streaks-fallback pointer-events-none absolute inset-0 -z-10" />
      <div className="pointer-events-none absolute inset-0 -z-10">
        <NetworkPaths />
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-1/3 bg-gradient-to-b from-transparent to-black" />

      <div className="mx-auto w-full max-w-[1320px] px-6 pt-28 pb-10">
        <div className="grid items-end gap-8 lg:grid-cols-12">
          {/* Left — greeting copy */}
          <div className="lg:col-span-8">
            <div className="flex items-center gap-3">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
              </span>
              <Eyebrow>{GREETING_EYEBROW}</Eyebrow>
            </div>

            <h1 className="studio-hero-title mt-5 text-[clamp(44px,7.2vw,96px)] text-fg">
              {g.word}
              <br />
              <span className="text-accent">Pilih listing-mu</span>
              <br />
              hari ini.
            </h1>

            <p className="mt-7 max-w-xl text-[15px] leading-relaxed text-fg-muted">
              {g.subtitle} adalah titik temu Customer dengan Provider. Cari
              VPS &amp; Dedicated Server, bandingkan spesifikasi &amp;
              harga, lalu lanjut ke order, invoice, dan pembayaran Midtrans —
              semuanya dari satu alur.
            </p>

            <div className="mt-7 flex flex-wrap gap-2">
              {[
                "Midtrans + Wallet aktif",
                "Listing teraudit",
                "Customer support 24/7",
              ].map((chip) => (
                <span
                  key={chip}
                  className="studio-eyebrow inline-flex items-center gap-1.5 rounded-full border border-line bg-white/[0.02] px-3 py-1.5 text-[9px] text-fg-muted backdrop-blur"
                >
                  <span className="h-1 w-1 rounded-full bg-accent" />
                  {chip}
                </span>
              ))}
            </div>
          </div>

          {/* Right — date / clock / quick facts (terminal feel, mirrors API console) */}
          <div className="lg:col-span-4 lg:pb-1">
            <div className="ml-auto max-w-sm overflow-hidden rounded-2xl border border-line bg-surface/60 backdrop-blur">
              <div className="flex items-center justify-between border-b border-line/80 bg-black/40 px-4 py-3">
                <span className="studio-eyebrow flex items-center gap-2 text-[10px] text-fg-muted">
                  <span className="material-symbols-outlined text-[14px]">schedule</span>
                  Sesi
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                  <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                  <span className="h-2.5 w-2.5 rounded-full bg-accent" />
                </span>
              </div>
              <div className="px-5 py-5">
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-fg-dim">
                  {fmtDate(now)}
                </p>
                <p className="studio-display mt-1 text-[40px] leading-none text-fg tabular-nums">
                  {fmtClock(now)}
                </p>
                <div className="mt-5 grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-line/80 bg-line">
                  {QUICK_FACTS.map((q) => (
                    <div
                      key={q.label}
                      className="flex flex-col items-start gap-1 bg-surface/70 px-3 py-3"
                    >
                      <span className="studio-display text-[16px] text-fg">
                        {q.value}
                      </span>
                      <span className="studio-eyebrow text-[8px] text-fg-dim">
                        {q.label}
                      </span>
                    </div>
                  ))}
                </div>
                <a
                  href="#katalog"
                  className="group mt-5 flex h-10 items-center justify-center gap-2 rounded-lg border border-line-strong text-[13px] font-semibold text-fg transition-all hover:border-accent hover:bg-accent hover:text-accent-fg"
                >
                  Lihat listing di bawah
                  <span className="material-symbols-outlined text-[16px] transition-transform duration-300 group-hover:translate-y-0.5">
                    south
                  </span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Main Content (Client) ──────────────────────────────────────────────────

function MarketplaceContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [meta, setMeta] = useState<{
    current_page: number;
    last_page: number;
    total: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: "",
    resource_type: "",
    region: "",
    billing_cycle: "",
  });

  const page = Number(searchParams.get("page") ?? "1");

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page) };
      if (filters.search) params.search = filters.search;
      if (filters.resource_type) params.resource_type = filters.resource_type;
      if (filters.region) params.region = filters.region;
      if (filters.billing_cycle) params.billing_cycle = filters.billing_cycle;

      const queryParams = new URLSearchParams(params).toString();
      const res = await fetch(`/api/v1/marketplace/listings${queryParams ? `?${queryParams}` : ""}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data: ListingResponse = await res.json();
      setProducts(data.data || []);
      setMeta(data.meta);
    } catch (error) {
      console.error("Failed to fetch products:", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  function goToPage(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`/marketplace?${params.toString()}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="relative min-h-screen text-fg">
      <div className="mx-auto max-w-[1320px] px-6 py-10">
        {/* Back Button — same chip style as StudioNav */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-md border border-line/80 bg-surface/50 px-4 py-2 text-[13px] text-fg-muted transition-all duration-300 hover:border-accent hover:text-accent group"
          >
            <span className="material-symbols-outlined text-[16px] transition-transform duration-300 group-hover:-translate-x-0.5">
              arrow_back
            </span>
            <span className="font-mono uppercase tracking-[0.16em] text-[10px]">
              Kembali ke Beranda
            </span>
          </Link>
        </div>

        {/* Filter Bar */}
        <FilterBar
          filters={filters}
          onChange={setFilters}
          resultCount={meta?.total ?? 0}
        />

        {/* Product Grid */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-2xl border border-line bg-surface/40 p-16 text-center">
            <span className="material-symbols-outlined text-[64px] text-fg-dim mb-4 block">
              search_off
            </span>
            <h3 className="studio-display text-[24px] text-fg mb-2">
              Tidak ada listing ditemukan
            </h3>
            <p className="text-[14px] text-fg-muted">
              Coba ubah filter atau kata kunci pencarian Anda.
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {products.map((product, index) => (
                <ProductCard key={product.id} listing={product} index={index} />
              ))}
            </div>

            {/* Pagination — same look as the rest of studio */}
            {meta && meta.last_page > 1 && (
              <div className="mt-16 flex items-center justify-center gap-2">
                <button
                  type="button"
                  disabled={meta.current_page <= 1}
                  onClick={() => goToPage(meta.current_page - 1)}
                  className="grid h-10 w-10 place-items-center rounded-lg border border-line text-fg-muted hover:border-accent hover:text-accent disabled:opacity-30 disabled:hover:border-line disabled:hover:text-fg-muted transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                </button>

                {Array.from({ length: Math.min(meta.last_page, 5) }, (_, i) => {
                  let pageNum;
                  if (meta.last_page <= 5) {
                    pageNum = i + 1;
                  } else if (meta.current_page <= 3) {
                    pageNum = i + 1;
                  } else if (meta.current_page >= meta.last_page - 2) {
                    pageNum = meta.last_page - 4 + i;
                  } else {
                    pageNum = meta.current_page - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => goToPage(pageNum)}
                      className={`h-10 w-10 rounded-lg text-[13px] font-mono font-medium transition-all ${
                        pageNum === meta.current_page
                          ? "bg-accent text-accent-fg shadow-lg shadow-accent/20"
                          : "border border-line text-fg-muted hover:border-accent hover:text-accent"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  type="button"
                  disabled={meta.current_page >= meta.last_page}
                  onClick={() => goToPage(meta.current_page + 1)}
                  className="grid h-10 w-10 place-items-center rounded-lg border border-line text-fg-muted hover:border-accent hover:text-accent disabled:opacity-30 disabled:hover:border-line disabled:hover:text-fg-muted transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Browser with Suspense fallback ─────────────────────────────────────────

function MarketplaceBrowser() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen">
          <div className="max-w-[1320px] mx-auto px-6 py-10">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[...Array(8)].map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      }
    >
      <MarketplaceContent />
    </Suspense>
  );
}

// ─── Studio Marketplace Page (server-rendered with client islands) ──────────

export default function MarketplacePage() {
  return (
    <main className="studio relative min-h-screen overflow-x-hidden">
      <ScrollRail />
      <StudioNav />

      {/* ───────────────────────── GREETINGS ───────────────────────── */}
      <Greetings />

      <RevealOnScroll>
        {/* ───────────────────────── KATALOG (browser) ───────────────────────── */}
        <section id="katalog" className="mx-auto max-w-[1320px] px-6 pb-24 pt-12">
          <MarketplaceBrowser />
        </section>

        {/* ───────────────────────── ADD-ONS ───────────────────────── */}
        <section
          id="addons"
          className="mx-auto max-w-[1320px] px-6 py-24"
        >
          <div className="reveal-rise mb-12 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Eyebrow>Add-on Resource Type</Eyebrow>
              <h2 className="studio-display mt-5 text-[clamp(30px,4.5vw,56px)] text-fg">
                Backup Plan &amp; Public IP
              </h2>
            </div>
            <p className="max-w-sm text-[14px] leading-relaxed text-fg-muted lg:text-right">
              Add-on Resource Type dijual setelah Deployment utama aktif.
              Order terpisah yang ditautkan ke Deployment yang sudah berjalan.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {ADDON_TYPES.map((a) => (
              <article
                key={a.name}
                className="studio-card reveal-rise flex items-start gap-5 rounded-2xl border border-line bg-surface/50 p-7 md:p-9"
              >
                <div className="grid aspect-square w-16 place-items-center rounded-xl border border-line/80 bg-black/40">
                  <span className="material-symbols-outlined text-[32px] text-accent">
                    {a.icon}
                  </span>
                </div>
                <div>
                  <h3 className="studio-display text-[24px] text-fg">
                    {a.name}
                  </h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-fg-muted">
                    {a.desc}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* ───────────────────────── PROVIDERS / ABOUT + GLOBE ───────────────────────── */}
        <section
          id="providers"
          className="relative overflow-hidden border-y border-line/70"
        >
          <div className="mx-auto grid max-w-[1320px] items-center gap-10 px-6 py-24 lg:grid-cols-2 lg:py-32">
            <div className="reveal-rise relative order-2 lg:order-1">
              <div
                className="pointer-events-none absolute inset-0 -z-10"
                style={{
                  background:
                    "radial-gradient(50% 50% at 60% 60%, rgba(255,116,0,0.14), transparent 70%)",
                }}
              />
              <RegionGlobe className="mx-auto w-full max-w-[520px]" />
            </div>

            <div className="reveal-rise order-1 lg:order-2">
              <div className="flex items-center justify-between">
                <Eyebrow>Provider terverifikasi</Eyebrow>
                <Link
                  href="/lifecycle"
                  className="studio-eyebrow inline-flex items-center gap-1.5 text-accent hover:underline"
                >
                  Cara verifikasi
                  <span className="material-symbols-outlined text-[14px]">
                    north_east
                  </span>
                </Link>
              </div>
              <h2 className="studio-display mt-6 text-[clamp(32px,5vw,64px)] text-fg">
                Listing dari Provider yang sudah melewati audit.
              </h2>
              <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-fg-muted">
                Marketplace hanya menampilkan Listing dari First-party
                Provider (ZaganJade) dan Third-party Provider yang sudah
                terverifikasi. Setiap entri membawa data spesifikasi,
                region, harga, dan provisioning SLA yang konsisten.
              </p>
              <div className="mt-7 grid grid-cols-3 gap-3">
                {[
                  { stat: "First-party", note: "ZaganJade" },
                  { stat: "Third-party", note: "Verified" },
                  { stat: "Region", note: "Asia Tenggara" },
                ].map((p) => (
                  <div
                    key={p.stat}
                    className="rounded-xl border border-line/80 bg-surface/40 px-4 py-3"
                  >
                    <div className="studio-eyebrow text-[9px] text-fg-dim">
                      {p.stat}
                    </div>
                    <div className="mt-1 text-[14px] font-semibold text-fg">
                      {p.note}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ───────────────────────── DEVELOPERS ───────────────────────── */}
        <section
          id="developers"
          className="mx-auto max-w-[1320px] px-6 py-24 lg:py-32"
        >
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div className="reveal-rise">
              <Eyebrow>Untuk developer</Eyebrow>
              <h2 className="studio-display mt-5 text-[clamp(30px,4.5vw,56px)] text-fg">
                Order via REST API.
              </h2>
              <p className="mt-5 max-w-md text-[15px] leading-relaxed text-fg-muted">
                Ambil listing, buat order, dan cek status pembayaran via API
                dengan kontrak OpenAPI 3.1. Idempotency pada setiap endpoint
                finansial, webhook bertanda tangan HMAC-SHA256.
              </p>
              <div className="mt-8 space-y-2.5">
                {DX_FEATURES.map((f) => (
                  <div
                    key={f.label}
                    className="group flex items-center justify-between rounded-xl border border-line/80 bg-surface/40 px-4 py-3 transition-colors hover:border-accent/50"
                  >
                    <span className="flex items-center gap-2.5 text-[14px] text-fg">
                      <span className="material-symbols-outlined text-[18px] text-accent">
                        {f.icon}
                      </span>
                      {f.label}
                    </span>
                    <span className="font-mono text-[11px] text-fg-muted">
                      {f.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Terminal */}
            <div className="reveal-rise overflow-hidden rounded-2xl border border-line bg-surface/60">
              <div className="flex items-center justify-between border-b border-line/80 bg-black/40 px-4 py-3">
                <span className="studio-eyebrow flex items-center gap-2 text-[10px] text-fg-muted">
                  <span className="material-symbols-outlined text-[14px]">
                    terminal
                  </span>
                  GET /v1/marketplace/listings
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                  <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                  <span className="h-2.5 w-2.5 rounded-full bg-accent" />
                </span>
              </div>
              <pre className="overflow-x-auto px-5 py-5 font-mono text-[12.5px] leading-relaxed text-fg/90">
                <code>{CODE_EXAMPLE}</code>
              </pre>
              <div className="flex items-center justify-between border-t border-line/80 bg-black/40 px-4 py-2.5">
                <span className="flex items-center gap-1.5 font-mono text-[10px] text-fg-muted">
                  <span className="h-1.5 w-1.5 rounded-full bg-success" />
                  200 OK
                </span>
                <span className="font-mono text-[10px] text-accent">38ms</span>
              </div>
            </div>
          </div>
        </section>
      </RevealOnScroll>

      {/* ───────────────────────── FOOTER ───────────────────────── */}
      <footer className="border-t border-line/70 px-6 py-16">
        <div className="mx-auto max-w-[1320px]">
          <div className="footer-4col-grid grid gap-10 md:grid-cols-2">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="relative grid h-7 w-7 place-items-center">
                  <span
                    className="absolute inset-0 bg-accent"
                    style={{
                      clipPath:
                        "polygon(50% 0, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)",
                    }}
                  />
                  <span className="relative font-mono text-[10px] font-bold text-accent-fg">
                    JN
                  </span>
                </span>
                <span className="studio-display text-[16px] font-bold text-fg">
                  Jade<span className="text-accent">Node</span>
                </span>
              </div>
              <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-fg-muted">
                Marketplace infrastruktur cloud untuk Indonesia &amp; Asia
                Tenggara. Listing terverifikasi, financial correctness, dan
                provisioning yang dapat diaudit.
              </p>
              <div className="mt-5 text-[13px] text-fg-muted">
                customer@jadenode.id
              </div>
              <div className="text-[13px] text-fg-dim">
                Customer support 24/7
              </div>
              <div className="mt-5 flex gap-2">
                {["alternate_email", "rss_feed"].map((i) => (
                  <span
                    key={i}
                    className="grid h-9 w-9 place-items-center rounded-full border border-line text-fg-muted transition-colors hover:border-accent hover:text-accent"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {i}
                    </span>
                  </span>
                ))}
              </div>
            </div>

            {FOOTER_COLUMNS.map((col) => (
              <div key={col.label}>
                <h4 className="studio-eyebrow text-[10px] text-fg-dim">
                  {col.label}
                </h4>
                <ul className="mt-4 space-y-2.5">
                  {col.items.map((it) => (
                    <li key={it.text}>
                      <Link
                        href={it.href}
                        className="text-[13px] text-fg-muted transition-colors hover:text-fg"
                      >
                        {it.text}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-14 flex flex-col items-start justify-between gap-3 border-t border-line/70 pt-6 md:flex-row md:items-center">
            <span className="studio-eyebrow text-[10px] text-fg-dim">
              © 2026 JadeNode Marketplace · Dioperasikan oleh ZaganJade
            </span>
            <span className="flex items-center gap-2 text-[12px] text-fg-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              Marketplace &amp; katalog aktif
            </span>
          </div>
        </div>
      </footer>
    </main>
  );
}
