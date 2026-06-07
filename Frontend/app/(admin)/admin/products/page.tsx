"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import {
  adminListListings,
  adminUpdateListing,
  adminDeleteListing,
  adminGetListingFormOptions,
  type AdminListingData,
  type AdminListingListResponse,
  type ListingFormOptions,
} from "@/lib/auth";
import { ApiException } from "@/lib/api";
import { formatPrice } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { ProductFormModal, DeleteConfirmModal } from "@/features/admin/components/product-form-modal";

/* ═════════════════════════════════════════════════════════════════════════
   CONSTANTS & TYPES
   ═════════════════════════════════════════════════════════════════════════ */

const AVAILABILITY_OPTIONS = [
  "available",
  "limited",
  "waitlist",
  "unavailable",
] as const;

const AVAILABILITY_BADGE: Record<
  string,
  "available" | "limited" | "waitlist" | "unavailable" | "default"
> = {
  available: "available",
  limited: "limited",
  waitlist: "waitlist",
  unavailable: "unavailable",
};

const AVAILABILITY_LABEL: Record<string, string> = {
  available: "Available",
  limited: "Limited",
  waitlist: "Waitlist",
  unavailable: "Unavailable",
};

interface ProductCategory {
  id: string;
  label: string;
  icon: string;
  color: string;
  desc: string;
  keywords: string[];
}

const PRODUCT_CATEGORIES: ProductCategory[] = [
  {
    id: "compute",
    label: "Compute",
    icon: "memory",
    color: "#ff7400",
    desc: "VPS, Dedicated Server, Bare Metal",
    keywords: ["vps", "compute", "server", "bare-metal", "dedicated"],
  },
  {
    id: "network",
    label: "Network",
    icon: "language",
    color: "#3b82f6",
    desc: "Public IP, Load Balancer, VPC",
    keywords: ["public-ip", "load-balancer", "vpc", "network", "bandwidth"],
  },
  {
    id: "containers",
    label: "Kubernetes",
    icon: "hub",
    color: "#8b5cf6",
    desc: "Managed K8s, Container Registry",
    keywords: ["kubernetes", "container", "k8s", "docker", "registry"],
  },
  {
    id: "storage",
    label: "Storage",
    icon: "sd_storage",
    color: "#10b981",
    desc: "Object Storage, Block Storage, CDN",
    keywords: ["storage", "object", "block", "cdn", "file"],
  },
  {
    id: "database",
    label: "Database",
    icon: "database",
    color: "#f59e0b",
    desc: "MySQL, PostgreSQL, Redis, MongoDB",
    keywords: ["database", "mysql", "postgres", "redis", "mongo"],
  },
  {
    id: "security",
    label: "Security",
    icon: "shield",
    color: "#ef4444",
    desc: "Firewall, VPN, DDoS Protection",
    keywords: ["firewall", "vpn", "security", "ddos", "waf"],
  },
];

interface EditState {
  listingId: number;
  field: string;
  value: string;
}

/* ═════════════════════════════════════════════════════════════════════════
   HELPERS
   ═════════════════════════════════════════════════════════════════════════ */

function getCategoryForListing(listing: AdminListingData): ProductCategory | null {
  const catSlug = listing.category?.slug?.toLowerCase() ?? "";
  const resSlug = (listing.resource_type?.slug ?? "").toLowerCase();
  const nameLower = listing.name.toLowerCase();
  const combined = `${catSlug} ${resSlug} ${nameLower}`;

  for (const cat of PRODUCT_CATEGORIES) {
    if (cat.keywords.some((kw) => combined.includes(kw))) return cat;
  }
  return null;
}

function groupListingsByCategory(listings: AdminListingData[]) {
  const groups: Record<string, { category: ProductCategory; listings: AdminListingData[] }> = {};
  const uncategorized: AdminListingData[] = [];

  for (const listing of listings) {
    const cat = getCategoryForListing(listing);
    if (cat) {
      if (!groups[cat.id]) groups[cat.id] = { category: cat, listings: [] };
      groups[cat.id].listings.push(listing);
    } else {
      uncategorized.push(listing);
    }
  }

  const result = Object.values(groups);

  if (uncategorized.length > 0) {
    result.push({
      category: { id: "other", label: "Lainnya", icon: "apps", color: "#6366f1", desc: "Layanan lainnya", keywords: [] },
      listings: uncategorized,
    });
  }

  return result;
}

/* ═════════════════════════════════════════════════════════════════════════
   EYEBROW — same component as landing page
   ═════════════════════════════════════════════════════════════════════════ */

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="studio-eyebrow text-accent">{children}</p>;
}

/* ═════════════════════════════════════════════════════════════════════════
   SPOTLIGHT CARD — same pattern as marketplace product-card.tsx
   Uses --spotlight-x/y CSS vars, amber-brand colors, glass panel
   ═════════════════════════════════════════════════════════════════════════ */

function SpotlightCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      el.style.setProperty("--spotlight-x", `${e.clientX - rect.left}px`);
      el.style.setProperty("--spotlight-y", `${e.clientY - rect.top}px`);
    },
    [],
  );

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-line/60 bg-surface/50 transition-all duration-[var(--dur-standard)] hover:border-line-strong",
        className,
      )}
    >
      {/* Spotlight overlay — matches marketplace product-card exactly */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(400px circle at var(--spotlight-x, 50%) var(--spotlight-y, 50%), rgba(var(--accent-rgb),0.06), transparent 60%)",
        }}
      />
      {/* Top accent line — same as marketplace */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      {children}
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════════════════
   STAGGER REVEAL — mirrors landing page's RevealOnScroll behavior
   ═════════════════════════════════════════════════════════════════════════ */

function StaggerReveal({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const items = el.querySelectorAll<HTMLElement>(".stagger-rise");
    if (items.length === 0) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      for (const item of items) {
        item.style.opacity = "1";
        item.style.transform = "none";
      }
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const t = entry.target as HTMLElement;
            const delay = Number.parseInt(t.dataset.delay ?? "0", 10);
            setTimeout(() => {
              t.style.opacity = "1";
              t.style.transform = "translate3d(0,0,0)";
            }, delay);
            io.unobserve(t);
          }
        }
      },
      { threshold: 0.05 },
    );

    for (const item of items) io.observe(item);
    return () => io.disconnect();
  }, []);

  return <div ref={ref}>{children}</div>;
}

/* ═════════════════════════════════════════════════════════════════════════
   INLINE EDIT FIELD
   ═════════════════════════════════════════════════════════════════════════ */

function EditableCell({
  listing,
  field,
  currentValue,
  display,
  editRenderer,
  editing,
  setEditing,
  saveEdit,
  saving,
  cancelEdit,
}: {
  listing: AdminListingData;
  field: string;
  currentValue: string;
  display: React.ReactNode;
  editRenderer: () => React.ReactNode;
  editing: EditState | null;
  setEditing: (s: EditState | null) => void;
  saveEdit: (l: AdminListingData) => void;
  saving: number | null;
  cancelEdit: () => void;
}) {
  const isEditing =
    editing?.listingId === listing.id && editing?.field === field;

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        {editRenderer()}
        <button
          type="button"
          onClick={() => saveEdit(listing)}
          disabled={saving === listing.id}
          className="flex h-5 w-5 items-center justify-center rounded bg-accent/20 text-[10px] text-accent transition-colors hover:bg-accent/30 disabled:opacity-50"
          title="Simpan"
        >
          ✓
        </button>
        <button
          type="button"
          onClick={cancelEdit}
          disabled={saving === listing.id}
          className="flex h-5 w-5 items-center justify-center rounded text-[10px] text-fg-dim transition-colors hover:text-fg disabled:opacity-50"
          title="Batal"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() =>
        setEditing({ listingId: listing.id, field, value: currentValue })
      }
      className="group/val inline-flex items-center gap-1 rounded px-1 py-0.5 transition-colors hover:bg-white/[0.04]"
      title="Klik untuk edit"
    >
      {display}
      <span className="material-symbols-outlined text-[11px] text-fg-dim opacity-0 transition-opacity group-hover/val:opacity-100"
        style={{ fontVariationSettings: '"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20' }}
      >
        edit
      </span>
    </button>
  );
}

/* ═════════════════════════════════════════════════════════════════════════
   MAIN PAGE
   ═════════════════════════════════════════════════════════════════════════ */

export default function AdminProductsPage() {
  const [data, setData] = useState<AdminListingListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterAvailability, setFilterAvailability] = useState("");
  const [filterActive, setFilterActive] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [editing, setEditing] = useState<EditState | null>(null);
  const [saving, setSaving] = useState<number | null>(null);

  /* ── Create / edit / delete state ── */
  const [formOptions, setFormOptions] = useState<ListingFormOptions | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingListing, setEditingListing] = useState<AdminListingData | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminListingData | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState("");

  /* ── Data fetching ── */
  const fetchListings = useCallback(
    async (page?: number) => {
      setLoading(true);
      setError("");
      try {
        const params: Record<string, string> = {};
        if (page) params.page = String(page);
        if (search) params.search = search;
        if (filterAvailability) params.availability_status = filterAvailability;
        if (filterActive) params.is_active = filterActive;
        const result = await adminListListings(
          Object.keys(params).length > 0 ? params : undefined,
        );
        setData(result);
      } catch (err) {
        if (err instanceof ApiException) setError(err.message);
        else setError("Gagal memuat data listing.");
      } finally {
        setLoading(false);
      }
    },
    [search, filterAvailability, filterActive],
  );

  useEffect(() => { fetchListings(); }, [fetchListings]);

  // Load provider/category options once for the create/edit form.
  useEffect(() => {
    adminGetListingFormOptions()
      .then(setFormOptions)
      .catch(() => { /* form falls back to free-text suggestions */ });
  }, []);

  // Auto-dismiss success toast.
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  function openCreate() {
    setModalMode("create");
    setEditingListing(null);
    setModalOpen(true);
  }

  function openEdit(listing: AdminListingData) {
    setModalMode("edit");
    setEditingListing(listing);
    setModalOpen(true);
  }

  function handleSaved(message: string) {
    setModalOpen(false);
    setToast(message);
    fetchListings(data?.meta.current_page);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminDeleteListing(deleteTarget.id);
      setToast("Produk berhasil dihapus.");
      setDeleteTarget(null);
      fetchListings(data?.meta.current_page);
    } catch (err) {
      setError(err instanceof ApiException ? err.message : "Gagal menghapus produk.");
    } finally {
      setDeleting(false);
    }
  }

  function cancelEdit() { setEditing(null); }

  async function saveEdit(listing: AdminListingData) {
    if (!editing) return;
    setSaving(listing.id);
    try {
      const payload: Record<string, unknown> = {};
      if (editing.field === "availability_status") payload.availability_status = editing.value;
      else if (editing.field === "provisioning_sla_hours") payload.provisioning_sla_hours = Number.parseInt(editing.value, 10);
      else if (editing.field === "is_active") payload.is_active = editing.value === "true";
      else if (editing.field === "price_monthly") {
        payload.prices = [{ billing_cycle: "monthly", gross_price_minor: Math.round(Number.parseFloat(editing.value) * 100) }];
      } else if (editing.field === "price_yearly") {
        payload.prices = [{ billing_cycle: "yearly", gross_price_minor: Math.round(Number.parseFloat(editing.value) * 100) }];
      }
      await adminUpdateListing(listing.id, payload);
      setEditing(null);
      fetchListings(data?.meta.current_page);
    } catch (err) {
      if (err instanceof ApiException) setError(err.message);
      else setError("Gagal menyimpan perubahan.");
    } finally {
      setSaving(null);
    }
  }

  function getPrice(listing: AdminListingData, cycle: string): number {
    const price = listing.prices?.find((p) => p.billing_cycle === cycle);
    return price ? price.price : 0;
  }

  /* ── Filtering ── */
  function filteredListings(): AdminListingData[] {
    if (!data?.data) return [];
    if (!activeCategory) return data.data;
    if (activeCategory === "other") {
      return groupListingsByCategory(data.data).find((g) => g.category.id === "other")?.listings ?? [];
    }
    return data.data.filter((l) => getCategoryForListing(l)?.id === activeCategory);
  }

  /* ── Derived ── */
  const totalListings = data?.data.length ?? 0;
  const activeCount = data?.data.filter((l) => l.is_active).length ?? 0;
  const availableCount = data?.data.filter((l) => l.availability_status === "available").length ?? 0;
  const listings = filteredListings();
  const grouped = groupListingsByCategory(listings);

  /* ── Edit helpers ── */
  const inputCls = "rounded border border-line bg-bg px-2 py-1 text-xs font-mono text-fg focus:outline-none focus:ring-1 focus:ring-accent/20 focus:border-accent/40 transition-colors";
  const selectCls = inputCls;

  return (
    <div className="relative min-h-full">

      {/* ══════════════════════════════════════════════════════════════════
          HERO / GREETING — mirrors marketplace Greetings section
          ══════════════════════════════════════════════════════════════════ */}
      <section className="relative isolate overflow-hidden border-b border-line/60">
        {/* Atmospheric glow — same as landing hero */}
        <div className="studio-streaks-fallback pointer-events-none absolute inset-0 -z-10" />
        <div className="admin-glow -top-40 right-20 bg-accent pointer-events-none" />
        <div className="admin-glow -bottom-40 -left-20 bg-steel pointer-events-none" />

        <div className="mx-auto max-w-[1320px] px-6 py-10 lg:py-12">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Eyebrow>Product Management</Eyebrow>
              <h1 className="studio-hero-title mt-5 text-[clamp(28px,4vw,52px)] text-fg leading-none">
                Kelola Produk
              </h1>
              <p className="mt-3 max-w-lg text-[14px] leading-relaxed text-fg-muted">
                Kelola harga, ketersediaan, dan SLA semua listing produk infrastruktur.
              </p>
            </div>

            {/* Quick Facts + primary action */}
            <div className="flex flex-col items-start gap-4 sm:items-end">
              <div className="flex items-center gap-3">
                <span className="studio-eyebrow rounded-full border border-line px-3 py-1.5 text-[9px] text-fg-muted">
                  {totalListings} listing
                </span>
                <span className="studio-eyebrow rounded-full border border-line px-3 py-1.5 text-[9px] text-fg-muted">
                  {activeCount} aktif
                </span>
                <span className="studio-eyebrow rounded-full border border-accent/30 bg-accent/5 px-3 py-1.5 text-[9px] text-accent">
                  {availableCount} tersedia
                </span>
              </div>
              <button
                type="button"
                onClick={openCreate}
                className="group inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-[13px] font-semibold text-accent-fg transition-all hover:brightness-110"
              >
                <span
                  className="material-symbols-outlined text-[18px] transition-transform group-hover:rotate-90"
                  style={{ fontVariationSettings: '"FILL" 0, "wght" 400, "GRAD" 0, "opsz" 20' }}
                >
                  add
                </span>
                Tambah Produk
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          FILTER BAR — same glassy style as marketplace FilterBar
          ══════════════════════════════════════════════════════════════════ */}
      {error && (
        <div className="mx-auto max-w-[1320px] px-6 pt-6">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      <div className="mx-auto max-w-[1320px] px-6 py-5">
        <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-line/60 bg-surface/50 p-4 backdrop-blur-sm">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <label className="studio-eyebrow mb-1.5 block text-[8px] text-fg-dim">
              Cari
            </label>
            <div className="relative">
              <span
                className="absolute left-2.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[16px] text-fg-dim"
                style={{ fontVariationSettings: '"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20' }}
              >
                search
              </span>
              <input
                type="text"
                placeholder="Nama atau slug..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="block w-full rounded-lg border border-line/60 bg-bg py-2 pl-8 pr-3 text-[13px] text-fg placeholder:text-fg-dim focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/15 transition-colors"
              />
            </div>
          </div>

          {/* Availability select */}
          <div className="w-36">
            <label className="studio-eyebrow mb-1.5 block text-[8px] text-fg-dim">
              Availability
            </label>
            <select
              value={filterAvailability}
              onChange={(e) => setFilterAvailability(e.target.value)}
              className="block w-full rounded-lg border border-line/60 bg-bg px-2.5 py-2 text-[13px] text-fg focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/15 transition-colors"
            >
              <option value="">Semua</option>
              {AVAILABILITY_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{AVAILABILITY_LABEL[opt]}</option>
              ))}
            </select>
          </div>

          {/* Status select */}
          <div className="w-28">
            <label className="studio-eyebrow mb-1.5 block text-[8px] text-fg-dim">
              Status
            </label>
            <select
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value)}
              className="block w-full rounded-lg border border-line/60 bg-bg px-2.5 py-2 text-[13px] text-fg focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/15 transition-colors"
            >
              <option value="">Semua</option>
              <option value="1">Active</option>
              <option value="0">Inactive</option>
            </select>
          </div>

          <Button size="sm" variant="primary" onClick={() => fetchListings()}>
            <span className="material-symbols-outlined text-[14px]"
              style={{ fontVariationSettings: '"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20' }}
            >
              filter_list
            </span>
            Filter
          </Button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          CATEGORY TABS — Tencent Cloud product grid style
          ══════════════════════════════════════════════════════════════════ */}
      <div className="mx-auto max-w-[1320px] px-6 pb-2">
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            type="button"
            onClick={() => setActiveCategory(null)}
            className={cn(
              "studio-tab flex shrink-0 items-center gap-2 rounded-lg border px-3.5 py-2 text-[11px] font-medium uppercase tracking-wider transition-all",
              activeCategory === null
                ? "border-accent/40 bg-accent/10 text-accent"
                : "border-line/60 text-fg-dim hover:border-line-strong hover:text-fg-muted",
            )}
          >
            <span className="material-symbols-outlined text-[16px]"
              style={{ fontVariationSettings: '"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20' }}
            >
              apps
            </span>
            Semua
          </button>
          {PRODUCT_CATEGORIES.map((cat) => {
            const count = data?.data.filter((l) => getCategoryForListing(l)?.id === cat.id).length ?? 0;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
                className={cn(
                  "studio-tab flex shrink-0 items-center gap-2 rounded-lg border px-3.5 py-2 text-[11px] font-medium uppercase tracking-wider transition-all",
                  activeCategory === cat.id
                    ? "border-accent/40 bg-accent/10 text-accent"
                    : "border-line/60 text-fg-dim hover:border-line-strong hover:text-fg-muted",
                )}
              >
                <span className="material-symbols-outlined text-[16px]"
                  style={{
                    fontVariationSettings: '"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20',
                    color: activeCategory === cat.id ? undefined : cat.color,
                  }}
                >
                  {cat.icon}
                </span>
                {cat.label}
                {count > 0 && (
                  <span className={cn(
                    "rounded-full px-1.5 py-0.5 font-mono text-[9px]",
                    activeCategory === cat.id
                      ? "bg-accent/15 text-accent"
                      : "bg-white/[0.04] text-fg-dim",
                  )}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          CONTENT
          ══════════════════════════════════════════════════════════════════ */}
      <div className="mx-auto max-w-[1320px] px-6 pb-10">

        {/* ── Loading ── */}
        {loading && !data ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="relative h-10 w-10">
              <div className="absolute inset-0 rounded-full border-2 border-line" />
              <div className="absolute inset-0 animate-spin rounded-full border-2 border-t-accent" />
            </div>
            <p className="studio-eyebrow mt-4 text-[9px] text-fg-dim">
              Memuat data produk...
            </p>
          </div>

        /* ── Empty ── */
        ) : listings.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-line/60 bg-surface/40 py-20">
            <span className="material-symbols-outlined mb-4 block text-[56px] text-fg-dim">
              search_off
            </span>
            <h3 className="studio-display text-[22px] text-fg">
              Tidak ada listing ditemukan
            </h3>
            <p className="mt-2 text-[13px] text-fg-muted">
              Coba ubah filter atau kata kunci pencarian.
            </p>
          </div>

        /* ── Product Grid ── */
        ) : (
          <StaggerReveal>
            <div className="space-y-10">
              {grouped.map((group) => (
                <section key={group.category.id}>
                  {/* ── Category Header ── */}
                  <div className="mb-5 flex items-center gap-3">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-line/60 bg-white/[0.02]">
                      <span
                        className="material-symbols-outlined text-[20px]"
                        style={{
                          color: group.category.color,
                          fontVariationSettings: '"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20',
                        }}
                      >
                        {group.category.icon}
                      </span>
                    </div>
                    <div>
                      <h2 className="studio-display text-[20px] text-fg">
                        {group.category.label}
                      </h2>
                      <p className="text-[11px] text-fg-dim">{group.category.desc}</p>
                    </div>
                    <span className="ml-auto rounded-full bg-white/[0.04] px-2.5 py-0.5 font-mono text-[10px] text-fg-dim">
                      {group.listings.length}
                    </span>
                  </div>

                  {/* ── Cards Grid — responsive like marketplace ── */}
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {group.listings.map((listing, idx) => {
                      const cat = getCategoryForListing(listing);
                      const priceMonthly = getPrice(listing, "monthly");
                      const priceYearly = getPrice(listing, "yearly");

                      return (
                        <article
                          key={listing.id}
                          data-delay={idx * 50}
                          className="stagger-rise"
                          style={{
                            opacity: 0,
                            transform: "translate3d(0,20px,0)",
                            transition: "opacity 560ms var(--ease-signature), transform 560ms var(--ease-signature)",
                          }}
                        >
                          <SpotlightCard className="flex h-full flex-col p-3">
                            {/* Product Image Area — same structure as marketplace ProductCard */}
                            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-line/60 bg-bg">
                              {/* Colored gradient backdrop per category */}
                              <div
                                className="absolute inset-0 opacity-20"
                                style={{
                                  background: `radial-gradient(ellipse at 50% 40%, ${cat?.color ?? "var(--color-accent)"}, transparent 70%)`,
                                }}
                              />
                              {/* Icon centered */}
                              <div className="absolute inset-0 grid place-items-center">
                                <span
                                  className="material-symbols-outlined text-[48px]"
                                  style={{
                                    color: cat?.color ?? "var(--color-fg-dim)",
                                    fontVariationSettings: '"FILL" 0, "wght" 200, "GRAD" 0, "opsz" 40',
                                    opacity: 0.7,
                                  }}
                                >
                                  {cat?.icon ?? "deployed_code"}
                                </span>
                              </div>
                              {/* Badges overlay */}
                              <div className="absolute left-2.5 top-2.5 flex items-center gap-1.5">
                                <EditableCell
                                  listing={listing}
                                  field="is_active"
                                  currentValue={String(listing.is_active)}
                                  display={
                                    <Badge variant={listing.is_active ? "success" : "error"}>
                                      {listing.is_active ? "Active" : "Inactive"}
                                    </Badge>
                                  }
                                  editRenderer={() => (
                                    <select
                                      defaultValue={String(listing.is_active)}
                                      onChange={(e) => setEditing((p) => p ? { ...p, value: e.target.value } : null)}
                                      className={selectCls}
                                    >
                                      <option value="true">Active</option>
                                      <option value="false">Inactive</option>
                                    </select>
                                  )}
                                  editing={editing}
                                  setEditing={setEditing}
                                  saveEdit={saveEdit}
                                  saving={saving}
                                  cancelEdit={cancelEdit}
                                />
                              </div>
                              <div className="absolute right-2.5 top-2.5">
                                <EditableCell
                                  listing={listing}
                                  field="availability_status"
                                  currentValue={listing.availability_status}
                                  display={
                                    <Badge variant={AVAILABILITY_BADGE[listing.availability_status] ?? "default"}>
                                      {AVAILABILITY_LABEL[listing.availability_status] ?? listing.availability_status}
                                    </Badge>
                                  }
                                  editRenderer={() => (
                                    <select
                                      defaultValue={listing.availability_status}
                                      onChange={(e) => setEditing((p) => p ? { ...p, value: e.target.value } : null)}
                                      className={selectCls}
                                    >
                                      {AVAILABILITY_OPTIONS.map((o) => (
                                        <option key={o} value={o}>{AVAILABILITY_LABEL[o]}</option>
                                      ))}
                                    </select>
                                  )}
                                  editing={editing}
                                  setEditing={setEditing}
                                  saveEdit={saveEdit}
                                  saving={saving}
                                  cancelEdit={cancelEdit}
                                />
                              </div>
                              {/* Region chip */}
                              <div className="absolute bottom-2.5 left-2.5">
                                <span className="rounded-full bg-bg/80 px-2 py-0.5 font-mono text-[9px] text-fg-muted backdrop-blur-sm">
                                  {listing.region}
                                </span>
                              </div>
                            </div>

                            {/* Card body — matches marketplace ProductCard layout */}
                            <div className="mt-3 flex flex-1 flex-col px-1 pb-1">
                              {/* Title */}
                              <h3 className="truncate text-[14px] font-semibold text-fg">
                                {listing.name}
                              </h3>
                              <p className="truncate font-mono text-[10px] text-fg-dim">
                                {listing.slug}
                              </p>

                              {/* Provider */}
                              <p className="mt-1 text-[11px] text-fg-muted">
                                {listing.provider?.name ?? "—"}
                                {listing.category && (
                                  <span className="text-fg-dim"> · {listing.category.name}</span>
                                )}
                              </p>

                              {/* Specs summary */}
                              {listing.specs_summary && (
                                <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-fg-dim">
                                  {listing.specs_summary}
                                </p>
                              )}

                              {/* Price row — matches marketplace price display */}
                              <div className="mt-3 flex items-baseline gap-3">
                                <div>
                                  <EditableCell
                                    listing={listing}
                                    field="price_monthly"
                                    currentValue={String(priceMonthly)}
                                    display={
                                      <span className="font-mono text-[15px] font-bold text-fg">
                                        {formatPrice(priceMonthly)}
                                      </span>
                                    }
                                    editRenderer={() => (
                                      <input type="number" step="0.01" min="0"
                                        defaultValue={priceMonthly}
                                        onChange={(e) => setEditing((p) => p ? { ...p, value: e.target.value } : null)}
                                        className={cn(inputCls, "w-24")}
                                        autoFocus
                                        onKeyDown={(e) => { if (e.key === "Escape") cancelEdit(); }}
                                      />
                                    )}
                                    editing={editing}
                                    setEditing={setEditing}
                                    saveEdit={saveEdit}
                                    saving={saving}
                                    cancelEdit={cancelEdit}
                                  />
                                  <span className="ml-1 text-[10px] text-fg-dim">/bln</span>
                                </div>
                                <div className="text-fg-dim">
                                  <EditableCell
                                    listing={listing}
                                    field="price_yearly"
                                    currentValue={String(priceYearly)}
                                    display={
                                      <span className="font-mono text-[12px] text-fg-muted">
                                        {formatPrice(priceYearly)}
                                      </span>
                                    }
                                    editRenderer={() => (
                                      <input type="number" step="0.01" min="0"
                                        defaultValue={priceYearly}
                                        onChange={(e) => setEditing((p) => p ? { ...p, value: e.target.value } : null)}
                                        className={cn(inputCls, "w-24")}
                                        autoFocus
                                        onKeyDown={(e) => { if (e.key === "Escape") cancelEdit(); }}
                                      />
                                    )}
                                    editing={editing}
                                    setEditing={setEditing}
                                    saveEdit={saveEdit}
                                    saving={saving}
                                    cancelEdit={cancelEdit}
                                  />
                                  <span className="text-[9px] text-fg-dim">/thn</span>
                                </div>
                              </div>

                              {/* Bottom meta — SLA + audit */}
                              <div className="mt-auto pt-3">
                                <div className="h-px bg-line/80" />
                                <div className="mt-2.5 flex items-center justify-between">
                                  <EditableCell
                                    listing={listing}
                                    field="provisioning_sla_hours"
                                    currentValue={String(listing.provisioning_sla_hours)}
                                    display={
                                      <span className="inline-flex items-center gap-1 rounded-full border border-line bg-white/[0.03] px-2 py-0.5">
                                        <span className="material-symbols-outlined text-[12px] text-accent"
                                          style={{ fontVariationSettings: '"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20' }}
                                        >
                                          schedule
                                        </span>
                                        <span className="font-mono text-[9px] text-fg-muted">
                                          SLA {listing.provisioning_sla_hours}h
                                        </span>
                                      </span>
                                    }
                                    editRenderer={() => (
                                      <input type="number" min="1"
                                        defaultValue={listing.provisioning_sla_hours}
                                        onChange={(e) => setEditing((p) => p ? { ...p, value: e.target.value } : null)}
                                        className={cn(inputCls, "w-16")}
                                        autoFocus
                                        onKeyDown={(e) => { if (e.key === "Escape") cancelEdit(); }}
                                      />
                                    )}
                                    editing={editing}
                                    setEditing={setEditing}
                                    saveEdit={saveEdit}
                                    saving={saving}
                                    cancelEdit={cancelEdit}
                                  />
                                  <span className="text-[9px] text-fg-dim">
                                    {listing.last_audit
                                      ? `${listing.last_audit.changed_by?.name ?? "?"} · ${new Date(listing.last_audit.changed_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}`
                                      : "—"}
                                  </span>
                                </div>

                                {/* ── Manage actions ── */}
                                <div className="mt-3 flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => openEdit(listing)}
                                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-line/80 py-1.5 text-[11px] font-medium text-fg-muted transition-colors hover:border-accent/40 hover:bg-accent/5 hover:text-accent"
                                  >
                                    <span
                                      className="material-symbols-outlined text-[14px]"
                                      style={{ fontVariationSettings: '"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20' }}
                                    >
                                      edit
                                    </span>
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDeleteTarget(listing)}
                                    title="Hapus produk"
                                    className="grid h-[30px] w-[34px] place-items-center rounded-lg border border-line/80 text-fg-dim transition-colors hover:border-[var(--color-error)]/40 hover:bg-[var(--color-error)]/[0.06] hover:text-[var(--color-error)]"
                                  >
                                    <span
                                      className="material-symbols-outlined text-[15px]"
                                      style={{ fontVariationSettings: '"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20' }}
                                    >
                                      delete
                                    </span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </SpotlightCard>
                        </article>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          </StaggerReveal>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            PAGINATION — matches studio style
            ══════════════════════════════════════════════════════════════════ */}
        {data && data.meta.last_page > 1 && (
          <div className="mt-8 flex items-center justify-between rounded-2xl border border-line/60 bg-surface/50 px-5 py-3">
            <Button size="sm" variant="outline"
              disabled={data.meta.current_page <= 1}
              onClick={() => fetchListings(data.meta.current_page - 1)}
            >
              <span className="material-symbols-outlined text-[14px]"
                style={{ fontVariationSettings: '"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20' }}
              >
                chevron_left
              </span>
              Sebelumnya
            </Button>
            <span className="studio-eyebrow text-[8px] text-fg-dim">
              Halaman {data.meta.current_page} dari {data.meta.last_page} · {data.meta.total} listing
            </span>
            <Button size="sm" variant="outline"
              disabled={data.meta.current_page >= data.meta.last_page}
              onClick={() => fetchListings(data.meta.current_page + 1)}
            >
              Berikutnya
              <span className="material-symbols-outlined text-[14px]"
                style={{ fontVariationSettings: '"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20' }}
              >
                chevron_right
              </span>
            </Button>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          MODALS & TOAST
          ══════════════════════════════════════════════════════════════════ */}

      {/* Success Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[60] animate-[slideInUp_360ms_var(--ease-signature)]">
          <div className="flex items-center gap-2.5 rounded-xl border border-[var(--color-accent)]/20 bg-[var(--color-surface)] px-4 py-3 shadow-2xl">
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-[var(--color-accent)]/10">
              <span
                className="material-symbols-outlined text-[16px] text-[var(--color-accent)]"
                style={{ fontVariationSettings: '"FILL" 0, "wght" 400, "GRAD" 0, "opsz" 20' }}
              >
                check_circle
              </span>
            </div>
            <span className="text-[13px] font-medium text-[var(--color-fg)]">{toast}</span>
          </div>
        </div>
      )}

      {/* Create/Edit Product Modal */}
      <ProductFormModal
        open={modalOpen}
        mode={modalMode}
        listing={editingListing}
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        open={deleteTarget !== null}
        listing={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        deleting={deleting}
      />
    </div>
  );
}
