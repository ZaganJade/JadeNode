"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { RevealOnScroll } from "@/components/landing/reveal-on-scroll";
import { StudioNav } from "@/components/landing/studio/studio-nav";
import { ScrollRail } from "@/components/landing/studio/scroll-rail";
import { ApiEndpoint } from "@/components/docs/api-endpoint";
import { CodeBlock } from "@/components/shared/code-block";

// ─── Sidebar navigation data ────────────────────────────────────────────────

const SIDEBAR_SECTIONS = [
  { id: "quickstart", label: "Quick Start", short: "01" },
  { id: "api", label: "API Reference", short: "02" },
  { id: "webhooks", label: "Webhooks", short: "03" },
  { id: "examples", label: "Code Examples", short: "04" },
] as const;

// ─── Floating sidebar with IntersectionObserver active tracking ──────────────

function DocsSideNav() {
  const [activeId, setActiveId] = useState<string>(SIDEBAR_SECTIONS[0].id);
  const isClickScrolling = useRef(false);

  useEffect(() => {
    const sectionEls = SIDEBAR_SECTIONS.map((s) =>
      document.getElementById(s.id),
    ).filter(Boolean) as HTMLElement[];

    // IntersectionObserver — a section is "active" when its top edge
    // enters the upper 40% of the viewport.
    const observer = new IntersectionObserver(
      (entries) => {
        if (isClickScrolling.current) return; // defer to click-set id
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: "-10% 0px -55% 0px", threshold: [0, 0.25, 0.5] },
    );

    for (const el of sectionEls) observer.observe(el);
    return () => observer.disconnect();
  }, []);

  function handleClick(id: string) {
    setActiveId(id);
    isClickScrolling.current = true;
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    // Let IntersectionObserver take over again after scroll finishes
    setTimeout(() => {
      isClickScrolling.current = false;
    }, 900);
  }

  return (
    <nav aria-label="Docs section navigation" className="flex flex-col gap-1">
      {SIDEBAR_SECTIONS.map((sec) => {
        const isActive = activeId === sec.id;
        return (
          <button
            key={sec.id}
            type="button"
            onClick={() => handleClick(sec.id)}
            className="group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-300"
            style={{
              color: isActive ? "rgba(255,116,0,1)" : "rgba(255,255,255,0.45)",
              background: isActive ? "rgba(255,116,0,0.06)" : "transparent",
            }}
          >
            {/* ── Orange sliding rail (left edge) ── */}
            <span
              className="absolute left-0 top-1/2 w-[3px] rounded-full -translate-y-1/2 origin-center transition-transform duration-300 ease-out"
              style={{
                height: isActive ? "100%" : "0%",
                background: "rgba(255,116,0,0.9)",
                transform: isActive ? "translateY(-50%) scaleY(1)" : "translateY(-50%) scaleY(0)",
              }}
            />

            {/* ── Leading dot ── */}
            <span
              className="relative flex h-[7px] w-[7px] shrink-0 rounded-full transition-all duration-300"
              style={{
                background: isActive ? "rgba(255,116,0,1)" : "rgba(255,255,255,0.15)",
                boxShadow: isActive
                  ? "0 0 8px rgba(255,116,0,0.5)"
                  : "none",
                transform: isActive ? "scale(1.3)" : "scale(1)",
              }}
            />

            {/* ── Number + label ── */}
            <span className="flex items-baseline gap-2">
              <span
                className="font-mono text-[10px] uppercase tracking-[0.14em]"
                style={{
                  color: isActive
                    ? "rgba(255,116,0,0.7)"
                    : "rgba(255,255,255,0.2)",
                }}
              >
                {sec.short}
              </span>
              <span
                className="text-[13px] font-medium leading-tight"
                style={{
                  fontFamily: '"Satoshi", sans-serif',
                }}
              >
                {sec.label}
              </span>
            </span>
          </button>
        );
      })}
    </nav>
  );
}

const FOOTER_COLUMNS = [
  {
    label: "Docs",
    items: [
      { text: "Quick Start", href: "#quickstart" },
      { text: "API Reference", href: "#api" },
      { text: "Webhooks", href: "#webhooks" },
      { text: "Code Examples", href: "#examples" },
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
      { text: "API reference", href: "/docs" },
      { text: "OpenAPI 3.1", href: "/docs" },
      { text: "Idempotency-Key", href: "/docs" },
      { text: "Status page", href: "#" },
    ],
  },
];

// ─── Subcomponents ──────────────────────────────────────────────────────────

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="studio-eyebrow text-accent">{children}</p>;
}

// ─── Greetings (simple — eyebrow + headline + subtitle) ─────────────────────

function Greetings() {
  return (
    <section
      aria-label="Docs greetings"
      className="border-b border-line/60"
    >
      <div className="mx-auto w-full max-w-[1320px] px-6 pt-28 pb-12">
        <div className="flex items-center gap-3">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
          </span>
          <Eyebrow>Docs · developer reference</Eyebrow>
        </div>

        <h1 className="studio-hero-title mt-5 text-[clamp(40px,7vw,92px)] text-fg">
          Build on{" "}
          <span className="serif-italic text-accent">JadeNode</span>
          <br />
          lewat REST API.
        </h1>

        <p className="mt-6 max-w-2xl text-[15px] leading-relaxed text-fg-muted">
          Dokumentasi lengkap dan panduan untuk mengintegrasikan infrastruktur
          JadeNode ke workflow Anda. Kontrak OpenAPI 3.1, Idempotency-Key
          untuk setiap endpoint finansial, dan webhook bertanda tangan
          HMAC-SHA256.
        </p>
      </div>
    </section>
  );
}

// ─── Studio Docs Page ──────────────────────────────────────────────────────

export default function DocsPage() {
  return (
    <main className="studio relative min-h-screen">
      <ScrollRail />
      <StudioNav />

      {/* Greetings — simple */}
      <Greetings />

      <RevealOnScroll>
        {/* ───────────────────────── DOCS LAYOUT (sidebar + content) ───────────────────────── */}
        <section className="mx-auto max-w-[1320px] px-6 py-16">
          <div className="docs-layout-grid grid gap-10">
            {/* ── Sticky sidebar — stays inside grid, follows scroll ── */}
            <aside className="hidden lg:block">
              <div
                className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto"
                style={{ scrollbarWidth: "thin" }}
              >
                {/* Sidebar header */}
                <div className="mb-4 flex items-center gap-2.5 px-3">
                  <span
                    className="relative flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-bold"
                    style={{
                      background: "rgba(255,116,0,0.12)",
                      color: "rgba(255,116,0,0.9)",
                      fontFamily: '"JetBrains Mono", monospace',
                    }}
                  >
                    JN
                  </span>
                  <span
                    className="font-mono text-[10px] uppercase tracking-[0.18em]"
                    style={{
                      color: "rgba(255,255,255,0.3)",
                      fontFamily: '"JetBrains Mono", monospace',
                    }}
                  >
                    On this page
                  </span>
                </div>
                <DocsSideNav />
              </div>
            </aside>

            {/* Main content */}
            <div className="min-w-0">
              {/* Quick Start */}
              <section id="quickstart" className="mb-20 scroll-mt-24">
                <div className="mb-8 flex items-end gap-4">
                  <div>
                    <Eyebrow>01 · Quick Start</Eyebrow>
                    <h2 className="studio-display mt-3 text-[clamp(28px,4vw,40px)] text-fg">
                      Mulai dalam 3 langkah
                    </h2>
                  </div>
                </div>

                <div className="space-y-6">
                  {[
                    {
                      step: "1",
                      title: "Get API Key",
                      desc: "Login ke dashboard dan generate API key di menu Settings → API Keys.",
                      code: `curl -X POST https://api.jadenode.id/v1/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "user@example.com",
    "password": "yourpassword"
  }'`,
                      lang: "bash",
                    },
                    {
                      step: "2",
                      title: "First Request",
                      desc: "Gunakan API key untuk mendapatkan listing produk.",
                      code: `curl -X GET https://api.jadenode.id/v1/marketplace/listings \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Idempotency-Key: $(uuidgen)"`,
                      lang: "bash",
                    },
                    {
                      step: "3",
                      title: "First Order",
                      desc: "Order infrastruktur pertama Anda.",
                      code: `curl -X POST https://api.jadenode.id/v1/orders \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Idempotency-Key: $(uuidgen)" \\
  -H "Content-Type: application/json" \\
  -d '{
    "listing_id": "01HVQ2W7H6Y4...JKT",
    "billing_cycle": "monthly"
  }'`,
                      lang: "bash",
                    },
                  ].map((s, i) => (
                    <article
                      key={s.step}
                      className="studio-card rounded-2xl border border-line bg-surface/50 p-6 md:p-7"
                      style={{ animationDelay: `${i * 80}ms` }}
                    >
                      <div className="mb-5 flex items-center gap-4">
                        <span className="grid h-10 w-10 place-items-center rounded-full border border-accent/50 bg-accent/10 font-mono text-[13px] text-accent">
                          {s.step}
                        </span>
                        <div>
                          <h3 className="studio-display text-[20px] text-fg">
                            {s.title}
                          </h3>
                          <p className="mt-1 text-[13px] text-fg-muted">
                            {s.desc}
                          </p>
                        </div>
                      </div>
                      <CodeBlock language={s.lang} code={s.code} />
                    </article>
                  ))}
                </div>
              </section>

              {/* API Reference */}
              <section id="api" className="mb-20 scroll-mt-24">
                <div className="mb-8 flex items-end gap-4">
                  <div>
                    <Eyebrow>02 · API Reference</Eyebrow>
                    <h2 className="studio-display mt-3 text-[clamp(28px,4vw,40px)] text-fg">
                      Endpoint &amp; autentikasi
                    </h2>
                  </div>
                </div>

                <h3
                  id="authentication"
                  className="studio-display mt-6 mb-4 text-[20px] text-fg scroll-mt-24"
                >
                  Authentication
                </h3>
                <p className="mb-6 text-[14px] leading-relaxed text-fg-muted">
                  Semua request ke API memerlukan Bearer token di header
                  Authorization. Generate API key di dashboard Customer.
                </p>

                <div>
                  <ApiEndpoint
                    method="GET"
                    endpoint="/api/v1/marketplace/listings"
                    description="List all available infrastructure products with filtering and pagination."
                    headers={[
                      { name: "Authorization", value: "Bearer {token}", description: "Your API key" },
                      { name: "Idempotency-Key", value: "{uuid}", description: "Unique request identifier (recommended)" },
                    ]}
                    params={[
                      { name: "page", type: "integer", required: false, description: "Page number for pagination (default: 1)" },
                      { name: "per_page", type: "integer", required: false, description: "Items per page (default: 15, max: 100)" },
                      { name: "search", type: "string", required: false, description: "Search query for product name" },
                      { name: "resource_type", type: "string", required: false, description: "Filter by resource type (Vps, Dedicated)" },
                    ]}
                    response={{
                      code: 200,
                      description: "Success",
                      example: {
                        data: [
                          {
                            id: "01HVQ2W7H6Y4...JKT",
                            name: "VPS Starter",
                            slug: "vps-starter",
                            resource_type: "Vps",
                            region: "Jakarta (ID)",
                            specs: { cpu: "1 vCPU", ram: "1 GB RAM", storage: "20 GB SSD" },
                            price: 50000,
                          },
                        ],
                        meta: {
                          current_page: 1,
                          last_page: 3,
                          per_page: 15,
                          total: 42,
                        },
                      },
                    }}
                    errors={[
                      { code: 401, description: "Unauthorized — invalid or missing API key" },
                      { code: 400, description: "Bad Request — invalid parameters" },
                    ]}
                  />
                </div>

                <div id="orders-api" className="mt-8 scroll-mt-24">
                  <h3 className="studio-display text-[20px] text-fg mb-4">
                    Orders
                  </h3>
                  <div>
                    <ApiEndpoint
                      method="POST"
                      endpoint="/api/v1/orders"
                      description="Create a new infrastructure order."
                      headers={[
                        { name: "Authorization", value: "Bearer {token}", description: "Your API key" },
                        { name: "Idempotency-Key", value: "{uuid}", description: "REQUIRED for all POST requests" },
                        { name: "Content-Type", value: "application/json", description: "Request body format" },
                      ]}
                      params={[
                        { name: "listing_id", type: "string", required: true, description: "Product listing ID from marketplace" },
                        { name: "billing_cycle", type: "string", required: true, description: "Billing cycle: monthly or yearly" },
                      ]}
                      requestBody={{
                        listing_id: "01HVQ2W7H6Y4...JKT",
                        billing_cycle: "monthly",
                      }}
                      response={{
                        code: 201,
                        description: "Order created successfully",
                        example: {
                          order_id: "01HZ...ABC",
                          status: "pending_payment",
                          total_amount: 50000,
                          payment_url: "https://midtrans.com/pay/...",
                          created_at: "2026-06-04T00:00:00Z",
                        },
                      }}
                      errors={[
                        { code: 401, description: "Unauthorized" },
                        { code: 400, description: "Invalid request body" },
                        { code: 409, description: "Duplicate idempotency key — request already processed" },
                      ]}
                    />
                  </div>
                </div>
              </section>

              {/* Webhooks */}
              <section id="webhooks" className="mb-20 scroll-mt-24">
                <div className="mb-8 flex items-end gap-4">
                  <div>
                    <Eyebrow>03 · Webhooks</Eyebrow>
                    <h2 className="studio-display mt-3 text-[clamp(28px,4vw,40px)] text-fg">
                      Event notifications
                    </h2>
                  </div>
                </div>

                <p className="mb-6 text-[14px] leading-relaxed text-fg-muted">
                  JadeNode mengirim webhook events untuk notify status updates
                  di infrastruktur Anda. Setiap request ditandai tangan dengan
                  HMAC-SHA256 untuk keamanan.
                </p>

                <div className="studio-card rounded-2xl border border-line bg-surface/50 p-6 md:p-7">
                  <h3 className="studio-eyebrow text-[10px] uppercase text-fg-dim mb-4">
                    Event types
                  </h3>
                  <div className="space-y-2">
                    {[
                      { event: "order.created", desc: "Order baru dibuat" },
                      { event: "order.paid", desc: "Pembayaran sukses" },
                      { event: "order.provisioning", desc: "Provisioning sedang berjalan" },
                      { event: "order.provisioned", desc: "Infrastruktur siap digunakan" },
                      { event: "order.failed", desc: "Order atau provisioning gagal" },
                    ].map((item) => (
                      <div
                        key={item.event}
                        className="flex items-center gap-4 rounded-lg border border-line/60 bg-black/20 px-3 py-2.5"
                      >
                        <code className="font-mono text-[12px] text-accent">
                          {item.event}
                        </code>
                        <span className="text-[12px] text-fg-muted">
                          {item.desc}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="studio-card mt-6 rounded-2xl border border-line bg-surface/50 p-6 md:p-7">
                  <h3 className="studio-eyebrow text-[10px] uppercase text-fg-dim mb-3">
                    Signature verification
                  </h3>
                  <p className="mb-4 text-[13px] leading-relaxed text-fg-muted">
                    Setiap webhook request berisi signature di header{" "}
                    <code className="rounded bg-black/40 px-1.5 py-0.5 font-mono text-[12px] text-accent">
                      X-JadenNode-Signature
                    </code>
                    . Verify dengan HMAC-SHA256 menggunakan webhook secret dari
                    dashboard.
                  </p>
                  <CodeBlock
                    language="python"
                    code={`import hmac
import hashlib

def verify_signature(payload, signature, secret):
    expected = hmac.new(
        secret.encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature)`}
                  />
                </div>
              </section>

              {/* Code Examples */}
              <section id="examples" className="mb-20 scroll-mt-24">
                <div className="mb-8 flex items-end gap-4">
                  <div>
                    <Eyebrow>04 · Code Examples</Eyebrow>
                    <h2 className="studio-display mt-3 text-[clamp(28px,4vw,40px)] text-fg">
                      Integrasi dalam bahasa Anda
                    </h2>
                  </div>
                </div>

                <p className="mb-6 text-[14px] leading-relaxed text-fg-muted">
                  Contoh integrasi dalam berbagai bahasa untuk memulai
                  development dengan JadeNode API.
                </p>

                <div className="space-y-6">
                  <div>
                    <h3 className="studio-eyebrow mb-3 text-[10px] uppercase text-fg-dim">
                      cURL
                    </h3>
                    <CodeBlock
                      language="bash"
                      code={`# Get all listings
curl -X GET https://api.jadenode.id/v1/marketplace/listings \\
  -H "Authorization: Bearer YOUR_API_KEY"

# Create order
curl -X POST https://api.jadenode.id/v1/orders \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Idempotency-Key: $(uuidgen)" \\
  -H "Content-Type: application/json" \\
  -d '{"listing_id":"01HV...","billing_cycle":"monthly"}'`}
                    />
                  </div>

                  <div>
                    <h3 className="studio-eyebrow mb-3 text-[10px] uppercase text-fg-dim">
                      JavaScript (Node.js)
                    </h3>
                    <CodeBlock
                      language="javascript"
                      code={`const axios = require('axios');

const client = axios.create({
  baseURL: 'https://api.jadenode.id/v1',
  headers: {
    'Authorization': \`Bearer \${process.env.JADENODE_API_KEY}\`,
  },
});

// Get all listings
const listings = await client.get('/marketplace/listings');

// Create order
const order = await client.post('/orders', {
  listing_id: '01HVQ2W7H6Y4...JKT',
  billing_cycle: 'monthly',
}, {
  headers: {
    'Idempotency-Key': crypto.randomUUID(),
  },
});`}
                    />
                  </div>

                  <div>
                    <h3 className="studio-eyebrow mb-3 text-[10px] uppercase text-fg-dim">
                      Python
                    </h3>
                    <CodeBlock
                      language="python"
                      code={`import requests
import uuid

API_KEY = 'your_api_key'
BASE_URL = 'https://api.jadenode.id/v1'

headers = {
    'Authorization': f'Bearer {API_KEY}',
    'Content-Type': 'application/json',
}

# Get all listings
response = requests.get(
    f'{BASE_URL}/marketplace/listings',
    headers=headers
)
listings = response.json()

# Create order
order_data = {
    'listing_id': '01HVQ2W7H6Y4...JKT',
    'billing_cycle': 'monthly'
}
headers['Idempotency-Key'] = str(uuid.uuid4())

response = requests.post(
    f'{BASE_URL}/orders',
    json=order_data,
    headers=headers
)
order = response.json()`}
                    />
                  </div>
                </div>
              </section>
            </div>
          </div>
        </section>
      </RevealOnScroll>

      {/* ───────────────────────── FOOTER ───────────────────────── */}
      <footer className="border-t border-line/70 px-6 py-16">
        <div className="mx-auto max-w-[1320px]">
          <div className="docs-footer-grid grid gap-10 md:grid-cols-2">
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
                Tenggara. OpenAPI 3.1, Idempotency-Key, webhook HMAC-SHA256
                untuk integrasi yang aman.
              </p>
              <div className="mt-5 text-[13px] text-fg-muted">
                developer@jadenode.id
              </div>
              <div className="text-[13px] text-fg-dim">
                API support 24/7
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
              API &amp; documentation aktif
            </span>
          </div>
        </div>
      </footer>
    </main>
  );
}
