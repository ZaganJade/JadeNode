"use client";

import { useEffect, useRef } from "react";

/**
 * Network-routing paths — the hero's signature motion. A fabric of region /
 * provider nodes is wired to a bright central JadeNode hub by curved routes;
 * glowing packets stream along those paths (orders flowing in, deployments
 * flowing out) while the routes themselves pulse with a flowing-dash effect.
 *
 * This replaces the earlier radial "fireworks" streaks with motion that maps
 * directly to the product: traffic being routed across cloud infrastructure.
 *
 * Pure canvas, dependency-free. Caps DPR at 2, pauses off-screen, gentle mouse
 * parallax, and renders a single static frame under prefers-reduced-motion.
 */

// Normalised node layout (0..1), biased to the right so the headline stays
// legible on the left. Index 0 is the hub.
const NODES: Array<[number, number]> = [
  [0.66, 0.46], // 0 hub
  [0.9, 0.16], // 1
  [0.97, 0.5], // 2
  [0.86, 0.82], // 3
  [0.55, 0.12], // 4
  [0.46, 0.4], // 5
  [0.58, 0.86], // 6
  [0.78, 0.3], // 7
  [0.81, 0.64], // 8
];

// Routes as node-index pairs. Spokes to the hub + a few mesh links.
const ROUTES: Array<[number, number]> = [
  [0, 1],
  [0, 2],
  [0, 3],
  [0, 4],
  [0, 5],
  [0, 6],
  [0, 7],
  [0, 8],
  [1, 7],
  [7, 4],
  [2, 8],
  [8, 3],
  [3, 6],
  [5, 6],
];

type Packet = { route: number; t: number; speed: number; dir: 1 | -1 };

function quad(
  p0: number,
  c: number,
  p1: number,
  t: number,
): number {
  const mt = 1 - t;
  return mt * mt * p0 + 2 * mt * t * c + t * t * p1;
}

export function NetworkPaths({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let w = 0;
    let h = 0;
    let dpr = 1;

    // pixel-space node positions + per-route control points
    let pts: Array<{ x: number; y: number }> = [];
    let controls: Array<{ cx: number; cy: number }> = [];

    const computeGeometry = () => {
      pts = NODES.map(([nx, ny]) => ({ x: nx * w, y: ny * h }));
      controls = ROUTES.map(([a, b], i) => {
        const pa = pts[a];
        const pb = pts[b];
        const mx = (pa.x + pb.x) / 2;
        const my = (pa.y + pb.y) / 2;
        const dx = pb.x - pa.x;
        const dy = pb.y - pa.y;
        const len = Math.hypot(dx, dy) || 1;
        // perpendicular offset, deterministic sign per route → stable curves
        const sign = i % 2 === 0 ? 1 : -1;
        const amount = len * 0.18 * sign;
        return { cx: mx + (-dy / len) * amount, cy: my + (dx / len) * amount };
      });
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width;
      h = rect.height;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      computeGeometry();
    };

    // Packets — a couple per spoke, fewer on mesh links
    const packets: Packet[] = [];
    ROUTES.forEach((r, i) => {
      const isSpoke = r[0] === 0 || r[1] === 0;
      const count = isSpoke ? 2 : 1;
      for (let k = 0; k < count; k++) {
        packets.push({
          route: i,
          t: Math.random(),
          speed: 0.0016 + Math.random() * 0.0026,
          dir: Math.random() > 0.5 ? 1 : -1,
        });
      }
    });

    // mouse parallax
    const parallax = { tx: 0, ty: 0, cx: 0, cy: 0 };
    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      parallax.tx = ((e.clientX - rect.left) / rect.width - 0.5) * 26;
      parallax.ty = ((e.clientY - rect.top) / rect.height - 0.5) * 18;
    };

    const drawRoute = (i: number, dashOffset: number) => {
      const [a, b] = ROUTES[i];
      const pa = pts[a];
      const pb = pts[b];
      const c = controls[i];
      ctx.beginPath();
      ctx.moveTo(pa.x, pa.y);
      ctx.quadraticCurveTo(c.cx, c.cy, pb.x, pb.y);

      // faint base line
      ctx.setLineDash([]);
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(255,116,0,0.07)";
      ctx.stroke();

      // flowing dashed overlay
      ctx.setLineDash([2, 16]);
      ctx.lineDashOffset = dashOffset;
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = "rgba(255,150,60,0.28)";
      ctx.stroke();
      ctx.setLineDash([]);
    };

    const drawPacket = (p: Packet) => {
      const [a, b] = ROUTES[p.route];
      const pa = pts[a];
      const pb = pts[b];
      const c = controls[p.route];
      const tt = p.dir === 1 ? p.t : 1 - p.t;

      const x = quad(pa.x, c.cx, pb.x, tt);
      const y = quad(pa.y, c.cy, pb.y, tt);

      // short comet trail (a little behind the head, along travel direction)
      const tb = p.dir === 1 ? Math.max(0, tt - 0.08) : Math.min(1, tt + 0.08);
      const xb = quad(pa.x, c.cx, pb.x, tb);
      const yb = quad(pa.y, c.cy, pb.y, tb);

      const grad = ctx.createLinearGradient(xb, yb, x, y);
      grad.addColorStop(0, "rgba(255,116,0,0)");
      grad.addColorStop(1, "rgba(255,190,120,0.9)");
      ctx.beginPath();
      ctx.moveTo(xb, yb);
      ctx.lineTo(x, y);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.stroke();

      // glowing head
      ctx.beginPath();
      ctx.arc(x, y, 2.1, 0, Math.PI * 2);
      ctx.fillStyle = "#ffd9a8";
      ctx.shadowColor = "rgba(255,140,40,0.9)";
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;
    };

    const drawNode = (i: number, time: number) => {
      const p = pts[i];
      const hub = i === 0;
      const r = hub ? 5 : 2.6;

      if (hub) {
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 120);
        g.addColorStop(0, "rgba(255,116,0,0.22)");
        g.addColorStop(1, "rgba(255,116,0,0)");
        ctx.fillStyle = g;
        ctx.fillRect(p.x - 120, p.y - 120, 240, 240);
      }

      // pulse ring on hub + a couple of nodes
      if (hub || i === 2 || i === 4 || i === 6) {
        const phase = (time * 0.0006 + i * 0.5) % 1;
        const ring = r + phase * (hub ? 46 : 26);
        ctx.beginPath();
        ctx.arc(p.x, p.y, ring, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255,140,50,${(1 - phase) * (hub ? 0.5 : 0.3)})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fillStyle = hub ? "#ff8a2a" : "rgba(255,170,110,0.85)";
      ctx.shadowColor = "rgba(255,140,40,0.9)";
      ctx.shadowBlur = hub ? 18 : 8;
      ctx.fill();
      ctx.shadowBlur = 0;

      if (hub) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, r + 4, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255,200,150,0.9)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    };

    const render = (time: number, animate: boolean) => {
      ctx.clearRect(0, 0, w, h);
      ctx.save();
      // eased parallax
      parallax.cx += (parallax.tx - parallax.cx) * 0.06;
      parallax.cy += (parallax.ty - parallax.cy) * 0.06;
      ctx.translate(parallax.cx, parallax.cy);

      const dashOffset = animate ? -(time * 0.03) : 0;
      for (let i = 0; i < ROUTES.length; i++) drawRoute(i, dashOffset);
      for (const p of packets) {
        if (animate) {
          p.t += p.speed;
          if (p.t > 1) p.t -= 1;
        }
        drawPacket(p);
      }
      for (let i = 0; i < NODES.length; i++) drawNode(i, animate ? time : 0);

      ctx.restore();
    };

    resize();

    let raf = 0;
    let running = !reduce;

    if (reduce) {
      render(0, false);
    } else {
      const loop = (time: number) => {
        if (!running) return;
        render(time, true);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
      window.addEventListener("mousemove", onMove);
    }

    const ro = new ResizeObserver(() => {
      resize();
      if (reduce) render(0, false);
    });
    ro.observe(canvas);

    const io = new IntersectionObserver(
      ([entry]) => {
        if (reduce) return;
        if (entry.isIntersecting && !running) {
          running = true;
          raf = requestAnimationFrame((t) => {
            const loop = (time: number) => {
              if (!running) return;
              render(time, true);
              raf = requestAnimationFrame(loop);
            };
            loop(t);
          });
        } else if (!entry.isIntersecting && running) {
          running = false;
          cancelAnimationFrame(raf);
        }
      },
      { threshold: 0 },
    );
    io.observe(canvas);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={`pointer-events-none h-full w-full ${className}`}
    />
  );
}
