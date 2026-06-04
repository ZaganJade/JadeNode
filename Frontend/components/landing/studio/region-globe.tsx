"use client";

import { useEffect, useRef } from "react";

/**
 * Rotating dotted-earth data globe. Continents are rendered as a point cloud
 * projected orthographically onto the sphere (so you read actual country
 * areas, with Southeast Asia featured), the whole earth turns slowly, and a
 * never-idle stream of packets flows along curved routes between cities placed
 * at their true lat/long — fading and culling at the horizon. Conveys realtime
 * fetching / 100% uptime across many countries.
 *
 * All geometry lives in a fixed 0..600 space (shared with the SVG sphere) and
 * is scaled to the rendered square at draw time. Pure canvas + SVG, no deps.
 */
const VB = 600;
const CENTER = 300;
const R = 238;

// View latitude — tilt north so a near-continuous band of northern-hemisphere
// landmass (Eurasia / Africa / N. America) stays in view through every spin.
const LAT0 = (26 * Math.PI) / 180;
const SIN_LAT0 = Math.sin(LAT0);
const COS_LAT0 = Math.cos(LAT0);
const D2R = Math.PI / 180;

// ── Continents as a union of lat/lon boxes + ellipses (recognisable, not
//    cartographic). Generous coverage so the whole turning earth reads right. ──
type Region =
  | { box: [number, number, number, number] } // latMin, latMax, lonMin, lonMax
  | { ell: [number, number, number, number] }; // cLat, cLon, rLat, rLon

const LAND: Region[] = [
  // North America
  { box: [49, 71, -132, -58] },
  { box: [30, 49, -123, -72] },
  { ell: [22, -100, 9, 12] },
  { ell: [72, -40, 11, 20] }, // Greenland
  // South America
  { ell: [-12, -60, 26, 15] },
  { box: [-55, -20, -73, -63] },
  // Europe
  { box: [40, 60, -10, 40] },
  { box: [58, 70, 5, 28] },
  // Africa
  { ell: [4, 19, 22, 17] },
  { ell: [-22, 26, 15, 12] },
  { box: [-25, -12, 43, 50] }, // Madagascar
  // Middle East / Arabia
  { ell: [23, 45, 12, 11] },
  { box: [25, 40, 44, 63] },
  // Asia
  { box: [50, 72, 55, 178] }, // Siberia
  { ell: [40, 100, 15, 30] }, // China / Mongolia
  { box: [38, 52, 48, 78] }, // Central Asia
  { ell: [20, 78, 13, 10] }, // India
  { box: [8, 28, 95, 109] }, // Indochina
  // Maritime SE Asia (featured region)
  { ell: [-2, 116, 7, 25] }, // Indonesian archipelago
  { ell: [1, 114, 5, 6] }, // Borneo
  { ell: [12, 122, 7, 4] }, // Philippines
  { box: [31, 43, 131, 142] }, // Japan
  { box: [34, 43, 125, 130] }, // Korea
  // Oceania
  { ell: [-25, 134, 12, 20] }, // Australia
  { box: [-10, -1, 131, 150] }, // New Guinea
  { box: [-47, -35, 166, 178] }, // New Zealand
];

function isLand(lat: number, lon: number) {
  for (const r of LAND) {
    if ("box" in r) {
      const [a, b, c, d] = r.box;
      if (lat >= a && lat <= b && lon >= c && lon <= d) return true;
    } else {
      const [cLat, cLon, rLat, rLon] = r.ell;
      const dx = (lat - cLat) / rLat;
      const dy = (lon - cLon) / rLon;
      if (dx * dx + dy * dy <= 1) return true;
    }
  }
  return false;
}

// Precomputed land point cloud. We cache sin/cos of BOTH lat and lon so the
// per-frame hot loop needs no trig at all (cos(lon−lon0) via angle subtraction).
type LandPt = {
  sinLat: number;
  cosLat: number;
  sinLon: number;
  cosLon: number;
};

function mkPt(lat: number, lon: number): LandPt {
  const la = lat * D2R;
  const lo = lon * D2R;
  return {
    sinLat: Math.sin(la),
    cosLat: Math.cos(la),
    sinLon: Math.sin(lo),
    cosLon: Math.cos(lo),
  };
}

// Rough fallback — only shown for the brief moment before the real world-map
// image is sampled (and if that image ever fails to load).
function buildLandApprox(): LandPt[] {
  const pts: LandPt[] = [];
  for (let lat = -78; lat <= 82; lat += 3) {
    for (let lon = -180; lon < 180; lon += 3) {
      if (isLand(lat, lon)) pts.push(mkPt(lat, lon));
    }
  }
  return pts;
}

// Accurate land cloud sampled from an equirectangular world-map image: ocean
// pixels are blue-dominant, everything else (land / desert / ice) is land.
// High mask resolution + ~1° dot grid so fragmented archipelagos (Indonesia,
// the Philippines, the Caribbean) resolve into proper islands.
const MW = 620;
const MH = 310;
const STEP = 2; // mask pixels per dot → ~0.58° mask, ~1.16° dot spacing
function buildLandFromImage(img: HTMLImageElement): LandPt[] | null {
  const off = document.createElement("canvas");
  off.width = MW;
  off.height = MH;
  const octx = off.getContext("2d", { willReadFrequently: true });
  if (!octx) return null;
  octx.drawImage(img, 0, 0, MW, MH);
  let data: Uint8ClampedArray;
  try {
    data = octx.getImageData(0, 0, MW, MH).data;
  } catch {
    return null; // tainted / unavailable → keep the fallback
  }
  const oceanAt = (mx: number, my: number) => {
    const i = (my * MW + mx) * 4;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    return b > r + 12 && b > g + 2;
  };
  const pts: LandPt[] = [];
  for (let my = 1; my < MH - 1; my += STEP) {
    const lat = 90 - (my / MH) * 180;
    if (lat < -84 || lat > 84) continue;
    for (let mx = 0; mx < MW; mx += STEP) {
      // a dot lights if land falls anywhere in its cell → thin islands survive
      let land = false;
      for (let dy = 0; dy < STEP && !land; dy++) {
        for (let dx = 0; dx < STEP && !land; dx++) {
          if (!oceanAt(Math.min(mx + dx, MW - 1), Math.min(my + dy, MH - 1)))
            land = true;
        }
      }
      if (land) pts.push(mkPt(lat, (mx / MW) * 360 - 180));
    }
  }
  return pts;
}

// Cities at true-ish lat/long (index 0 = JadeNode hub).
const NODES: Array<{ lat: number; lon: number; hub?: boolean }> = [
  { lat: -6.2, lon: 106.8, hub: true }, // Jakarta
  { lat: 1.35, lon: 103.8 }, // Singapore
  { lat: 3.1, lon: 101.7 }, // Kuala Lumpur
  { lat: 13.7, lon: 100.5 }, // Bangkok
  { lat: 14.6, lon: 121.0 }, // Manila
  { lat: 10.8, lon: 106.7 }, // Ho Chi Minh
  { lat: 21.0, lon: 105.8 }, // Hanoi
  { lat: -8.7, lon: 115.2 }, // Denpasar
  { lat: 35.7, lon: 139.7 }, // Tokyo
  { lat: 22.3, lon: 114.2 }, // Hong Kong
  { lat: 25.0, lon: 121.5 }, // Taipei
  { lat: 37.5, lon: 127.0 }, // Seoul
  { lat: 19.1, lon: 72.9 }, // Mumbai
  { lat: 25.2, lon: 55.3 }, // Dubai
  { lat: -33.9, lon: 151.2 }, // Sydney
  { lat: -31.9, lon: 115.9 }, // Perth
  // Global points of presence — keep data flowing across every longitude as
  // the earth turns ("various countries", never idle).
  { lat: 51.5, lon: -0.1 }, // London
  { lat: 50.1, lon: 8.7 }, // Frankfurt
  { lat: 37.8, lon: -122.4 }, // San Francisco
  { lat: -23.5, lon: -46.6 }, // São Paulo
  { lat: -26.2, lon: 28.0 }, // Johannesburg
];

const HUB_ROUTES: Array<[number, number]> = NODES.slice(1).map(
  (_, i) => [0, i + 1] as [number, number],
);
const MESH_ROUTES: Array<[number, number]> = [
  // SE / East Asia + Oceania
  [1, 4],
  [2, 12],
  [3, 6],
  [5, 9],
  [9, 8],
  [10, 8],
  [8, 11],
  [4, 9],
  [7, 14],
  [14, 15],
  [13, 2],
  [12, 13],
  [9, 10],
  [6, 8],
  // Global backbone (Europe / Americas / Africa) so every hemisphere is live
  [16, 17], // London – Frankfurt
  [17, 13], // Frankfurt – Dubai
  [16, 13], // London – Dubai
  [13, 20], // Dubai – Johannesburg
  [16, 18], // London – San Francisco
  [18, 19], // San Francisco – São Paulo
  [19, 20], // São Paulo – Johannesburg
  [18, 8], // San Francisco – Tokyo
  [12, 13], // Mumbai – Dubai
];
const ROUTES = [...HUB_ROUTES, ...MESH_ROUTES];

type Packet = { route: number; t: number; speed: number; size: number };
type Ping = { x: number; y: number; life: number };
type P = { x: number; y: number; vis: number };

const NUM_PACKETS = 26;
const ROT = 0.0028; // degrees of spin per millisecond (~128s / rotation)

export function RegionGlobe({ className = "" }: { className?: string }) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let land = buildLandApprox();
    let disposed = false;
    let size = 0;
    let dpr = 1;
    let f = 1;

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      size = rect.width;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(size * dpr);
      canvas.height = Math.floor(size * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      f = size / VB;
    };

    // Orthographic projection → pixel coords + visibility (cos of angular dist).
    const projTrig = (sinLat: number, cosLat: number, lon: number, lon0: number): P => {
      const dl = lon - lon0;
      const cd = Math.cos(dl);
      const sd = Math.sin(dl);
      const vis = SIN_LAT0 * sinLat + COS_LAT0 * cosLat * cd;
      const x = cosLat * sd;
      const y = COS_LAT0 * sinLat - SIN_LAT0 * cosLat * cd;
      return { x: CENTER + x * R, y: CENTER - y * R, vis };
    };
    const proj = (latDeg: number, lonDeg: number, lon0: number) =>
      projTrig(Math.sin(latDeg * D2R), Math.cos(latDeg * D2R), lonDeg * D2R, lon0);

    const packets: Packet[] = Array.from({ length: NUM_PACKETS }, () => ({
      route: Math.floor(Math.random() * HUB_ROUTES.length),
      t: Math.random(),
      speed: 0.0035 + Math.random() * 0.006,
      size: 1.4 + Math.random() * 1.5,
    }));
    const pings: Ping[] = [];

    const nodeP: P[] = NODES.map(() => ({ x: 0, y: 0, vis: -1 }));

    const respawn = (p: Packet, visibleHub: number[], visibleAll: number[]) => {
      const pool =
        visibleHub.length && Math.random() < 0.65 ? visibleHub : visibleAll;
      if (!pool.length) return;
      p.route = pool[(Math.random() * pool.length) | 0];
      p.t = 0;
      p.speed = 0.0035 + Math.random() * 0.006;
      p.size = 1.4 + Math.random() * 1.5;
    };

    const render = (time: number, animate: boolean) => {
      const lon0 = (110 - (animate ? time * ROT : 0)) * D2R;
      ctx.clearRect(0, 0, size, size);

      // ── Land point cloud (allocation-free, trig-free hot loop) ──
      const cosLon0 = Math.cos(lon0);
      const sinLon0 = Math.sin(lon0);
      const sDot = 1.45 * f;
      const halfDot = sDot / 2;
      ctx.fillStyle = "rgb(242,238,230)";
      for (let i = 0; i < land.length; i++) {
        const lp = land[i];
        // cos(lon − lon0) and sin(lon − lon0) via angle subtraction (no trig)
        const cosdl = lp.cosLon * cosLon0 + lp.sinLon * sinLon0;
        const vis = SIN_LAT0 * lp.sinLat + COS_LAT0 * lp.cosLat * cosdl;
        if (vis <= 0.02) continue;
        const sindl = lp.sinLon * cosLon0 - lp.cosLon * sinLon0;
        const x = (CENTER + lp.cosLat * sindl * R) * f;
        const y =
          (CENTER - (COS_LAT0 * lp.sinLat - SIN_LAT0 * lp.cosLat * cosdl) * R) *
          f;
        // bright cream dots with a high floor so even limb land reads clearly
        ctx.globalAlpha = vis >= 1 ? 0.92 : 0.4 + vis * 0.52;
        ctx.fillRect(x - halfDot, y - halfDot, sDot, sDot);
      }
      ctx.globalAlpha = 1;

      // ── Latitude rings (cheap, rotation-invariant) ──
      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      ctx.lineWidth = 1;
      for (const lat of [-60, -30, 0, 30, 60]) {
        ctx.beginPath();
        let started = false;
        for (let lon = -180; lon <= 180; lon += 6) {
          const p = proj(lat, lon, lon0);
          if (p.vis <= 0.02) {
            started = false;
            continue;
          }
          const X = p.x * f;
          const Y = p.y * f;
          if (started) ctx.lineTo(X, Y);
          else {
            ctx.moveTo(X, Y);
            started = true;
          }
        }
        ctx.stroke();
      }
      // ── Meridians (rotate with the globe) ──
      for (let lon = -180; lon < 180; lon += 30) {
        ctx.beginPath();
        let started = false;
        for (let lat = -85; lat <= 85; lat += 6) {
          const p = proj(lat, lon, lon0);
          if (p.vis <= 0.02) {
            started = false;
            continue;
          }
          const X = p.x * f;
          const Y = p.y * f;
          if (started) ctx.lineTo(X, Y);
          else {
            ctx.moveTo(X, Y);
            started = true;
          }
        }
        ctx.stroke();
      }

      // ── Project nodes, gather visible routes ──
      for (let i = 0; i < NODES.length; i++) {
        const n = NODES[i];
        nodeP[i] = proj(n.lat, n.lon, lon0);
      }
      const visibleAll: number[] = [];
      const visibleHub: number[] = [];
      for (let i = 0; i < ROUTES.length; i++) {
        const [a, b] = ROUTES[i];
        if (nodeP[a].vis > 0.06 && nodeP[b].vis > 0.06) {
          visibleAll.push(i);
          if (a === 0 || b === 0) visibleHub.push(i);
        }
      }

      // ── Routes ──
      for (const ri of visibleAll) {
        const [ai, bi] = ROUTES[ri];
        const a = nodeP[ai];
        const b = nodeP[bi];
        const mx = (a.x + b.x) / 2;
        const my = (a.y + b.y) / 2;
        let nx = mx - CENTER;
        let ny = my - CENTER;
        const nl = Math.hypot(nx, ny) || 1;
        const span = Math.hypot(b.x - a.x, b.y - a.y);
        const lift = 20 + span * 0.28;
        const cx = mx + (nx / nl) * lift;
        const cy = my + (ny / nl) * lift;
        const av = Math.min(a.vis, b.vis);
        ctx.beginPath();
        ctx.moveTo(a.x * f, a.y * f);
        ctx.quadraticCurveTo(cx * f, cy * f, b.x * f, b.y * f);
        ctx.strokeStyle = `rgba(255,116,0,${0.05 + av * 0.08})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // ── Packets ──
      for (const p of packets) {
        if (animate) {
          p.t += p.speed;
        }
        const inView = visibleAll.includes(p.route);
        if (!inView) {
          if (animate) respawn(p, visibleHub, visibleAll);
          continue;
        }
        if (p.t >= 1) {
          if (animate) {
            const [, bi] = ROUTES[p.route];
            pings.push({ x: nodeP[bi].x, y: nodeP[bi].y, life: 0 });
            respawn(p, visibleHub, visibleAll);
          }
          continue;
        }
        const [ai, bi] = ROUTES[p.route];
        const a = nodeP[ai];
        const b = nodeP[bi];
        const mx = (a.x + b.x) / 2;
        const my = (a.y + b.y) / 2;
        const nx = mx - CENTER;
        const ny = my - CENTER;
        const nl = Math.hypot(nx, ny) || 1;
        const span = Math.hypot(b.x - a.x, b.y - a.y);
        const lift = 20 + span * 0.28;
        const cx = mx + (nx / nl) * lift;
        const cy = my + (ny / nl) * lift;
        const tt = p.t;
        const qx = (1 - tt) * (1 - tt) * a.x + 2 * (1 - tt) * tt * cx + tt * tt * b.x;
        const qy = (1 - tt) * (1 - tt) * a.y + 2 * (1 - tt) * tt * cy + tt * tt * b.y;
        const tb = Math.max(0, tt - 0.09);
        const bx = (1 - tb) * (1 - tb) * a.x + 2 * (1 - tb) * tb * cx + tb * tb * b.x;
        const by = (1 - tb) * (1 - tb) * a.y + 2 * (1 - tb) * tb * cy + tb * tb * b.y;
        const X = qx * f;
        const Y = qy * f;
        const g = ctx.createLinearGradient(bx * f, by * f, X, Y);
        g.addColorStop(0, "rgba(255,116,0,0)");
        g.addColorStop(1, "rgba(255,200,140,0.95)");
        ctx.beginPath();
        ctx.moveTo(bx * f, by * f);
        ctx.lineTo(X, Y);
        ctx.strokeStyle = g;
        ctx.lineWidth = p.size * f;
        ctx.lineCap = "round";
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(X, Y, p.size * 0.9 * f, 0, Math.PI * 2);
        ctx.fillStyle = "#ffe2bf";
        ctx.shadowColor = "rgba(255,150,60,0.9)";
        ctx.shadowBlur = 8 * f;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // ── Pings ──
      if (animate) {
        for (let i = pings.length - 1; i >= 0; i--) {
          pings[i].life += 0.022;
          if (pings[i].life >= 1) pings.splice(i, 1);
        }
      }
      for (const ping of pings) {
        const rr = (3 + ping.life * 15) * f;
        ctx.beginPath();
        ctx.arc(ping.x * f, ping.y * f, rr, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255,170,80,${(1 - ping.life) * 0.8})`;
        ctx.lineWidth = 1.4 * f;
        ctx.stroke();
      }

      // ── Nodes ──
      for (let i = 0; i < NODES.length; i++) {
        const n = NODES[i];
        const p = nodeP[i];
        if (p.vis <= 0.05) continue;
        const x = p.x * f;
        const y = p.y * f;
        const alpha = Math.min(1, p.vis * 1.4);
        if (n.hub) {
          const grad = ctx.createRadialGradient(x, y, 0, x, y, 80 * f);
          grad.addColorStop(0, `rgba(255,116,0,${0.3 * alpha})`);
          grad.addColorStop(1, "rgba(255,116,0,0)");
          ctx.fillStyle = grad;
          ctx.fillRect(x - 80 * f, y - 80 * f, 160 * f, 160 * f);
          const phase = (time * 0.0009) % 1;
          ctx.beginPath();
          ctx.arc(x, y, 4 * f + phase * 28 * f, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255,150,60,${(1 - phase) * 0.5 * alpha})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(x, y, (n.hub ? 4.2 : 2.1) * f, 0, Math.PI * 2);
        ctx.fillStyle = n.hub
          ? `rgba(255,138,42,${alpha})`
          : `rgba(255,170,110,${alpha})`;
        ctx.shadowColor = "rgba(255,140,40,0.9)";
        ctx.shadowBlur = (n.hub ? 16 : 6) * f;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    };

    resize();

    let raf = 0;
    let running = !reduce;
    const loop = (time: number) => {
      if (!running) return;
      render(time, true);
      raf = requestAnimationFrame(loop);
    };
    if (reduce) render(0, false);
    else raf = requestAnimationFrame(loop);

    // Upgrade the rough fallback to accurate continents sampled from the
    // bundled equirectangular world map.
    const mapImg = new Image();
    mapImg.onload = () => {
      if (disposed) return;
      const accurate = buildLandFromImage(mapImg);
      if (accurate && accurate.length > 200) {
        land = accurate;
        if (reduce) render(0, false);
      }
    };
    mapImg.src = "/world-map.jpg";

    const ro = new ResizeObserver(() => {
      resize();
      if (reduce) render(0, false);
    });
    ro.observe(wrap);

    const io = new IntersectionObserver(
      ([entry]) => {
        if (reduce) return;
        if (entry.isIntersecting && !running) {
          running = true;
          raf = requestAnimationFrame(loop);
        } else if (!entry.isIntersecting && running) {
          running = false;
          cancelAnimationFrame(raf);
        }
      },
      { threshold: 0 },
    );
    io.observe(wrap);

    return () => {
      disposed = true;
      running = false;
      cancelAnimationFrame(raf);
      mapImg.onload = null;
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  return (
    <div ref={wrapRef} className={`relative aspect-square ${className}`}>
      <svg
        viewBox="0 0 600 600"
        className="absolute inset-0 h-full w-full"
        aria-hidden
        role="presentation"
      >
        <defs>
          <radialGradient id="globe-body" cx="42%" cy="38%" r="72%">
            <stop offset="0%" stopColor="#120f0d" />
            <stop offset="60%" stopColor="#080605" />
            <stop offset="100%" stopColor="#000000" />
          </radialGradient>
          {/* even, faint orange rim all the way round */}
          <radialGradient id="globe-rim" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255,116,0,0)" />
            <stop offset="90%" stopColor="rgba(255,116,0,0)" />
            <stop offset="100%" stopColor="rgba(255,140,40,0.16)" />
          </radialGradient>
          {/* one-sided sun-lit crescent that fades out (no fill beyond edge) */}
          <radialGradient id="globe-limb" cx="74%" cy="76%" r="56%">
            <stop offset="0%" stopColor="rgba(255,140,40,0)" />
            <stop offset="66%" stopColor="rgba(255,140,40,0)" />
            <stop offset="88%" stopColor="rgba(255,150,55,0.26)" />
            <stop offset="100%" stopColor="rgba(255,150,55,0)" />
          </radialGradient>
        </defs>
        <circle cx="300" cy="300" r="238" fill="url(#globe-body)" />
        <circle cx="300" cy="300" r="238" fill="url(#globe-rim)" />
        <circle cx="300" cy="300" r="238" fill="url(#globe-limb)" />
        <circle
          cx="300"
          cy="300"
          r="238"
          fill="none"
          stroke="rgba(255,255,255,0.10)"
          strokeWidth="1"
        />
      </svg>
      <canvas
        ref={canvasRef}
        aria-hidden
        className="absolute inset-0 h-full w-full"
      />
    </div>
  );
}
