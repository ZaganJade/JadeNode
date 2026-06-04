"use client";

import Link from "next/link";
import { RevealOnScroll } from "@/components/landing/reveal-on-scroll";
import { StudioNav } from "@/components/landing/studio/studio-nav";
import { ScrollRail } from "@/components/landing/studio/scroll-rail";
import { RegionGlobe } from "@/components/landing/studio/region-globe";

// ─── Data (menu sama — hanya visual yang di-redesign) ────────────────────────

const STEP_DATA = [
  {
    step: 1,
    title: "Order",
    description: "Pilih produk dan konfigurasi spesifikasi yang sesuai",
    icon: "shopping_cart",
    details: [
      "Browse marketplace untuk VPS atau Dedicated Server",
      "Pilih tier yang sesuai dengan kebutuhan",
      "Konfigurasi spesifikasi tambahan jika diperlukan",
      "Review ringkasan order sebelum submit",
    ],
  },
  {
    step: 2,
    title: "Payment",
    description: "Proses pembayaran yang aman dengan berbagai metode",
    icon: "payments",
    details: [
      "Integrasi Midtrans untuk payment gateway",
      "Berbagai metode: Transfer, E-Wallet, QRIS, Kartu Kredit",
      "Invoice otomatis generated setelah payment",
      "Email notifikasi dikirim setelah sukses",
    ],
  },
  {
    step: 3,
    title: "Provisioning",
    description: "Server disiapkan sesuai SLA yang terjamin",
    icon: "settings_suggest",
    details: [
      "Automated provisioning system memulai setup",
      "SLA 1 hari untuk VPS, 3 hari untuk Dedicated",
      "Real-time status tracking di dashboard",
      "Notifikasi saat server ready untuk use",
    ],
  },
  {
    step: 4,
    title: "Deployment",
    description: "Kredensial dan akses dikirim dengan aman",
    icon: "rocket_launch",
    details: [
      "SSH credentials dikirim via email terenkripsi",
      "IP address dan login detail tersedia di dashboard",
      "Server pre-configured dengan OS pilihan",
      "Ready untuk production dalam minutes",
    ],
  },
  {
    step: 5,
    title: "Management",
    description: "Kelola infrastruktur dengan control panel lengkap",
    icon: "dashboard",
    details: [
      "Monitor resource usage real-time",
      "Reboot, re-image, atau resize sesuai kebutuhan",
      "Access backup dan restore features",
      "24/7 support untuk technical assistance",
    ],
  },
];

const PHASES = [
  {
    key: "pre",
    label: "Pre-flight",
    items: ["Pilih listing", "Konfigurasi", "Review order"],
  },
  {
    key: "transit",
    label: "In-flight",
    items: ["Order", "Invoice", "Bayar Midtrans", "Provisioning"],
  },
  {
    key: "post",
    label: "Post-flight",
    items: ["Deployment", "Kredensial", "Management", "Renewal"],
  },
];

const INTEGRATION_STACK = [
  { icon: "payments", label: "Midtrans Snap", value: "Payment gateway" },
  { icon: "account_balance_wallet", label: "Wallet ledger", value: "Stored value" },
  { icon: "receipt_long", label: "Invoice PDF", value: "Auditable" },
  { icon: "lan", label: "Idempotency-Key", value: "REST/Webhooks" },
];

const LIFECYCLE_CODE = `$ curl -X POST https://api.jadenode.id/v1/orders \\
  -H "Authorization: Bearer $JN_TOKEN" \\
  -H "Idempotency-Key: $(uuidgen)" \\
  -H "Content-Type: application/json" \\
  -d '{
    "listing_id": "01HVQ2W7H6Y4...JKT",
    "billing_cycle": "monthly"
  }'`;

const FOOTER_COLUMNS = [
  {
    label: "Lifecycle",
    items: [
      { text: "Order", href: "#flow" },
      { text: "Payment", href: "#flow" },
      { text: "Provisioning", href: "#flow" },
      { text: "Deployment", href: "#flow" },
    ],
  },
  {
    label: "Customer",
    items: [
      { text: "Order history", href: "/customer/orders" },
      { text: "Invoice & Wallet", href: "/customer/invoices" },
      { text: "Deployment aktif", href: "/customer/deployments" },
      { text: "Tiket dukungan", href: "/customer/tickets" },
    ],
  },
  {
    label: "Developer",
    items: [
      { text: "API Docs", href: "/docs" },
      { text: "Webhooks", href: "#developers" },
      { text: "Idempotency-Key", href: "#developers" },
      { text: "Status page", href: "#" },
    ],
  },
];

// ─── Static eyebrow (SSR-safe) ───────────────────────────────────────────────

const GREETING_EYEBROW = "Lifecycle · customer journey end-to-end";

// ─── Subcomponents ──────────────────────────────────────────────────────────

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="studio-eyebrow text-accent">{children}</p>;
}

// ─── Greetings section (simple — no background, no tracker card) ─────────────

function Greetings() {
  return (
    <section
      aria-label="Lifecycle greetings"
      className="border-b border-line/60"
    >
      <div className="mx-auto w-full max-w-[1320px] px-6 pt-28 pb-12">
        <div className="flex items-center gap-3">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
          </span>
          <Eyebrow>{GREETING_EYEBROW}</Eyebrow>
        </div>

        <h1 className="studio-hero-title mt-5 text-[clamp(40px,7vw,92px)] text-fg">
          Lifecycle.
          <br />
          <span className="text-accent">Order ke production</span>
          <br />
          dalam satu alur.
        </h1>

        <p className="mt-6 max-w-2xl text-[15px] leading-relaxed text-fg-muted">
          Pelajari setiap tahap dari order sampai deployment — pilih listing,
          bayar lewat Midtrans, provisioning otomatis oleh Provider, dan
          terima kredensial server dengan aman. Provisioning SLA dijamin
          1–3 hari.
        </p>
      </div>
    </section>
  );
}

// ─── Flow Visualizer (studio-card style, 5 step timeline) ──────────────────

function FlowVisualizer() {
  return (
    <div className="relative">
      {/* Connecting line (orange gradient, glowing) */}
      <div className="absolute top-12 left-0 right-0 hidden h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent md:block" />

      <div className="grid gap-4 md:grid-cols-5">
        {STEP_DATA.map((step, index) => (
          <div
            key={step.step}
            className="studio-card reveal-rise relative flex flex-col items-center rounded-2xl border border-line bg-surface/50 p-5 text-center"
            style={{ animationDelay: `${index * 80}ms` }}
          >
            {/* Step number ribbon */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border border-line-strong bg-bg px-2.5 py-0.5 font-mono text-[9px] tracking-[0.18em] text-fg-muted">
              STEP {String(step.step).padStart(2, "0")}
            </div>

            {/* Step circle with icon */}
            <div className="relative mt-3">
              <div
                className="grid h-16 w-16 place-items-center rounded-full border border-accent/50 bg-bg transition-all duration-300 group-hover:border-accent"
                style={{
                  boxShadow:
                    "0 0 24px -2px rgba(255, 116, 0, 0.35), inset 0 0 0 1px rgba(255, 116, 0, 0.2)",
                }}
              >
                <span className="material-symbols-outlined text-[24px] text-accent">
                  {step.icon}
                </span>
              </div>
              <div className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full bg-accent font-mono text-[10px] font-bold text-accent-fg">
                {step.step}
              </div>
            </div>

            {/* Step name */}
            <h3 className="studio-display mt-4 text-[18px] text-fg">
              {step.title}
            </h3>
            <p className="mt-1.5 text-[12px] leading-relaxed text-fg-muted">
              {step.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Step Detail Card (studio-card style) ───────────────────────────────────

function StepCard({
  step,
  title,
  description,
  details,
  icon,
}: {
  step: number;
  title: string;
  description: string;
  details: string[];
  icon: string;
}) {
  return (
    <article
      className="studio-card reveal-rise rounded-2xl border border-line bg-surface/50 p-7 md:p-9"
      style={{ animationDelay: `${(step - 1) * 80}ms` }}
    >
      <div className="flex items-start gap-5">
        {/* Step badge */}
        <div className="flex flex-col items-center gap-2">
          <div className="grid h-14 w-14 place-items-center rounded-xl border border-accent/30 bg-accent/10">
            <span className="material-symbols-outlined text-accent text-[26px]">
              {icon}
            </span>
          </div>
          <span className="font-mono text-[10px] tracking-[0.18em] text-fg-dim">
            STEP {String(step).padStart(2, "0")}
          </span>
        </div>

        <div className="flex-1">
          <h3 className="studio-display text-[24px] text-fg">{title}</h3>
          <p className="mt-2 text-[14px] leading-relaxed text-fg-muted">
            {description}
          </p>

          <ul className="mt-5 space-y-2.5">
            {details.map((detail, i) => (
              <li
                key={i}
                className="flex items-start gap-2.5 text-[13px] text-fg-muted"
              >
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                {detail}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  );
}

// ─── Studio Lifecycle Page ──────────────────────────────────────────────────

export default function LifecyclePage() {
  return (
    <main className="studio relative min-h-screen overflow-x-hidden">
      <ScrollRail />
      <StudioNav />

      {/* Greetings — simple */}
      <Greetings />

      <RevealOnScroll>
        {/* ───────────────────────── INTRO HEADLINE ───────────────────────── */}
        <section className="mx-auto max-w-[1320px] px-6 pb-12 pt-12">
          <div className="reveal-rise flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Eyebrow>Customer Journey</Eyebrow>
              <h2 className="studio-display mt-5 max-w-2xl text-[clamp(30px,4.5vw,56px)] text-fg">
                Lima tahap. Satu alur yang auditable.
              </h2>
            </div>
            <p className="max-w-sm text-[14px] leading-relaxed text-fg-muted lg:text-right">
              Setiap tahap di Lifecycle punya input, output, dan SLA
              yang jelas. Anda tahu status order kapan saja lewat dashboard
              Customer.
            </p>
          </div>
        </section>

        {/* ───────────────────────── FLOW VISUALIZER ───────────────────────── */}
        <section id="flow" className="mx-auto max-w-[1320px] px-6 pb-20">
          <FlowVisualizer />
        </section>

        {/* ───────────────────────── PHASES STRIP ───────────────────────── */}
        <section className="border-y border-line/60 bg-surface/20 py-16">
          <div className="mx-auto max-w-[1320px] px-6">
            <div className="reveal-rise mb-8 flex flex-col gap-3">
              <Eyebrow>Tiga fase</Eyebrow>
              <h3 className="studio-display text-[clamp(24px,3vw,36px)] text-fg">
                Pre-flight → In-flight → Post-flight
              </h3>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {PHASES.map((phase, i) => (
                <div
                  key={phase.key}
                  className="studio-card reveal-rise rounded-2xl border border-line bg-surface/50 p-6"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="flex items-center justify-between">
                    <span className="studio-eyebrow text-accent">
                      {phase.label}
                    </span>
                    <span className="font-mono text-[10px] text-fg-dim">
                      0{i + 1}
                    </span>
                  </div>
                  <ul className="mt-4 space-y-2">
                    {phase.items.map((it) => (
                      <li
                        key={it}
                        className="flex items-center gap-2.5 font-mono text-[12px] text-fg-muted"
                      >
                        <span className="h-1 w-1 rounded-full bg-accent" />
                        {it}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ───────────────────────── STEP DETAILS ───────────────────────── */}
        <section className="mx-auto max-w-[1320px] px-6 py-24">
          <div className="reveal-rise mb-12 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Eyebrow>Detail per tahap</Eyebrow>
              <h2 className="studio-display mt-5 text-[clamp(30px,4.5vw,56px)] text-fg">
                Apa yang terjadi di setiap step
              </h2>
            </div>
            <p className="max-w-sm text-[14px] leading-relaxed text-fg-muted lg:text-right">
              Semua step di bawah ini akan otomatis dijalankan oleh sistem
              JadeNode. Anda hanya perlu menunggu notifikasi saat status
              berubah.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {STEP_DATA.map((step) => (
              <StepCard
                key={step.step}
                step={step.step}
                title={step.title}
                description={step.description}
                details={step.details}
                icon={step.icon}
              />
            ))}
          </div>
        </section>

        {/* ───────────────────────── INTEGRATION STACK ───────────────────────── */}
        <section className="border-y border-line/60 bg-surface/20 py-24">
          <div className="mx-auto max-w-[1320px] px-6">
            <div className="reveal-rise mb-12 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <Eyebrow>Integrasi</Eyebrow>
                <h2 className="studio-display mt-5 text-[clamp(30px,4.5vw,56px)] text-fg">
                  Midtrans, Wallet, dan audit trail
                </h2>
              </div>
              <p className="max-w-sm text-[14px] leading-relaxed text-fg-muted lg:text-right">
                Setiap pembayaran, refund, dan provisioning tercatat di
                ledger yang bisa di-export — siap untuk audit finance.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {INTEGRATION_STACK.map((f, i) => (
                <div
                  key={f.label}
                  className="reveal-rise group flex items-center justify-between rounded-xl border border-line/80 bg-surface/40 px-5 py-4 transition-colors hover:border-accent/50"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <span className="flex items-center gap-3 text-[14px] text-fg">
                    <span className="grid h-9 w-9 place-items-center rounded-lg border border-accent/30 bg-accent/10">
                      <span className="material-symbols-outlined text-[18px] text-accent">
                        {f.icon}
                      </span>
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
                Otomatiskan lifecycle via API.
              </h2>
              <p className="mt-5 max-w-md text-[15px] leading-relaxed text-fg-muted">
                Buat order, cek status, dan terima webhook
                <span className="text-fg"> provisioning-ready</span> lewat
                REST API dengan kontrak OpenAPI 3.1. Idempotency pada
                setiap endpoint finansial.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
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
                  href="/docs"
                  className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-white/[0.03] px-6 py-3 text-[14px] font-medium text-fg backdrop-blur transition-colors hover:border-accent hover:text-accent"
                >
                  Baca API docs
                </Link>
              </div>
            </div>

            {/* Terminal */}
            <div className="reveal-rise overflow-hidden rounded-2xl border border-line bg-surface/60">
              <div className="flex items-center justify-between border-b border-line/80 bg-black/40 px-4 py-3">
                <span className="studio-eyebrow flex items-center gap-2 text-[10px] text-fg-muted">
                  <span className="material-symbols-outlined text-[14px]">
                    terminal
                  </span>
                  POST /v1/orders
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                  <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                  <span className="h-2.5 w-2.5 rounded-full bg-accent" />
                </span>
              </div>
              <pre className="overflow-x-auto px-5 py-5 font-mono text-[12.5px] leading-relaxed text-fg/90">
                <code>{LIFECYCLE_CODE}</code>
              </pre>
              <div className="flex items-center justify-between border-t border-line/80 bg-black/40 px-4 py-2.5">
                <span className="flex items-center gap-1.5 font-mono text-[10px] text-fg-muted">
                  <span className="h-1.5 w-1.5 rounded-full bg-success" />
                  201 CREATED
                </span>
                <span className="font-mono text-[10px] text-accent">42ms</span>
              </div>
            </div>
          </div>
        </section>

        {/* ───────────────────────── PROVIDERS / GLOBE ───────────────────────── */}
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
              <Eyebrow>Provider teraudit</Eyebrow>
              <h2 className="studio-display mt-6 text-[clamp(32px,5vw,64px)] text-fg">
                Lifecycle dijalankan Provider yang sudah lulus audit.
              </h2>
              <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-fg-muted">
                Setiap provisioning step dilakukan oleh Provider
                terverifikasi (First-party: ZaganJade, atau Third-party yang
                sudah lulus verifikasi). SLA 1 hari untuk VPS dan 3 hari
                untuk Dedicated Server.
              </p>

              <div className="mt-7 grid grid-cols-2 gap-3">
                {[
                  { stat: "First-party", note: "ZaganJade" },
                  { stat: "Third-party", note: "Verified" },
                  { stat: "SLA", note: "1–3 hari" },
                  { stat: "Status", note: "Real-time" },
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
      </RevealOnScroll>

      {/* ───────────────────────── FOOTER ───────────────────────── */}
      <footer className="border-t border-line/70 px-6 py-16">
        <div className="mx-auto max-w-[1320px]">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
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
                Tenggara. Order, bayar, deploy — semua dalam satu
                lifecycle yang auditable.
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
              Lifecycle &amp; provisioning aktif
            </span>
          </div>
        </div>
      </footer>
    </main>
  );
}
