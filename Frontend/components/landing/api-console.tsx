"use client";

import { useEffect, useState } from "react";

const SAMPLES: Array<{
  cmd: string;
  body: string[];
  status: string;
}> = [
  {
    cmd: "POST /api/v1/orders",
    body: [
      "{",
      '  "listing_id": "01HVQ2W7H6Y4...JKT",',
      '  "billing_cycle": "monthly",',
      '  "ssh_key_id": "01HVR1...A2"',
      "}",
    ],
    status: "201 · order.pending",
  },
  {
    cmd: "POST /api/v1/payments/midtrans-snap",
    body: [
      "{",
      '  "invoice_id": "INV-0001",',
      '  "amount": 135000,',
      '  "method": "snap"',
      "}",
    ],
    status: "200 · redirect_url received",
  },
  {
    cmd: "POST /api/v1/deployments/{id}/actions",
    body: ['{', '  "type": "restart"', "}"],
    status: "202 · action.queued",
  },
];

/**
 * Live API console: cycles through three real JadeNode endpoint examples,
 * typewriter-revealing the request body, then flipping to a status pill.
 *
 * Pure setTimeout cycle, no external library.
 */
export function ApiConsole() {
  const [index, setIndex] = useState(0);
  const [typed, setTyped] = useState("");
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const sample = SAMPLES[index];
    const full = sample.body.join("\n");

    if (reduced) {
      setTyped(full);
      setShowStatus(true);
      const t = window.setTimeout(() => {
        setIndex((i) => (i + 1) % SAMPLES.length);
        setShowStatus(false);
      }, 4000);
      return () => clearTimeout(t);
    }

    let i = 0;
    setTyped("");
    setShowStatus(false);
    const tick = () => {
      i++;
      if (i <= full.length) {
        setTyped(full.slice(0, i));
        const ch = full[i - 1];
        const delay = ch === "\n" ? 80 : ch === " " ? 18 : 16 + Math.random() * 14;
        timer = window.setTimeout(tick, delay);
      } else {
        statusTimer = window.setTimeout(() => setShowStatus(true), 320);
        nextTimer = window.setTimeout(
          () => setIndex((n) => (n + 1) % SAMPLES.length),
          3200,
        );
      }
    };
    let timer = window.setTimeout(tick, 320);
    let statusTimer = 0;
    let nextTimer = 0;
    return () => {
      clearTimeout(timer);
      clearTimeout(statusTimer);
      clearTimeout(nextTimer);
    };
  }, [index]);

  const sample = SAMPLES[index];

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface">
      {/* Window chrome */}
      <div className="flex items-center justify-between border-b border-line bg-surface-2 px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-surface-4" />
          <span className="h-2.5 w-2.5 rounded-full bg-surface-4" />
          <span className="h-2.5 w-2.5 rounded-full bg-surface-4" />
        </div>
        <div className="font-mono text-[11px] text-fg-muted">
          api.jadenode.id
        </div>
        <div className="flex items-center gap-1.5">
          <span className="pulse-dot h-2 w-2 rounded-full bg-accent" />
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-fg-muted">
            live
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 font-mono text-[13px] leading-relaxed">
        <div className="flex items-center gap-2 text-fg-muted">
          <span className="text-accent">$</span>
          <span className="text-fg">{sample.cmd}</span>
        </div>
        <pre className="mt-3 whitespace-pre text-fg/90">
          <span>{typed}</span>
          <span className="caret text-accent">▍</span>
        </pre>

        <div
          className={`mt-4 inline-flex items-center gap-2 rounded-md border px-2.5 py-1 transition-all duration-[360ms] ${
            showStatus
              ? "border-accent/40 bg-accent-soft text-accent opacity-100"
              : "pointer-events-none border-line text-fg-dim opacity-0"
          }`}
        >
          <span className="material-symbols-outlined text-[14px]">check</span>
          <span className="text-[11px] uppercase tracking-[0.18em]">
            {sample.status}
          </span>
        </div>
      </div>

      {/* Footer with index */}
      <div className="flex items-center justify-between border-t border-line bg-surface-2 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-fg-dim">
        <span>example {index + 1} / {SAMPLES.length}</span>
        <span className="flex items-center gap-1">
          <span className="material-symbols-outlined text-[12px]">key</span>
          jw.signed · sha256
        </span>
      </div>
    </div>
  );
}
