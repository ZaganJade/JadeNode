"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

interface Product {
  id: string;
  name: string;
  slug: string;
  resource_type: string;
  region: string;
  specs: { cpu: string; ram: string; storage: string };
  price: number;
  billing_cycle: string;
  currency: string;
  availability: string;
  provisioning_sla: string;
  provider: { name: string; verified: boolean };
}

const RESOURCE_ICON: Record<string, string> = {
  vps: "dns",
  "dedicated server": "developer_board",
  "dedicated-server": "developer_board",
  storage: "database",
  "object storage": "database",
  network: "lan",
  gpu: "memory",
};

function iconFor(type: string) {
  return RESOURCE_ICON[type.toLowerCase()] ?? "deployed_code";
}

function availabilityTone(a: string) {
  const v = a.toLowerCase();
  if (v.includes("limit")) return { dot: "#ff7400", label: "TERBATAS" };
  if (v.includes("out") || v.includes("sold"))
    return { dot: "#ff7a7a", label: "HABIS" };
  return { dot: "#6ce8a6", label: "TERSEDIA" };
}

export function CatalogExplorer() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState("Semua");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/marketplace/listings?per_page=12");
        const data = await res.json();
        if (alive) setProducts(data.data || []);
      } catch (e) {
        console.error("Failed to fetch listings:", e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const tabs = useMemo(() => {
    const types = Array.from(
      new Set(products.map((p) => p.resource_type).filter(Boolean)),
    ).slice(0, 4);
    return ["Semua", ...types];
  }, [products]);

  const filtered = useMemo(() => {
    const list =
      active === "Semua"
        ? products
        : products.filter((p) => p.resource_type === active);
    return list.slice(0, 4);
  }, [products, active]);

  return (
    <div>
      {/* Tab pills */}
      <div className="mb-8 flex flex-wrap items-center gap-2">
        {tabs.map((tab) => {
          const on = tab === active;
          return (
            <button
              key={tab}
              onClick={() => setActive(tab)}
              className={`studio-tab rounded-lg px-5 py-2.5 text-[13px] font-medium capitalize ${
                on
                  ? "bg-accent text-accent-fg"
                  : "bg-surface/70 text-fg-muted hover:text-fg"
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-[420px] animate-pulse rounded-2xl border border-line bg-surface/40"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-line bg-surface/40 p-12 text-center">
          <p className="text-[14px] text-fg-muted">
            Belum ada listing untuk kategori ini.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {filtered.map((p) => {
            const tone = availabilityTone(p.availability);
            return (
              <article
                key={p.id}
                className="studio-card flex flex-col rounded-2xl border border-line bg-surface/50 p-3"
              >
                {/* Visual */}
                <div className="relative grid aspect-square place-items-center overflow-hidden rounded-xl border border-line/80 bg-gradient-to-br from-white/[0.04] to-transparent">
                  <div
                    className="absolute inset-0 opacity-[0.5]"
                    style={{
                      background:
                        "radial-gradient(60% 60% at 50% 40%, rgba(255,116,0,0.16), transparent 70%)",
                    }}
                  />
                  <span className="material-symbols-outlined relative text-[64px] text-fg/70">
                    {iconFor(p.resource_type)}
                  </span>
                  <span
                    className="absolute right-3 top-3 h-2 w-2 rounded-full"
                    style={{
                      background: tone.dot,
                      boxShadow: `0 0 8px 1px ${tone.dot}`,
                    }}
                  />
                </div>

                {/* Body */}
                <div className="flex flex-1 flex-col px-1.5 pt-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-fg-dim">
                    {p.provider.name}
                  </p>
                  <p className="mt-0.5 truncate font-mono text-[11px] uppercase tracking-[0.12em] text-accent">
                    {p.slug}
                  </p>
                  <h3 className="studio-display mt-2 text-[19px] font-bold leading-tight text-fg">
                    {p.name}
                  </h3>
                  <p className="mt-0.5 text-[12px] capitalize text-fg-muted">
                    {p.resource_type} · {p.region}
                  </p>

                  <div className="mt-auto pt-4">
                    <div className="flex items-center justify-between border-t border-line/80 pt-3">
                      <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-fg-muted">
                        {tone.label}
                      </span>
                      <span className="font-mono text-[11px] tabular-nums text-fg">
                        Rp {p.price.toLocaleString("id-ID")}
                      </span>
                    </div>
                    <Link
                      href="/login"
                      className="group mt-3 flex h-9 items-center justify-center gap-1.5 rounded-lg border border-line-strong text-[12px] font-semibold text-fg transition-colors hover:border-accent hover:bg-accent hover:text-accent-fg"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        add_shopping_cart
                      </span>
                      Order
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
