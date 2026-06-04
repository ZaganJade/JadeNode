"use client";

/**
 * Decorative node grid for the "instant availability" bento card.
 *
 * A signal climbs the diagonal staircase one node at a time (capacity coming
 * online) on a repeating loop, while a few idle fleet nodes flicker to life on
 * their own cadence. Motion uses real transform/glow travel so it reads as
 * movement rather than a static glow. Deterministic layout → identical SSR.
 */
const COLS = 7;
const ROWS = 8;

// Staircase, ordered bottom-left → top-right so the signal visibly climbs.
const STAIRCASE: Array<{ r: number; c: number; order: number }> = [
  { r: 4, c: 1, order: 0 },
  { r: 3, c: 2, order: 1 },
  { r: 2, c: 3, order: 2 },
  { r: 1, c: 4, order: 3 },
  { r: 0, c: 5, order: 4 },
];

// Idle fleet nodes that occasionally flicker online (own staggered cadence).
const FLICKER: Array<{ r: number; c: number; delay: number }> = [
  { r: 5, c: 4, delay: 0 },
  { r: 6, c: 2, delay: 2.2 },
  { r: 7, c: 5, delay: 3.6 },
  { r: 6, c: 5, delay: 4.8 },
];

// Remaining dim fleet nodes (static).
const IDLE: Array<[number, number]> = [
  [5, 0],
  [5, 1],
  [5, 3],
  [6, 0],
  [6, 1],
  [6, 3],
  [6, 4],
  [7, 0],
  [7, 1],
  [7, 2],
  [7, 3],
  [7, 4],
  [7, 6],
];

const STEP = 0.5; // seconds between each staircase node lighting up

const key = (r: number, c: number) => `${r}-${c}`;
const stair = new Map(STAIRCASE.map((n) => [key(n.r, n.c), n]));
const flick = new Map(FLICKER.map((n) => [key(n.r, n.c), n]));
const idle = new Set(IDLE.map(([r, c]) => key(r, c)));

export function NodeCluster() {
  const cells = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const k = key(r, c);
      if (stair.has(k)) {
        const n = stair.get(k)!;
        cells.push(
          <span
            key={k}
            className="node-travel aspect-square rounded-[5px] border"
            style={{ gridColumn: c + 1, gridRow: r + 1, animationDelay: `${n.order * STEP}s` }}
          />,
        );
      } else if (flick.has(k)) {
        const n = flick.get(k)!;
        cells.push(
          <span
            key={k}
            className="node-flicker aspect-square rounded-[5px] border"
            style={{ gridColumn: c + 1, gridRow: r + 1, animationDelay: `${n.delay}s` }}
          />,
        );
      } else if (idle.has(k)) {
        cells.push(
          <span
            key={k}
            className="aspect-square rounded-[5px] border border-line-strong/70 bg-white/[0.015]"
            style={{ gridColumn: c + 1, gridRow: r + 1 }}
          />,
        );
      }
    }
  }

  return (
    <div
      aria-hidden
      className="grid w-full max-w-[320px] gap-2"
      style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}
    >
      {cells}
    </div>
  );
}
