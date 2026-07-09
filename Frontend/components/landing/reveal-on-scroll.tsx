"use client";

import { useEffect, useRef } from "react";

/**
 * Toggles `.is-visible` on `.reveal`, `.word`, and `.reveal-rise` descendants
 * when they enter the viewport. Designed to be wrapped around large sections so
 * the IntersectionObserver bookkeeping happens once.
 *
 * A MutationObserver re-scans for targets added AFTER mount — without it,
 * content that renders asynchronously (e.g. fetched article cards) would never
 * be observed and would stay stuck at `opacity: 0`.
 *
 * Honours `prefers-reduced-motion` by activating everything immediately.
 */
export function RevealOnScroll({ children }: { children: React.ReactNode }) {
  const root = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = root.current;
    if (!node) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let io: IntersectionObserver | null = null;
    if (!reduceMotion) {
      io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              io?.unobserve(entry.target);
            }
          }
        },
        { threshold: 0, rootMargin: "0px 0px 0px 0px" },
      );
    }

    const activate = (el: HTMLElement) => {
      if (el.classList.contains("is-visible")) return;
      if (io) io.observe(el);
      else el.classList.add("is-visible");
    };

    const scan = () =>
      node
        .querySelectorAll<HTMLElement>(".reveal, .word, .reveal-rise")
        .forEach(activate);

    scan();

    // Async content (e.g. fetched article cards) mounts after this effect
    // runs, so re-scan on DOM changes. rAF coalesces mutation bursts.
    let scheduled = false;
    const mo = new MutationObserver(() => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
        scan();
      });
    });
    mo.observe(node, { childList: true, subtree: true });

    return () => {
      io?.disconnect();
      mo.disconnect();
    };
  }, []);

  return <div ref={root}>{children}</div>;
}
