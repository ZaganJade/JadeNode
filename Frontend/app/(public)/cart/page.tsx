"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { StudioNav } from "@/components/landing/studio/studio-nav";
import { ScrollRail } from "@/components/landing/studio/scroll-rail";
import { NetworkPaths } from "@/components/landing/studio/network-paths";
import { CartLineItem } from "@/components/cart/cart-line-item";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/formatters";

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="studio-eyebrow text-accent">{children}</p>;
}

export default function CartPage() {
  const { items, count, subtotal, clear, ready } = useCart();
  const router = useRouter();
  const isEmpty = ready && items.length === 0;

  return (
    <main className="studio relative min-h-screen overflow-x-hidden">
      <ScrollRail />
      <StudioNav />

      {/* Hero strip */}
      <section className="relative isolate overflow-hidden border-b border-line/60">
        <div className="studio-streaks-fallback pointer-events-none absolute inset-0 -z-10" />
        <div className="pointer-events-none absolute inset-0 -z-10">
          <NetworkPaths />
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-1/3 bg-gradient-to-b from-transparent to-black" />

        <div className="mx-auto w-full max-w-[1100px] px-6 pt-28 pb-10">
          <nav className="mb-6 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em]">
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
            <span className="text-fg-muted">Keranjang</span>
          </nav>
          <Eyebrow>Keranjang</Eyebrow>
          <h1 className="studio-hero-title mt-3 text-[clamp(32px,5vw,56px)] text-fg">
            Tinjau pesanan kamu
          </h1>
          <p className="mt-3 text-[14px] text-fg-muted">
            {count > 0
              ? `${count} item siap untuk di-checkout.`
              : "Belum ada item di keranjang."}
          </p>
        </div>
      </section>

      <div className="mx-auto w-full max-w-[1100px] px-6 py-12">
        {!ready ? (
          // Hydration placeholder
          <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
            <div className="h-64 animate-pulse rounded-2xl bg-surface/50" />
            <div className="h-64 animate-pulse rounded-2xl bg-surface/50" />
          </div>
        ) : isEmpty ? (
          <div className="rounded-2xl border border-line bg-surface/40 p-16 text-center">
            <span className="material-symbols-outlined mb-4 block text-[64px] text-fg-dim">
              remove_shopping_cart
            </span>
            <h2 className="studio-display text-[24px] text-fg">
              Keranjang kamu kosong
            </h2>
            <p className="mt-2 text-[14px] text-fg-muted">
              Tambahkan VPS atau Dedicated Server dari Marketplace untuk
              memulai.
            </p>
            <Link
              href="/marketplace"
              className="mt-6 inline-flex items-center gap-2 rounded-lg border border-line-strong px-6 py-3 text-[13px] font-semibold text-fg transition-all hover:border-accent hover:bg-accent hover:text-accent-fg"
            >
              <span className="material-symbols-outlined text-[16px]">
                storefront
              </span>
              Jelajahi Marketplace
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr] lg:items-start">
            {/* Items */}
            <div className="space-y-3">
              {items.map((item) => (
                <CartLineItem key={item.slug} item={item} variant="detailed" />
              ))}
              <button
                type="button"
                onClick={clear}
                className="mt-2 inline-flex items-center gap-2 rounded-lg border border-line px-4 py-2.5 text-[12px] font-semibold text-fg-muted transition-all hover:border-error/50 hover:text-error"
              >
                <span className="material-symbols-outlined text-[16px]">
                  delete_sweep
                </span>
                Kosongkan keranjang
              </button>
            </div>

            {/* Summary */}
            <aside className="lg:sticky lg:top-28">
              <div className="rounded-2xl border border-line bg-surface/50 p-6 backdrop-blur">
                <h2 className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-fg-dim">
                  Ringkasan
                </h2>
                <div className="mt-4 space-y-3 text-[13px]">
                  <div className="flex items-center justify-between text-fg-muted">
                    <span>Jumlah item</span>
                    <span className="font-mono tabular-nums text-fg">
                      {count}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-fg-muted">
                    <span>Subtotal</span>
                    <span className="font-mono tabular-nums text-fg">
                      {formatPrice(subtotal)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-fg-muted">
                    <span>PPN</span>
                    <span className="font-mono text-fg-dim">
                      Dihitung saat checkout
                    </span>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
                  <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-fg-dim">
                    Estimasi total
                  </span>
                  <span className="studio-display text-[26px] text-accent tabular-nums">
                    {formatPrice(subtotal)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => router.push("/cart/checkout")}
                  className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-accent text-[13px] font-semibold text-accent-fg transition-all hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    lock
                  </span>
                  Lanjut ke Pembayaran
                </button>
                <Link
                  href="/marketplace"
                  className="mt-2.5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-line-strong text-[13px] font-semibold text-fg transition-all hover:border-accent hover:text-accent"
                >
                  Lanjut Belanja
                </Link>

                <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-fg-dim">
                  <span className="material-symbols-outlined text-[14px] text-success">
                    verified_user
                  </span>
                  Pembayaran aman via Midtrans Snap
                </p>
              </div>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
