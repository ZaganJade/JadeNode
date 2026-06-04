"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PriceCard } from "@/components/shared/price-card";

interface ProductTier {
  id: string;
  name: string;
  badge?: "popular" | "enterprise";
  specs: {
    cpu: string;
    ram: string;
    storage: string;
    bandwidth?: string;
  };
  monthlyPrice: number;
  yearlyPrice?: number;
  features: string[];
}

const VPS_TIERS: ProductTier[] = [
  {
    id: "vps-starter",
    name: "VPS Starter",
    specs: {
      cpu: "1 vCPU",
      ram: "1 GB RAM",
      storage: "20 GB SSD",
      bandwidth: "1 TB Transfer",
    },
    monthlyPrice: 50000,
    yearlyPrice: 480000,
    features: [
      "SLA 1 hari provisioning",
      "Standard Support",
      "Basic monitoring",
      "Weekly backup",
    ],
  },
  {
    id: "vps-basic",
    name: "VPS Basic",
    badge: "popular",
    specs: {
      cpu: "2 vCPU",
      ram: "2 GB RAM",
      storage: "40 GB SSD",
      bandwidth: "2 TB Transfer",
    },
    monthlyPrice: 100000,
    yearlyPrice: 960000,
    features: [
      "SLA 1 hari provisioning",
      "Priority Support",
      "Advanced monitoring",
      "Daily backup",
      "IPv6 included",
    ],
  },
  {
    id: "vps-pro",
    name: "VPS Pro",
    specs: {
      cpu: "4 vCPU",
      ram: "8 GB RAM",
      storage: "80 GB NVMe SSD",
      bandwidth: "4 TB Transfer",
    },
    monthlyPrice: 250000,
    yearlyPrice: 2400000,
    features: [
      "SLA 1 hari provisioning",
      "Priority Support",
      "Advanced monitoring",
      "Daily backup",
      "IPv6 included",
      "Free snapshot",
    ],
  },
  {
    id: "vps-enterprise",
    name: "VPS Enterprise",
    badge: "enterprise",
    specs: {
      cpu: "8 vCPU",
      ram: "16 GB RAM",
      storage: "160 GB NVMe SSD",
      bandwidth: "8 TB Transfer",
    },
    monthlyPrice: 500000,
    yearlyPrice: 4800000,
    features: [
      "SLA 6 jam provisioning",
      "24/7 Support",
      "Advanced monitoring + alerts",
      "Hourly backup",
      "IPv6 included",
      "Free snapshot",
      "Dedicated IP",
    ],
  },
  {
    id: "vps-ultra",
    name: "VPS Ultra",
    specs: {
      cpu: "16 vCPU",
      ram: "32 GB RAM",
      storage: "320 GB NVMe SSD",
      bandwidth: "16 TB Transfer",
    },
    monthlyPrice: 900000,
    yearlyPrice: 8640000,
    features: [
      "SLA 6 jam provisioning",
      "24/7 Support",
      "Advanced monitoring + alerts",
      "Hourly backup",
      "IPv6 included",
      "Free snapshot",
      "Dedicated IP",
      "Load balancer ready",
    ],
  },
];

const DEDICATED_TIERS: ProductTier[] = [
  {
    id: "dedicated-standard",
    name: "Dedicated Standard",
    specs: {
      cpu: "Intel Xeon E-2236 (6C/12T)",
      ram: "32 GB RAM",
      storage: "2x1 TB SSD",
      bandwidth: "20 TB Transfer",
    },
    monthlyPrice: 1500000,
    yearlyPrice: 14400000,
    features: [
      "SLA 3 hari provisioning",
      "24/7 Support",
      "Advanced monitoring",
      "Daily backup",
      "IPv4 + IPv6",
      "KVM over IP",
    ],
  },
  {
    id: "dedicated-performance",
    name: "Dedicated Performance",
    badge: "popular",
    specs: {
      cpu: "Intel Xeon Gold (16C/32T)",
      ram: "64 GB RAM",
      storage: "4x2 TB NVMe SSD",
      bandwidth: "50 TB Transfer",
    },
    monthlyPrice: 3000000,
    yearlyPrice: 28800000,
    features: [
      "SLA 3 hari provisioning",
      "24/7 Priority Support",
      "Advanced monitoring + alerts",
      "Daily backup",
      "IPv4 + IPv6",
      "KVM over IP",
      "Remote management",
    ],
  },
  {
    id: "dedicated-ultra",
    name: "Dedicated Ultra",
    badge: "enterprise",
    specs: {
      cpu: "Dual Intel Xeon Gold (32C/64T)",
      ram: "128 GB RAM",
      storage: "8x4 TB NVMe SSD",
      bandwidth: "Unmetered",
    },
    monthlyPrice: 6000000,
    yearlyPrice: 57600000,
    features: [
      "SLA 3 hari provisioning",
      "24/7 Priority Support",
      "Advanced monitoring + alerts",
      "Hourly backup",
      "IPv4 + IPv6",
      "KVM over IP",
      "Remote management",
      "DDoS Protection",
    ],
  },
];

export default function PricingPage() {
  const [category, setCategory] = useState<"vps" | "dedicated">("vps");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [particles, setParticles] = useState<Array<{ id: number; left: string; top: string; duration: string; delay: string }>>([]);

  const tiers = category === "vps" ? VPS_TIERS : DEDICATED_TIERS;

  // Generate particles on client side only
  useEffect(() => {
    setParticles(
      [...Array(12)].map((_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        duration: `${5 + Math.random() * 5}s`,
        delay: `${Math.random() * 2}s`,
      }))
    );
  }, []);

  // Handle category change with instant response
  const handleCategoryChange = (newCategory: "vps" | "dedicated") => {
    if (newCategory === category) return;
    setCategory(newCategory);
  };

  return (
    <main className="relative min-h-screen bg-bg overflow-hidden">
      {/* Ambient backdrop */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 bg-bg">
        <div className="absolute inset-0 grid-bg opacity-20" />
        <div className="ambient-glow glow-lime left-[-20%] top-[10%]" />
        <div className="ambient-glow glow-steel right-[-15%] top-[50%]" />

        {/* Animated particles */}
        {particles.length > 0 && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {particles.map((particle) => (
              <div
                key={particle.id}
                className="absolute w-1 h-1 rounded-full bg-accent/20"
                style={{
                  left: particle.left,
                  top: particle.top,
                  animation: `float ${particle.duration} ease-in-out infinite`,
                  animationDelay: particle.delay,
                }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-24">
        {/* Back button */}
        <div className="mb-8 animate-fadeIn" style={{ animationDelay: "0ms" }}>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg border border-line/60 bg-surface/60 px-4 py-2 text-sm text-fg-muted transition-all duration-300 hover:border-accent/40 hover:text-accent hover:bg-accent-soft/20 hover:-translate-x-1 group"
          >
            <span className="material-symbols-outlined text-[18px] transition-transform duration-300 group-hover:-translate-x-0.5">
              arrow_back
            </span>
            <span>Kembali ke Beranda</span>
          </Link>
        </div>

        {/* Hero */}
        <div className="text-center mb-12 animate-fadeIn" style={{ animationDelay: "100ms" }}>
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-2 mb-6 group">
            <span className="material-symbols-outlined text-accent text-[16px] animate-pulse">
              payments
            </span>
            <span className="font-mono text-[11px] uppercase tracking-wider text-accent">
              Transparent Pricing
            </span>
          </div>

          <h1 className="font-display text-4xl md:text-6xl font-bold text-fg mb-4">
            Pricing{" "}
            <span className="serif-italic text-accent">Jelas</span>
          </h1>

          <p className="text-lg text-fg-muted max-w-2xl mx-auto">
            Tidak ada hidden fee. Bayar apa yang Anda gunakan.
            Hemat hingga 20% dengan pembayaran tahunan.
          </p>
        </div>

        {/* Category Toggle */}
        <div className="flex justify-center mb-8 animate-fadeIn" style={{ animationDelay: "200ms" }}>
          <div className="inline-flex rounded-xl border border-line/60 bg-surface/60 p-1.5 shadow-lg">
            <button
              onClick={() => handleCategoryChange("vps")}
              className={`relative px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                category === "vps"
                  ? "bg-accent text-accent-fg shadow-md"
                  : "text-fg-muted hover:text-fg hover:bg-surface/80"
              }`}
            >
              {category === "vps" && (
                <span className="absolute inset-0 rounded-lg bg-accent/50 animate-ping opacity-20" />
              )}
              VPS
            </button>
            <button
              onClick={() => handleCategoryChange("dedicated")}
              className={`relative px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                category === "dedicated"
                  ? "bg-accent text-accent-fg shadow-md"
                  : "text-fg-muted hover:text-fg hover:bg-surface/80"
              }`}
            >
              {category === "dedicated" && (
                <span className="absolute inset-0 rounded-lg bg-accent/50 animate-ping opacity-20" />
              )}
              Dedicated
            </button>
          </div>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-10 animate-fadeIn" style={{ animationDelay: "300ms" }}>
          <div className="inline-flex items-center gap-2 rounded-xl border border-line/60 bg-surface/60 p-1.5">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                billingCycle === "monthly"
                  ? "bg-accent text-accent-fg shadow-md"
                  : "text-fg-muted hover:text-fg hover:bg-fg-dim/5"
              }`}
            >
              Bulanan
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                billingCycle === "yearly"
                  ? "bg-accent text-accent-fg shadow-md"
                  : "text-fg-muted hover:text-fg hover:bg-fg-dim/5"
              }`}
            >
              Tahunan
              <span className="inline-flex items-center gap-0.5 rounded bg-accent-fg/20 text-accent px-2 py-0.5 text-[10px] font-bold">
                -20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 auto-rows-fr">
          {tiers.map((tier, index) => (
            <PriceCard
              key={tier.id}
              name={tier.name}
              badge={tier.badge}
              specs={tier.specs}
              price={billingCycle === "monthly" ? tier.monthlyPrice : Math.floor((tier.yearlyPrice || tier.monthlyPrice * 12) / 12)}
              originalMonthlyPrice={tier.monthlyPrice}
              billingCycle={billingCycle}
              annualPrice={tier.yearlyPrice}
              features={tier.features}
              ctaHref="/marketplace"
              index={index}
            />
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-24 max-w-3xl mx-auto animate-fadeIn" style={{ animationDelay: "600ms" }}>
          <h2 className="font-display text-2xl font-semibold text-fg mb-8 text-center">
            Pertanyaan Umum
          </h2>

          <div className="space-y-4">
            {[
              {
                q: "Bagaimana cara billing?",
                a: "Billing dilakukan per bulan atau per tahun. Anda bisa memilih siklus billing saat order. Invoice otomatis dibuat setiap period.",
              },
              {
                q: "Apa kebijakan refund?",
                a: "Refund tersedia untuk penggunaan belum 7 hari sejak provisioning, dengan potongan biaya administrasi 10%. Hubungi support untuk request refund.",
              },
              {
                q: "Bagaimana SLA provisioning?",
                a: "SLA kami tergantung tipe produk: VPS (1 hari), Dedicated (3 hari). Jika terlambat, Anda berhak atas kompensasi berupa credit untuk bulan berikutnya.",
              },
              {
                q: "Apakah ada diskon untuk pembayaran tahunan?",
                a: "Ya! Hemat hingga 20% dengan pembayaran tahunan. Diskon otomatis diterapkan saat Anda pilih siklus billing tahunan.",
              },
            ].map((faq, i) => (
              <details
                key={i}
                className="group/details rounded-xl border border-line/60 bg-surface/40 overflow-hidden hover:border-accent/30 transition-all duration-300"
              >
                <summary className="cursor-pointer px-6 py-4 font-medium text-fg hover:bg-fg-dim/5 transition-colors flex items-center justify-between gap-4">
                  <span className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-accent text-[20px]">help</span>
                    {faq.q}
                  </span>
                  <span className="material-symbols-outlined transition-transform duration-300 group-open/details:rotate-180 shrink-0">
                    expand_more
                  </span>
                </summary>
                <div className="px-6 pb-4 text-fg-muted pl-14">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
            opacity: 0.2;
          }
          50% {
            transform: translateY(-20px);
            opacity: 0.5;
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out forwards;
          opacity: 0;
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </main>
  );
}
