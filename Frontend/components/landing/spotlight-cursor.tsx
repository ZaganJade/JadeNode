"use client";

import { useEffect, useRef } from "react";

/**
 * Cursor-follow lime spotlight on every `.spotlight-card` inside the wrapped
 * subtree. Sets `--mx`, `--my`, `--spot-opacity` CSS vars; the actual paint
 * is the `::after` defined in globals.css.
 */
export function SpotlightCursor({ children }: { children: React.ReactNode }) {
  const root = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = root.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const cards = Array.from(node.querySelectorAll<HTMLElement>(".spotlight-card"));
    const handlers: Array<{ el: HTMLElement; m: (e: MouseEvent) => void; l: () => void }> = [];

    for (const el of cards) {
      const m = (e: MouseEvent) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
        el.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
        el.style.setProperty("--spot-opacity", "1");
      };
      const l = () => el.style.setProperty("--spot-opacity", "0");
      el.addEventListener("mousemove", m);
      el.addEventListener("mouseleave", l);
      handlers.push({ el, m, l });
    }

    return () => {
      for (const { el, m, l } of handlers) {
        el.removeEventListener("mousemove", m);
        el.removeEventListener("mouseleave", l);
      }
    };
  }, []);

  return <div ref={root}>{children}</div>;
}
