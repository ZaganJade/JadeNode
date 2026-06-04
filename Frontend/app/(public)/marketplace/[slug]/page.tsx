"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api, ApiException } from "@/lib/api";
import { formatSpecs, formatPrice } from "@/lib/formatters";
import { SpecGrid } from "@/features/marketplace/components/spec-grid";
import { PriceSelector, type PricingOption } from "@/features/marketplace/components/price-selector";
import { TrustIndicators } from "@/features/marketplace/components/trust-indicators";
import { QuickCompare, type ComparableListing } from "@/features/marketplace/components/quick-compare";

// ─── Types ──────────────────────────────────────────────────────────────────

interface Provider {
  name: string;
  slug: string;
  verified: boolean;
}

interface ListingSpecs {
  cpu?: string;
  vcpu?: string;
  cores?: string;
  ram?: string;
  memory?: string;
  storage?: string;
  disk?: string;
  bandwidth?: string;
  storage_type?: string;
  network?: string;
  os?: string;
  ip?: string;
  [key: string]: string | number | undefined | null;
}

type Availability = "available" | "limited" | "waitlist" | "unavailable";

interface PricingEntry {
  cycle: "monthly" | "yearly";
  price: number;
}

interface Listing {
  slug: string;
  name: string;
  resource_type: string;
  description?: string;
  provider: Provider;
  region: string;
  availability: Availability;
  specs: ListingSpecs;
  pricing: PricingEntry[];
  provisioning_sla?: string;
  support_target?: string;
}

interface SimilarListing {
  slug: string;
  name: string;
  provider: { name: string; verified: boolean };
  specs: ListingSpecs;
  price: number;
  billing_cycle: string;
  availability: Availability;
}

// ─── Auth state (simplified for MVP) ────────────────────────────────────────

interface AuthState {
  authenticated: boolean;
  emailVerified: boolean;
  betaAccess: "none" | "pending" | "approved" | "rejected";
}

// ─── Availability helpers ───────────────────────────────────────────────────

const availabilityStyles: Record<string, string> = {
  available: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  limited: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  waitlist: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  unavailable: "bg-red-500/10 text-red-400 border-red-500/20",
};

const availabilityLabels: Record<string, string> = {
  available: "Tersedia",
  limited: "Terbatas",
  waitlist: "Waitlist",
  unavailable: "Tidak Tersedia",
};

// ─── Page ───────────────────────────────────────────────────────────────────

export default function ProductDetailPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const slug = params.slug;

  // ── State ───────────────────────────────────────────────────────────────
  const [listing, setListing] = useState<Listing | null>(null);
  const [similar, setSimilar] = useState<SimilarListing[]>([]);
  const [auth, setAuth] = useState<AuthState>({
    authenticated: false,
    emailVerified: false,
    betaAccess: "none",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  // ── Fetch data ──────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError(null);
      setNotFound(false);

      try {
        const [listingData, similarData] = await Promise.allSettled([
          api.get<Listing>(`/api/v1/marketplace/listings/${slug}`),
          api.get<{ data: SimilarListing[] }>(`/api/v1/marketplace/listings/${slug}/similar`),
        ]);

        if (cancelled) return;

        if (listingData.status === "rejected") {
          const err = listingData.reason;
          if (err instanceof ApiException && err.status === 404) {
            setNotFound(true);
          } else {
            setError(err instanceof Error ? err.message : "Gagal memuat product listing.");
          }
          setLoading(false);
          return;
        }

        setListing(listingData.value);

        if (similarData.status === "fulfilled" && similarData.value) {
          const d = similarData.value;
          setSimilar(Array.isArray(d) ? d : (d as { data: SimilarListing[] }).data?.slice?.(0, 3) ?? []);
        }

        // Fetch auth state
        try {
          const session = await api.get<{
            user: { email_verified_at: string | null } | null;
            capabilities: string[];
            authenticated: boolean;
          }>("/api/v1/auth/user");

          if (cancelled) return;

          const authenticated = session.authenticated && session.user != null;
          const emailVerified = session.user?.email_verified_at != null;
          const hasBeta = session.capabilities?.includes("beta_access") ?? false;

          // Try to get detailed beta status
          let betaAccess: AuthState["betaAccess"] = hasBeta ? "approved" : "none";
          if (authenticated && !hasBeta) {
            try {
              const betaStatus = await api.get<{
                status: "none" | "pending" | "approved" | "rejected";
              }>("/api/v1/beta-access/status");
              betaAccess = betaStatus.status;
            } catch {
              // Keep default
            }
          }

          setAuth({ authenticated, emailVerified, betaAccess });
        } catch {
          // Not authenticated — keep defaults
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, [slug]);

  // ── CTA handler ─────────────────────────────────────────────────────────
  const handleCta = useCallback(() => {
    if (!auth.authenticated) {
      router.push("/register");
    } else if (!auth.emailVerified) {
      // stay on page — show inline message
    } else if (auth.betaAccess !== "approved") {
      router.push("/beta-access");
    } else {
      router.push(`/checkout/${slug}`);
    }
  }, [auth, router, slug]);

  // ── Derived values ──────────────────────────────────────────────────────
  const specItems = listing ? formatSpecs(listing.specs) : [];
  const pricingOptions: PricingOption[] = listing?.pricing ?? [];

  // ── Loading skeleton ────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0B00] px-6 py-16">
        <div className="mx-auto max-w-[1200px] space-y-8">
          {/* Hero skeleton */}
          <div className="space-y-4">
            <div className="h-4 w-24 animate-pulse rounded bg-[rgba(255,191,0,0.1)]" />
            <div className="h-10 w-2/3 animate-pulse rounded bg-[rgba(255,191,0,0.08)]" />
            <div className="flex gap-3">
              <div className="h-7 w-20 animate-pulse rounded-full bg-[rgba(255,191,0,0.08)]" />
              <div className="h-7 w-28 animate-pulse rounded-full bg-[rgba(255,191,0,0.08)]" />
            </div>
          </div>

          {/* Specs skeleton */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-[72px] animate-pulse rounded-xl bg-[rgba(255,191,0,0.06)]"
              />
            ))}
          </div>

          {/* Pricing skeleton */}
          <div className="space-y-3">
            <div className="h-10 w-48 animate-pulse rounded bg-[rgba(255,191,0,0.06)]" />
            <div className="h-4 w-64 animate-pulse rounded bg-[rgba(255,191,0,0.04)]" />
          </div>

          {/* Trust skeleton */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-[72px] animate-pulse rounded-xl bg-[rgba(255,191,0,0.06)]"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Not found ───────────────────────────────────────────────────────────
  if (notFound) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0D0B00] px-6 text-center">
        <div className="rounded-2xl border border-[rgba(255,191,0,0.08)] bg-[rgba(25,20,0,0.4)] p-10 backdrop-blur-[24px]">
          <h1 className="text-2xl font-bold text-[#F5F5F0]">Product Listing Tidak Ditemukan</h1>
          <p className="mt-3 text-sm text-[#F5F5F0]/50">
            Product listing dengan slug &ldquo;{slug}&rdquo; tidak tersedia atau sudah dihapus.
          </p>
          <Link
            href="/marketplace"
            className="mt-6 inline-flex items-center rounded-full bg-[#FFBF00] px-6 py-2.5 text-sm font-semibold text-[#0D0B00] shadow-[0_0_20px_rgba(255,191,0,0.25)]"
          >
            Kembali ke Marketplace
          </Link>
        </div>
      </div>
    );
  }

  // ── Error ───────────────────────────────────────────────────────────────
  if (error || !listing) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0D0B00] px-6 text-center">
        <div className="rounded-2xl border border-red-500/20 bg-[rgba(25,20,0,0.4)] p-10 backdrop-blur-[24px]">
          <h1 className="text-2xl font-bold text-[#F5F5F0]">Gagal Memuat Product Listing</h1>
          <p className="mt-3 text-sm text-[#F5F5F0]/50">
            {error ?? "Terjadi kesalahan saat memuat data. Silakan coba lagi."}
          </p>
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-full border border-[rgba(255,191,0,0.12)] bg-[rgba(25,20,0,0.6)] px-6 py-2.5 text-sm font-medium text-[#F5F5F0]/60 transition-colors hover:border-[rgba(255,191,0,0.3)] hover:text-[#F5F5F0]"
            >
              Coba Lagi
            </button>
            <Link
              href="/marketplace"
              className="inline-flex items-center rounded-full bg-[#FFBF00] px-6 py-2.5 text-sm font-semibold text-[#0D0B00] shadow-[0_0_20px_rgba(255,191,0,0.25)]"
            >
              Kembali ke Marketplace
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Determine CTA ───────────────────────────────────────────────────────
  const isUnavailable = listing.availability === "unavailable";
  const isWaitlist = listing.availability === "waitlist";

  let ctaLabel: string;
  let ctaDisabled = false;
  let ctaSubtext: string | null = null;

  if (isUnavailable) {
    ctaLabel = "Tidak Tersedia";
    ctaDisabled = true;
    ctaSubtext = "Product listing ini sedang tidak tersedia. Anda bisa bergabung dengan waitlist untuk mendapat notifikasi.";
  } else if (!auth.authenticated) {
    ctaLabel = "Daftar untuk Order";
    ctaSubtext = "Buat akun untuk mulai melakukan pemesanan.";
  } else if (!auth.emailVerified) {
    ctaLabel = "Verifikasi Email Terlebih Dahulu";
    ctaDisabled = true;
    ctaSubtext = "Silakan verifikasi email Anda sebelum melakukan pemesanan.";
  } else if (auth.betaAccess === "pending") {
    ctaLabel = "Beta Access Menunggu Persetujuan";
    ctaDisabled = true;
    ctaSubtext = "Permintaan beta access Anda sedang dalam proses review.";
  } else if (auth.betaAccess === "rejected") {
    ctaLabel = "Ajukan Beta Access";
    ctaSubtext = "Permintaan sebelumnya ditolak. Anda bisa mengajukan kembali.";
  } else if (auth.betaAccess !== "approved") {
    ctaLabel = "Ajukan Beta Access";
    ctaSubtext = "Selama private beta, Anda perlu Beta Access untuk melakukan pemesanan.";
  } else {
    ctaLabel = "Buat Order";
    ctaSubtext = null;
  }

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0D0B00]">
      {/* Ambient glow */}
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute -left-40 top-0 h-[800px] w-[800px] rounded-full bg-[rgba(255,191,0,0.03)] blur-[120px]" />
        <div className="absolute -right-40 top-1/3 h-[600px] w-[600px] rounded-full bg-[rgba(255,165,0,0.02)] blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-[1200px] px-6 py-16 sm:px-8">
        {/* ──────────────────────── Breadcrumb ────────────────────────────── */}
        <nav className="mb-8 flex items-center gap-2 text-xs text-[#F5F5F0]/40">
          <Link href="/marketplace" className="transition-colors hover:text-[#FFBF00]">
            Marketplace
          </Link>
          <span>/</span>
          <span className="text-[#F5F5F0]/60">{listing.name}</span>
        </nav>

        {/* ──────────────────────── Hero Section ─────────────────────────── */}
        <section className="mb-12">
          {/* Resource type chip */}
          <span className="inline-flex items-center rounded-full border border-[rgba(255,191,0,0.12)] bg-[rgba(255,191,0,0.06)] px-3 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-[#FFBF00]">
            {listing.resource_type}
          </span>

          {/* Product name — gradient text */}
          <h1
            className="mt-4 text-4xl font-bold leading-tight sm:text-5xl"
            style={{
              background: "linear-gradient(135deg, #F5F5F0, #FFBF00, #FFA500)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {listing.name}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            {/* Provider badge */}
            <div className="flex items-center gap-1.5 rounded-full border border-[rgba(255,191,0,0.10)] bg-[rgba(25,20,0,0.5)] px-3 py-1.5 text-sm text-[#F5F5F0]/70 backdrop-blur-[12px]">
              {listing.provider.verified && (
                <svg className="h-3.5 w-3.5 text-[#FFBF00]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
              <span>{listing.provider.name}</span>
            </div>

            {/* Region */}
            <span className="flex items-center gap-1.5 text-sm text-[#F5F5F0]/50">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              {listing.region}
            </span>

            {/* Availability */}
            <span
              className={`rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase ${availabilityStyles[listing.availability] ?? availabilityStyles.available}`}
            >
              {availabilityLabels[listing.availability] ?? listing.availability}
            </span>
          </div>

          {/* Description */}
          {listing.description && (
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#F5F5F0]/50">
              {listing.description}
            </p>
          )}
        </section>

        {/* ──────────────────────── Specs Section ────────────────────────── */}
        <section className="mb-12">
          <h2 className="mb-4 font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-[#FFBF00]/60">
            Spesifikasi
          </h2>
          <SpecGrid specs={specItems} />
        </section>

        {/* ──────────────────────── Pricing Section ──────────────────────── */}
        <section className="mb-12 rounded-2xl border border-[rgba(255,191,0,0.08)] bg-[rgba(25,20,0,0.4)] p-8 backdrop-blur-[24px]">
          <h2 className="mb-6 font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-[#FFBF00]/60">
            Harga
          </h2>
          <PriceSelector pricing={pricingOptions} />
        </section>

        {/* ──────────────────────── Trust Indicators ─────────────────────── */}
        <section className="mb-12">
          <h2 className="mb-4 font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-[#FFBF00]/60">
            Trust Indicators
          </h2>
          <TrustIndicators
            providerVerified={listing.provider.verified}
            provisioningSla={listing.provisioning_sla}
            supportTarget={listing.support_target}
          />
        </section>

        {/* ──────────────────────── Quick Compare ────────────────────────── */}
        {similar.length > 0 && (
          <section className="mb-12">
            <QuickCompare
              listings={similar.map((s) => ({
                slug: s.slug,
                name: s.name,
                provider: s.provider,
                specs: s.specs,
                price: s.price,
                billingCycle: s.billing_cycle,
                availability: s.availability,
              }))}
            />
          </section>
        )}

        {/* ──────────────────────── CTA Section ──────────────────────────── */}
        <section className="rounded-2xl border border-[rgba(255,191,0,0.10)] bg-[rgba(25,20,0,0.5)] p-8 backdrop-blur-[24px]">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[#F5F5F0]">
                {isUnavailable ? "Tidak Tersedia Saat Ini" : isWaitlist ? "Bergabung Waitlist" : "Mulai Pemesanan"}
              </h2>
              {ctaSubtext && (
                <p className="mt-1 text-sm text-[#F5F5F0]/40">{ctaSubtext}</p>
              )}
            </div>

            <div className="flex items-center gap-3">
              {!isUnavailable && (
                <Link
                  href="/marketplace"
                  className="rounded-full border border-[rgba(255,191,0,0.12)] bg-[rgba(25,20,0,0.6)] px-5 py-2.5 text-sm font-medium text-[#F5F5F0]/60 transition-colors hover:border-[rgba(255,191,0,0.3)] hover:text-[#F5F5F0]"
                >
                  Kembali
                </Link>
              )}

              <button
                type="button"
                disabled={ctaDisabled}
                onClick={handleCta}
                className={`inline-flex items-center rounded-full px-6 py-2.5 text-sm font-semibold transition-all ${
                  ctaDisabled
                    ? "cursor-not-allowed bg-[rgba(255,191,0,0.1)] text-[#F5F5F0]/30"
                    : "bg-[#FFBF00] text-[#0D0B00] shadow-[0_0_20px_rgba(255,191,0,0.25)] hover:shadow-[0_0_30px_rgba(255,191,0,0.4)]"
                }`}
              >
                {ctaLabel}
              </button>
            </div>
          </div>
        </section>

        {/* ──────────────────────── Lifecycle Preview ────────────────────── */}
        <section className="mt-12">
          <h2 className="mb-4 font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-[#FFBF00]/60">
            Alur Pemesanan
          </h2>
          <div className="flex flex-wrap items-center gap-3 text-xs text-[#F5F5F0]/40">
            {["Order Dibuat", "Invoice Pending", "Midtrans Snap", "Payment Sync", "Provisioning Task", "Deployment Active"].map(
              (step, i, arr) => (
                <span key={step} className="flex items-center gap-3">
                  <span className="inline-flex h-8 items-center rounded-full border border-[rgba(255,191,0,0.10)] bg-[rgba(25,20,0,0.4)] px-3 text-[#F5F5F0]/60 backdrop-blur-[12px]">
                    {step}
                  </span>
                  {i < arr.length - 1 && (
                    <svg className="h-3 w-3 text-[#FFBF00]/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  )}
                </span>
              ),
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
