"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { RevealOnScroll } from "@/components/landing/reveal-on-scroll";
import { StudioNav } from "@/components/landing/studio/studio-nav";
import { ScrollRail } from "@/components/landing/studio/scroll-rail";
import { api, ApiException } from "@/lib/api";
import { formatPrice } from "@/lib/formatters";
import { OrderSummary } from "@/features/checkout/components/order-summary";
import { DemoPayment } from "@/features/checkout/components/demo-payment";

// ─── Types ──────────────────────────────────────────────────────────────────

interface Provider {
  name: string;
  verified: boolean;
}

interface PricingEntry {
  cycle: string;
  price: number;
}

interface ListingData {
  slug: string;
  name: string;
  resource_type: string;
  description?: string;
  provider: Provider;
  region: string;
  availability: string;
  specs: Record<string, string | number | undefined | null>;
  pricing: PricingEntry[];
  provisioning_sla?: string;
  support_target?: string;
}

interface AuthState {
  authenticated: boolean;
  emailVerified: boolean;
  betaAccess: "none" | "pending" | "approved" | "rejected";
}

interface OrderData {
  id: string;
  public_id: string;
  status: string;
  total: number;
  items: Array<{
    product_name: string;
    specs: Record<string, string | number | undefined | null>;
    billing_cycle: string;
    region: string;
    provisioning_sla?: string;
    unit_price: number;
    quantity: number;
    subtotal: number;
  }>;
  provider: Provider;
}

type CheckoutStep = "review" | "payment" | "success";

// ─── Helpers ────────────────────────────────────────────────────────────────

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="studio-eyebrow text-accent">{children}</p>;
}

// ─── Step indicator ─────────────────────────────────────────────────────────

function StepIndicator({ step }: { step: CheckoutStep }) {
  const steps = [
    { key: "review", label: "01", text: "Review Order" },
    { key: "payment", label: "02", text: "Pembayaran" },
    { key: "success", label: "03", text: "Selesai" },
  ] as const;

  const currentIndex = steps.findIndex((s) => s.key === step);

  return (
    <div className="flex items-center gap-0">
      {steps.map((s, i) => {
        const isActive = s.key === step;
        const isCompleted = i < currentIndex;

        return (
          <div key={s.key} className="flex items-center">
            <div className="flex items-center gap-2.5">
              <div
                className={`grid h-8 w-8 place-items-center rounded-lg border text-[11px] font-mono font-semibold transition-all duration-500 ${
                  isCompleted
                    ? "border-accent/40 bg-accent/10 text-accent"
                    : isActive
                      ? "border-accent/60 bg-accent text-accent-fg"
                      : "border-line text-fg-dim"
                }`}
              >
                {isCompleted ? (
                  <span className="material-symbols-outlined text-[14px]">
                    check
                  </span>
                ) : (
                  s.label
                )}
              </div>
              <span
                className={`hidden text-[12px] font-medium transition-all sm:block ${
                  isActive
                    ? "text-fg"
                    : isCompleted
                      ? "text-fg-muted"
                      : "text-fg-dim"
                }`}
              >
                {s.text}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`mx-3 h-px w-8 transition-colors duration-500 sm:w-12 ${
                  i < currentIndex ? "bg-accent/40" : "bg-line"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Skeleton ───────────────────────────────────────────────────────────────

function CheckoutSkeleton() {
  return (
    <div className="mx-auto max-w-[800px] space-y-6">
      <div className="h-4 w-40 animate-pulse rounded bg-fg/10" />
      <div className="h-12 w-3/5 animate-pulse rounded bg-accent/10" />
      <div className="flex gap-2">
        <div className="h-8 w-24 animate-pulse rounded-lg bg-surface-2" />
        <div className="h-8 w-24 animate-pulse rounded-lg bg-surface-2" />
        <div className="h-8 w-24 animate-pulse rounded-lg bg-surface-2" />
      </div>
      <div className="h-[320px] animate-pulse rounded-2xl bg-surface/50" />
      <div className="h-[120px] animate-pulse rounded-2xl bg-surface/50" />
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const slug = params.slug;

  const [listing, setListing] = useState<ListingData | null>(null);
  const [auth, setAuth] = useState<AuthState>({
    authenticated: false,
    emailVerified: false,
    betaAccess: "none",
  });
  const [selectedCycle, setSelectedCycle] = useState<string | null>(null);
  const [step, setStep] = useState<CheckoutStep>("review");
  const [order, setOrder] = useState<OrderData | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const orderCreatedRef = useRef(false);

  // ── Fetch data ──────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError(null);
      setNotFound(false);

      try {
        const listingRes = await api.get<{ data: ListingData }>(
          `/api/v1/marketplace/listings/${slug}`,
        );
        if (cancelled) return;
        const listingData = listingRes.data;
        setListing(listingData);

        if (listingData.pricing?.length > 0 && !selectedCycle) {
          const defaultPrice =
            listingData.pricing.find((p) => p.cycle === "monthly") ??
            listingData.pricing[0];
          setSelectedCycle(defaultPrice.cycle);
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
          // Not authenticated
        }
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiException && err.status === 404) {
          setNotFound(true);
        } else {
          setError(err instanceof Error ? err.message : "Gagal memuat data listing.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  // ── Create order ────────────────────────────────────────────────────────
  const handleCreateOrder = useCallback(async () => {
    if (!listing || !selectedCycle || orderCreatedRef.current) return;

    setSubmitting(true);
    setError(null);
    orderCreatedRef.current = true;

    try {
      const orderData = await api.post<OrderData>("/api/v1/orders", {
        listing_slug: listing.slug,
        billing_cycle: selectedCycle,
      });
      setOrder(orderData);

      // Demo: skip real payment gateway, show demo payment UI
      setShowPayment(true);
      setStep("payment");
    } catch (err) {
      orderCreatedRef.current = false;
      setError(
        err instanceof ApiException
          ? err.message
          : "Gagal membuat order. Silakan coba lagi.",
      );
    } finally {
      setSubmitting(false);
    }
  }, [listing, selectedCycle]);

  // ── Payment handlers ────────────────────────────────────────────────────
  const handlePaymentSuccess = useCallback(() => {
    setStep("success");
    if (order) {
      setTimeout(() => router.push(`/orders/${order.public_id}`), 2000);
    }
  }, [order, router]);

  const handlePaymentPending = useCallback(() => {
    if (order) {
      setTimeout(() => router.push(`/orders/${order.public_id}`), 3000);
    }
  }, [order, router]);

  // ── Selected price ──────────────────────────────────────────────────────
  const selectedPricing = listing?.pricing?.find((p) => p.cycle === selectedCycle);
  const totalPrice = selectedPricing?.price ?? 0;

  const orderItemsForSummary = order
    ? order.items
    : listing
      ? [
          {
            product_name: listing.name,
            specs: listing.specs,
            billing_cycle: selectedCycle ?? "monthly",
            region: listing.region,
            provisioning_sla: listing.provisioning_sla,
            unit_price: totalPrice,
            quantity: 1,
            subtotal: totalPrice,
          },
        ]
      : [];

  // ── Loading ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <main className="studio relative min-h-screen overflow-x-hidden">
        <ScrollRail />
        <StudioNav />
        <div className="pt-28 pb-24">
          <CheckoutSkeleton />
        </div>
      </main>
    );
  }

  // ── Not found ───────────────────────────────────────────────────────────
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
              Product listing dengan slug &ldquo;{slug}&rdquo; tidak tersedia.
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

  // ── Error ───────────────────────────────────────────────────────────────
  if (error && !listing) {
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
              Gagal Memuat Checkout
            </h1>
            <p className="mt-3 text-[14px] text-fg-muted">{error}</p>
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

  if (!listing) return null;

  // ── Beta access gate ────────────────────────────────────────────────────
  const canCheckout =
    auth.authenticated && auth.emailVerified && auth.betaAccess === "approved";

  if (!canCheckout && step === "review") {
    return (
      <main className="studio relative min-h-screen overflow-x-hidden">
        <ScrollRail />
        <StudioNav />

        <div className="relative mx-auto max-w-[540px] px-6 pt-36 pb-24 text-center">
          <div className="studio-card rounded-2xl border border-line bg-surface/50 p-10 backdrop-blur">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-xl border border-line bg-surface-2">
              <span className="material-symbols-outlined text-[28px] text-accent">
                lock
              </span>
            </div>

            <h2 className="studio-display mt-6 text-[24px] text-fg">
              Checkout Membutuhkan Akses
            </h2>

            {!auth.authenticated ? (
              <>
                <p className="mt-3 text-[14px] text-fg-muted">
                  Silakan daftar atau login terlebih dahulu untuk melakukan pemesanan.
                </p>
                <div className="mt-6 flex justify-center gap-3">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 rounded-lg border border-line-strong px-5 py-2.5 text-[13px] font-semibold text-fg transition-all hover:border-accent hover:bg-accent hover:text-accent-fg"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="rounded-lg border border-line px-5 py-2.5 text-[13px] font-semibold text-fg-muted transition-all hover:border-accent/50 hover:text-fg"
                  >
                    Daftar
                  </Link>
                </div>
              </>
            ) : !auth.emailVerified ? (
              <p className="mt-3 text-[14px] text-fg-muted">
                Silakan verifikasi email Anda terlebih dahulu sebelum melakukan pemesanan.
              </p>
            ) : auth.betaAccess === "pending" ? (
              <p className="mt-3 text-[14px] text-fg-muted">
                Permintaan beta access Anda sedang dalam proses review.
                Silakan tunggu persetujuan sebelum melakukan pemesanan.
              </p>
            ) : auth.betaAccess === "rejected" ? (
              <>
                <p className="mt-3 text-[14px] text-fg-muted">
                  Permintaan beta access sebelumnya ditolak. Anda bisa mengajukan kembali.
                </p>
                <Link
                  href="/beta-access"
                  className="mt-6 inline-flex items-center gap-2 rounded-lg border border-line-strong px-5 py-2.5 text-[13px] font-semibold text-fg transition-all hover:border-accent hover:bg-accent hover:text-accent-fg"
                >
                  Ajukan Beta Access
                </Link>
              </>
            ) : (
              <>
                <p className="mt-3 text-[14px] text-fg-muted">
                  Selama private beta, Anda perlu Beta Access untuk melakukan pemesanan.
                </p>
                <Link
                  href="/beta-access"
                  className="mt-6 inline-flex items-center gap-2 rounded-lg border border-line-strong px-5 py-2.5 text-[13px] font-semibold text-fg transition-all hover:border-accent hover:bg-accent hover:text-accent-fg"
                >
                  Ajukan Beta Access
                </Link>
              </>
            )}

            <Link
              href={`/marketplace/${slug}`}
              className="mt-6 block font-mono text-[11px] uppercase tracking-[0.14em] text-fg-dim transition-colors hover:text-accent"
            >
              ← Kembali ke detail produk
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // ── Success state ───────────────────────────────────────────────────────
  if (step === "success") {
    return (
      <main className="studio relative min-h-screen overflow-x-hidden">
        <ScrollRail />
        <StudioNav />

        <div className="relative mx-auto max-w-[540px] px-6 pt-36 pb-24 text-center">
          <div className="studio-card rounded-2xl border border-success/20 bg-surface/50 p-10 backdrop-blur">
            <div className="relative mx-auto grid h-20 w-20 place-items-center">
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background:
                    "radial-gradient(50% 50% at 50% 50%, rgba(108,232,166,0.15), transparent 70%)",
                }}
              />
              <div className="relative grid h-16 w-16 place-items-center rounded-full border border-success/20 bg-success/10">
                <span className="material-symbols-outlined text-[32px] text-success">
                  check_circle
                </span>
              </div>
            </div>
            <h2 className="studio-display mt-6 text-[28px] text-fg">
              Order Berhasil Dibuat!
            </h2>
            <p className="mt-3 text-[14px] text-fg-muted">
              {order
                ? `Order #${order.public_id} berhasil dibuat. Anda akan dialihkan ke detail order.`
                : "Order berhasil dibuat. Anda akan dialihkan."}
            </p>
            {order && (
              <Link
                href={`/orders/${order.public_id}`}
                className="mt-6 inline-flex items-center gap-2 rounded-lg border border-line-strong px-5 py-2.5 text-[13px] font-semibold text-fg transition-all hover:border-accent hover:bg-accent hover:text-accent-fg"
              >
                <span className="material-symbols-outlined text-[16px]">
                  receipt_long
                </span>
                Lihat Detail Order
              </Link>
            )}
          </div>
        </div>
      </main>
    );
  }

  // ── Main render ─────────────────────────────────────────────────────────
  return (
    <main className="studio relative min-h-screen overflow-x-hidden">
      <ScrollRail />
      <StudioNav />

      <div className="relative mx-auto max-w-[800px] px-6 pt-28 pb-24 sm:px-8">
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
          <Link
            href={`/marketplace/${slug}`}
            className="text-fg-dim transition-colors hover:text-accent"
          >
            {listing.name}
          </Link>
          <span className="text-line-strong">/</span>
          <span className="text-fg-muted">Checkout</span>
        </nav>

        {/* Title + step indicator */}
        <div className="mb-10">
          <Eyebrow>Checkout</Eyebrow>
          <h1 className="studio-hero-title mt-3 text-[clamp(32px,5vw,48px)] text-fg">
            Konfirmasi pesanan Anda
          </h1>
          <div className="mt-6">
            <StepIndicator step={step} />
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-lg border border-error/20 bg-error/5 px-5 py-4">
            <span className="material-symbols-outlined text-[18px] text-error">
              warning
            </span>
            <p className="text-[13px] text-error">{error}</p>
          </div>
        )}

        <RevealOnScroll>
          {/* Order Summary */}
          <div className="mb-6">
            <OrderSummary
              provider={listing.provider}
              items={orderItemsForSummary}
              total={order?.total ?? totalPrice}
            />
          </div>

          {/* Review step: billing cycle selector + confirm */}
          {step === "review" && !order && (
            <div className="rounded-2xl border border-line bg-surface/50 p-6 backdrop-blur sm:p-8">
              <div className="mb-5 flex items-center gap-2.5">
                <div className="grid h-8 w-8 place-items-center rounded-lg border border-line/80 bg-surface-2">
                  <span className="material-symbols-outlined text-[16px] text-accent">
                    recurring
                  </span>
                </div>
                <h3 className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-fg-dim">
                  Pilih Billing Cycle
                </h3>
              </div>

              <div className="mb-6 flex flex-wrap gap-3">
                {listing.pricing?.map((p) => {
                  const isSelected = selectedCycle === p.cycle;
                  return (
                    <button
                      key={p.cycle}
                      type="button"
                      onClick={() => setSelectedCycle(p.cycle)}
                      className={`group relative flex items-center gap-3 rounded-xl border px-5 py-3 text-[13px] font-medium transition-all duration-300 ${
                        isSelected
                          ? "border-accent/50 bg-accent/10 text-accent"
                          : "border-line bg-surface/50 text-fg-muted hover:border-fg-dim/30 hover:text-fg"
                      }`}
                    >
                      {/* Radio dot */}
                      <span
                        className={`grid h-4 w-4 place-items-center rounded-full border transition-all ${
                          isSelected
                            ? "border-accent bg-accent"
                            : "border-fg-dim/40"
                        }`}
                      >
                        {isSelected && (
                          <span className="h-1.5 w-1.5 rounded-full bg-accent-fg" />
                        )}
                      </span>
                      <span>
                        {p.cycle === "monthly"
                          ? "Per Bulan"
                          : p.cycle === "yearly"
                            ? "Per Tahun"
                            : p.cycle}
                      </span>
                      <span className="font-mono text-[11px] tabular-nums text-fg-dim">
                        {formatPrice(p.price)}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between border-t border-line pt-5">
                <Link
                  href={`/marketplace/${slug}`}
                  className="inline-flex items-center gap-2 rounded-lg border border-line px-4 py-2.5 text-[13px] font-semibold text-fg-muted transition-all hover:border-accent/50 hover:text-fg"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    arrow_back
                  </span>
                  Kembali
                </Link>

                <button
                  type="button"
                  onClick={handleCreateOrder}
                  disabled={submitting || !selectedCycle}
                  className={`inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-[13px] font-semibold transition-all ${
                    submitting || !selectedCycle
                      ? "cursor-not-allowed border border-line text-fg-dim"
                      : "border border-line-strong text-fg hover:border-accent hover:bg-accent hover:text-accent-fg"
                  }`}
                >
                  {submitting ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-fg/20 border-t-fg" />
                      Membuat Order…
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">
                        shopping_cart
                      </span>
                      Buat Order
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Payment step */}
          {step === "payment" && (
            <DemoPayment
              orderId={order?.public_id ?? ""}
              total={order?.total ?? totalPrice}
              onSuccess={handlePaymentSuccess}
              onPending={handlePaymentPending}
              onError={() => {}}
            />
          )}
        </RevealOnScroll>

        {/* Bottom safety net */}
        <div className="mt-10 border-t border-line pt-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-fg-dim">
              © 2026 JadeNode · Demo Payment Gateway
            </p>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-success pulse-dot" />
              <span className="text-[11px] text-fg-dim">
                Checkout aman & terenkripsi
              </span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
