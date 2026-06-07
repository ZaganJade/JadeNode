"use client";

import { useState, useEffect, useCallback, type FormEvent } from "react";
import { cn } from "@/lib/utils";
import {
  adminCreateListing,
  adminUpdateListing,
  adminGetListingFormOptions,
  type AdminListingData,
  type CreateListingData,
  type ListingFormOptions,
} from "@/lib/auth";
import { ApiException } from "@/lib/api";

/* ═════════════════════════════════════════════════════════════════════════
   TYPES
   ═════════════════════════════════════════════════════════════════════════ */

interface ProductFormModalProps {
  open: boolean;
  mode: "create" | "edit";
  listing?: AdminListingData | null;
  onClose: () => void;
  onSaved: (message: string) => void;
}

interface FormState {
  name: string;
  slug: string;
  description: string;
  provider_id: string;
  category_id: string;
  resource_type: string;
  region: string;
  availability_status: string;
  provisioning_sla_hours: string;
  is_active: boolean;
  price_monthly: string;
  price_yearly: string;
  price_hourly: string;
  specs_summary: string;
}

const EMPTY: FormState = {
  name: "",
  slug: "",
  description: "",
  provider_id: "",
  category_id: "",
  resource_type: "",
  region: "",
  availability_status: "available",
  provisioning_sla_hours: "24",
  is_active: true,
  price_monthly: "",
  price_yearly: "",
  price_hourly: "",
  specs_summary: "",
};

/* ═════════════════════════════════════════════════════════════════════════
   HELPERS
   ═════════════════════════════════════════════════════════════════════════ */

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/* ═════════════════════════════════════════════════════════════════════════
   PRODUCT FORM MODAL
   ═════════════════════════════════════════════════════════════════════════ */

export function ProductFormModal({
  open,
  mode,
  listing,
  onClose,
  onSaved,
}: ProductFormModalProps) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState("");
  const [options, setOptions] = useState<ListingFormOptions | null>(null);
  const [autoSlug, setAutoSlug] = useState(true);

  /* ── Load form options (providers, categories, etc.) ── */
  useEffect(() => {
    if (!open) return;
    adminGetListingFormOptions()
      .then(setOptions)
      .catch(() => setOptions(null));
  }, [open]);

  /* ── Populate form when editing ── */
  useEffect(() => {
    if (!open) return;
    setErrors({});
    setGlobalError("");

    if (mode === "edit" && listing) {
      const monthlyPrice = listing.prices?.find((p) => p.billing_cycle === "monthly");
      const yearlyPrice = listing.prices?.find((p) => p.billing_cycle === "yearly");
      const hourlyPrice = listing.prices?.find((p) => p.billing_cycle === "hourly");

      setForm({
        name: listing.name ?? "",
        slug: listing.slug ?? "",
        description: listing.description ?? "",
        provider_id: listing.provider ? String((listing.provider as Record<string, unknown>).id ?? "") : "",
        category_id: listing.category ? String((listing.category as Record<string, unknown>).id ?? "") : "",
        resource_type: listing.resource_type?.slug ?? "",
        region: listing.region ?? "",
        availability_status: listing.availability_status ?? "available",
        provisioning_sla_hours: String(listing.provisioning_sla_hours ?? 24),
        is_active: listing.is_active,
        price_monthly: monthlyPrice ? String(monthlyPrice.price) : "",
        price_yearly: yearlyPrice ? String(yearlyPrice.price) : "",
        price_hourly: hourlyPrice ? String(hourlyPrice.price) : "",
        specs_summary: listing.specs_summary ?? "",
      });
      setAutoSlug(false);
    } else {
      setForm(EMPTY);
      setAutoSlug(true);
    }
  }, [open, mode, listing]);

  /* ── Keyboard handler ── */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, handleKeyDown]);

  /* ── Field update ── */
  function updateField(field: keyof FormState, value: string | boolean) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      // Auto-generate slug when typing name in create mode
      if (field === "name" && autoSlug && mode === "create") {
        next.slug = slugify(value as string);
      }
      return next;
    });
    // Clear field errors on change
    if (errors[field]) {
      setErrors((prev) => {
        const n = { ...prev };
        delete n[field];
        return n;
      });
    }
  }

  /* ── Submit ── */
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors({});
    setGlobalError("");
    setSubmitting(true);

    try {
      const prices: Array<{ billing_cycle: string; gross_price_minor: number }> = [];
      if (form.price_monthly) {
        prices.push({ billing_cycle: "monthly", gross_price_minor: Math.round(Number.parseFloat(form.price_monthly) * 100) });
      }
      if (form.price_yearly) {
        prices.push({ billing_cycle: "yearly", gross_price_minor: Math.round(Number.parseFloat(form.price_yearly) * 100) });
      }
      if (form.price_hourly) {
        prices.push({ billing_cycle: "hourly", gross_price_minor: Math.round(Number.parseFloat(form.price_hourly) * 100) });
      }

      if (mode === "create") {
        const data: CreateListingData = {
          provider_id: Number(form.provider_id),
          category_id: Number(form.category_id),
          name: form.name,
          slug: form.slug,
          description: form.description || null,
          resource_type: form.resource_type,
          region: form.region,
          availability_status: form.availability_status,
          provisioning_sla_hours: Number.parseInt(form.provisioning_sla_hours, 10) || 24,
          is_active: form.is_active,
          prices,
        };
        const res = await adminCreateListing(data);
        onSaved(res.message || "Produk berhasil ditambahkan.");
      } else if (listing) {
        const payload: Record<string, unknown> = {
          name: form.name,
          slug: form.slug,
          description: form.description || null,
          region: form.region,
          availability_status: form.availability_status,
          provisioning_sla_hours: Number.parseInt(form.provisioning_sla_hours, 10) || 24,
          is_active: form.is_active,
          prices,
        };
        if (form.provider_id) payload.provider_id = Number(form.provider_id);
        if (form.category_id) payload.category_id = Number(form.category_id);
        if (form.resource_type) payload.resource_type = form.resource_type;
        const res = await adminUpdateListing(listing.id, payload);
        onSaved(res.message || "Produk berhasil diperbarui.");
      }
    } catch (error) {
      if (error instanceof ApiException) {
        if (error.status === 422 && typeof error.detail === "object" && error.detail !== null) {
          const detail = error.detail as Record<string, unknown>;
          if ("errors" in detail) {
            setErrors(detail.errors as Record<string, string[]>);
          } else {
            setGlobalError(error.message);
          }
        } else {
          setGlobalError(error.message);
        }
      } else {
        setGlobalError("Terjadi kesalahan. Silakan coba lagi.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  /* ── Shared input styles ── */
  const fieldCls =
    "block w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-bg)] px-3 py-2.5 text-[13px] text-[var(--color-fg)] placeholder:text-[var(--color-fg-dim)] transition-colors focus:border-[var(--color-accent)]/40 focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]/15";
  const selectCls = fieldCls;
  const labelCls = "block text-[11px] font-semibold uppercase tracking-wider text-[var(--color-fg-muted)] mb-1.5";
  const errorCls = "mt-1 text-[11px] text-[var(--color-error)]";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* ── Backdrop ── */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* ── Modal Panel ── */}
      <div
        className="relative z-50 w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] shadow-2xl"
        role="dialog"
        aria-modal="true"
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between border-b border-[var(--color-line)] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl border border-[var(--color-accent)]/20 bg-[var(--color-accent)]/10">
              <span
                className="material-symbols-outlined text-[18px] text-[var(--color-accent)]"
                style={{ fontVariationSettings: '"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20' }}
              >
                {mode === "create" ? "add_circle" : "edit"}
              </span>
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-[var(--color-fg)]">
                {mode === "create" ? "Tambah Produk Baru" : "Edit Produk"}
              </h2>
              <p className="text-[11px] text-[var(--color-fg-dim)]">
                {mode === "create"
                  ? "Isi detail produk infrastruktur baru"
                  : "Perbarui informasi produk"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg border border-[var(--color-line)] text-[var(--color-fg-dim)] transition-colors hover:border-[var(--color-line-strong)] hover:text-[var(--color-fg)]"
            aria-label="Tutup"
          >
            <span
              className="material-symbols-outlined text-[18px]"
              style={{ fontVariationSettings: '"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20' }}
            >
              close
            </span>
          </button>
        </div>

        {/* ── Form body ── */}
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {/* Global error */}
            {globalError && (
              <div className="rounded-lg border border-[var(--color-error)]/20 bg-[var(--color-error)]/5 px-4 py-3 text-[13px] text-[var(--color-error)]">
                {globalError}
              </div>
            )}

            {/* ── Row: Name + Slug ── */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Nama Produk *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="e.g. VPS Standard 2GB"
                  className={cn(fieldCls, errors.name && "border-[var(--color-error)]/50")}
                  autoFocus
                />
                {errors.name && <p className={errorCls}>{errors.name[0]}</p>}
              </div>
              <div>
                <label className={labelCls}>Slug *</label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => {
                    setAutoSlug(false);
                    updateField("slug", e.target.value);
                  }}
                  placeholder="vps-standard-2gb"
                  className={cn(fieldCls, errors.slug && "border-[var(--color-error)]/50")}
                />
                {errors.slug && <p className={errorCls}>{errors.slug[0]}</p>}
              </div>
            </div>

            {/* ── Description ── */}
            <div>
              <label className={labelCls}>Deskripsi</label>
              <textarea
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="Deskripsi singkat produk..."
                rows={3}
                className={cn(fieldCls, "resize-none", errors.description && "border-[var(--color-error)]/50")}
              />
              {errors.description && <p className={errorCls}>{errors.description[0]}</p>}
            </div>

            {/* ── Row: Provider + Category + Resource Type ── */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className={labelCls}>Provider *</label>
                <select
                  value={form.provider_id}
                  onChange={(e) => updateField("provider_id", e.target.value)}
                  className={cn(selectCls, !form.provider_id && "text-[var(--color-fg-dim)]")}
                >
                  <option value="">Pilih provider</option>
                  {options?.providers.map((p) => (
                    <option key={p.id} value={String(p.id)}>{p.name}</option>
                  ))}
                </select>
                {errors.provider_id && <p className={errorCls}>{errors.provider_id[0]}</p>}
              </div>
              <div>
                <label className={labelCls}>Kategori *</label>
                <select
                  value={form.category_id}
                  onChange={(e) => updateField("category_id", e.target.value)}
                  className={cn(selectCls, !form.category_id && "text-[var(--color-fg-dim)]")}
                >
                  <option value="">Pilih kategori</option>
                  {options?.categories.map((c) => (
                    <option key={c.id} value={String(c.id)}>{c.name}</option>
                  ))}
                </select>
                {errors.category_id && <p className={errorCls}>{errors.category_id[0]}</p>}
              </div>
              <div>
                <label className={labelCls}>Resource Type *</label>
                <select
                  value={form.resource_type}
                  onChange={(e) => updateField("resource_type", e.target.value)}
                  className={cn(selectCls, !form.resource_type && "text-[var(--color-fg-dim)]")}
                >
                  <option value="">Pilih tipe</option>
                  {options?.resource_types?.map((rt) => (
                    <option key={rt} value={rt}>{rt}</option>
                  ))}
                  {/* Free text fallback */}
                  {form.resource_type && !options?.resource_types?.includes(form.resource_type) && (
                    <option value={form.resource_type}>{form.resource_type}</option>
                  )}
                </select>
                {errors.resource_type && <p className={errorCls}>{errors.resource_type[0]}</p>}
              </div>
            </div>

            {/* ── Row: Region + Availability + SLA ── */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className={labelCls}>Region *</label>
                <select
                  value={form.region}
                  onChange={(e) => updateField("region", e.target.value)}
                  className={cn(selectCls, !form.region && "text-[var(--color-fg-dim)]")}
                >
                  <option value="">Pilih region</option>
                  {options?.regions?.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                  {form.region && !options?.regions?.includes(form.region) && (
                    <option value={form.region}>{form.region}</option>
                  )}
                </select>
                {errors.region && <p className={errorCls}>{errors.region[0]}</p>}
              </div>
              <div>
                <label className={labelCls}>Ketersediaan</label>
                <select
                  value={form.availability_status}
                  onChange={(e) => updateField("availability_status", e.target.value)}
                  className={selectCls}
                >
                  <option value="available">Available</option>
                  <option value="limited">Limited</option>
                  <option value="waitlist">Waitlist</option>
                  <option value="unavailable">Unavailable</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>SLA (jam)</label>
                <input
                  type="number"
                  min="1"
                  value={form.provisioning_sla_hours}
                  onChange={(e) => updateField("provisioning_sla_hours", e.target.value)}
                  className={fieldCls}
                />
                {errors.provisioning_sla_hours && <p className={errorCls}>{errors.provisioning_sla_hours[0]}</p>}
              </div>
            </div>

            {/* ── Divider ── */}
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-[var(--color-line)]" />
              <span className="text-[9px] font-semibold uppercase tracking-widest text-[var(--color-fg-dim)]">
                Harga (IDR)
              </span>
              <div className="h-px flex-1 bg-[var(--color-line)]" />
            </div>

            {/* ── Row: Prices ── */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className={labelCls}>Per Jam</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-[var(--color-fg-dim)]">Rp</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.price_hourly}
                    onChange={(e) => updateField("price_hourly", e.target.value)}
                    placeholder="0.00"
                    className={cn(fieldCls, "pl-9")}
                  />
                </div>
              </div>
              <div>
                <label className={labelCls}>Per Bulan *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-[var(--color-fg-dim)]">Rp</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.price_monthly}
                    onChange={(e) => updateField("price_monthly", e.target.value)}
                    placeholder="0.00"
                    className={cn(fieldCls, "pl-9", errors.prices && "border-[var(--color-error)]/50")}
                  />
                </div>
                {errors.prices && <p className={errorCls}>{errors.prices[0]}</p>}
              </div>
              <div>
                <label className={labelCls}>Per Tahun</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-[var(--color-fg-dim)]">Rp</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.price_yearly}
                    onChange={(e) => updateField("price_yearly", e.target.value)}
                    placeholder="0.00"
                    className={cn(fieldCls, "pl-9")}
                  />
                </div>
              </div>
            </div>

            {/* ── Active toggle ── */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                role="switch"
                aria-checked={form.is_active}
                onClick={() => updateField("is_active", !form.is_active)}
                className={cn(
                  "relative h-6 w-11 rounded-full transition-colors duration-200",
                  form.is_active ? "bg-[var(--color-accent)]" : "bg-[var(--color-line-strong)]",
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200",
                    form.is_active ? "translate-x-[22px]" : "translate-x-0.5",
                  )}
                />
              </button>
              <span className="text-[13px] text-[var(--color-fg-muted)]">
                Produk aktif {form.is_active ? "" : "(tidak ditampilkan)"}
              </span>
            </div>
          </div>

          {/* ── Footer ── */}
          <div className="flex items-center justify-end gap-3 border-t border-[var(--color-line)] px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[var(--color-line)] px-4 py-2.5 text-[13px] font-medium text-[var(--color-fg-muted)] transition-colors hover:border-[var(--color-line-strong)] hover:text-[var(--color-fg)]"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-[13px] font-semibold transition-all",
                "bg-[var(--color-accent)] text-[var(--color-accent-fg)] hover:brightness-110",
                "disabled:pointer-events-none disabled:opacity-50",
              )}
            >
              {submitting ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-t-transparent border-[var(--color-accent-fg)]" />
                  {mode === "create" ? "Menyimpan..." : "Memperbarui..."}
                </>
              ) : (
                <>
                  <span
                    className="material-symbols-outlined text-[16px]"
                    style={{ fontVariationSettings: '"FILL" 0, "wght" 400, "GRAD" 0, "opsz" 20' }}
                  >
                    {mode === "create" ? "add" : "save"}
                  </span>
                  {mode === "create" ? "Tambah Produk" : "Simpan Perubahan"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════════════════
   DELETE CONFIRMATION MODAL
   ═════════════════════════════════════════════════════════════════════════ */

interface DeleteConfirmModalProps {
  open: boolean;
  listing: AdminListingData | null;
  onClose: () => void;
  onConfirm: () => void;
  deleting: boolean;
}

export function DeleteConfirmModal({
  open,
  listing,
  onClose,
  onConfirm,
  deleting,
}: DeleteConfirmModalProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); },
    [onClose],
  );

  useEffect(() => {
    if (open) document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, handleKeyDown]);

  if (!open || !listing) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative z-50 w-full max-w-md rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-[var(--color-line)] px-6 py-4">
          <div className="grid h-10 w-10 place-items-center rounded-xl border border-[var(--color-error)]/20 bg-[var(--color-error)]/10">
            <span
              className="material-symbols-outlined text-[20px] text-[var(--color-error)]"
              style={{ fontVariationSettings: '"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20' }}
            >
              warning
            </span>
          </div>
          <div>
            <h2 className="text-[15px] font-bold text-[var(--color-fg)]">
              Hapus Produk
            </h2>
            <p className="text-[11px] text-[var(--color-fg-dim)]">
              Tindakan ini tidak dapat dibatalkan
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <p className="text-[13px] leading-relaxed text-[var(--color-fg-muted)]">
            Apakah kamu yakin ingin menghapus produk{" "}
            <span className="font-semibold text-[var(--color-fg)]">"{listing.name}"</span>?
          </p>

          {/* Product info card */}
          <div className="mt-4 rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)] p-3">
            <div className="flex items-center gap-3">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-[var(--color-line)]">
                <span className="font-mono text-[9px] text-[var(--color-fg-dim)]">
                  #{listing.id}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-[var(--color-fg)]">
                  {listing.name}
                </p>
                <p className="truncate font-mono text-[10px] text-[var(--color-fg-dim)]">
                  {listing.slug} · {listing.region}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-[var(--color-line)] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="rounded-lg border border-[var(--color-line)] px-4 py-2.5 text-[13px] font-medium text-[var(--color-fg-muted)] transition-colors hover:border-[var(--color-line-strong)] hover:text-[var(--color-fg)] disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-[13px] font-semibold transition-all",
              "bg-[var(--color-error)] text-white hover:brightness-110",
              "disabled:pointer-events-none disabled:opacity-50",
            )}
          >
            {deleting ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-t-transparent border-white" />
                Menghapus...
              </>
            ) : (
              <>
                <span
                  className="material-symbols-outlined text-[16px]"
                  style={{ fontVariationSettings: '"FILL" 0, "wght" 400, "GRAD" 0, "opsz" 20' }}
                >
                  delete
                </span>
                Hapus Produk
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
