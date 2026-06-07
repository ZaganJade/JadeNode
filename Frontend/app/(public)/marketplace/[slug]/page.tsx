"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { RevealOnScroll } from "@/components/landing/reveal-on-scroll";
import { StudioNav } from "@/components/landing/studio/studio-nav";
import { ScrollRail } from "@/components/landing/studio/scroll-rail";
import { NetworkPaths } from "@/components/landing/studio/network-paths";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { api, ApiException } from "@/lib/api";

// ─── Types (match backend ResourceProductResource) ──────────────────────────

interface ProductSpec {
  cpu: string;
  ram: string;
  storage: string;
  [key: string]: string | number | undefined | null;
}

interface Provider {
  name: string;
  verified: boolean;
}

type Availability = "available" | "limited" | "waitlist" | "unavailable";

interface Listing {
  id: string;
  name: string;
  slug: string;
  description?: string;
  resource_type: string;
  region: string;
  specs: ProductSpec;
  price: number;
  billing_cycle: string;
  currency: string;
  availability: Availability;
  provisioning_sla: string;
  image?: string | null;
  provider: Provider;
}

interface SimilarListing {
  id: string;
  name: string;
  slug: string;
  resource_type: string;
  region: string;
  specs: ProductSpec;
  price: number;
  billing_cycle: string;
  availability: Availability;
  image?: string | null;
  provider: Provider;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="studio-eyebrow text-accent">{children}</p>;
}

const RESOURCE_ICON: Record<string, string> = {
  vps: "dns",
  dedicated: "developer_board",
  "dedicated server": "developer_board",
  storage: "database",
  network: "lan",
  gpu: "memory",
};

const AVAILABILITY_MAP: Record<string, { dot: string; label: string }> = {
  available: { dot: "#6ce8a6", label: "TERSEDIA" },
  limited: { dot: "#ff7400", label: "TERBATAS" },
  waitlist: { dot: "#ffb347", label: "WAITLIST" },
  unavailable: { dot: "#ff7a7a", label: "HABIS" },
};

// ─── Spec Row ───────────────────────────────────────────────────────────────

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-line bg-surface/50 p-4 backdrop-blur transition-colors hover:border-accent/30">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <p className="font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-fg-dim">
        {label}
      </p>
      <p className="mt-1 text-[15px] font-semibold text-fg">{value}</p>
    </div>
  );
}

// ─── Trust Card ─────────────────────────────────────────────────────────────

function TrustCard({
  icon,
  title,
  value,
}: {
  icon: string;
  title: string;
  value: string;
}) {
  return (
    <div className="studio-card group relative overflow-hidden rounded-2xl border border-line bg-surface/50 p-5 transition-colors hover:border-accent/30">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="flex items-start gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line/80 bg-surface-2">
          <span className="material-symbols-outlined text-[18px] text-accent">
            {icon}
          </span>
        </div>
        <div className="min-w-0">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-fg-dim">
            {title}
          </p>
          <p className="mt-1 text-[13px] text-fg">{value}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Similar Product Card ───────────────────────────────────────────────────

function SimilarCard({ listing }: { listing: SimilarListing }) {
  const iconName =
    RESOURCE_ICON[listing.resource_type.toLowerCase()] ?? "deployed_code";
  const tone = AVAILABILITY_MAP[listing.availability] ?? AVAILABILITY_MAP.available;

  return (
    <Link
      href={`/marketplace/${listing.slug}`}
      className="studio-card group relative flex flex-col rounded-2xl border border-line bg-surface/50 p-4 transition-all hover:border-accent/30"
    >
      {/* Image / icon */}
      <div className="relative grid aspect-square place-items-center overflow-hidden rounded-xl border border-line/80 bg-gradient-to-br from-white/[0.04] to-transparent">
        <div
          className="absolute inset-0 transition-opacity duration-500"
          style={{
            background:
              "radial-gradient(60% 60% at 50% 40%, rgba(198,242,74,0.12), transparent 70%)",
            opacity: 0.5,
          }}
        />
        {listing.image ? (
          <img
            src={`/${listing.image}`}
            alt={listing.name}
            className="relative h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <span className="material-symbols-outlined relative text-[48px] text-fg/70 transition-transform duration-500 group-hover:scale-110">
            {iconName}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col px-1 pt-3">
        <p className="truncate text-[13px] font-semibold text-fg">
          {listing.name}
        </p>
        <p className="mt-0.5 text-[11px] text-fg-dim">
          {listing.provider.name}
        </p>

        {/* Mini specs */}
        <div className="mt-2 space-y-1">
          <div className="flex items-center justify-between font-mono text-[10px]">
            <span className="text-fg-dim">CPU</span>
            <span className="text-fg">{listing.specs.cpu}</span>
          </div>
          <div className="flex items-center justify-between font-mono text-[10px]">
            <span className="text-fg-dim">RAM</span>
            <span className="text-fg">{listing.specs.ram}</span>
          </div>
        </div>

        {/* Price + availability */}
        <div className="mt-auto pt-3 border-t border-line/60">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 font-mono text-[10px] text-fg-muted">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: tone.dot }}
              />
              {tone.label}
            </span>
            <span className="font-mono text-[11px] tabular-nums text-fg">
              {formatRupiah(listing.price)}
              <span className="ml-1 text-fg-dim">
                /{listing.billing_cycle === "monthly" ? "bln" : "thn"}
              </span>
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Skeleton ───────────────────────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-[1320px] px-6 py-10 space-y-8">
      <div className="h-4 w-32 animate-pulse rounded bg-fg/10" />
      <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
        <div className="aspect-square animate-pulse rounded-2xl bg-surface-2" />
        <div className="space-y-4">
          <div className="h-4 w-20 animate-pulse rounded bg-accent/10" />
          <div className="h-10 w-3/4 animate-pulse rounded bg-fg/10" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-fg/5" />
          <div className="flex gap-3">
            <div className="h-8 w-28 animate-pulse rounded-full bg-accent/10" />
            <div className="h-8 w-24 animate-pulse rounded-full bg-fg/5" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-surface-2" />
        ))}
      </div>
      <div className="h-40 animate-pulse rounded-2xl bg-surface-2" />
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function ProductDetailPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const slug = params.slug;

  const [listing, setListing] = useState<Listing | null>(null);
  const [similar, setSimilar] = useState<SimilarListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError(null);
      setNotFound(false);

      try {
        // Fetch listing detail
        const listingRes = await api.get<{ data: Listing }>(
          `/api/v1/marketplace/listings/${slug}`,
        );
        if (cancelled) return;
        setListing(listingRes.data);

        // Fetch similar products (non-critical — settle independently)
        api
          .get<{ data: SimilarListing[] }>(
            `/api/v1/marketplace/listings/${slug}/similar`,
          )
          .then((res) => {
            if (!cancelled) {
              const items = Array.isArray(res.data) ? res.data : [];
              setSimilar(items.slice(0, 3));
            }
          })
          .catch(() => {
            // Similar products are optional — ignore errors
          });
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiException && err.status === 404) {
          setNotFound(true);
        } else {
          setError(
            err instanceof Error ? err.message : "Gagal memuat product listing.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  // ── CTA handler ────────────────────────────────────────────────────────
  const handleOrder = useCallback(() => {
    router.push(`/marketplace/${slug}/checkout`);
  }, [router, slug]);

  // ── Derived ────────────────────────────────────────────────────────────
  const iconName = listing
    ? RESOURCE_ICON[listing.resource_type.toLowerCase()] ?? "deployed_code"
    : "deployed_code";
  const tone = listing
    ? AVAILABILITY_MAP[listing.availability] ?? AVAILABILITY_MAP.available
    : AVAILABILITY_MAP.available;
  const isUnavailable = listing?.availability === "unavailable";

  // ── Loading ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <main className="studio relative min-h-screen overflow-x-hidden">
        <ScrollRail />
        <StudioNav />
        <div className="pt-28 pb-24">
          <DetailSkeleton />
        </div>
      </main>
    );
  }

  // ── Not Found ──────────────────────────────────────────────────────────
  if (notFound) {
    return (
      <main className="studio relative min-h-screen overflow-x-hidden">
        <ScrollRail />
        <StudioNav />
        <div className="flex min-h-[80vh] flex-col items-center justify-center px-6 text-center">
          <div className="studio-card rounded-2xl border border-line bg-surface/50 p-12 backdrop-blur">
            <span className="material-symbols-outlined mb-4 block text-[64px] text-fg-dim">
              search_off
            </span>
            <h1 className="studio-display text-[28px] text-fg">
              Listing tidak ditemukan
            </h1>
            <p className="mt-3 text-[14px] text-fg-muted">
              Product listing dengan slug &ldquo;{slug}&rdquo; tidak tersedia
              atau sudah dihapus.
            </p>
            <Link
              href="/marketplace"
              className="mt-6 inline-flex items-center gap-2 rounded-lg border border-line-strong px-5 py-2.5 text-[13px] font-semibold text-fg transition-all hover:border-accent hover:bg-accent hover:text-accent-fg"
            >
              <span className="material-symbols-outlined text-[16px]">
                arrow_back
              </span>
              Kembali ke Marketplace
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────
  if (error || !listing) {
    return (
      <main className="studio relative min-h-screen overflow-x-hidden">
        <ScrollRail />
        <StudioNav />
        <div className="flex min-h-[80vh] flex-col items-center justify-center px-6 text-center">
          <div className="studio-card rounded-2xl border border-error/20 bg-surface/50 p-12 backdrop-blur">
            <span className="material-symbols-outlined mb-4 block text-[64px] text-error">
              error
            </span>
            <h1 className="studio-display text-[28px] text-fg">
              Gagal memuat listing
            </h1>
            <p className="mt-3 text-[14px] text-fg-muted">
              {error ?? "Terjadi kesalahan saat memuat data."}
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="rounded-lg border border-line px-5 py-2.5 text-[13px] font-semibold text-fg-muted transition-all hover:border-accent hover:text-accent"
              >
                Coba Lagi
              </button>
              <Link
                href="/marketplace"
                className="inline-flex items-center gap-2 rounded-lg border border-line-strong px-5 py-2.5 text-[13px] font-semibold text-fg transition-all hover:border-accent hover:bg-accent hover:text-accent-fg"
              >
                Kembali ke Marketplace
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <main className="studio relative min-h-screen overflow-x-hidden">
      <ScrollRail />
      <StudioNav />

      {/* ────────── Hero Background ────────── */}
      <section
        aria-label="Product hero"
        className="relative isolate overflow-hidden border-b border-line/60"
      >
        <div className="studio-streaks-fallback pointer-events-none absolute inset-0 -z-10" />
        <div className="pointer-events-none absolute inset-0 -z-10">
          <NetworkPaths />
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-1/3 bg-gradient-to-b from-transparent to-black" />

        <div className="mx-auto w-full max-w-[1320px] px-6 pt-28 pb-12">
          {/* Breadcrumb */}
          <nav className="mb-8 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em]">
            <Link
              href="/marketplace"
              className="flex items-center gap-1.5 text-fg-dim transition-colors hover:text-accent"
            >
              <span className="material-symbols-outlined text-[16px]">
                arrow_back
              </span>
              Marketplace
            </Link>
            <span className="text-line-strong">/</span>
            <span className="text-fg-muted">{listing.name}</span>
          </nav>

          {/* Hero grid */}
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            {/* Product image */}
            <div className="relative overflow-hidden rounded-2xl border border-line/80 bg-surface/50 backdrop-blur">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/[0.06] to-transparent" />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "radial-gradient(60% 60% at 50% 40%, rgba(198,242,74,0.10), transparent 70%)",
                }}
              />
              {listing.image ? (
                <img
                  src={`/${listing.image}`}
                  alt={listing.name}
                  className="relative aspect-square w-full object-cover"
                />
              ) : (
                <div className="relative flex aspect-square items-center justify-center">
                  <span className="material-symbols-outlined text-[96px] text-fg/20">
                    {iconName}
                  </span>
                </div>
              )}
              {/* Resource type pill */}
              <span className="absolute left-4 top-4 z-10 rounded-md border border-accent/30 bg-accent/10 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-accent">
                {listing.resource_type}
              </span>
              {/* Status dot */}
              <span
                className="absolute right-4 top-4 z-10 h-2.5 w-2.5 rounded-full"
                style={{
                  background: tone.dot,
                  boxShadow: `0 0 8px 1px ${tone.dot}`,
                }}
              />
            </div>

            {/* Product info */}
            <div>
              <Eyebrow>Product Detail</Eyebrow>
              <h1 className="studio-hero-title mt-4 text-[clamp(32px,5vw,64px)] leading-tight text-fg">
                {listing.name}
              </h1>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                {/* Provider */}
                <div className="flex items-center gap-1.5 rounded-md border border-line/80 bg-surface/50 px-3 py-1.5 text-[12px] text-fg-muted">
                  {listing.provider.verified && (
                    <span className="material-symbols-outlined text-[14px] text-accent">
                      verified
                    </span>
                  )}
                  {listing.provider.name}
                </div>
                {/* Region */}
                <span className="flex items-center gap-1.5 text-[12px] text-fg-dim">
                  <span className="material-symbols-outlined text-[14px]">
                    location_on
                  </span>
                  {listing.region}
                </span>
                {/* Availability */}
                <span
                  className="rounded-md px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em]"
                  style={{ color: tone.dot }}
                >
                  {tone.label}
                </span>
              </div>

              {/* Description */}
              {listing.description && (
                <p className="mt-5 max-w-xl text-[14px] leading-relaxed text-fg-muted">
                  {listing.description}
                </p>
              )}

              {/* Price callout */}
              <div className="mt-6 rounded-2xl border border-line/80 bg-surface/50 p-6 backdrop-blur">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-fg-dim">
                  Harga
                </p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="studio-display text-[40px] leading-none text-fg tabular-nums">
                    {formatRupiah(listing.price)}
                  </span>
                  <span className="text-[14px] text-fg-dim">
                    /{listing.billing_cycle === "monthly" ? "bulan" : "tahun"}
                  </span>
                </div>
                <p className="mt-2 text-[11px] text-fg-dim">
                  Belum termasuk PPN · Perpanjangan otomatis
                </p>

                {/* CTA */}
                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    disabled={isUnavailable}
                    onClick={handleOrder}
                    className={`inline-flex items-center gap-2 rounded-lg px-6 py-3 text-[13px] font-semibold transition-all ${
                      isUnavailable
                        ? "cursor-not-allowed border border-line text-fg-dim"
                        : "border border-line-strong text-fg hover:border-accent hover:bg-accent hover:text-accent-fg"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {isUnavailable ? "block" : "bolt"}
                    </span>
                    {isUnavailable ? "Stok habis" : "Buat Order"}
                  </button>
                  <AddToCartButton
                    variant="full"
                    disabled={isUnavailable}
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
                      pricing: [
                        { cycle: listing.billing_cycle, price: listing.price },
                      ],
                      cycle: listing.billing_cycle,
                    }}
                  />
                  <Link
                    href="/marketplace"
                    className="inline-flex items-center gap-2 rounded-lg border border-line px-5 py-3 text-[13px] font-semibold text-fg-muted transition-all hover:border-accent/50 hover:text-fg"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      arrow_back
                    </span>
                    Kembali
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <RevealOnScroll>
        {/* ────────── Specs ────────── */}
        <section className="mx-auto max-w-[1320px] px-6 py-16">
          <div className="reveal-rise mb-6 flex items-center justify-between">
            <div>
              <Eyebrow>Spesifikasi</Eyebrow>
              <h2 className="studio-display mt-3 text-[clamp(24px,3.5vw,40px)] text-fg">
                Resource yang Anda dapatkan
              </h2>
            </div>
          </div>

          <div className="reveal-rise grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <SpecRow label="CPU" value={listing.specs.cpu} />
            <SpecRow label="RAM" value={listing.specs.ram} />
            <SpecRow label="Storage" value={listing.specs.storage} />
            <SpecRow
              label="Resource Type"
              value={listing.resource_type}
            />
            <SpecRow label="Region" value={listing.region} />
            <SpecRow label="Provider" value={listing.provider.name} />
            {listing.provisioning_sla && (
              <SpecRow
                label="Provisioning SLA"
                value={listing.provisioning_sla}
              />
            )}
            <SpecRow
              label="Currency"
              value={listing.currency}
            />
          </div>
        </section>

        {/* ────────── Trust Indicators ────────── */}
        <section className="mx-auto max-w-[1320px] px-6 pb-16">
          <div className="reveal-rise mb-6">
            <Eyebrow>Trust Indicators</Eyebrow>
            <h2 className="studio-display mt-3 text-[clamp(24px,3.5vw,40px)] text-fg">
              Mengapa listing ini bisa dipercaya
            </h2>
          </div>

          <div className="reveal-rise grid grid-cols-1 gap-3 sm:grid-cols-3">
            <TrustCard
              icon="verified"
              title="Provider"
              value={
                listing.provider.verified
                  ? `${listing.provider.name} — Identitas & infrastruktur terverifikasi`
                  : "Belum terverifikasi"
              }
            />
            <TrustCard
              icon="timer"
              title="Provisioning SLA"
              value={listing.provisioning_sla || "Belum ditentukan"}
            />
            <TrustCard
              icon="shield"
              title="Keamanan"
              value="Provisioning teraudit & pembayaran via Midtrans Snap"
            />
          </div>
        </section>

        {/* ────────── Order Lifecycle ────────── */}
        <section className="border-y border-line/60">
          <div className="mx-auto max-w-[1320px] px-6 py-16">
            <div className="reveal-rise mb-8">
              <Eyebrow>Alur Pemesanan</Eyebrow>
              <h2 className="studio-display mt-3 text-[clamp(24px,3.5vw,40px)] text-fg">
                Dari order hingga deployment aktif
              </h2>
            </div>

            <div className="reveal-rise flex flex-wrap items-center gap-3">
              {[
                "Order Dibuat",
                "Invoice Pending",
                "Midtrans Snap",
                "Payment Sync",
                "Provisioning Task",
                "Deployment Active",
              ].map((step, i, arr) => (
                <span key={step} className="flex items-center gap-3">
                  <span className="inline-flex h-9 items-center gap-2 rounded-lg border border-line/80 bg-surface/50 px-3.5 text-[12px] text-fg-muted backdrop-blur">
                    <span className="font-mono text-[10px] text-accent">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {step}
                  </span>
                  {i < arr.length - 1 && (
                    <span className="material-symbols-outlined text-[14px] text-accent/40">
                      arrow_forward
                    </span>
                  )}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ────────── Similar Products ────────── */}
        {similar.length > 0 && (
          <section className="mx-auto max-w-[1320px] px-6 py-16">
            <div className="reveal-rise mb-6 flex items-end justify-between">
              <div>
                <Eyebrow>Quick Compare</Eyebrow>
                <h2 className="studio-display mt-3 text-[clamp(24px,3.5vw,40px)] text-fg">
                  Listing serupa di region yang sama
                </h2>
              </div>
              <Link
                href="/marketplace"
                className="studio-eyebrow hidden items-center gap-1.5 text-accent hover:underline sm:flex"
              >
                Lihat semua
                <span className="material-symbols-outlined text-[14px]">
                  north_east
                </span>
              </Link>
            </div>

            <div className="reveal-rise grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {similar.map((s) => (
                <SimilarCard key={s.id} listing={s} />
              ))}
            </div>
          </section>
        )}

        {/* ────────── Final CTA ────────── */}
        <section className="mx-auto max-w-[1320px] px-6 pb-24">
          <div className="reveal-rise rounded-2xl border border-line/80 bg-surface/50 p-8 backdrop-blur sm:p-10">
            <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="studio-display text-[24px] text-fg">
                  {isUnavailable
                    ? "Listing sedang tidak tersedia"
                    : "Siap untuk memesan?"}
                </h2>
                <p className="mt-2 max-w-md text-[14px] text-fg-muted">
                  {isUnavailable
                    ? "Anda bisa bergabung dengan waitlist untuk mendapat notifikasi saat listing kembali tersedia."
                    : "Lanjutkan ke checkout untuk membuat order dan pembayaran via Midtrans."}
                </p>
              </div>
              <div className="flex shrink-0 gap-3">
                <Link
                  href="/marketplace"
                  className="rounded-lg border border-line px-5 py-2.5 text-[13px] font-semibold text-fg-muted transition-all hover:border-accent/50 hover:text-fg"
                >
                  Kembali
                </Link>
                {!isUnavailable && (
                  <button
                    type="button"
                    onClick={handleOrder}
                    className="inline-flex items-center gap-2 rounded-lg border border-line-strong px-6 py-2.5 text-[13px] font-semibold text-fg transition-all hover:border-accent hover:bg-accent hover:text-accent-fg"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      shopping_cart
                    </span>
                    Buat Order
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>
      </RevealOnScroll>

      {/* ────────── Footer (minimal) ────────── */}
      <footer className="border-t border-line/70 px-6 py-10">
        <div className="mx-auto flex max-w-[1320px] flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-2 text-[13px] text-fg-muted transition-colors hover:text-fg"
          >
            <span className="material-symbols-outlined text-[16px]">
              arrow_back
            </span>
            Kembali ke Marketplace
          </Link>
          <span className="studio-eyebrow text-[10px] text-fg-dim">
            © 2026 JadeNode Marketplace · Dioperasikan oleh ZaganJade
          </span>
        </div>
      </footer>
    </main>
  );
}
