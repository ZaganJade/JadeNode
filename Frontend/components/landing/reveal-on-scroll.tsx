"use client";

import { useEffect, useRef } from "react";

/**
 * Toggles `.is-visible` on `.reveal` and `.word` descendants when they enter
 * the viewport. Designed to be wrapped around large sections so the
 * IntersectionObserver bookkeeping happens once.
 *
 * Honours `prefers-reduced-motion` by activating everything immediately.
 */
export function RevealOnScroll({ children }: { children: React.ReactNode }) {
  const root = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = root.current;
    if (!node) return;

    const targets = node.querySelectorAll<HTMLElement>(
      ".reveal, .word, .reveal-rise",
    );
    if (targets.length === 0) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      for (const el of targets) el.classList.add("is-visible");
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0, rootMargin: "0px 0px 0px 0px" },
    );

    for (const el of targets) io.observe(el);
    return () => io.disconnect();
  }, []);

  return <div ref={root}>{children}</div>;
}
