"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";

interface ProductSpecs {
  cpu: string;
  ram: string;
  storage: string;
  bandwidth?: string;
}

interface PriceCardProps {
  name: string;
  badge?: "popular" | "enterprise";
  specs: ProductSpecs;
  price: number;
  originalMonthlyPrice: number; // Added this for correct savings calculation
  billingCycle: "monthly" | "yearly";
  annualPrice?: number;
  features: string[];
  ctaHref: string;
  index: number;
}

export function PriceCard({
  name,
  badge,
  specs,
  price,
  originalMonthlyPrice,
  annualPrice,
  features,
  ctaHref,
  index,
}: PriceCardProps) {
  // Calculate savings percentage based on original monthly price
  const savingsPercent = annualPrice
    ? Math.round((1 - annualPrice / (originalMonthlyPrice * 12)) * 100)
    : 0;

  // Animated price state
  const [displayPrice, setDisplayPrice] = useState(price);
  const previousPrice = useRef(price);
  const animationRef = useRef<number | null>(null);

  // Animate price when it changes
  useEffect(() => {
    if (price !== previousPrice.current) {
      const startPrice = previousPrice.current;
      const endPrice = price;
      const duration = 400; // ms
      const startTime = performance.now();

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease-out function for natural feel
        const easeOut = 1 - Math.pow(1 - progress, 3);

        setDisplayPrice(Math.floor(startPrice + (endPrice - startPrice) * easeOut));

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          previousPrice.current = endPrice;
        }
      };

      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }

      animationRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [price]);

  return (
    <div
      className="relative flex flex-col rounded-2xl border bg-surface/60 overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-accent/40"
      style={{
        animation: `fadeIn 0.5s ease-out ${index * 80}ms both`,
        borderColor: badge === "popular" ? "rgba(var(--color-accent-rgb), 0.5)" : "rgba(var(--color-line-rgb), 0.6)",
        boxShadow: badge === "popular" ? "0 0 30px rgba(var(--color-accent-rgb), 0.15)" : "transparent",
      }}
    >
      {/* Popular gradient overlay */}
      {badge === "popular" && (
        <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-transparent pointer-events-none" />
      )}

      {/* Card Content */}
      <div className="flex flex-col p-5 h-full">
        {/* Badge - positioned inside padding */}
        {badge && (
          <div className="flex justify-center mb-3">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold shadow-md ${
                badge === "popular"
                  ? "bg-accent text-accent-fg"
                  : "bg-steel text-steel-fg"
              }`}
            >
              {badge === "popular" && (
                <span className="material-symbols-outlined text-[14px]">star</span>
              )}
              {badge === "enterprise" ? "Enterprise" : "Popular"}
            </span>
          </div>
        )}

        {/* Title */}
        <div className="text-center mb-4">
          <h3 className="font-display text-lg font-bold text-fg">
            {name}
          </h3>
        </div>

        {/* Specs */}
        <div className="space-y-2 mb-4">
          {[
            { icon: "memory", value: specs.cpu },
            { icon: "data_usage", value: specs.ram },
            { icon: "hard_drive", value: specs.storage },
          ].map((spec, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span className="material-symbols-outlined text-accent text-[16px] shrink-0">
                {spec.icon}
              </span>
              <span className="text-fg-muted text-xs">{spec.value}</span>
            </div>
          ))}
        </div>

        {/* Price Section */}
        <div className="text-center py-3 border-y border-line/50 mb-4 bg-fg-dim/5">
          <div className="font-display text-2xl font-bold text-fg">
            Rp {displayPrice.toLocaleString("id-ID")}
          </div>
          <span className="text-fg-muted text-xs">/bulan</span>
          {annualPrice && savingsPercent > 0 && (
            <p className="text-xs text-accent mt-1 font-medium">
              Hemat {savingsPercent}%/tahun
            </p>
          )}
        </div>

        {/* Features */}
        <ul className="space-y-1.5 flex-1 mb-4">
          {features.map((feature, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-fg-muted">
              <span className="material-symbols-outlined text-accent text-[14px] shrink-0 mt-0.5">
                check
              </span>
              <span className="leading-snug">{feature}</span>
            </li>
          ))}
        </ul>

        {/* CTA Button - always at bottom */}
        <div className="mt-auto">
          <Link
            href={ctaHref}
            className="flex items-center justify-center gap-2 w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-fg transition-all duration-200 hover:bg-accent/90 hover:shadow-md active:scale-95"
          >
            <span>Order</span>
            <span className="material-symbols-outlined text-[16px]">
              arrow_forward
            </span>
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
