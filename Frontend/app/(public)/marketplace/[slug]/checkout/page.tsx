"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api, ApiException } from "@/lib/api";
import { formatPrice } from "@/lib/formatters";
import { OrderSummary } from "@/features/checkout/components/order-summary";
import { PaymentStep } from "@/features/checkout/components/payment-step";

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

interface PayResponse {
  snap_token: string;
  redirect_url?: string;
}

type CheckoutStep = "review" | "payment" | "success";

// ─── Page ───────────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const slug = params.slug;

  // ── State ───────────────────────────────────────────────────────────────
  const [listing, setListing] = useState<ListingData | null>(null);
  const [auth, setAuth] = useState<AuthState>({
    authenticated: false,
    emailVerified: false,
    betaAccess: "none",
  });
  const [selectedCycle, setSelectedCycle] = useState<string | null>(null);
  const [step, setStep] = useState<CheckoutStep>("review");
  const [order, setOrder] = useState<OrderData | null>(null);
  const [snapToken, setSnapToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  // Idempotency: track if we already created an order for this slug
  const orderCreatedRef = useRef(false);

  // ── Fetch data ──────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError(null);
      setNotFound(false);

      try {
        // Fetch listing
        const listingData = await api.get<ListingData>(
          `/api/v1/marketplace/listings/${slug}`,
        );
        if (cancelled) return;
        setListing(listingData);

        // Auto-select first/default pricing cycle
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
          const hasBeta =
            session.capabilities?.includes("beta_access") ?? false;

          let betaAccess: AuthState["betaAccess"] = hasBeta
            ? "approved"
            : "none";
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
          setError(
            err instanceof Error ? err.message : "Gagal memuat data listing.",
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

      // Get snap token
      const payData = await api.post<PayResponse>(
        `/api/v1/orders/${orderData.public_id}/pay`,
      );
      setSnapToken(payData.snap_token);
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

  // ── Payment success handler ─────────────────────────────────────────────
  const handlePaymentSuccess = useCallback(() => {
    setStep("success");
    // Redirect to order detail after a short delay
    if (order) {
      setTimeout(() => {
        router.push(`/orders/${order.public_id}`);
      }, 2000);
    }
  }, [order, router]);

  // ── Payment pending handler ─────────────────────────────────────────────
  const handlePaymentPending = useCallback(() => {
    if (order) {
      setTimeout(() => {
        router.push(`/orders/${order.public_id}`);
      }, 3000);
    }
  }, [order, router]);

  // ── Loading skeleton ────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0B00] px-6 py-16">
        <div className="mx-auto max-w-[800px] space-y-6">
          <div className="h-4 w-32 animate-pulse rounded bg-[rgba(255,191,0,0.1)]" />
          <div className="h-10 w-2/3 animate-pulse rounded bg-[rgba(255,191,0,0.08)]" />
          <div className="h-[300px] animate-pulse rounded-2xl bg-[rgba(255,191,0,0.06)]" />
          <div className="h-[100px] animate-pulse rounded-2xl bg-[rgba(255,191,0,0.04)]" />
        </div>
      </div>
    );
  }

  // ── Not found ───────────────────────────────────────────────────────────
  if (notFound) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0D0B00] px-6 text-center">
        <div className="rounded-2xl border border-[rgba(255,191,0,0.08)] bg-[rgba(25,20,0,0.4)] p-10 backdrop-blur-[24px]">
          <h1 className="text-2xl font-bold text-[#F5F5F0]">
            Product Listing Tidak Ditemukan
          </h1>
          <p className="mt-3 text-sm text-[#F5F5F0]/50">
            Product listing dengan slug &ldquo;{slug}&rdquo; tidak tersedia.
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
  if (error && !listing) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0D0B00] px-6 text-center">
        <div className="rounded-2xl border border-error-500/20 bg-[rgba(25,20,0,0.4)] p-10 backdrop-blur-[24px]">
          <h1 className="text-2xl font-bold text-[#F5F5F0]">
            Gagal Memuat Checkout
          </h1>
          <p className="mt-3 text-sm text-[#F5F5F0]/50">{error}</p>
          <div className="mt-6 flex gap-3 justify-center">
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

  if (!listing) return null;

  // ── Beta access gate ────────────────────────────────────────────────────
  const canCheckout =
    auth.authenticated &&
    auth.emailVerified &&
    auth.betaAccess === "approved";

  if (!canCheckout && step === "review") {
    return (
      <div className="min-h-screen bg-[#0D0B00]">
        <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute -left-40 top-0 h-[800px] w-[800px] rounded-full bg-[rgba(255,191,0,0.03)] blur-[120px]" />
        </div>

        <div className="relative mx-auto max-w-[600px] px-6 py-24 text-center">
          <div className="rounded-2xl border border-[rgba(255,191,0,0.10)] bg-[rgba(25,20,0,0.5)] p-10 backdrop-blur-[24px]">
            <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-warning-500/10">
              <svg className="h-8 w-8 text-warning-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>

            <h2 className="mt-6 text-xl font-bold text-[#F5F5F0]">
              Checkout Membutuhkan Akses
            </h2>

            {!auth.authenticated ? (
              <>
                <p className="mt-3 text-sm text-[#F5F5F0]/50">
                  Silakan daftar atau login terlebih dahulu untuk melakukan pemesanan.
                </p>
                <div className="mt-6 flex gap-3 justify-center">
                  <Link
                    href="/login"
                    className="inline-flex items-center rounded-full bg-[#FFBF00] px-6 py-2.5 text-sm font-semibold text-[#0D0B00] shadow-[0_0_20px_rgba(255,191,0,0.25)]"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="rounded-full border border-[rgba(255,191,0,0.12)] bg-[rgba(25,20,0,0.6)] px-6 py-2.5 text-sm font-medium text-[#F5F5F0]/60 transition-colors hover:border-[rgba(255,191,0,0.3)] hover:text-[#F5F5F0]"
                  >
                    Daftar
                  </Link>
                </div>
              </>
            ) : !auth.emailVerified ? (
              <p className="mt-3 text-sm text-[#F5F5F0]/50">
                Silakan verifikasi email Anda terlebih dahulu sebelum melakukan pemesanan.
              </p>
            ) : auth.betaAccess === "pending" ? (
              <p className="mt-3 text-sm text-[#F5F5F0]/50">
                Permintaan beta access Anda sedang dalam proses review.
                Silakan tunggu persetujuan sebelum melakukan pemesanan.
              </p>
            ) : auth.betaAccess === "rejected" ? (
              <>
                <p className="mt-3 text-sm text-[#F5F5F0]/50">
                  Permintaan beta access sebelumnya ditolak. Anda bisa mengajukan kembali.
                </p>
                <Link
                  href="/beta-access"
                  className="mt-6 inline-flex items-center rounded-full bg-[#FFBF00] px-6 py-2.5 text-sm font-semibold text-[#0D0B00] shadow-[0_0_20px_rgba(255,191,0,0.25)]"
                >
                  Ajukan Beta Access
                </Link>
              </>
            ) : (
              <>
                <p className="mt-3 text-sm text-[#F5F5F0]/50">
                  Selama private beta, Anda perlu Beta Access untuk melakukan pemesanan.
                </p>
                <Link
                  href="/beta-access"
                  className="mt-6 inline-flex items-center rounded-full bg-[#FFBF00] px-6 py-2.5 text-sm font-semibold text-[#0D0B00] shadow-[0_0_20px_rgba(255,191,0,0.25)]"
                >
                  Ajukan Beta Access
                </Link>
              </>
            )}

            <Link
              href={`/marketplace/${slug}`}
              className="mt-6 block text-sm text-[#FFBF00]/60 transition-colors hover:text-[#FFBF00]"
            >
              Kembali ke detail produk
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Selected price ──────────────────────────────────────────────────────
  const selectedPricing = listing.pricing?.find(
    (p) => p.cycle === selectedCycle,
  );
  const totalPrice = selectedPricing?.price ?? 0;

  // ── Build order items for OrderSummary ──────────────────────────────────
  const orderItemsForSummary = order
    ? order.items
    : [
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
      ];

  // ── Success state ───────────────────────────────────────────────────────
  if (step === "success") {
    return (
      <div className="min-h-screen bg-[#0D0B00]">
        <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute left-1/2 top-1/4 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-[rgba(34,197,94,0.05)] blur-[120px]" />
        </div>
        <div className="relative mx-auto max-w-[600px] px-6 py-24 text-center">
          <div className="rounded-2xl border border-success-500/20 bg-[rgba(25,20,0,0.4)] p-10 backdrop-blur-[24px]">
            <div className="flex h-20 w-20 mx-auto items-center justify-center rounded-full bg-success-500/10">
              <svg className="h-10 w-10 text-success-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h2 className="mt-6 text-2xl font-bold text-[#F5F5F0]">
              Order Berhasil Dibuat!
            </h2>
            <p className="mt-3 text-sm text-[#F5F5F0]/50">
              {order
                ? `Order #${order.public_id} berhasil dibuat. Anda akan dialihkan ke detail order.`
                : "Order berhasil dibuat. Anda akan dialihkan."}
            </p>
            {order && (
              <Link
                href={`/orders/${order.public_id}`}
                className="mt-6 inline-flex items-center rounded-full bg-[#FFBF00] px-6 py-2.5 text-sm font-semibold text-[#0D0B00] shadow-[0_0_20px_rgba(255,191,0,0.25)]"
              >
                Lihat Detail Order
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Main render ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0D0B00]">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-40 top-0 h-[800px] w-[800px] rounded-full bg-[rgba(255,191,0,0.03)] blur-[120px]" />
        <div className="absolute -right-40 top-1/3 h-[600px] w-[600px] rounded-full bg-[rgba(255,165,0,0.02)] blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-[800px] px-6 py-16 sm:px-8">
        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center gap-2 text-xs text-[#F5F5F0]/40">
          <Link href="/marketplace" className="transition-colors hover:text-[#FFBF00]">
            Marketplace
          </Link>
          <span>/</span>
          <Link
            href={`/marketplace/${slug}`}
            className="transition-colors hover:text-[#FFBF00]"
          >
            {listing.name}
          </Link>
          <span>/</span>
          <span className="text-[#F5F5F0]/60">Checkout</span>
        </nav>

        {/* Title */}
        <h1
          className="mb-8 text-3xl font-bold"
          style={{
            background: "linear-gradient(135deg, #F5F5F0, #FFBF00, #FFA500)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Checkout
        </h1>

        {/* Step indicator */}
        <div className="mb-8 flex items-center gap-3 text-xs">
          <span
            className={`inline-flex h-8 items-center rounded-full px-3 ${
              step === "review"
                ? "border border-[#FFBF00]/30 bg-[#FFBF00]/10 text-[#FFBF00]"
                : "border border-[rgba(255,191,0,0.08)] bg-[rgba(25,20,0,0.3)] text-[#F5F5F0]/40"
            }`}
          >
            1. Review Order
          </span>
          <svg className="h-3 w-3 text-[#FFBF00]/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
          <span
            className={`inline-flex h-8 items-center rounded-full px-3 ${
              step === "payment"
                ? "border border-[#FFBF00]/30 bg-[#FFBF00]/10 text-[#FFBF00]"
                : "border border-[rgba(255,191,0,0.08)] bg-[rgba(25,20,0,0.3)] text-[#F5F5F0]/40"
            }`}
          >
            2. Pembayaran
          </span>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-6 rounded-xl border border-error-500/20 bg-error-500/5 p-4 text-sm text-error-400">
            {error}
          </div>
        )}

        {/* Order Summary */}
        <div className="mb-6">
          <OrderSummary
            provider={listing.provider}
            items={orderItemsForSummary}
            total={order?.total ?? totalPrice}
          />
        </div>

        {/* Review step: billing cycle selector + confirm button */}
        {step === "review" && !order && (
          <div className="rounded-2xl border border-[rgba(255,191,0,0.08)] bg-[rgba(25,20,0,0.4)] p-8 backdrop-blur-[24px]">
            <h3 className="mb-4 font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-[#FFBF00]/60">
              Pilih Billing Cycle
            </h3>

            <div className="mb-6 flex flex-wrap gap-3">
              {listing.pricing?.map((p) => (
                <button
                  key={p.cycle}
                  type="button"
                  onClick={() => setSelectedCycle(p.cycle)}
                  className={`rounded-full border px-5 py-2 text-sm font-medium transition-all ${
                    selectedCycle === p.cycle
                      ? "border-[#FFBF00]/30 bg-[#FFBF00]/10 text-[#FFBF00]"
                      : "border-[rgba(255,191,0,0.08)] bg-[rgba(25,20,0,0.3)] text-[#F5F5F0]/60 hover:border-[rgba(255,191,0,0.2)] hover:text-[#F5F5F0]"
                  }`}
                >
                  <span>
                    {p.cycle === "monthly"
                      ? "Per Bulan"
                      : p.cycle === "yearly"
                        ? "Per Tahun"
                        : p.cycle}
                  </span>
                  <span className="ml-2 text-xs opacity-70">
                    {formatPrice(p.price)}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between border-t border-[rgba(255,191,0,0.08)] pt-4">
              <Link
                href={`/marketplace/${slug}`}
                className="rounded-full border border-[rgba(255,191,0,0.12)] bg-[rgba(25,20,0,0.6)] px-5 py-2.5 text-sm font-medium text-[#F5F5F0]/60 transition-colors hover:border-[rgba(255,191,0,0.3)] hover:text-[#F5F5F0]"
              >
                Kembali
              </Link>

              <button
                type="button"
                onClick={handleCreateOrder}
                disabled={submitting || !selectedCycle}
                className={`inline-flex items-center rounded-full px-6 py-2.5 text-sm font-semibold transition-all ${
                  submitting || !selectedCycle
                    ? "cursor-not-allowed bg-[rgba(255,191,0,0.1)] text-[#F5F5F0]/30"
                    : "bg-[#FFBF00] text-[#0D0B00] shadow-[0_0_20px_rgba(255,191,0,0.25)] hover:shadow-[0_0_30px_rgba(255,191,0,0.4)]"
                }`}
              >
                {submitting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-[#0D0B00]/20 border-t-[#0D0B00]" />
                    Membuat Order...
                  </>
                ) : (
                  "Buat Order"
                )}
              </button>
            </div>
          </div>
        )}

        {/* Payment step */}
        {step === "payment" && snapToken && (
          <PaymentStep
            snapToken={snapToken}
            orderId={order?.public_id ?? ""}
            onSuccess={handlePaymentSuccess}
            onPending={handlePaymentPending}
            onError={() => {}}
            onClose={() => {}}
          />
        )}
      </div>
    </div>
  );
}
