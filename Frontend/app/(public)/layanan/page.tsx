"use client";

import Link from "next/link";
import { RevealOnScroll } from "@/components/landing/reveal-on-scroll";
import { StudioNav } from "@/components/landing/studio/studio-nav";
import { ScrollRail } from "@/components/landing/studio/scroll-rail";
import { formatPrice } from "@/lib/formatters";

/* ═════════════════════════════════════════════════════════════════════════
   DATA
   ═════════════════════════════════════════════════════════════════════════ */

const SERVICE_CATEGORIES = [
  {
    id: "vps",
    icon: "memory",
    color: "#ff7400",
    title: "VPS (Virtual Private Server)",
    tagline: "Performa cloud dengan kontrol penuh.",
    description:
      "Server virtual dengan resource dedicated — CPU, RAM, dan storage yang tidak dibagi dengan pengguna lain. Cocok untuk web app, API server, database, dan staging environment.",
    highlights: [
      "Resource dedicated (bukan shared)",
      "Full root/admin access",
      "Pilihan OS: Ubuntu, Debian, CentOS, AlmaLinux",
      "Provisioning SLA 6 jam – 1 hari",
      "Mulai dari Rp 50.000/bulan",
    ],
    tiers: [
      {
        name: "Starter",
        price: 50000,
        specs: "1 vCPU · 1 GB · 20 GB SSD",
      },
      {
        name: "Basic",
        price: 100000,
        specs: "2 vCPU · 2 GB · 40 GB SSD",
        popular: true,
      },
      {
        name: "Pro",
        price: 250000,
        specs: "4 vCPU · 8 GB · 80 GB NVMe",
      },
      {
        name: "Enterprise",
        price: 500000,
        specs: "8 vCPU · 16 GB · 160 GB NVMe",
      },
      {
        name: "Ultra",
        price: 900000,
        specs: "16 vCPU · 32 GB · 320 GB NVMe",
      },
    ],
    useCases: [
      "Web hosting & aplikasi web",
      "REST API & microservices",
      "Database server (MySQL, PostgreSQL, Redis)",
      "CI/CD runner & build server",
      "Game server kecil",
    ],
  },
  {
    id: "dedicated",
    icon: "dns",
    color: "#3b82f6",
    title: "Dedicated Server",
    tagline: "Hardware fisik, kekuatan tanpa kompromi.",
    description:
      "Server fisik eksklusif milik Anda sendiri. Tidak ada hypervisor, tidak ada resource sharing — semua kekuatan hardware untuk beban kerja berat, high-traffic, dan workload mission-critical.",
    highlights: [
      "Hardware fisik eksklusif",
      "Intel Xeon series processor",
      "Hingga 128 GB RAM + NVMe SSD",
      "Provisioning SLA 3 hari",
      "KVM over IP + remote management",
    ],
    tiers: [
      {
        name: "Standard",
        price: 1500000,
        specs: "Xeon E-2236 · 32 GB · 2×1 TB SSD",
      },
      {
        name: "Performance",
        price: 3000000,
        specs: "Xeon Gold 16C · 64 GB · 4×2 TB NVMe",
        popular: true,
      },
      {
        name: "Ultra",
        price: 6000000,
        specs: "Dual Xeon Gold 32C · 128 GB · 8×4 TB NVMe",
      },
    ],
    useCases: [
      "High-traffic website & e-commerce",
      "Big data & analytics workload",
      "Virtualization & private cloud",
      "Database cluster besar",
      "Enterprise application hosting",
    ],
  },
];

const ADDITIONAL_SERVICES = [
  {
    icon: "lan",
    color: "#8b5cf6",
    title: "Load Balancer",
    description: "Distribusi traffic otomatis ke multiple server untuk high availability dan zero-downtime deployment.",
  },
  {
    icon: "cloud",
    color: "#10b981",
    title: "Object Storage",
    description: "Penyimpanan file dan aset statis yang scalable — cocok untuk media, backup, dan distribusi konten.",
  },
  {
    icon: "public",
    color: "#f59e0b",
    title: "Public IP & Network",
    description: "IPv4 dan IPv6 dedicated, VPC private network, dan bandwidth besar untuk kebutuhan konektivitas.",
  },
  {
    icon: "security",
    color: "#ef4444",
    title: "DDoS Protection",
    description: "Proteksi otomatis dari serangan DDoS hingga ratusan Gbps — uptime Anda tetap terjaga.",
  },
  {
    icon: "backup",
    color: "#06b6d4",
    title: "Managed Backup",
    description: "Backup otomatis harian atau per jam dengan retention policy fleksibel dan restore cepat.",
  },
  {
    icon: "monitoring",
    color: "#84cc16",
    title: "Monitoring & Alerts",
    description: "Resource monitoring real-time, custom alert threshold, dan notifikasi proaktif ke email & webhook.",
  },
];

const WHY_JADENODE = [
  {
    icon: "verified",
    title: "Provider Terverifikasi",
    description: "Setiap provider dalam marketplace kami telah melalui proses verifikasi kualitas dan reliabilitas.",
  },
  {
    icon: "receipt_long",
    title: "Billing Transparan",
    description: "Invoice rinci, riwayat pembayaran lengkap, dan audit trail untuk setiap transaksi keuangan.",
  },
  {
    icon: "shield",
    title: "SLA Terjamin",
    description: "Provisioning SLA 6 jam – 3 hari. Jika terlambat, ada kompensasi yang jelas dan terukur.",
  },
  {
    icon: "support_agent",
    title: "Dukungan 24/7",
    description: "Tim support teknis siap membantu kapan saja — eskalasi cepat saat terjadi insiden.",
  },
];

/* ═════════════════════════════════════════════════════════════════════════
   HELPERS
   ═════════════════════════════════════════════════════════════════════════ */

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="studio-eyebrow text-accent">{children}</p>;
}

/* ═════════════════════════════════════════════════════════════════════════
   PAGE
   ═════════════════════════════════════════════════════════════════════════ */

export default function LayananPage() {
  return (
    <main className="studio relative min-h-screen overflow-x-hidden">
      <ScrollRail />
      <StudioNav />

      {/* ───────────────────────── HERO ───────────────────────── */}
      <section className="border-b border-line/60">
        <div className="mx-auto w-full max-w-[1320px] px-6 pt-28 pb-16">
          <div className="flex items-center gap-3">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
            </span>
            <Eyebrow>Layanan · produk & infrastruktur</Eyebrow>
          </div>

          <h1 className="studio-hero-title mt-5 text-[clamp(40px,7vw,92px)] text-fg">
            Layanan
            <br />
            <span className="text-accent">infrastruktur cloud</span>
            <br />
            untuk setiap skala.
          </h1>

          <p className="mt-6 max-w-2xl text-[15px] leading-relaxed text-fg-muted">
            Dari VPS entry-level hingga Dedicated Server enterprise — semua
            tersedia di marketplace kami dengan provisioning terjamin SLA,
            billing transparan, dan dukungan 24/7.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/marketplace"
              className="group inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-[14px] font-semibold text-black transition-transform duration-200 hover:-translate-y-0.5"
            >
              Lihat katalog
              <span className="material-symbols-outlined text-[18px] transition-transform duration-300 group-hover:translate-x-0.5">
                north_east
              </span>
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-white/[0.03] px-6 py-3 text-[14px] font-medium text-fg backdrop-blur transition-colors hover:border-accent hover:text-accent"
            >
              Bandingkan harga
            </Link>
          </div>
        </div>
      </section>

      <RevealOnScroll>
        {/* ─────────────────── MAIN SERVICES ─────────────────── */}
        {SERVICE_CATEGORIES.map((service, sIdx) => (
          <section
            key={service.id}
            id={service.id}
            className={`${
              sIdx > 0 ? "border-t border-line/60" : ""
            } bg-surface/20`}
          >
            <div className="mx-auto max-w-[1320px] px-6 py-24 lg:py-28">
              <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
                {/* Left: Info */}
                <div className="reveal-rise">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-xl"
                      style={{
                        backgroundColor: `${service.color}14`,
                        border: `1px solid ${service.color}24`,
                      }}
                    >
                      <span
                        className="material-symbols-outlined text-[20px]"
                        style={{
                          color: service.color,
                          fontVariationSettings:
                            '"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20',
                        }}
                      >
                        {service.icon}
                      </span>
                    </div>
                    <Eyebrow>{service.title}</Eyebrow>
                  </div>

                  <h2 className="studio-display mt-5 text-[clamp(30px,4.5vw,56px)] text-fg">
                    {service.tagline}
                  </h2>

                  <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-fg-muted">
                    {service.description}
                  </p>

                  {/* Highlights */}
                  <ul className="mt-8 space-y-3">
                    {service.highlights.map((h) => (
                      <li
                        key={h}
                        className="flex items-start gap-2.5 text-[13px] text-fg-muted"
                      >
                        <span
                          className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ backgroundColor: service.color }}
                        />
                        {h}
                      </li>
                    ))}
                  </ul>

                  {/* Use cases */}
                  <div className="mt-10">
                    <p className="studio-eyebrow text-[8px] text-fg-dim">
                      COCOK UNTUK
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {service.useCases.map((uc) => (
                        <span
                          key={uc}
                          className="rounded-full border border-line/80 bg-surface/40 px-3 py-1.5 text-[11px] text-fg-muted"
                        >
                          {uc}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right: Tier cards */}
                <div className="reveal-rise space-y-3">
                  {service.tiers.map((tier) => (
                    <div
                      key={tier.name}
                      className={`group relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 hover:bg-surface ${
                        tier.popular
                          ? "border-accent/30 bg-accent-soft"
                          : "border-line bg-surface/50"
                      }`}
                    >
                      {tier.popular && (
                        <span className="absolute right-4 top-4 rounded-full bg-accent/20 px-2.5 py-0.5 studio-eyebrow text-[7px] font-bold uppercase tracking-wider text-accent">
                          Populer
                        </span>
                      )}
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <h3 className="studio-display text-[16px] font-semibold text-fg">
                            {service.title.split(" ")[0]} {tier.name}
                          </h3>
                          <p className="mt-1 font-mono text-[11px] text-fg-dim">
                            {tier.specs}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p
                            className="text-[18px] font-bold"
                            style={{ color: service.color }}
                          >
                            {formatPrice(tier.price, "IDR")}
                          </p>
                          <p className="text-[10px] text-fg-dim">/bulan</p>
                        </div>
                      </div>
                    </div>
                  ))}

                  <Link
                    href="/marketplace"
                    className="group mt-4 flex items-center justify-center gap-2 rounded-2xl border border-dashed border-line-strong py-4 text-[13px] font-medium text-fg-muted transition-all hover:border-accent/40 hover:text-accent"
                  >
                    <span
                      className="material-symbols-outlined text-[18px]"
                      style={{
                        fontVariationSettings:
                          '"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20',
                      }}
                    >
                      add
                    </span>
                    Lihat semua varian di marketplace
                    <span className="material-symbols-outlined text-[14px] transition-transform group-hover:translate-x-0.5">
                      north_east
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          </section>
        ))}

        {/* ─────────────────── ADDITIONAL SERVICES ─────────────────── */}
        <section className="border-t border-line/60">
          <div className="mx-auto max-w-[1320px] px-6 py-24 lg:py-28">
            <div className="reveal-rise mb-12">
              <Eyebrow>Layanan tambahan</Eyebrow>
              <h2 className="studio-display mt-5 max-w-2xl text-[clamp(30px,4.5vw,48px)] text-fg">
                Ekosistem lengkap untuk infrastruktur Anda.
              </h2>
              <p className="mt-4 max-w-lg text-[14px] leading-relaxed text-fg-muted">
                Selain compute, kami menyediakan layanan pendukung untuk menjaga
                infrastruktur tetap aman, cepat, dan dapat diandalkan.
              </p>
            </div>

            <div className="reveal-rise grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {ADDITIONAL_SERVICES.map((svc) => (
                <div
                  key={svc.title}
                  className="group rounded-2xl border border-line bg-surface/50 p-6 transition-all duration-300 hover:border-line-strong hover:bg-surface"
                >
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{
                      backgroundColor: `${svc.color}14`,
                      border: `1px solid ${svc.color}24`,
                    }}
                  >
                    <span
                      className="material-symbols-outlined text-[20px]"
                      style={{
                        color: svc.color,
                        fontVariationSettings:
                          '"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20',
                      }}
                    >
                      {svc.icon}
                    </span>
                  </div>
                  <h3 className="studio-display mt-4 text-[16px] font-semibold text-fg">
                    {svc.title}
                  </h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-fg-muted">
                    {svc.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─────────────────── WHY JADENODE ─────────────────── */}
        <section className="border-t border-line/60 bg-surface/20">
          <div className="mx-auto max-w-[1320px] px-6 py-24 lg:py-28">
            <div className="reveal-rise mb-12">
              <Eyebrow>Kenapa JadeNode</Eyebrow>
              <h2 className="studio-display mt-5 max-w-2xl text-[clamp(30px,4.5vw,48px)] text-fg">
                Bukan cuma jual server.
              </h2>
            </div>

            <div className="reveal-rise grid gap-4 sm:grid-cols-2">
              {WHY_JADENODE.map((item) => (
                <div
                  key={item.title}
                  className="flex gap-4 rounded-2xl border border-line bg-surface/50 p-6 transition-all duration-300 hover:border-line-strong hover:bg-surface"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft">
                    <span
                      className="material-symbols-outlined text-[20px] text-accent"
                      style={{
                        fontVariationSettings:
                          '"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20',
                      }}
                    >
                      {item.icon}
                    </span>
                  </div>
                  <div>
                    <h3 className="studio-display text-[15px] font-semibold text-fg">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-[13px] leading-relaxed text-fg-muted">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─────────────────── CTA ─────────────────── */}
        <section className="border-t border-line/60">
          <div className="mx-auto max-w-[1320px] px-6 py-24 lg:py-28">
            <div className="reveal-rise text-center">
              <Eyebrow>Siap memulai?</Eyebrow>
              <h2 className="studio-display mt-5 text-[clamp(30px,4.5vw,48px)] text-fg">
                Temukan layanan yang tepat untuk Anda.
              </h2>
              <p className="mx-auto mt-4 max-w-md text-[14px] leading-relaxed text-fg-muted">
                Browse katalog lengkap kami, bandingkan harga, dan order langsung
                — provisioning dimulai segera setelah pembayaran dikonfirmasi.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/marketplace"
                  className="group inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-[14px] font-semibold text-black transition-transform duration-200 hover:-translate-y-0.5"
                >
                  Buka marketplace
                  <span className="material-symbols-outlined text-[18px] transition-transform duration-300 group-hover:translate-x-0.5">
                    north_east
                  </span>
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-white/[0.03] px-6 py-3 text-[14px] font-medium text-fg backdrop-blur transition-colors hover:border-accent hover:text-accent"
                >
                  Lihat daftar harga
                </Link>
              </div>
            </div>
          </div>
        </section>
      </RevealOnScroll>

      {/* ───────────────────────── FOOTER ───────────────────────── */}
      <footer className="border-t border-line/70 px-6 py-10">
        <div className="mx-auto flex max-w-[1320px] items-center justify-between">
          <span className="studio-eyebrow text-[10px] text-fg-dim">
            © 2026 JadeNode Marketplace
          </span>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-[13px] text-fg-muted transition-colors hover:text-fg"
            >
              Beranda
            </Link>
            <Link
              href="/marketplace"
              className="text-[13px] text-fg-muted transition-colors hover:text-fg"
            >
              Marketplace
            </Link>
            <Link
              href="/pricing"
              className="text-[13px] text-fg-muted transition-colors hover:text-fg"
            >
              Harga
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
