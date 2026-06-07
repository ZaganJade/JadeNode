"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/formatters";
import { CartLineItem } from "./cart-line-item";

const TITLE_ID = "cart-modal-title";

/**
 * Centered modal cart panel. Rendered once at the app root.
 * Wrapped in `.studio` so it inherits the orange marketplace theme even though
 * it is portaled outside the page's studio scope.
 */
export function CartDrawer() {
  const { items, count, subtotal, isOpen, close } = useCart();
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  // Lock body scroll while open.
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  // Focus management: move focus in on open, restore on close.
  useEffect(() => {
    if (isOpen) {
      restoreFocusRef.current = document.activeElement as HTMLElement | null;
      const id = window.setTimeout(() => closeBtnRef.current?.focus(), 30);
      return () => window.clearTimeout(id);
    }
    restoreFocusRef.current?.focus?.();
  }, [isOpen]);

  // Esc to close + simple focus trap.
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        close();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusables = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    },
    [close],
  );

  function goCheckout() {
    close();
    router.push("/cart/checkout");
  }

  if (!isOpen) return null;

  return (
    <div
      className="studio fixed inset-0 z-[100] flex items-center justify-center"
      onKeyDown={onKeyDown}
    >
      {/* Backdrop — blur + dim */}
      <button
        type="button"
        aria-label="Tutup keranjang"
        onClick={close}
        className="absolute inset-0 cursor-default motion-safe:animate-[fadeIn_200ms_ease-out]"
        style={{
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      />

      {/* Modal panel — centered */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={TITLE_ID}
        className="relative flex max-h-[85vh] w-[calc(100%-2rem)] max-w-[520px] flex-col overflow-hidden rounded-2xl border border-line bg-surface text-fg shadow-2xl motion-safe:animate-[modalScaleIn_350ms_cubic-bezier(0.22,1,0.36,1)]"
        style={{
          boxShadow:
            "0 0 0 1px rgba(198,242,74,0.06), 0 25px 60px -12px rgba(0,0,0,0.6), 0 0 80px -20px rgba(198,242,74,0.08)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2
            id={TITLE_ID}
            className="flex items-center gap-2.5 studio-display text-[20px] text-fg"
          >
            <div className="grid h-8 w-8 place-items-center rounded-lg border border-accent/25 bg-accent/8">
              <span className="material-symbols-outlined text-[18px] text-accent">
                shopping_cart
              </span>
            </div>
            Keranjang
            <span className="font-mono text-[12px] font-normal text-fg-dim">
              ({count})
            </span>
          </h2>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={close}
            aria-label="Tutup keranjang"
            className="grid h-9 w-9 place-items-center rounded-lg text-fg-muted transition-colors hover:bg-white/5 hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Body */}
        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 px-8 py-16 text-center">
            <div className="grid h-20 w-20 place-items-center rounded-2xl border border-line bg-surface-2">
              <span className="material-symbols-outlined text-[36px] text-fg-dim">
                remove_shopping_cart
              </span>
            </div>
            <div>
              <p className="studio-display text-[20px] text-fg">
                Keranjang kamu kosong
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-fg-muted">
                Tambahkan VPS atau Dedicated Server dari Marketplace.
              </p>
            </div>
            <Link
              href="/marketplace"
              onClick={close}
              className="mt-2 inline-flex items-center gap-2 rounded-xl border border-line-strong px-6 py-3 text-[13px] font-semibold text-fg transition-all hover:border-accent hover:bg-accent hover:text-accent-fg"
            >
              <span className="material-symbols-outlined text-[16px]">
                storefront
              </span>
              Jelajahi Marketplace
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-3 overflow-y-auto px-6 py-5">
              {items.map((item) => (
                <CartLineItem key={item.slug} item={item} variant="compact" />
              ))}
            </div>

            {/* Footer */}
            <div className="border-t border-line bg-surface-2/40 px-6 py-5">
              <div className="mb-4 flex items-center justify-between">
                <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-fg-dim">
                  Subtotal
                </span>
                <span className="studio-display text-[24px] tabular-nums text-accent">
                  {formatPrice(subtotal)}
                </span>
              </div>
              <p className="mb-4 text-[11px] text-fg-dim">
                Harga final & pajak dihitung saat checkout oleh server.
              </p>
              <div className="flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={goCheckout}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-accent text-[13px] font-semibold text-accent-fg transition-all hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    lock
                  </span>
                  Checkout
                </button>
                <Link
                  href="/cart"
                  onClick={close}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-line-strong text-[13px] font-semibold text-fg transition-all hover:border-accent hover:text-accent"
                >
                  Lihat Keranjang
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
