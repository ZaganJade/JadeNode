"use client";

/**
 * JadeNode Keranjang (Cart) store.
 *
 * The cart is intentionally **client-side only** (browser localStorage) until
 * checkout. Nothing in the cart is an Order, Invoice, or Payment yet — those
 * are created on the backend at `/cart/checkout`. This keeps the cart out of
 * the financial/domain model (per CONTEXT.md "no cart item after checkout").
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface CartPricing {
  cycle: string;
  price: number;
}

export interface CartItem {
  /** Stable identity = the Product Listing slug. */
  slug: string;
  name: string;
  image?: string | null;
  resource_type: string;
  region: string;
  provider: { name: string; verified: boolean };
  specs: Record<string, string | number | undefined | null>;
  availability: string;
  currency: string;
  /** Known cycle/price pairs. From a card we usually know one. */
  pricing: CartPricing[];
  /** Currently selected billing cycle. */
  cycle: string;
  quantity: number;
}

/** Shape callers pass to `add` — quantity defaults to 1. */
export type CartInput = Omit<CartItem, "quantity"> & { quantity?: number };

interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotal: number;
  isOpen: boolean;
  /** True once localStorage has been read (avoids SSR/hydration mismatch). */
  ready: boolean;
  add: (item: CartInput) => void;
  remove: (slug: string) => void;
  setQuantity: (slug: string, quantity: number) => void;
  setCycle: (slug: string, cycle: string) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STORAGE_KEY = "jadenode_cart_v1";

const CartContext = createContext<CartContextValue | null>(null);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function priceFor(item: CartItem): number {
  const match = item.pricing.find((p) => p.cycle === item.cycle);
  return match?.price ?? item.pricing[0]?.price ?? 0;
}

function loadFromStorage(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Defensive: keep only well-formed rows.
    return parsed.filter(
      (i): i is CartItem =>
        i && typeof i.slug === "string" && Array.isArray(i.pricing),
    );
  } catch {
    return [];
  }
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [ready, setReady] = useState(false);

  // Hydrate from localStorage once on mount.
  useEffect(() => {
    setItems(loadFromStorage());
    setReady(true);
  }, []);

  // Persist on every change (after hydration).
  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Storage full / unavailable — cart simply won't persist.
    }
  }, [items, ready]);

  // Sync across tabs.
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY) setItems(loadFromStorage());
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const add = useCallback((input: CartInput) => {
    setItems((prev) => {
      const qty = Math.max(1, input.quantity ?? 1);
      const existing = prev.find((i) => i.slug === input.slug);
      if (existing) {
        return prev.map((i) =>
          i.slug === input.slug
            ? { ...i, quantity: i.quantity + qty }
            : i,
        );
      }
      return [...prev, { ...input, quantity: qty }];
    });
    setIsOpen(true); // peek the drawer on add
  }, []);

  const remove = useCallback((slug: string) => {
    setItems((prev) => prev.filter((i) => i.slug !== slug));
  }, []);

  const setQuantity = useCallback((slug: string, quantity: number) => {
    setItems((prev) =>
      quantity <= 0
        ? prev.filter((i) => i.slug !== slug)
        : prev.map((i) => (i.slug === slug ? { ...i, quantity } : i)),
    );
  }, []);

  const setCycle = useCallback((slug: string, cycle: string) => {
    setItems((prev) =>
      prev.map((i) => (i.slug === slug ? { ...i, cycle } : i)),
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((v) => !v), []);

  const count = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items],
  );

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + priceFor(i) * i.quantity, 0),
    [items],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      count,
      subtotal,
      isOpen,
      ready,
      add,
      remove,
      setQuantity,
      setCycle,
      clear,
      open,
      close,
      toggle,
    }),
    [
      items,
      count,
      subtotal,
      isOpen,
      ready,
      add,
      remove,
      setQuantity,
      setCycle,
      clear,
      open,
      close,
      toggle,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within a <CartProvider>.");
  }
  return ctx;
}

/** Resolve the active unit price for a cart item. */
export function unitPrice(item: CartItem): number {
  return priceFor(item);
}
