/**
 * Midtrans Snap integration utilities for JadeNode Marketplace.
 *
 * Loads the Snap.js library from CDN and provides a typed wrapper
 * around `window.snap.pay()`.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

interface SnapCallbacks {
  /** Payment completed successfully (transaction_status: capture / settlement). */
  onSuccess: (result: SnapResult) => void;
  /** Payment initiated but not yet completed (transaction_status: pending). */
  onPending: (result: SnapResult) => void;
  /** Payment failed or was rejected by the gateway. */
  onError: (result: SnapResult) => void;
  /** Customer closed the Snap popup without completing payment. */
  onClose: () => void;
}

interface SnapResult {
  status_code: string;
  status_message: string;
  transaction_id: string;
  order_id: string;
  gross_amount: string;
  payment_type: string;
  transaction_status: string;
  transaction_time: string;
  [key: string]: unknown;
}

// ─── Global augmentation ────────────────────────────────────────────────────

declare global {
  interface Window {
    snap?: {
      pay: (token: string, callbacks: Record<string, unknown>) => void;
    };
  }
}

// ─── CDN URL ────────────────────────────────────────────────────────────────

const MIDTRANS_SNAP_URL = "https://app.sandbox.midtrans.com/snap/snap.js";
const MIDTRANS_PRODUCTION_SNAP_URL = "https://app.midtrans.com/snap/snap.js";

// ─── Loader ─────────────────────────────────────────────────────────────────

let loadPromise: Promise<void> | null = null;

/**
 * Load the Midtrans Snap JS library from CDN.
 *
 * Idempotent — calling multiple times returns the same promise.
 * Uses sandbox URL by default; set `NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION=true`
 * to load the production CDN.
 */
export function loadMidtransSnap(): Promise<void> {
  if (loadPromise) return loadPromise;

  loadPromise = new Promise<void>((resolve, reject) => {
    // Already loaded
    if (window.snap) {
      resolve();
      return;
    }

    const isProduction =
      process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true";
    const src = isProduction
      ? MIDTRANS_PRODUCTION_SNAP_URL
      : MIDTRANS_SNAP_URL;

    const script = document.createElement("script");
    script.src = src;
    script.setAttribute(
      "data-client-key",
      process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? "",
    );
    script.async = true;

    script.onload = () => resolve();
    script.onerror = () => {
      loadPromise = null;
      reject(new Error("Gagal memuat Midtrans Snap. Silakan coba lagi."));
    };

    document.head.appendChild(script);
  });

  return loadPromise;
}

/**
 * Open the Midtrans Snap payment popup.
 *
 * @param snapToken — The snap token obtained from the backend
 * @param callbacks — Success, pending, error, and close callbacks
 */
export function openMidtransSnap(
  snapToken: string,
  callbacks: SnapCallbacks,
): void {
  if (!window.snap) {
    throw new Error(
      "Midtrans Snap belum dimuat. Panggil loadMidtransSnap() terlebih dahulu.",
    );
  }

  window.snap.pay(snapToken, {
    onSuccess: callbacks.onSuccess,
    onPending: callbacks.onPending,
    onError: callbacks.onError,
    onClose: callbacks.onClose,
  });
}

export type { SnapCallbacks, SnapResult };
