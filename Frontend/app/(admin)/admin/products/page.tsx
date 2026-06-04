"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import {
  adminListListings,
  adminUpdateListing,
  type AdminListingData,
  type AdminListingListResponse,
} from "@/lib/auth";
import { ApiException } from "@/lib/api";
import { formatPrice } from "@/lib/formatters";

const AVAILABILITY_OPTIONS = [
  "available",
  "limited",
  "waitlist",
  "unavailable",
] as const;

const AVAILABILITY_BADGE: Record<string, "available" | "limited" | "waitlist" | "unavailable" | "default"> = {
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

interface EditState {
  listingId: number;
  field: string;
  value: string;
}

export default function AdminProductsPage() {
  const [data, setData] = useState<AdminListingListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterAvailability, setFilterAvailability] = useState("");
  const [filterActive, setFilterActive] = useState("");
  const [editing, setEditing] = useState<EditState | null>(null);
  const [saving, setSaving] = useState<number | null>(null);

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

        const result = await adminListListings(Object.keys(params).length > 0 ? params : undefined);
        setData(result);
      } catch (err) {
        if (err instanceof ApiException) {
          setError(err.message);
        } else {
          setError("Gagal memuat data listing.");
        }
      } finally {
        setLoading(false);
      }
    },
    [search, filterAvailability, filterActive],
  );

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  function startEdit(listingId: number, field: string, value: string) {
    setEditing({ listingId, field, value });
  }

  function cancelEdit() {
    setEditing(null);
  }

  async function saveEdit(listing: AdminListingData) {
    if (!editing) return;
    setSaving(listing.id);

    try {
      const payload: Record<string, unknown> = {};

      if (editing.field === "availability_status") {
        payload.availability_status = editing.value;
      } else if (editing.field === "provisioning_sla_hours") {
        payload.provisioning_sla_hours = Number.parseInt(editing.value, 10);
      } else if (editing.field === "is_active") {
        payload.is_active = editing.value === "true";
      } else if (editing.field === "price_monthly") {
        const minor = Math.round(Number.parseFloat(editing.value) * 100);
        payload.prices = [
          { billing_cycle: "monthly", gross_price_minor: minor },
        ];
      } else if (editing.field === "price_yearly") {
        const minor = Math.round(Number.parseFloat(editing.value) * 100);
        payload.prices = [
          { billing_cycle: "yearly", gross_price_minor: minor },
        ];
      }

      await adminUpdateListing(listing.id, payload);
      setEditing(null);
      fetchListings(data?.meta.current_page);
    } catch (err) {
      if (err instanceof ApiException) {
        setError(err.message);
      } else {
        setError("Gagal menyimpan perubahan.");
      }
    } finally {
      setSaving(null);
    }
  }

  function getPrice(listing: AdminListingData, cycle: string): number {
    const price = listing.prices?.find((p) => p.billing_cycle === cycle);
    return price ? price.price : 0;
  }

  function isEditingField(listingId: number, field: string): boolean {
    return editing?.listingId === listingId && editing?.field === field;
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-foreground">
          Product Listings
        </h1>
        <p className="mt-0.5 text-xs text-foreground-muted">
          Kelola harga, ketersediaan, dan SLA semua listing produk.
        </p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {/* Search / Filter Bar */}
      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-surface-glass-border bg-surface-glass p-3">
        <div className="flex-1 min-w-[200px]">
          <label className="mb-1 block text-2xs font-medium uppercase tracking-wider text-foreground-muted">
            Cari
          </label>
          <input
            type="text"
            placeholder="Nama atau slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full rounded border border-surface-glass-border bg-background px-2.5 py-1.5 text-sm text-foreground placeholder:text-foreground-dim focus:border-amber-brand focus:outline-none focus:ring-1 focus:ring-amber-brand/20"
          />
        </div>
        <div className="w-36">
          <label className="mb-1 block text-2xs font-medium uppercase tracking-wider text-foreground-muted">
            Availability
          </label>
          <select
            value={filterAvailability}
            onChange={(e) => setFilterAvailability(e.target.value)}
            className="block w-full rounded border border-surface-glass-border bg-background px-2.5 py-1.5 text-sm text-foreground focus:border-amber-brand focus:outline-none focus:ring-1 focus:ring-amber-brand/20"
          >
            <option value="">Semua</option>
            {AVAILABILITY_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {AVAILABILITY_LABEL[opt]}
              </option>
            ))}
          </select>
        </div>
        <div className="w-28">
          <label className="mb-1 block text-2xs font-medium uppercase tracking-wider text-foreground-muted">
            Status
          </label>
          <select
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value)}
            className="block w-full rounded border border-surface-glass-border bg-background px-2.5 py-1.5 text-sm text-foreground focus:border-amber-brand focus:outline-none focus:ring-1 focus:ring-amber-brand/20"
          >
            <option value="">Semua</option>
            <option value="1">Active</option>
            <option value="0">Inactive</option>
          </select>
        </div>
        <Button
          size="sm"
          variant="primary"
          onClick={() => fetchListings()}
        >
          Filter
        </Button>
      </div>

      {/* Listings Table */}
      <div className="overflow-x-auto rounded-lg border border-surface-glass-border bg-surface-glass">
        {loading && !data ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-brand border-t-transparent" />
          </div>
        ) : data && data.data.length > 0 ? (
          <>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-surface-glass-border">
                  <th className="whitespace-nowrap px-3 py-2 text-2xs font-semibold uppercase tracking-wider text-foreground-muted">
                    Nama
                  </th>
                  <th className="whitespace-nowrap px-3 py-2 text-2xs font-semibold uppercase tracking-wider text-foreground-muted">
                    Provider
                  </th>
                  <th className="whitespace-nowrap px-3 py-2 text-2xs font-semibold uppercase tracking-wider text-foreground-muted">
                    Category
                  </th>
                  <th className="whitespace-nowrap px-3 py-2 text-2xs font-semibold uppercase tracking-wider text-foreground-muted">
                    Region
                  </th>
                  <th className="whitespace-nowrap px-3 py-2 text-2xs font-semibold uppercase tracking-wider text-foreground-muted">
                    Monthly
                  </th>
                  <th className="whitespace-nowrap px-3 py-2 text-2xs font-semibold uppercase tracking-wider text-foreground-muted">
                    Yearly
                  </th>
                  <th className="whitespace-nowrap px-3 py-2 text-2xs font-semibold uppercase tracking-wider text-foreground-muted">
                    Availability
                  </th>
                  <th className="whitespace-nowrap px-3 py-2 text-2xs font-semibold uppercase tracking-wider text-foreground-muted">
                    SLA (jam)
                  </th>
                  <th className="whitespace-nowrap px-3 py-2 text-2xs font-semibold uppercase tracking-wider text-foreground-muted">
                    Active
                  </th>
                  <th className="whitespace-nowrap px-3 py-2 text-2xs font-semibold uppercase tracking-wider text-foreground-muted text-right">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-glass-border">
                {data.data.map((listing) => (
                  <tr
                    key={listing.id}
                    className="transition-colors hover:bg-surface-elevated/50"
                  >
                    {/* Name */}
                    <td className="whitespace-nowrap px-3 py-2">
                      <div className="font-medium text-foreground text-sm">
                        {listing.name}
                      </div>
                      <div className="text-2xs text-foreground-dim font-mono">
                        {listing.slug}
                      </div>
                    </td>

                    {/* Provider */}
                    <td className="whitespace-nowrap px-3 py-2 text-xs text-foreground-muted">
                      {listing.provider?.name ?? "—"}
                    </td>

                    {/* Category */}
                    <td className="whitespace-nowrap px-3 py-2 text-xs text-foreground-muted">
                      {listing.category?.name ?? "—"}
                    </td>

                    {/* Region */}
                    <td className="whitespace-nowrap px-3 py-2 text-xs text-foreground-muted">
                      {listing.region}
                    </td>

                    {/* Monthly Price */}
                    <td className="whitespace-nowrap px-3 py-2">
                      {isEditingField(listing.id, "price_monthly") ? (
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          defaultValue={getPrice(listing, "monthly")}
                          onChange={(e) =>
                            setEditing((prev) =>
                              prev ? { ...prev, value: e.target.value } : null,
                            )
                          }
                          className="w-24 rounded border border-amber-brand/30 bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-amber-brand/20"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEdit(listing);
                            if (e.key === "Escape") cancelEdit();
                          }}
                        />
                      ) : (
                        <span
                          className="cursor-pointer font-mono text-xs text-foreground hover:text-amber-brand"
                          onClick={() =>
                            startEdit(
                              listing.id,
                              "price_monthly",
                              String(getPrice(listing, "monthly")),
                            )
                          }
                          title="Klik untuk edit"
                        >
                          {formatPrice(getPrice(listing, "monthly"))}
                        </span>
                      )}
                    </td>

                    {/* Yearly Price */}
                    <td className="whitespace-nowrap px-3 py-2">
                      {isEditingField(listing.id, "price_yearly") ? (
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          defaultValue={getPrice(listing, "yearly")}
                          onChange={(e) =>
                            setEditing((prev) =>
                              prev ? { ...prev, value: e.target.value } : null,
                            )
                          }
                          className="w-24 rounded border border-amber-brand/30 bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-amber-brand/20"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEdit(listing);
                            if (e.key === "Escape") cancelEdit();
                          }}
                        />
                      ) : (
                        <span
                          className="cursor-pointer font-mono text-xs text-foreground hover:text-amber-brand"
                          onClick={() =>
                            startEdit(
                              listing.id,
                              "price_yearly",
                              String(getPrice(listing, "yearly")),
                            )
                          }
                          title="Klik untuk edit"
                        >
                          {formatPrice(getPrice(listing, "yearly"))}
                        </span>
                      )}
                    </td>

                    {/* Availability */}
                    <td className="whitespace-nowrap px-3 py-2">
                      {isEditingField(listing.id, "availability_status") ? (
                        <select
                          defaultValue={listing.availability_status}
                          onChange={(e) =>
                            setEditing((prev) =>
                              prev ? { ...prev, value: e.target.value } : null,
                            )
                          }
                          className="rounded border border-amber-brand/30 bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-amber-brand/20"
                          autoFocus
                        >
                          {AVAILABILITY_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {AVAILABILITY_LABEL[opt]}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span
                          className="cursor-pointer"
                          onClick={() =>
                            startEdit(
                              listing.id,
                              "availability_status",
                              listing.availability_status,
                            )
                          }
                          title="Klik untuk edit"
                        >
                          <Badge
                            variant={
                              AVAILABILITY_BADGE[listing.availability_status] ??
                              "default"
                            }
                          >
                            {AVAILABILITY_LABEL[listing.availability_status] ??
                              listing.availability_status}
                          </Badge>
                        </span>
                      )}
                    </td>

                    {/* SLA */}
                    <td className="whitespace-nowrap px-3 py-2">
                      {isEditingField(listing.id, "provisioning_sla_hours") ? (
                        <input
                          type="number"
                          min="1"
                          defaultValue={listing.provisioning_sla_hours}
                          onChange={(e) =>
                            setEditing((prev) =>
                              prev ? { ...prev, value: e.target.value } : null,
                            )
                          }
                          className="w-16 rounded border border-amber-brand/30 bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-amber-brand/20"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEdit(listing);
                            if (e.key === "Escape") cancelEdit();
                          }}
                        />
                      ) : (
                        <span
                          className="cursor-pointer font-mono text-xs text-foreground hover:text-amber-brand"
                          onClick={() =>
                            startEdit(
                              listing.id,
                              "provisioning_sla_hours",
                              String(listing.provisioning_sla_hours),
                            )
                          }
                          title="Klik untuk edit"
                        >
                          {listing.provisioning_sla_hours}h
                        </span>
                      )}
                    </td>

                    {/* Active */}
                    <td className="whitespace-nowrap px-3 py-2">
                      {isEditingField(listing.id, "is_active") ? (
                        <select
                          defaultValue={String(listing.is_active)}
                          onChange={(e) =>
                            setEditing((prev) =>
                              prev ? { ...prev, value: e.target.value } : null,
                            )
                          }
                          className="rounded border border-amber-brand/30 bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-amber-brand/20"
                          autoFocus
                        >
                          <option value="true">Active</option>
                          <option value="false">Inactive</option>
                        </select>
                      ) : (
                        <span
                          className="cursor-pointer"
                          onClick={() =>
                            startEdit(
                              listing.id,
                              "is_active",
                              String(listing.is_active),
                            )
                          }
                          title="Klik untuk edit"
                        >
                          <Badge variant={listing.is_active ? "success" : "error"}>
                            {listing.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="whitespace-nowrap px-3 py-2 text-right">
                      {editing?.listingId === listing.id ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => saveEdit(listing)}
                            disabled={saving === listing.id}
                            className="rounded bg-amber-brand/20 px-2 py-0.5 text-2xs font-medium text-amber-brand transition-colors hover:bg-amber-brand/30 disabled:opacity-50"
                          >
                            {saving === listing.id ? "..." : "Simpan"}
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            disabled={saving === listing.id}
                            className="rounded px-2 py-0.5 text-2xs font-medium text-foreground-muted transition-colors hover:text-foreground"
                          >
                            Batal
                          </button>
                        </div>
                      ) : (
                        <span className="text-2xs text-foreground-dim">
                          {listing.last_audit
                            ? `by ${listing.last_audit.changed_by?.name ?? "?"} ${new Date(listing.last_audit.changed_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}`
                            : "—"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {data.meta.last_page > 1 && (
              <div className="flex items-center justify-between border-t border-surface-glass-border px-4 py-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={data.meta.current_page <= 1}
                  onClick={() => fetchListings(data.meta.current_page - 1)}
                >
                  Sebelumnya
                </Button>
                <span className="text-2xs text-foreground-muted">
                  Halaman {data.meta.current_page} dari {data.meta.last_page}{" "}
                  · {data.meta.total} listing
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={data.meta.current_page >= data.meta.last_page}
                  onClick={() => fetchListings(data.meta.current_page + 1)}
                >
                  Berikutnya
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="py-12 text-center">
            <p className="text-sm text-foreground-muted">
              Tidak ada listing ditemukan.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
