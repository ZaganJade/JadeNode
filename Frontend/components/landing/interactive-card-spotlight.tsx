"use client";

import { useEffect, useRef } from "react";

/**
 * Adds a cursor-following purple radial spotlight to every `.interactive-card`
 * inside the wrapped subtree. Listens once per card and shares logic.
 */
export function InteractiveCardSpotlight({
  children,
}: {
  children: React.ReactNode;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const cards = Array.from(
      root.querySelectorAll<HTMLElement>(".interactive-card"),
    );

    const handlers: Array<{
      el: HTMLElement;
      move: (e: MouseEvent) => void;
      leave: () => void;
    }> = [];

    for (const el of cards) {
      const move = (e: MouseEvent) => {
        const rect = el.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        el.style.setProperty("--mx", `${x}%`);
        el.style.setProperty("--my", `${y}%`);
        el.style.setProperty("--spot-opacity", "1");
      };
      const leave = () => {
        el.style.setProperty("--spot-opacity", "0");
      };
      el.addEventListener("mousemove", move);
      el.addEventListener("mouseleave", leave);
      handlers.push({ el, move, leave });
    }

    return () => {
      for (const { el, move, leave } of handlers) {
        el.removeEventListener("mousemove", move);
        el.removeEventListener("mouseleave", leave);
      }
    };
  }, []);

  return <div ref={rootRef}>{children}</div>;
}
