"use client";

import { useState, useEffect, useRef, type MouseEvent } from "react";

interface NavItem {
  id: string;
  label: string;
  href: string;
  children?: NavItem[];
}

const NAV_ITEMS: NavItem[] = [
  { id: "quickstart", label: "Quick Start", href: "#quickstart" },
  {
    id: "api",
    label: "API Reference",
    href: "#api",
    children: [
      { id: "auth", label: "Authentication", href: "#authentication" },
      { id: "marketplace", label: "Marketplace", href: "#marketplace-api" },
      { id: "orders", label: "Orders", href: "#orders-api" },
      { id: "invoices", label: "Invoices", href: "#invoices-api" },
    ],
  },
  { id: "webhooks", label: "Webhooks", href: "#webhooks" },
  { id: "examples", label: "Code Examples", href: "#examples" },
];

interface DocsSidebarProps {
  activeId?: string;
}

export function DocsSidebar({ activeId }: DocsSidebarProps) {
  const [currentId, setCurrentId] = useState(activeId || "quickstart");
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Robust active-section detection using IntersectionObserver.
  // Each section is "active" when it crosses the upper 1/3 of the viewport.
  useEffect(() => {
    const trackedIds = NAV_ITEMS.flatMap((item) =>
      item.children ? item.children.map((c) => c.id) : [item.id]
    );

    const visibility = new Map<string, number>();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          visibility.set(entry.target.id, entry.intersectionRatio);
        }
        let bestId: string | null = null;
        let bestRatio = 0;
        for (const [id, ratio] of visibility.entries()) {
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestId = id;
          }
        }
        if (bestId && bestRatio > 0) {
          setCurrentId(bestId);
        }
      },
      {
        // Trigger band: section is "active" when its top edge is in the
        // upper 15%–45% of the viewport. Stays stable while scrolling.
        rootMargin: "-15% 0px -55% 0px",
        threshold: [0, 0.25, 0.5, 0.75, 1],
      }
    );

    for (const id of trackedIds) {
      const el = document.getElementById(id);
      if (el) observerRef.current!.observe(el);
    }

    return () => observerRef.current?.disconnect();
  }, []);

  function handleClick(e: MouseEvent<HTMLAnchorElement>, id: string) {
    // Set active immediately on click for instant feedback (IO refines it).
    setCurrentId(id);
  }

  // If the active section is a child, also light up its parent group label.
  const activeParentId = (() => {
    if (!currentId) return null;
    const parent = NAV_ITEMS.find((it) =>
      it.children?.some((c) => c.id === currentId)
    );
    return parent?.id ?? null;
  })();

  return (
    <aside className="w-full">
      {/* Brand strip */}
      <div className="mb-6 flex items-center gap-2.5">
        <span className="relative grid h-6 w-6 place-items-center">
          <span
            className="absolute inset-0 bg-accent"
            style={{
              clipPath:
                "polygon(50% 0, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)",
            }}
          />
          <span className="relative font-mono text-[8px] font-bold text-accent-fg">
            JN
          </span>
        </span>
        <span className="studio-display text-[14px] font-bold text-fg">
          Docs<span className="text-accent">.</span>
        </span>
      </div>

      <nav className="relative space-y-6">
        {NAV_ITEMS.map((item) => {
          const isActiveParent = activeParentId === item.id;
          const isActiveTop = currentId === item.id;

          return (
            <div key={item.id}>
              {item.children ? (
                <div>
                  {/* Parent group label — lights up when any child is active */}
                  <h3
                    className={`studio-eyebrow mb-3 px-3 text-[10px] uppercase transition-colors duration-300 ${
                      isActiveParent ? "text-accent" : "text-fg-dim"
                    }`}
                  >
                    {item.label}
                  </h3>
                  <ul className="space-y-1">
                    {item.children.map((child) => {
                      const isActive = currentId === child.id;
                      return (
                        <li key={child.id}>
                          <SidebarLink
                            href={child.href}
                            label={child.label}
                            isActive={isActive}
                            onClick={(e) => handleClick(e, child.id)}
                          />
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : (
                <SidebarLink
                  href={item.href}
                  label={item.label}
                  isActive={isActiveTop}
                  onClick={(e) => handleClick(e, item.id)}
                />
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

// ─── SidebarLink — animated, glows orange when active ───────────────────────

function SidebarLink({
  href,
  label,
  isActive,
  onClick,
}: {
  href: string;
  label: string;
  isActive: boolean;
  onClick: (e: MouseEvent<HTMLAnchorElement>) => void;
}) {
  return (
    <a
      href={href}
      onClick={onClick}
      className={`group relative block overflow-hidden rounded-lg py-2 pl-5 pr-3 text-[13px] transition-all duration-300 ease-out ${
        isActive
          ? "bg-accent/[0.12] text-accent font-medium"
          : "text-fg-muted hover:bg-white/[0.03] hover:text-fg"
      }`}
      style={{
        // Premium easing for the active state glow shift
        transitionProperty:
          "background-color, color, padding-left, box-shadow, transform",
        boxShadow: isActive
          ? "0 0 22px -4px rgba(255,116,0,0.45), inset 0 0 0 1px rgba(255,116,0,0.25)"
          : "inset 0 0 0 1px transparent",
      }}
    >
      {/* Sliding orange rail on the left edge — animates in/out */}
      <span
        aria-hidden
        className={`absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-r-full bg-accent transition-all duration-300 ease-out ${
          isActive ? "scale-y-100 opacity-100" : "scale-y-0 opacity-0"
        }`}
        style={{
          boxShadow: isActive
            ? "0 0 8px 1px rgba(255,116,0,0.7)"
            : "none",
        }}
      />
      {/* Leading dot that pulses on active (ambient layer) */}
      <span
        aria-hidden
        className={`absolute left-2 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full transition-all duration-300 ${
          isActive
            ? "scale-100 bg-accent opacity-100"
            : "scale-0 bg-accent opacity-0"
        }`}
        style={{
          boxShadow: isActive
            ? "0 0 6px 1px rgba(255,116,0,0.6)"
            : "none",
        }}
      />
      <span className="relative">{label}</span>
    </a>
  );
}
