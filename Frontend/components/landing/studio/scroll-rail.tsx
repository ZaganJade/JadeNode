"use client";

import { useEffect, useRef } from "react";

/**
 * Right-edge vertical scroll progress — the reference's glowing orange rail.
 * Writes a `--rail` percentage onto the thumb via rAF-throttled scroll.
 */
export function ScrollRail() {
  const thumb = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let ticking = false;
    const update = () => {
      ticking = false;
      const el = document.documentElement;
      const max = el.scrollHeight - el.clientHeight;
      const pct = max > 0 ? (el.scrollTop / max) * 100 : 0;
      thumb.current?.style.setProperty("--rail", `${pct}%`);
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div aria-hidden className="studio-rail">
      <div ref={thumb} className="studio-rail__thumb" />
    </div>
  );
}
