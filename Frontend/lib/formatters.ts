/**
 * JadeNode Marketplace formatters.
 *
 * All prices are stored as minor units (cents). These helpers format them for
 * Indonesian Rupiah display and billing-cycle labels.
 */

// ─── Price ──────────────────────────────────────────────────────────────────

/**
 * Format a minor-unit amount into a readable IDR string.
 *
 * @example
 * formatPrice(50_000, 'IDR') // 'Rp 50.000'
 * formatPrice(1_500_000, 'IDR') // 'Rp 1.500.000'
 */
export function formatPrice(minor: number, currency: string = "IDR"): string {
  if (currency !== "IDR") {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(minor);
  }

  const formatted = new Intl.NumberFormat("id-ID").format(minor);
  return `Rp ${formatted}`;
}

// ─── Billing Cycle ──────────────────────────────────────────────────────────

const cycleLabels: Record<string, string> = {
  monthly: "Per Bulan",
  yearly: "Per Tahun",
  hourly: "Per Jam",
};

/**
 * Convert a billing-cycle key into a Bahasa Indonesia label.
 *
 * @example
 * formatBillingCycle('monthly') // 'Per Bulan'
 * formatBillingCycle('yearly')  // 'Per Tahun'
 */
export function formatBillingCycle(cycle: string): string {
  return cycleLabels[cycle] ?? cycle;
}

// ─── Specs ──────────────────────────────────────────────────────────────────

export interface SpecItem {
  key: string;
  label: string;
  value: string;
}

type RawSpecs = Record<string, string | number | undefined | null>;

/**
 * Transform a raw specs object into an array of display-ready items.
 * Known keys get friendly labels; unknown keys are capitalised.
 */
export function formatSpecs(specs: RawSpecs): SpecItem[] {
  const knownLabels: Record<string, string> = {
    cpu: "CPU",
    ram: "RAM",
    storage: "Storage",
    bandwidth: "Bandwidth",
    storage_type: "Tipe Storage",
    os: "OS",
    ip: "IP Address",
    cores: "Cores",
    vcpu: "vCPU",
    memory: "Memory",
    disk: "Disk",
    network: "Network",
  };

  return Object.entries(specs)
    .filter(([, v]) => v != null && v !== "")
    .map(([key, raw]) => ({
      key,
      label: knownLabels[key] ?? key.charAt(0).toUpperCase() + key.slice(1),
      value: String(raw),
    }));
}
