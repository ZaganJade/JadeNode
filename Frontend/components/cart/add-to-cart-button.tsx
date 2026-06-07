"use client";

import { useState } from "react";
import { useCart, type CartInput } from "@/lib/cart";

interface AddToCartButtonProps {
  item: CartInput;
  /** `icon` = compact square (product card); `full` = labelled button (detail). */
  variant?: "icon" | "full";
  disabled?: boolean;
  className?: string;
}

/**
 * Adds a Product Listing to the cart with a brief "added" confirmation.
 * Stops link navigation when nested inside a clickable card.
 */
export function AddToCartButton({
  item,
  variant = "icon",
  disabled = false,
  className = "",
}: AddToCartButtonProps) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    add(item);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1400);
  }

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        aria-label={`Tambah ${item.name} ke keranjang`}
        className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg border transition-all ${
          disabled
            ? "cursor-not-allowed border-line text-fg-dim"
            : added
              ? "border-success/50 bg-success/10 text-success"
              : "border-line-strong text-fg hover:border-accent hover:bg-accent hover:text-accent-fg"
        } ${className}`}
      >
        <span className="material-symbols-outlined text-[16px]">
          {added ? "check" : "add_shopping_cart"}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={`inline-flex items-center gap-2 rounded-lg border px-5 py-3 text-[13px] font-semibold transition-all ${
        disabled
          ? "cursor-not-allowed border-line text-fg-dim"
          : added
            ? "border-success/50 bg-success/10 text-success"
            : "border-line-strong text-fg hover:border-accent hover:bg-accent hover:text-accent-fg"
      } ${className}`}
    >
      <span className="material-symbols-outlined text-[16px]">
        {added ? "check" : "add_shopping_cart"}
      </span>
      {added ? "Ditambahkan" : "Tambah ke Keranjang"}
    </button>
  );
}
