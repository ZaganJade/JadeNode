"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CartButton } from "@/components/cart/cart-button";

const PRIMARY = [
  { label: "Marketplace", href: "/marketplace" },
  { label: "Layanan", href: "/layanan" },
  { label: "Lifecycle", href: "/lifecycle" },
  { label: "Artikel", href: "/articles" },
];

/**
 * The cloned top navigation: a thin utility strip over a glassy bar with the
 * brand, primary links, an inert search field (visual parity with the
 * reference's command field) and right-aligned account actions.
 */
export function StudioNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      {/* Utility strip */}
      <div className="hidden border-b border-line/70 bg-black/60 backdrop-blur md:block">
        <div className="mx-auto flex h-8 max-w-[1320px] items-center justify-between px-6">
          <p className="studio-eyebrow text-[10px] text-fg-dim">
            Infrastruktur cloud untuk tim engineering · Indonesia & SEA
          </p>
          <Link
            href="/marketplace"
            className="studio-eyebrow flex items-center gap-1.5 text-[10px] text-fg-muted transition-colors hover:text-accent"
          >
            Buka marketplace
            <span className="material-symbols-outlined text-[13px]">
              north_east
            </span>
          </Link>
        </div>
      </div>

      {/* Main bar */}
      <div
        className={`border-b transition-colors duration-300 ${
          scrolled
            ? "border-line/80 bg-black/80 backdrop-blur-xl"
            : "border-transparent bg-transparent"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-[1320px] items-center gap-5 px-6">
          {/* Brand */}
          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            <span className="relative grid h-7 w-7 shrink-0 place-items-center overflow-hidden">
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
            <span className="studio-display shrink-0 text-[16px] font-bold tracking-tight text-fg">
              Jade<span className="text-accent">Node</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-6 lg:flex">
            {PRIMARY.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className="text-[13px] text-fg-muted transition-colors hover:text-fg"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Spacer — pushes search + actions to the right */}
          <div className="hidden flex-1 lg:block" />

          {/* Search (visual) */}
          <div className="hidden min-w-0 md:flex">
            <div className="flex h-9 w-full max-w-[300px] items-center gap-2 rounded-md border border-line bg-surface/80 px-3 text-fg-dim">
              <span className="material-symbols-outlined text-[16px]">
                search
              </span>
              <span className="truncate text-[13px]">
                Cari VPS, region, provider…
              </span>
              <kbd className="ml-auto rounded border border-line-strong px-1.5 py-px font-mono text-[10px] text-fg-muted">
                ⌘K
              </kbd>
            </div>
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-3 md:ml-3">
            <Link
              href="/docs"
              className="hidden text-[13px] text-fg-muted transition-colors hover:text-fg lg:inline"
            >
              Docs
            </Link>
            <Link
              href="/login"
              className="hidden text-[13px] text-fg-muted transition-colors hover:text-fg sm:inline"
            >
              Masuk
            </Link>
            <CartButton />
            <a
              href="#mulai"
              className="group relative inline-flex h-9 items-center gap-1.5 overflow-hidden rounded-md bg-accent px-4 text-[13px] font-semibold text-accent-fg"
            >
              <span className="relative z-10">Ajukan akses</span>
              <span className="material-symbols-outlined relative z-10 text-[15px]">
                arrow_forward
              </span>
              <span className="absolute inset-0 -translate-x-full bg-white/25 transition-transform duration-[640ms] ease-out group-hover:translate-x-full" />
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
