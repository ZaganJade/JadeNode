"use client";

import Link from "next/link";

interface ProductTickerItem {
  name: string;
  category: string;
  specs: string;
  price: string;
  slug: string;
}

interface ProductTickerProps {
  products: ProductTickerItem[];
}

export function ProductTicker({ products }: ProductTickerProps) {
  // Duplicate products multiple times for seamless scrolling
  const allProducts = [...products, ...products, ...products, ...products];

  return (
    <div className="border-b border-line/60 bg-surface/40 py-3 overflow-hidden relative">
      {/* Fade edges */}
      <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-bg to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-bg to-transparent z-10 pointer-events-none" />

      {/* Scrolling container */}
      <div className="flex overflow-hidden">
        <div className="flex gap-8 animate-scroll-ticker hover:[animation-play-state:paused] whitespace-nowrap">
          {allProducts.map((product, index) => (
            <Link
              key={`${product.slug}-${index}`}
              href="/marketplace"
              className="inline-flex items-center gap-3 px-4 py-1 rounded-full hover:bg-surface/60 transition-colors group flex-shrink-0"
            >
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-accent px-2 py-0.5 rounded bg-accent/10 border border-accent/30">
                {product.category}
              </span>
              <span className="font-display text-sm font-semibold text-fg group-hover:text-accent transition-colors">
                {product.name}
              </span>
              <span className="font-mono text-[10px] text-fg-dim hidden sm:inline">
                {product.specs}
              </span>
              <span className="font-mono text-[11px] font-semibold text-accent">
                Rp {product.price}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
