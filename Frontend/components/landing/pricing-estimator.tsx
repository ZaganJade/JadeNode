"use client";

import { useMemo, useState } from "react";

const REGIONS = [
  { id: "id-jkt", label: "ID-JKT", price: 1.0 },
  { id: "id-sub", label: "ID-SUB", price: 0.95 },
  { id: "sg-1",   label: "SG-1",   price: 1.15 },
] as const;

const STORAGE_TYPES = [
  { id: "nvme", label: "NVMe SSD", multiplier: 1.0 },
  { id: "ssd",  label: "SATA SSD", multiplier: 0.78 },
] as const;

const PRICE_PER_VCPU = 35000;
const PRICE_PER_GB_RAM = 12000;
const PRICE_PER_GB_STORAGE = 350;

function formatIDR(n: number) {
  return new Intl.NumberFormat("id-ID").format(Math.round(n));
}

/**
 * Live pricing estimator: three sliders + region/storage chips. Total
 * recomputes inline (no debounce — values are small integers).
 */
export function PricingEstimator() {
  const [vcpu, setVcpu] = useState(2);
  const [ram, setRam] = useState(4);
  const [storage, setStorage] = useState(60);
  const [region, setRegion] = useState<(typeof REGIONS)[number]["id"]>("id-jkt");
  const [storageType, setStorageType] =
    useState<(typeof STORAGE_TYPES)[number]["id"]>("nvme");

  const total = useMemo(() => {
    const r = REGIONS.find((x) => x.id === region)!;
    const s = STORAGE_TYPES.find((x) => x.id === storageType)!;
    const compute = vcpu * PRICE_PER_VCPU + ram * PRICE_PER_GB_RAM;
    const disk = storage * PRICE_PER_GB_STORAGE * s.multiplier;
    return (compute + disk) * r.price;
  }, [vcpu, ram, storage, region, storageType]);

  const yearly = total * 12 * 0.92; // 8% annual discount

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_auto_360px] lg:items-start">
      {/* Sliders */}
      <div className="space-y-7">
        <Slider
          label="vCPU"
          value={vcpu}
          min={1}
          max={32}
          step={1}
          unit=""
          onChange={setVcpu}
        />
        <Slider
          label="RAM"
          value={ram}
          min={1}
          max={128}
          step={1}
          unit="GB"
          onChange={setRam}
        />
        <Slider
          label="Storage"
          value={storage}
          min={20}
          max={2000}
          step={10}
          unit="GB"
          onChange={setStorage}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <ChipGroup
            label="Region"
            items={REGIONS.map((r) => ({ id: r.id, label: r.label }))}
            value={region}
            onChange={(v) => setRegion(v as typeof region)}
          />
          <ChipGroup
            label="Storage type"
            items={STORAGE_TYPES.map((s) => ({ id: s.id, label: s.label }))}
            value={storageType}
            onChange={(v) => setStorageType(v as typeof storageType)}
          />
        </div>
      </div>

      {/* Hairline divider */}
      <div aria-hidden className="hidden h-full w-px bg-line lg:block" />

      {/* Total */}
      <aside className="rounded-lg border border-line bg-surface p-6">
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-fg-muted">
          Estimasi · per bulan
        </div>
        <div className="mt-3 flex items-baseline gap-2 font-display tabular-nums">
          <span className="text-[44px] font-semibold leading-none tracking-tight text-fg">
            Rp {formatIDR(total)}
          </span>
        </div>
        <div className="mt-1 font-mono text-[12px] text-fg-muted">
          Tahunan: Rp {formatIDR(yearly)} <span className="text-accent">−8%</span>
        </div>

        <ul className="mt-6 space-y-2 font-mono text-[12px] text-fg-muted">
          <li className="flex items-center justify-between">
            <span>Compute</span>
            <span className="tabular-nums text-fg">
              Rp {formatIDR(vcpu * PRICE_PER_VCPU + ram * PRICE_PER_GB_RAM)}
            </span>
          </li>
          <li className="flex items-center justify-between">
            <span>Storage</span>
            <span className="tabular-nums text-fg">
              Rp {formatIDR(
                storage *
                  PRICE_PER_GB_STORAGE *
                  STORAGE_TYPES.find((s) => s.id === storageType)!.multiplier,
              )}
            </span>
          </li>
          <li className="flex items-center justify-between">
            <span>Region multiplier</span>
            <span className="tabular-nums text-fg">
              ×{REGIONS.find((r) => r.id === region)!.price.toFixed(2)}
            </span>
          </li>
        </ul>

        <button
          type="button"
          className="mt-7 inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-accent px-4 py-2.5 font-sans text-[13px] font-semibold text-accent-fg transition-transform duration-[180ms] hover:-translate-y-0.5"
        >
          Buat Order Snapshot
          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
        </button>
      </aside>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (n: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg-muted">
          {label}
        </span>
        <span className="font-display text-[18px] font-semibold tabular-nums text-fg">
          {value}
          <span className="ml-1 text-[12px] font-normal text-fg-muted">{unit}</span>
        </span>
      </div>
      <div className="relative h-1.5 w-full rounded-full bg-surface-3">
        <div
          className="pointer-events-none absolute inset-y-0 left-0 rounded-full bg-accent"
          style={{ width: `${pct}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent
            [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-accent [&::-webkit-slider-thumb]:bg-bg [&::-webkit-slider-thumb]:shadow-[0_0_0_4px_rgba(198,242,74,0.18)] [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:duration-[180ms] hover:[&::-webkit-slider-thumb]:scale-110
            [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-accent [&::-moz-range-thumb]:bg-bg"
          aria-label={label}
        />
      </div>
    </div>
  );
}

function ChipGroup({
  label,
  items,
  value,
  onChange,
}: {
  label: string;
  items: ReadonlyArray<{ id: string; label: string }>;
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div>
      <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.2em] text-fg-muted">
        {label}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((it) => {
          const active = it.id === value;
          return (
            <button
              key={it.id}
              type="button"
              onClick={() => onChange(it.id)}
              className={`rounded-md border px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.16em] transition-all duration-[180ms] ${
                active
                  ? "border-accent bg-accent-soft text-accent"
                  : "border-line text-fg-muted hover:border-line-strong hover:text-fg"
              }`}
            >
              {it.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
