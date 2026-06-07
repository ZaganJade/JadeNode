"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart";

/**
 * Cart icon + count badge for the marketplace / landing top navigation.
 * Navigates directly to the /cart page.
 */
export function CartButton({ className = "" }: { className?: string }) {
  const { count, ready } = useCart();
  const showBadge = ready && count > 0;

  return (
    <Link
      href="/cart"
      aria-label={showBadge ? `Keranjang, ${count} item` : "Keranjang, kosong"}
      className={`group relative grid h-9 w-9 place-items-center rounded-md border border-line text-fg-muted transition-colors hover:border-accent hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${className}`}
    >
      <span className="material-symbols-outlined text-[18px]">
        shopping_cart
      </span>
      {showBadge && (
        <span
          aria-hidden="true"
          className="absolute -right-1.5 -top-1.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-accent px-1 font-mono text-[10px] font-bold leading-none text-accent-fg shadow-[0_0_10px_rgba(255,116,0,0.45)]"
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
