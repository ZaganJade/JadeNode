"use client";

import { useState, useEffect, useCallback } from "react";
import {
  adminListArticles,
  adminCreateArticle,
  adminUpdateArticle,
  adminDeleteArticle,
  adminArchiveArticle,
  type AdminArticleData,
  type AdminArticleListResponse,
} from "@/lib/articles";
import { ApiException } from "@/lib/api";
import { RevealOnScroll } from "@/components/landing/reveal-on-scroll";
import { ArticleFormModal, DeleteConfirmModal } from "./components/article-form-modal";

function formatDate(d: string | null) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return d;
  }
}

const STATUS_BADGE: Record<
  string,
  { color: string; bg: string; border: string }
> = {
  draft: {
    color: "var(--color-fg-dim)",
    bg: "rgba(255,255,255,0.03)",
    border: "rgba(255,255,255,0.06)",
  },
  published: {
    color: "var(--color-success)",
    bg: "rgba(108,232,166,0.08)",
    border: "rgba(108,232,166,0.18)",
  },
  archived: {
    color: "var(--color-amber)",
    bg: "rgba(245,179,71,0.08)",
    border: "rgba(245,179,71,0.18)",
  },
};

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
};

const CATEGORIES = [
  "Tutorial",
  "Panduan",
  "Pengumuman",
  "Tips & Trik",
  "Changelog",
  "Insight",
];

export default function AdminArticlesPage() {
  const [data, setData] = useState<AdminArticleListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingArticle, setEditingArticle] =
    useState<AdminArticleData | null>(null);
  const [deletingArticle, setDeletingArticle] =
    useState<AdminArticleData | null>(null);
  const [archivingArticle, setArchivingArticle] =
    useState<AdminArticleData | null>(null);

  const fetchArticles = useCallback(
    async (page?: number) => {
      setLoading(true);
      setError("");
      try {
        const params: Record<string, string> = {};
        if (page) params.page = String(page);
        if (searchQuery) params.search = searchQuery;
        if (statusFilter) params.status = statusFilter;
        setData(await adminListArticles(params));
      } catch (err) {
        setError(
          err instanceof ApiException ? err.message : "Gagal memuat artikel.",
        );
      } finally {
        setLoading(false);
      }
    },
    [searchQuery, statusFilter],
  );

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const handleCreate = async (formData: {
    title: string;
    excerpt: string;
    body: string;
    cover_image: string;
    category: string;
    status: string;
  }) => {
    await adminCreateArticle(formData);
    setShowCreateModal(false);
    fetchArticles();
  };

  const handleEdit = async (
    id: number,
    formData: {
      title: string;
      excerpt: string;
      body: string;
      cover_image: string;
      category: string;
      status: string;
    },
  ) => {
    await adminUpdateArticle(id, formData);
    setEditingArticle(null);
    fetchArticles();
  };

  const handleDelete = async (id: number) => {
    await adminDeleteArticle(id);
    setDeletingArticle(null);
    fetchArticles();
  };

  const handleArchive = async (id: number) => {
    await adminArchiveArticle(id);
    setArchivingArticle(null);
    fetchArticles();
  };

  return (
    <RevealOnScroll>
      <div className="mx-auto w-full max-w-[1320px] px-6 py-8">
        {/* Header */}
        <section className="reveal-rise mb-8">
          <div className="flex items-start justify-between">
            <div>
              <p className="studio-eyebrow text-[var(--color-accent)]">
                Konten
              </p>
              <h1 className="studio-display mt-3 text-[clamp(28px,4vw,44px)] text-[var(--color-fg)]">
                Artikel
              </h1>
              <p className="mt-2 text-[13px] text-[var(--color-fg-muted)]">
                Kelola artikel, panduan, dan pengumuman.
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 rounded-xl bg-[var(--color-accent)] px-4 py-2.5 text-[12px] font-semibold text-[var(--color-accent-fg)] transition-all duration-[var(--dur-standard)] hover:brightness-110"
            >
              <span
                className="material-symbols-outlined text-[16px]"
                style={{
                  fontVariationSettings:
                    '"FILL" 0, "wght" 400, "GRAD" 0, "opsz" 20',
                }}
              >
                add
              </span>
              Tambah Artikel
            </button>
          </div>
        </section>

        {error && (
          <div className="reveal-rise mb-6 flex items-center gap-2 rounded-2xl border border-[var(--color-error)]/20 bg-[var(--color-error)]/5 px-5 py-3">
            <span
              className="material-symbols-outlined text-[18px] text-[var(--color-error)]"
              style={{ fontVariationSettings: '"FILL" 0, "wght" 300' }}
            >
              error
            </span>
            <p className="text-[13px] text-[var(--color-error)]">{error}</p>
          </div>
        )}

        {/* Filters */}
        <section className="reveal-rise mb-6 flex flex-wrap items-end gap-3 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)]/50 p-4">
          <div className="min-w-[180px] flex-1">
            <label className="studio-eyebrow mb-1.5 block text-[7px] text-[var(--color-fg-dim)]">
              Cari
            </label>
            <div className="relative">
              <span
                className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[16px] text-[var(--color-fg-dim)]"
                style={{
                  fontVariationSettings:
                    '"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20',
                }}
              >
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Judul atau slug..."
                className="block w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-bg)] py-2 pl-9 pr-3 text-[13px] text-[var(--color-fg)] placeholder:text-[var(--color-fg-dim)] focus:border-[var(--color-accent)]/40 focus:outline-none"
              />
            </div>
          </div>
          <div className="w-36">
            <label className="studio-eyebrow mb-1.5 block text-[7px] text-[var(--color-fg-dim)]">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-bg)] px-2.5 py-2 text-[13px] text-[var(--color-fg)] focus:border-[var(--color-accent)]/40 focus:outline-none"
            >
              <option value="">Semua</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          {data && (
            <span className="ml-auto font-mono text-[11px] text-[var(--color-fg-dim)]">
              {data.meta.total} total
            </span>
          )}
        </section>

        {/* Table */}
        <section className="reveal-rise overflow-x-auto rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)]/50">
          {loading && !data ? (
            <div className="flex items-center justify-center py-16">
              <div className="relative h-10 w-10">
                <div className="absolute inset-0 rounded-full border-2 border-[var(--color-line)]" />
                <div className="absolute inset-0 animate-spin rounded-full border-2 border-t-[var(--color-accent)]" />
              </div>
            </div>
          ) : data && data.data.length > 0 ? (
            <>
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="border-b border-[var(--color-line)]">
                    {[
                      "Judul",
                      "Kategori",
                      "Status",
                      "Waktu Baca",
                      "Penulis",
                      "Tanggal",
                      "Aksi",
                    ].map((h) => (
                      <th
                        key={h}
                        className="whitespace-nowrap px-4 py-3 studio-eyebrow text-[8px] text-[var(--color-fg-dim)]"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-line)]">
                  {data.data.map((article) => {
                    const sc = STATUS_BADGE[article.status] ?? STATUS_BADGE.draft;
                    return (
                      <tr
                        key={article.public_id}
                        className="transition-colors hover:bg-white/[0.02]"
                      >
                        <td className="max-w-[260px] px-4 py-3">
                          <p className="truncate text-[13px] font-semibold text-[var(--color-fg)]">
                            {article.title}
                          </p>
                          <p className="truncate text-[10px] text-[var(--color-fg-dim)]">
                            /{article.slug}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-[12px] text-[var(--color-fg-muted)]">
                          {article.category ?? "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="rounded-full border px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider"
                            style={{
                              color: sc.color,
                              backgroundColor: sc.bg,
                              borderColor: sc.border,
                            }}
                          >
                            {STATUS_LABEL[article.status] ?? article.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[11px] text-[var(--color-fg-muted)]">
                          {article.reading_time} min
                        </td>
                        <td className="px-4 py-3 text-[12px] text-[var(--color-fg-muted)]">
                          {article.author?.name ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-[11px] text-[var(--color-fg-muted)]">
                          {formatDate(article.created_at)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setEditingArticle(article)}
                              title="Edit"
                              className="rounded-lg p-1.5 text-[var(--color-fg-dim)] transition-colors hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-accent)]"
                            >
                              <span
                                className="material-symbols-outlined text-[16px]"
                                style={{
                                  fontVariationSettings:
                                    '"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20',
                                }}
                              >
                                edit
                              </span>
                            </button>
                            {article.status !== "archived" ? (
                              <button
                                onClick={() => setArchivingArticle(article)}
                                title="Arsipkan"
                                className="rounded-lg p-1.5 text-[var(--color-fg-dim)] transition-colors hover:bg-[var(--color-amber-soft)] hover:text-[var(--color-amber)]"
                              >
                                <span
                                  className="material-symbols-outlined text-[16px]"
                                  style={{
                                    fontVariationSettings:
                                      '"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20',
                                  }}
                                >
                                  archive
                                </span>
                              </button>
                            ) : null}
                            <button
                              onClick={() => setDeletingArticle(article)}
                              title="Hapus"
                              className="rounded-lg p-1.5 text-[var(--color-fg-dim)] transition-colors hover:bg-red-500/10 hover:text-red-400"
                            >
                              <span
                                className="material-symbols-outlined text-[16px]"
                                style={{
                                  fontVariationSettings:
                                    '"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20',
                                }}
                              >
                                delete
                              </span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {data.meta.last_page > 1 && (
                <div className="flex items-center justify-between border-t border-[var(--color-line)] px-5 py-3">
                  <button
                    disabled={data.meta.current_page <= 1}
                    onClick={() => fetchArticles(data.meta.current_page - 1)}
                    className="rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-[11px] font-medium text-[var(--color-fg-muted)] disabled:opacity-50"
                  >
                    Sebelumnya
                  </button>
                  <span className="studio-eyebrow text-[8px] text-[var(--color-fg-dim)]">
                    Halaman {data.meta.current_page} dari{" "}
                    {data.meta.last_page}
                  </span>
                  <button
                    disabled={data.meta.current_page >= data.meta.last_page}
                    onClick={() => fetchArticles(data.meta.current_page + 1)}
                    className="rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-[11px] font-medium text-[var(--color-fg-muted)] disabled:opacity-50"
                  >
                    Berikutnya
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="py-12 text-center">
              <span
                className="material-symbols-outlined text-[40px] text-[var(--color-fg-dim)]"
                style={{
                  fontVariationSettings:
                    '"FILL" 0, "wght" 200, "GRAD" 0, "opsz" 40',
                }}
              >
                newspaper
              </span>
              <p className="mt-3 text-[13px] text-[var(--color-fg-muted)]">
                Belum ada artikel. Klik "Tambah Artikel" untuk membuat baru.
              </p>
            </div>
          )}
        </section>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <ArticleFormModal
          categories={CATEGORIES}
          onSubmit={handleCreate}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {/* Edit Modal */}
      {editingArticle && (
        <ArticleFormModal
          article={editingArticle}
          categories={CATEGORIES}
          onSubmit={(formData) => handleEdit(editingArticle.id, formData)}
          onClose={() => setEditingArticle(null)}
        />
      )}

      {/* Delete Confirmation */}
      {deletingArticle && (
        <DeleteConfirmModal
          title="Hapus Artikel"
          message={`Apakah kamu yakin ingin menghapus "${deletingArticle.title}"? Tindakan ini tidak dapat dibatalkan.`}
          confirmLabel="Hapus"
          onConfirm={() => handleDelete(deletingArticle.id)}
          onClose={() => setDeletingArticle(null)}
        />
      )}

      {/* Archive Confirmation */}
      {archivingArticle && (
        <DeleteConfirmModal
          title="Arsipkan Artikel"
          message={`Apakah kamu yakin ingin mengarsipkan "${archivingArticle.title}"? Artikel akan dipindahkan ke Arsip.`}
          confirmLabel="Arsipkan"
          variant="archive"
          onConfirm={() => handleArchive(archivingArticle.id)}
          onClose={() => setArchivingArticle(null)}
        />
      )}
    </RevealOnScroll>
  );
}
