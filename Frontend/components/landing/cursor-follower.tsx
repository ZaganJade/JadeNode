"use client";

import { useEffect, useRef } from "react";

/**
 * Custom cursor: a 28px hairline dot with `mix-blend-mode: difference`.
 * Grows to 56px and tints lime when hovering interactive elements
 * (`a`, `button`, `[data-cursor=grow]`).
 *
 * Hidden on coarse pointers via CSS.
 */
export function CursorFollower() {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const dot = ref.current;
    if (!dot) return;

    let x = -100;
    let y = -100;
    let raf = 0;
    let target = { x, y };

    const onMove = (e: MouseEvent) => {
      target = { x: e.clientX, y: e.clientY };
    };

    const tick = () => {
      // light damping for buttery cursor follow
      x += (target.x - x) * 0.32;
      y += (target.y - y) * 0.32;
      dot.style.transform = `translate3d(${x - 14}px, ${y - 14}px, 0)`;
      raf = requestAnimationFrame(tick);
    };

    const onOver = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (!t) return;
      const grow = t.closest(
        "a, button, [data-cursor='grow'], input, textarea, select",
      );
      dot.dataset.state = grow ? "grow" : "idle";
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseover", onOver);
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
      cancelAnimationFrame(raf);
    };
  }, []);

  return <div ref={ref} aria-hidden className="cursor-dot" />;
}
