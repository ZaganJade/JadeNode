"use client";

/* ═══════════════════════════════════════════════════════════════════════
   STUDIO ADMIN PRIMITIVES
   Reusable pieces of the landing's "orange-on-black" design language,
   adapted for admin management screens. Everything reads the `.studio`
   design tokens so it auto-tints inside the admin shell.

   Pure-SVG / CSS data-viz — no charting library. Each visual draws itself
   on scroll via an IntersectionObserver, mirroring the dashboard home.
   ═══════════════════════════════════════════════════════════════════════ */

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const ICON_VAR = '"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20';

/* ── In-view hook (drives draw-on-scroll) ─────────────────────────────── */
function useInView<T extends Element>(threshold = 0.3) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, inView] as const;
}

/* ── Material icon helper ─────────────────────────────────────────────── */
export function Icon({
  name,
  className,
  size = 20,
  fill = 0,
}: {
  name: string;
  className?: string;
  size?: number;
  fill?: 0 | 1;
}) {
  return (
    <span
      className={cn("material-symbols-outlined", className)}
      style={{
        fontSize: size,
        fontVariationSettings: `"FILL" ${fill}, "wght" 300, "GRAD" 0, "opsz" ${size}`,
      }}
    >
      {name}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   PAGE HEADER — editorial hero: mono eyebrow + Satoshi display title
   ═══════════════════════════════════════════════════════════════════════ */
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  status,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  status?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="reveal-rise relative mb-8">
      {/* ambient glow lifted from the landing hero */}
      <span className="admin-glow -left-20 -top-24 bg-[radial-gradient(circle,var(--color-accent),transparent_70%)]" />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="studio-eyebrow text-accent">{eyebrow}</p>
          <h1 className="studio-display mt-3 text-[clamp(28px,4vw,44px)] text-[var(--color-fg)]">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 max-w-xl text-[13px] text-[var(--color-fg-muted)]">
              {subtitle}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {status && (
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-line)] bg-[var(--color-surface)]/60 px-3 py-1.5">
              <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-[var(--color-success)]" />
              <span className="studio-eyebrow text-[9px] text-[var(--color-fg-dim)]">
                {status}
              </span>
            </span>
          )}
          {children}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   KPI / STAT CARD
   ═══════════════════════════════════════════════════════════════════════ */
export function StatCard({
  label,
  value,
  sub,
  icon,
  trend,
  trendValue,
  accent,
  delay = 0,
  compact,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: string;
  trend?: "up" | "down" | "flat";
  trendValue?: string;
  accent?: boolean;
  delay?: number;
  compact?: boolean;
}) {
  return (
    <div
      className="studio-card reveal-rise rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)]/50 p-5"
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="studio-eyebrow text-[8px] text-[var(--color-fg-dim)]">
            {label}
          </p>
          <p
            className={cn(
              "studio-display mt-2 truncate text-[var(--color-fg)]",
              compact ? "text-[20px]" : "text-[28px]",
            )}
          >
            {value}
          </p>
          {sub && (
            <p className="mt-1 text-[11px] text-[var(--color-fg-muted)]">{sub}</p>
          )}
        </div>
        <div
          className={cn(
            "grid h-10 w-10 shrink-0 place-items-center rounded-xl border",
            accent
              ? "border-[var(--color-accent)]/30 bg-[var(--color-accent-soft)]"
              : "border-[var(--color-line)] bg-black/40",
          )}
        >
          <Icon name={icon} className="text-[var(--color-accent)]" size={20} />
        </div>
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1.5 border-t border-[var(--color-line)]/80 pt-3">
          <Icon
            name={
              trend === "up"
                ? "trending_up"
                : trend === "down"
                  ? "trending_down"
                  : "trending_flat"
            }
            size={14}
            fill={0}
            className={
              trend === "up"
                ? "text-[var(--color-success)]"
                : trend === "down"
                  ? "text-[var(--color-error)]"
                  : "text-[var(--color-fg-dim)]"
            }
          />
          <span className="text-[10px] text-[var(--color-fg-muted)]">
            {trendValue ?? ""} vs bulan lalu
          </span>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   BENTO CARD — a titled studio-card panel for visualizations
   ═══════════════════════════════════════════════════════════════════════ */
export function BentoCard({
  eyebrow,
  title,
  action,
  children,
  className,
  delay = 0,
}: {
  eyebrow: string;
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <article
      className={cn(
        "studio-card reveal-rise overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)]/50 p-6",
        className,
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <span className="studio-eyebrow text-[9px] text-[var(--color-fg-dim)]">
            {eyebrow}
          </span>
          <h3 className="studio-display mt-2 text-[20px] text-[var(--color-fg)]">
            {title}
          </h3>
        </div>
        {action}
      </div>
      {children}
    </article>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   AREA CHART — normalized values[], draws line + gradient fill on scroll
   ═══════════════════════════════════════════════════════════════════════ */
export function AreaChart({
  values,
  height = 160,
  labels,
}: {
  values: number[];
  height?: number;
  labels?: string[];
}) {
  const [ref, drawn] = useInView<HTMLDivElement>();
  const rawId = useId().replace(/[:]/g, "");
  const areaId = `area-${rawId}`;
  const lineId = `line-${rawId}`;

  const w = 660;
  const h = height;
  const pad = 8;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = max - min || 1;
  const stepX = w / Math.max(values.length - 1, 1);
  const pts = values.map((v, i) => ({
    x: i * stepX,
    y: h - pad - ((v - min) / span) * (h - pad * 2),
  }));

  const pathD = pts
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");
  const areaD = `${pathD} L ${w} ${h} L 0 ${h} Z`;
  const last = pts[pts.length - 1];

  return (
    <div ref={ref} className="w-full">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ overflow: "visible" }}>
        <defs>
          <linearGradient id={areaId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.32" />
            <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={lineId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.6" />
            <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="1" />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((g) => (
          <line
            key={g}
            x1="0"
            y1={g * h}
            x2={w}
            y2={g * h}
            stroke="var(--color-line)"
            strokeWidth="0.5"
          />
        ))}
        <path
          d={areaD}
          fill={`url(#${areaId})`}
          style={{
            opacity: drawn ? 1 : 0,
            transition: "opacity 1.2s cubic-bezier(0.22,1,0.36,1)",
          }}
        />
        <path
          d={pathD}
          fill="none"
          stroke={`url(#${lineId})`}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="2000"
          strokeDashoffset={drawn ? "0" : "2000"}
          style={{ transition: "stroke-dashoffset 2s cubic-bezier(0.22,1,0.36,1)" }}
        />
        {pts.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="2.5"
            fill="var(--color-accent)"
            style={{
              opacity: drawn ? 1 : 0,
              transition: `opacity 0.4s cubic-bezier(0.22,1,0.36,1) ${0.8 + i * 0.05}s`,
            }}
          />
        ))}
        <circle cx={last.x} cy={last.y} r="6" fill="var(--color-accent)" opacity="0.25" className="pulse-dot" />
      </svg>
      {labels && (
        <div className="mt-2 flex justify-between">
          {labels.map((l, i) => (
            <span key={`${l}-${i}`} className="font-mono text-[8px] text-[var(--color-fg-dim)]">
              {l}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   DONUT CHART — animated segments
   ═══════════════════════════════════════════════════════════════════════ */
export function DonutChart({
  data,
  size = 150,
  strokeWidth = 26,
  centerLabel,
  centerValue,
}: {
  data: { label: string; value: number; color: string }[];
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
  centerValue?: string;
}) {
  const [ref, drawn] = useInView<HTMLDivElement>();
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  let offset = 0;

  return (
    <div ref={ref} className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-line)" strokeWidth={strokeWidth} />
          {data.map((seg, i) => {
            const len = (seg.value / total) * circ;
            const dashArray = drawn ? `${len} ${circ - len}` : `0 ${circ}`;
            const dashOffset = -offset;
            offset += len;
            return (
              <circle
                key={seg.label}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={seg.color}
                strokeWidth={strokeWidth}
                strokeDasharray={dashArray}
                strokeDashoffset={dashOffset}
                strokeLinecap="butt"
                style={{ transition: `stroke-dasharray 1.2s cubic-bezier(0.22,1,0.36,1) ${i * 0.15}s` }}
              />
            );
          })}
        </svg>
        {(centerValue || centerLabel) && (
          <div className="absolute inset-0 grid place-items-center text-center">
            <div>
              {centerValue && (
                <p className="studio-display text-[24px] leading-none text-[var(--color-fg)]">
                  {centerValue}
                </p>
              )}
              {centerLabel && (
                <p className="studio-eyebrow mt-1 text-[7px] text-[var(--color-fg-dim)]">
                  {centerLabel}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5">
        {data.map((seg) => (
          <div key={seg.label} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: seg.color }} />
            <span className="text-[11px] text-[var(--color-fg-muted)]">{seg.label}</span>
            <span className="font-mono text-[11px] font-semibold text-[var(--color-fg)]">
              {Math.round((seg.value / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   MINI BAR CHART — vertical bars, highlights the last column
   ═══════════════════════════════════════════════════════════════════════ */
export function MiniBarChart({
  values,
  labels,
  height = 120,
}: {
  values: number[];
  labels?: string[];
  height?: number;
}) {
  const [ref, drawn] = useInView<HTMLDivElement>();
  const max = Math.max(...values, 1);

  return (
    <div ref={ref} className="w-full">
      <div className="flex items-end gap-[6px]" style={{ height }}>
        {values.map((val, i) => (
          <div key={i} className="flex flex-1 flex-col items-center">
            <div
              className="w-full rounded-t-sm"
              style={{
                height: drawn ? `${(val / max) * 100}%` : "0%",
                background:
                  i === values.length - 1
                    ? "var(--color-accent)"
                    : "rgba(var(--accent-rgb), 0.2)",
                transition: "height 1s cubic-bezier(0.22,1,0.36,1)",
                transitionDelay: `${i * 60}ms`,
              }}
            />
          </div>
        ))}
      </div>
      {labels && (
        <div className="mt-2 flex gap-[6px]">
          {labels.map((l, i) => (
            <span key={`${l}-${i}`} className="flex-1 text-center font-mono text-[8px] text-[var(--color-fg-dim)]">
              {l}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   PROGRESS BAR — horizontal animated bar (distribution / SLA / share)
   ═══════════════════════════════════════════════════════════════════════ */
export function ProgressBar({
  label,
  pct,
  rightLabel,
  color = "var(--color-accent)",
  delay = 0,
  labelWidth = 112,
}: {
  label: string;
  pct: number;
  rightLabel?: string;
  color?: string;
  delay?: number;
  labelWidth?: number;
}) {
  const [drawn, setDrawn] = useState(false);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDrawn(true);
      return;
    }
    const t = setTimeout(() => setDrawn(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div className="flex items-center gap-3">
      <span
        className="shrink-0 truncate text-right text-[12px] text-[var(--color-fg-muted)]"
        style={{ width: labelWidth }}
      >
        {label}
      </span>
      <div className="studio-bar h-2 flex-1 overflow-hidden rounded-full bg-white/[0.04]">
        <span
          className="block h-full rounded-full"
          style={{
            width: drawn ? `${Math.min(pct, 100)}%` : "0%",
            background: color,
            transition: "width 1.4s cubic-bezier(0.22,1,0.36,1)",
            transitionDelay: `${delay}ms`,
          }}
        />
      </div>
      <span className="w-14 shrink-0 text-right font-mono text-[11px] font-semibold text-[var(--color-fg)]">
        {rightLabel ?? `${Math.round(pct)}%`}
      </span>
    </div>
  );
}

/* ── SLA tone helper ──────────────────────────────────────────────────── */
export function slaColor(pct: number) {
  return pct >= 95
    ? "var(--color-accent)"
    : pct >= 80
      ? "var(--color-amber)"
      : "var(--color-error)";
}

/* ═══════════════════════════════════════════════════════════════════════
   STATUS PILL — the rounded uppercase badge used across tables
   ═══════════════════════════════════════════════════════════════════════ */
export function StatusPill({
  label,
  color,
  bg,
  border,
  size = "md",
}: {
  label: string;
  color: string;
  bg: string;
  border: string;
  size?: "sm" | "md";
}) {
  return (
    <span
      className={cn(
        "inline-block rounded-full border font-semibold uppercase tracking-wider",
        size === "sm" ? "px-2 py-0.5 text-[8px]" : "px-2.5 py-0.5 text-[9px]",
      )}
      style={{ color, backgroundColor: bg, borderColor: border }}
    >
      {label}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   QUICK ACTION — icon tile with hover spotlight (landing step-card clone)
   ═══════════════════════════════════════════════════════════════════════ */
export function QuickAction({
  icon,
  label,
  href,
  onClick,
  delay = 0,
}: {
  icon: string;
  label: string;
  href?: string;
  onClick?: () => void;
  delay?: number;
}) {
  const inner = (
    <>
      <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(var(--accent-rgb),0.08),transparent_70%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <Icon
        name={icon}
        size={24}
        className="relative text-[var(--color-accent)] transition-transform duration-200 group-hover:scale-110"
      />
      <span className="studio-eyebrow relative text-[9px] text-[var(--color-fg-muted)]">
        {label}
      </span>
    </>
  );
  const cls =
    "reveal-rise group relative grid place-items-center gap-2 overflow-hidden rounded-xl border border-[var(--color-line)]/80 bg-black/40 py-5 transition-all duration-[var(--dur-standard)] hover:border-[var(--color-accent)]/40";
  return href ? (
    <Link href={href} className={cls} style={{ transitionDelay: `${delay}ms` }}>
      {inner}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={cls} style={{ transitionDelay: `${delay}ms` }}>
      {inner}
    </button>
  );
}

export { useInView };
