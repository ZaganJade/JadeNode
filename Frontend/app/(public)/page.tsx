import Link from "next/link";
import { RevealOnScroll } from "@/components/landing/reveal-on-scroll";
import { BetaAccessForm } from "@/components/landing/beta-access-form";
import { StudioNav } from "@/components/landing/studio/studio-nav";
import { ScrollRail } from "@/components/landing/studio/scroll-rail";
import { NetworkPaths } from "@/components/landing/studio/network-paths";
import { NodeCluster } from "@/components/landing/studio/node-cluster";
import { CatalogExplorer } from "@/components/landing/studio/catalog-explorer";
import { RegionGlobe } from "@/components/landing/studio/region-globe";
import { LandingArticles } from "@/components/landing/landing-articles";

const HERO_STATS = [
  { value: "450+", label: "Node aktif" },
  { value: "24/7", label: "Dukungan teknis" },
  { value: "99.9%", label: "Uptime · 90 hari" },
];

const AVAILABILITY_BULLETS = [
  "Provisioning cepat & efisien",
  "Provider tersertifikasi",
  "Region Indonesia & Asia Tenggara",
];

const SUPPORT_BULLETS = [
  "Penanganan insiden menyeluruh",
  "Eskalasi cepat saat downtime",
  "Solusi pada harga kompetitif",
];

const DX_FEATURES = [
  { icon: "code", label: "OpenAPI 3.1 contract", value: "REST + Webhooks" },
  { icon: "key", label: "Autentikasi", value: "Sanctum Bearer" },
  { icon: "replay", label: "Idempotency", value: "Idempotency-Key" },
  { icon: "fingerprint", label: "Public IDs", value: "ULID" },
];

const REVIEWS = [
  {
    quote:
      "Provisioning yang dijanjikan benar-benar terpenuhi. Order sore, malamnya VPS sudah jalan dengan SLA yang jelas.",
    name: "Alia Rahmawati",
    org: "Lead Infra · Kirana Commerce",
  },
  {
    quote:
      "Invoice dan pembayaran Midtrans-nya rapi dan auditable. Tim finance kami akhirnya berhenti mengejar bukti bayar manual.",
    name: "Bagas Pranata",
    org: "CTO · Loka Logistics",
  },
  {
    quote:
      "Dukungan 24/7 yang bukan sekadar tiket. Saat satu node bermasalah, eskalasinya cepat dan transparan.",
    name: "Sofia Wijaya",
    org: "Platform Eng · Nimbus Media",
  },
];

const CODE_EXAMPLE = `$ curl -X POST https://api.jadenode.id/v1/orders \\
  -H "Authorization: Bearer $JN_TOKEN" \\
  -H "Idempotency-Key: $(uuidgen)" \\
  -d '{
    "listing_id": "01HVQ2W7H6Y4...JKT",
    "billing_cycle": "monthly"
  }'`;

const FOOTER_COLUMNS = [
  {
    label: "Navigasi",
    items: [
      { text: "Katalog", href: "/marketplace" },
      { text: "Lifecycle", href: "/lifecycle" },
      { text: "Layanan", href: "/layanan" },
      { text: "Harga", href: "/pricing" },
      { text: "Ajukan akses", href: "#mulai" },
      { text: "Artikel", href: "/articles" },
    ],
  },
  {
    label: "Perusahaan",
    items: [
      { text: "Tentang", href: "#about" },
      { text: "Provider", href: "/marketplace" },
      { text: "Status SLA", href: "#" },
      { text: "Dukungan", href: "#mulai" },
    ],
  },
  {
    label: "Developer",
    items: [
      { text: "API Docs", href: "/docs" },
      { text: "Webhooks", href: "#developers" },
      { text: "Idempotency", href: "#developers" },
      { text: "SDK", href: "#" },
    ],
  },
];

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="studio-eyebrow text-accent">{children}</p>;
}

export default function PublicHomePage() {
  return (
    <main className="studio relative min-h-screen overflow-x-hidden">
      <ScrollRail />
      <StudioNav />

      {/* ───────────────────────── HERO ───────────────────────── */}
      <section className="relative isolate flex min-h-[92vh] flex-col justify-center overflow-hidden">
        {/* Network-routing paths + static glow fallback */}
        <div className="studio-streaks-fallback pointer-events-none absolute inset-0 -z-10" />
        <div className="pointer-events-none absolute inset-0 -z-10">
          <NetworkPaths />
        </div>
        {/* bottom vignette so the network dissolves into black */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-1/3 bg-gradient-to-b from-transparent to-black" />

        <div className="mx-auto w-full max-w-[1320px] px-6 pt-28">
          <div className="grid items-end gap-10 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <Eyebrow>Marketplace Infrastruktur</Eyebrow>
              <h1 className="studio-hero-title mt-5 text-[clamp(40px,7.2vw,92px)] text-fg">
                Infrastruktur cloud.
                <br />
                Kecepatan yang
                <br />
                membuat tim anda
                <br />
                bergerak lagi.
              </h1>

              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Link
                  href="/marketplace"
                  className="group inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-[14px] font-semibold text-black transition-transform duration-200 hover:-translate-y-0.5"
                >
                  Jelajahi katalog
                  <span className="material-symbols-outlined text-[18px] transition-transform duration-300 group-hover:translate-x-0.5">
                    north_east
                  </span>
                </Link>
                <a
                  href="#mulai"
                  className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-white/[0.03] px-6 py-3 text-[14px] font-medium text-fg backdrop-blur transition-colors hover:border-accent hover:text-accent"
                >
                  Minta penawaran
                </a>
              </div>
            </div>

            {/* Top-right descriptor */}
            <div className="lg:col-span-4 lg:pb-2">
              <p className="max-w-sm text-[14px] leading-relaxed text-fg-muted lg:ml-auto lg:text-right">
                Cari, bandingkan, dan order VPS &amp; Dedicated Server dari
                provider terverifikasi. JadeNode merapikan order, invoice,
                pembayaran, dan provisioning untuk menekan downtime.
              </p>
              <div className="mt-5 flex gap-2 lg:justify-end">
                <span className="studio-eyebrow rounded-full border border-line px-3 py-1.5 text-[9px] text-fg-muted">
                  Dukungan 24/7
                </span>
                <span className="studio-eyebrow rounded-full border border-line px-3 py-1.5 text-[9px] text-fg-muted">
                  450+ node
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <RevealOnScroll>
        {/* ─────────────────── INTRO HEADLINE ─────────────────── */}
        <section className="mx-auto max-w-[1320px] px-6 py-24 md:py-32">
          <div className="reveal-rise">
            <Eyebrow>Dari order ke deployment</Eyebrow>
            <h2 className="studio-display mt-6 max-w-3xl text-[clamp(34px,5.5vw,68px)] text-fg">
              Solusi cloud cepat untuk masalah kompleks.
            </h2>
          </div>
        </section>

        {/* ───────────────────────── BENTO ───────────────────────── */}
        <section id="bento" className="mx-auto max-w-[1320px] px-6 pb-24">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Big card — availability */}
            <article className="studio-card reveal-rise grid gap-6 overflow-hidden rounded-2xl border border-line bg-surface/50 p-7 md:grid-cols-2 md:p-9">
              <div className="grid place-items-center">
                <NodeCluster />
              </div>
              <div className="flex flex-col justify-center">
                <span className="studio-eyebrow text-accent">Kapasitas</span>
                <h3 className="studio-display mt-3 text-[32px] text-fg md:text-[38px]">
                  Ketersediaan instan
                </h3>
                <p className="mt-3 text-[14px] leading-relaxed text-fg-muted">
                  Kekuatan kami adalah ketersediaan kapasitas yang luas di
                  banyak region — termasuk konfigurasi yang sulit dicari.
                </p>
                <ul className="mt-5 space-y-2.5">
                  {AVAILABILITY_BULLETS.map((b) => (
                    <li
                      key={b}
                      className="flex items-center gap-2.5 text-[13px] text-fg-muted"
                    >
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                      {b}
                    </li>
                  ))}
                </ul>
                <div className="mt-7 grid grid-cols-2 gap-6 border-t border-line/80 pt-5">
                  <div>
                    <div className="studio-display text-[30px] text-fg">
                      450+
                    </div>
                    <div className="studio-eyebrow mt-1 text-[9px] text-fg-dim">
                      Node terkelola
                    </div>
                  </div>
                  <div>
                    <div className="studio-display text-[30px] text-accent">
                      24/7
                    </div>
                    <div className="studio-eyebrow mt-1 text-[9px] text-fg-dim">
                      Dukungan teknis
                    </div>
                  </div>
                </div>
              </div>
            </article>

            {/* Right column */}
            <div className="grid gap-4">
              {/* Support card */}
              <article className="studio-card reveal-rise rounded-2xl border border-line bg-surface/50 p-7 md:p-9">
                <span className="studio-eyebrow text-fg-dim">Dukungan</span>
                <h3 className="studio-display mt-3 text-[28px] text-fg md:text-[32px]">
                  Dukungan 24/7
                </h3>
                <p className="mt-3 max-w-md text-[14px] leading-relaxed text-fg-muted">
                  Server idle menghentikan produksi dan menimbulkan biaya. Tim
                  kami merespons sepanjang waktu.
                </p>
                <ul className="mt-5 grid gap-2.5">
                  {SUPPORT_BULLETS.map((b) => (
                    <li
                      key={b}
                      className="flex items-center gap-2.5 text-[13px] text-fg-muted"
                    >
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                      {b}
                    </li>
                  ))}
                </ul>
                <div className="mt-7 flex items-center gap-4">
                  <div className="studio-bar h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.05]">
                    <span style={{ animationDelay: "0s" }} />
                  </div>
                  <div className="studio-bar h-1.5 w-1/3 overflow-hidden rounded-full bg-white/[0.05]">
                    <span style={{ animationDelay: "0.6s" }} />
                  </div>
                  <span className="rounded-full border border-line px-3 py-1 font-mono text-[11px] text-fg-muted">
                    :) ▮▮▮
                  </span>
                </div>
              </article>

              {/* Provisioning steps card */}
              <article className="studio-card reveal-rise rounded-2xl border border-line bg-surface/50 p-7 md:p-9">
                <span className="studio-eyebrow text-fg-dim">Provisioning</span>
                <h3 className="studio-display mt-3 text-[28px] text-fg md:text-[32px]">
                  Order, bayar, deploy.
                </h3>
                <div className="mt-6 grid grid-cols-3 gap-3">
                  {[
                    { icon: "shopping_cart", label: "Order" },
                    { icon: "payments", label: "Bayar" },
                    { icon: "rocket_launch", label: "Deploy" },
                  ].map((s, i) => (
                    <div
                      key={s.label}
                      className="relative grid place-items-center gap-2 rounded-xl border border-line/80 bg-black/40 py-5"
                    >
                      <span
                        className={`material-symbols-outlined text-[26px] ${
                          i === 1 ? "text-accent" : "text-fg/70"
                        }`}
                      >
                        {s.icon}
                      </span>
                      <span className="studio-eyebrow text-[9px] text-fg-muted">
                        {s.label}
                      </span>
                    </div>
                  ))}
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* ───────────────────────── CATALOG ───────────────────────── */}
        <section className="mx-auto max-w-[1320px] px-6 py-24">
          <div className="reveal-rise mb-12 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Eyebrow>Katalog infrastruktur</Eyebrow>
              <h2 className="studio-display mt-5 max-w-2xl text-[clamp(30px,4.5vw,56px)] text-fg">
                Listing nyata, konteks operasional, respons cepat.
              </h2>
            </div>
            <div className="max-w-xs lg:text-right">
              <Link
                href="/marketplace"
                className="studio-eyebrow inline-flex items-center gap-1.5 text-accent hover:underline"
              >
                Lihat katalog penuh
                <span className="material-symbols-outlined text-[14px]">
                  north_east
                </span>
              </Link>
              <p className="mt-3 text-[13px] leading-relaxed text-fg-muted">
                Seleksi awal VPS &amp; Dedicated Server dari provider
                terverifikasi dengan status dan ketersediaan yang stabil.
              </p>
            </div>
          </div>
          <CatalogExplorer />
        </section>

        {/* ───────────────────────── ARTICLES ───────────────────────── */}
        <section id="articles" className="mx-auto max-w-[1320px] px-6 py-24">
          <div className="reveal-rise mb-12 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Eyebrow>Artikel</Eyebrow>
              <h2 className="studio-display mt-5 max-w-2xl text-[clamp(30px,4.5vw,56px)] text-fg">
                Insight, panduan, dan berita terbaru.
              </h2>
            </div>
            <div className="max-w-xs lg:text-right">
              <Link
                href="/articles"
                className="studio-eyebrow inline-flex items-center gap-1.5 text-accent hover:underline"
              >
                Lihat semua artikel
                <span className="material-symbols-outlined text-[14px]">
                  north_east
                </span>
              </Link>
              <p className="mt-3 text-[13px] leading-relaxed text-fg-muted">
                Tutorial, pengumuman, dan insight infrastruktur dari tim JadeNode.
              </p>
            </div>
          </div>
          <LandingArticles />
        </section>

        {/* ───────────────────────── REVIEWS ───────────────────────── */}
        <section className="mx-auto max-w-[1320px] px-6 py-24">
          <div className="reveal-rise mb-12 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Eyebrow>Ulasan</Eyebrow>
              <h2 className="studio-display mt-5 text-[clamp(30px,4.5vw,56px)] text-fg">
                Apa kata mereka tentang kami
              </h2>
            </div>
            <p className="max-w-sm text-[14px] leading-relaxed text-fg-muted lg:text-right">
              Umpan balik nyata dari tim yang memilih JadeNode untuk kebutuhan
              cepat, kapasitas tambahan, dan dukungan teknis.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {REVIEWS.map((r) => (
              <figure
                key={r.name}
                className="studio-card flex flex-col rounded-2xl border border-line bg-surface/50 p-7"
              >
                <span className="material-symbols-outlined text-[28px] text-accent">
                  format_quote
                </span>
                <blockquote className="mt-4 flex-1 text-[15px] leading-relaxed text-fg/90">
                  {r.quote}
                </blockquote>
                <figcaption className="mt-6 border-t border-line/80 pt-4">
                  <div className="text-[14px] font-semibold text-fg">
                    {r.name}
                  </div>
                  <div className="mt-0.5 text-[12px] text-fg-muted">
                    {r.org}
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* ───────────────────────── ABOUT + GLOBE ───────────────────────── */}
        <section
          id="about"
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
                <Eyebrow>Tentang kami</Eyebrow>
                <Link
                  href="/lifecycle"
                  className="studio-eyebrow inline-flex items-center gap-1.5 text-accent hover:underline"
                >
                  Pelajari perusahaan
                  <span className="material-symbols-outlined text-[14px]">
                    north_east
                  </span>
                </Link>
              </div>
              <h2 className="studio-display mt-6 text-[clamp(32px,5vw,64px)] text-fg">
                Kami membawa cloud ke tempat yang membutuhkannya. Se-Asia
                Tenggara.
              </h2>
              <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-fg-muted">
                JadeNode menghubungkan tim engineering dengan provider
                infrastruktur tepercaya di Indonesia dan kawasan. Dengan
                kontrak finansial yang benar, jejak audit penuh, dan
                provisioning yang dijamin SLA, kami membantu setiap perusahaan
                bergerak tanpa hambatan.
              </p>
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
                Dibangun untuk developer.
              </h2>
              <p className="mt-5 max-w-md text-[15px] leading-relaxed text-fg-muted">
                REST API dengan kontrak OpenAPI. Idempotency pada setiap
                endpoint finansial. Webhook dengan tanda tangan HMAC-SHA256.
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
                  API Request
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
                  201 CREATED
                </span>
                <span className="font-mono text-[10px] text-accent">
                  12ms
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ───────────────────────── CONTACT / START ───────────────────────── */}
        <section
          id="mulai"
          className="border-t border-line/70 bg-surface/20"
        >
          <div className="mx-auto grid max-w-[1320px] gap-12 px-6 py-24 lg:grid-cols-2 lg:py-32">
            <div className="reveal-rise">
              <Eyebrow>Mulai sekarang</Eyebrow>
              <h2 className="studio-display mt-5 text-[clamp(32px,5vw,60px)] text-fg">
                Sebutkan kebutuhan, kami yang siapkan.
              </h2>
              <p className="mt-5 max-w-md text-[15px] leading-relaxed text-fg-muted">
                Beri tahu region, spesifikasi, dan urgensinya. Tim JadeNode
                membantu memeriksa ketersediaan, opsi, dan alternatif yang
                kompatibel.
              </p>

              <div className="mt-9 grid gap-3">
                <ContactCard label="Alamat">
                  Jl. Jenderal Sudirman Kav. 52-53, Jakarta Selatan 12190
                </ContactCard>
                <ContactCard label="Telepon">
                  <span className="text-accent">+62 21 5050 1234</span>
                </ContactCard>
                <ContactCard label="Tulis ke kami">
                  <div className="text-fg">halo@jadenode.id</div>
                  <div className="text-fg">support@jadenode.id</div>
                </ContactCard>
              </div>
            </div>

            <div className="reveal-rise rounded-2xl border border-line bg-surface/50 p-7 md:p-9">
              <h3 className="studio-display text-[24px] text-fg">
                Ajukan beta access
              </h3>
              <p className="mt-2 text-[13px] text-fg-muted">
                Kami membuka akses secara bertahap untuk tim terverifikasi.
              </p>
              <div className="mt-6">
                <BetaAccessForm />
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
                Tenggara. Dibangun untuk financial correctness dan kepercayaan.
              </p>
              <div className="mt-5 text-[13px] text-fg-muted">
                halo@jadenode.id
              </div>
              <div className="text-[13px] text-fg-dim">
                Dukungan 24/7 untuk downtime
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
              Operasional &amp; dukungan teknis aktif
            </span>
          </div>
        </div>
      </footer>
    </main>
  );
}

function ContactCard({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-line bg-surface/40 px-5 py-4">
      <div className="studio-eyebrow text-[9px] text-fg-dim">{label}</div>
      <div className="mt-2 text-[14px] leading-relaxed text-fg">{children}</div>
    </div>
  );
}
