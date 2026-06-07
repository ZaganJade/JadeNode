"use client";

import { useState, useEffect, useCallback } from "react";
import {
  adminListArchivedArticles,
  adminUnarchiveArticle,
  adminDeleteArticle,
  type AdminArticleData,
  type AdminArticleListResponse,
} from "@/lib/articles";
import { ApiException } from "@/lib/api";
import { RevealOnScroll } from "@/components/landing/reveal-on-scroll";
import { DeleteConfirmModal } from "../components/article-form-modal";

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

export default function AdminArchivedArticlesPage() {
  const [data, setData] = useState<AdminArticleListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [restoringArticle, setRestoringArticle] =
    useState<AdminArticleData | null>(null);
  const [deletingArticle, setDeletingArticle] =
    useState<AdminArticleData | null>(null);

  const fetchArchived = useCallback(
    async (page?: number) => {
      setLoading(true);
      setError("");
      try {
        const params: Record<string, string> = {};
        if (page) params.page = String(page);
        if (searchQuery) params.search = searchQuery;
        setData(await adminListArchivedArticles(params));
      } catch (err) {
        setError(
          err instanceof ApiException ? err.message : "Gagal memuat arsip.",
        );
      } finally {
        setLoading(false);
      }
    },
    [searchQuery],
  );

  useEffect(() => {
    fetchArchived();
  }, [fetchArchived]);

  const handleRestore = async (id: number) => {
    await adminUnarchiveArticle(id);
    setRestoringArticle(null);
    fetchArchived();
  };

  const handleDelete = async (id: number) => {
    await adminDeleteArticle(id);
    setDeletingArticle(null);
    fetchArchived();
  };

  return (
    <RevealOnScroll>
      <div className="mx-auto w-full max-w-[1320px] px-6 py-8">
        {/* Header */}
        <section className="reveal-rise mb-8">
          <p className="studio-eyebrow text-[var(--color-amber)]">Arsip</p>
          <h1 className="studio-display mt-3 text-[clamp(28px,4vw,44px)] text-[var(--color-fg)]">
            Arsip Artikel
          </h1>
          <p className="mt-2 text-[13px] text-[var(--color-fg-muted)]">
            Artikel yang telah diarsipkan. Kamu bisa memulihkan atau menghapus
            permanen.
          </p>
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

        {/* Search */}
        <section className="reveal-rise mb-6 flex flex-wrap items-end gap-3 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)]/50 p-4">
          <div className="min-w-[180px] flex-1">
            <label className="studio-eyebrow mb-1.5 block text-[7px] text-[var(--color-fg-dim)]">
              Cari Arsip
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
          {data && (
            <span className="ml-auto font-mono text-[11px] text-[var(--color-fg-dim)]">
              {data.meta.total} diarsipkan
            </span>
          )}
        </section>

        {/* Table */}
        <section className="reveal-rise overflow-x-auto rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)]/50">
          {loading && !data ? (
            <div className="flex items-center justify-center py-16">
              <div className="relative h-10 w-10">
                <div className="absolute inset-0 rounded-full border-2 border-[var(--color-line)]" />
                <div className="absolute inset-0 animate-spin rounded-full border-2 border-t-[var(--color-amber)]" />
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
                      "Penulis",
                      "Diarsipkan",
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
                  {data.data.map((article) => (
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
                      <td className="px-4 py-3 text-[12px] text-[var(--color-fg-muted)]">
                        {article.author?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-[11px] text-[var(--color-fg-muted)]">
                        {formatDate(article.updated_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setRestoringArticle(article)}
                            title="Pulihkan"
                            className="rounded-lg p-1.5 text-[var(--color-fg-dim)] transition-colors hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-accent)]"
                          >
                            <span
                              className="material-symbols-outlined text-[16px]"
                              style={{
                                fontVariationSettings:
                                  '"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20',
                              }}
                            >
                              unarchive
                            </span>
                          </button>
                          <button
                            onClick={() => setDeletingArticle(article)}
                            title="Hapus Permanen"
                            className="rounded-lg p-1.5 text-[var(--color-fg-dim)] transition-colors hover:bg-red-500/10 hover:text-red-400"
                          >
                            <span
                              className="material-symbols-outlined text-[16px]"
                              style={{
                                fontVariationSettings:
                                  '"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20',
                              }}
                            >
                              delete_forever
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.meta.last_page > 1 && (
                <div className="flex items-center justify-between border-t border-[var(--color-line)] px-5 py-3">
                  <button
                    disabled={data.meta.current_page <= 1}
                    onClick={() => fetchArchived(data.meta.current_page - 1)}
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
                    onClick={() => fetchArchived(data.meta.current_page + 1)}
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
                inventory_2
              </span>
              <p className="mt-3 text-[13px] text-[var(--color-fg-muted)]">
                Arsip kosong — belum ada artikel yang diarsipkan.
              </p>
            </div>
          )}
        </section>
      </div>

      {/* Restore Confirmation */}
      {restoringArticle && (
        <DeleteConfirmModal
          title="Pulihkan Artikel"
          message={`Apakah kamu yakin ingin memulihkan "${restoringArticle.title}" dari arsip? Artikel akan dikembalikan ke status Draft.`}
          confirmLabel="Pulihkan"
          variant="restore"
          onConfirm={() => handleRestore(restoringArticle.id)}
          onClose={() => setRestoringArticle(null)}
        />
      )}

      {/* Delete Confirmation */}
      {deletingArticle && (
        <DeleteConfirmModal
          title="Hapus Permanen"
          message={`Apakah kamu yakin ingin menghapus permanen "${deletingArticle.title}"? Tindakan ini tidak dapat dibatalkan.`}
          confirmLabel="Hapus Permanen"
          onConfirm={() => handleDelete(deletingArticle.id)}
          onClose={() => setDeletingArticle(null)}
        />
      )}
    </RevealOnScroll>
  );
}
