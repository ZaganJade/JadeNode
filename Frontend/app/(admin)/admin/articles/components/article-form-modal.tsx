"use client";

import { useState, useEffect, useRef } from "react";
import type { AdminArticleData } from "@/lib/articles";

/* ═════════════════════════════════════════════════════════════════════════
   ARTICLE FORM MODAL
   ═════════════════════════════════════════════════════════════════════════ */

interface ArticleFormModalProps {
  article?: AdminArticleData | null;
  categories: string[];
  onSubmit: (data: {
    title: string;
    excerpt: string;
    body: string;
    cover_image: string;
    category: string;
    status: string;
  }) => Promise<void>;
  onClose: () => void;
}

export function ArticleFormModal({
  article,
  categories,
  onSubmit,
  onClose,
}: ArticleFormModalProps) {
  const isEditing = !!article;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const overlayRef = useRef<HTMLDivElement>(null);

  const [title, setTitle] = useState(article?.title ?? "");
  const [excerpt, setExcerpt] = useState(article?.excerpt ?? "");
  const [body, setBody] = useState(article?.body ?? "");
  const [coverImage, setCoverImage] = useState(article?.cover_image ?? "");
  const [category, setCategory] = useState(article?.category ?? "");
  const [status, setStatus] = useState(article?.status ?? "draft");

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onSubmit({
        title,
        excerpt,
        body,
        cover_image: coverImage,
        category,
        status,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal menyimpan artikel.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="relative mx-4 flex max-h-[90vh] w-full max-w-[700px] flex-col overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-line)] px-6 py-4">
          <div>
            <h2 className="studio-display text-[18px] text-[var(--color-fg)]">
              {isEditing ? "Edit Artikel" : "Artikel Baru"}
            </h2>
            <p className="mt-0.5 text-[11px] text-[var(--color-fg-dim)]">
              {isEditing
                ? "Perbarui konten dan pengaturan artikel."
                : "Isi detail artikel baru di bawah ini."}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--color-fg-dim)] transition-colors hover:bg-white/[0.05] hover:text-[var(--color-fg)]"
          >
            <span
              className="material-symbols-outlined text-[20px]"
              style={{
                fontVariationSettings:
                  '"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20',
              }}
            >
              close
            </span>
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-6 py-5"
        >
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-[var(--color-error)]/20 bg-[var(--color-error)]/5 px-4 py-2.5">
              <span
                className="material-symbols-outlined text-[16px] text-[var(--color-error)]"
                style={{ fontVariationSettings: '"FILL" 0, "wght" 300' }}
              >
                error
              </span>
              <p className="text-[12px] text-[var(--color-error)]">{error}</p>
            </div>
          )}

          <div className="space-y-5">
            {/* Title */}
            <div>
              <label className="studio-eyebrow mb-1.5 block text-[7px] text-[var(--color-fg-dim)]">
                Judul Artikel *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Masukkan judul artikel..."
                className="block w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-bg)] px-3 py-2.5 text-[13px] text-[var(--color-fg)] placeholder:text-[var(--color-fg-dim)] focus:border-[var(--color-accent)]/40 focus:outline-none"
              />
            </div>

            {/* Excerpt */}
            <div>
              <label className="studio-eyebrow mb-1.5 block text-[7px] text-[var(--color-fg-dim)]">
                Ringkasan (Excerpt)
              </label>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Ringkasan singkat artikel..."
                rows={3}
                className="block w-full resize-none rounded-lg border border-[var(--color-line)] bg-[var(--color-bg)] px-3 py-2.5 text-[13px] text-[var(--color-fg)] placeholder:text-[var(--color-fg-dim)] focus:border-[var(--color-accent)]/40 focus:outline-none"
              />
            </div>

            {/* Category + Status row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="studio-eyebrow mb-1.5 block text-[7px] text-[var(--color-fg-dim)]">
                  Kategori
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="block w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-bg)] px-2.5 py-2.5 text-[13px] text-[var(--color-fg)] focus:border-[var(--color-accent)]/40 focus:outline-none"
                >
                  <option value="">Tanpa Kategori</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="studio-eyebrow mb-1.5 block text-[7px] text-[var(--color-fg-dim)]">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="block w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-bg)] px-2.5 py-2.5 text-[13px] text-[var(--color-fg)] focus:border-[var(--color-accent)]/40 focus:outline-none"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>

            {/* Cover Image */}
            <div>
              <label className="studio-eyebrow mb-1.5 block text-[7px] text-[var(--color-fg-dim)]">
                Cover Image URL
              </label>
              <input
                type="text"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="block w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-bg)] px-3 py-2.5 text-[13px] text-[var(--color-fg)] placeholder:text-[var(--color-fg-dim)] focus:border-[var(--color-accent)]/40 focus:outline-none"
              />
            </div>

            {/* Body */}
            <div>
              <label className="studio-eyebrow mb-1.5 block text-[7px] text-[var(--color-fg-dim)]">
                Konten Artikel *
              </label>
              <textarea
                required
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Tulis konten artikel (mendukung HTML)..."
                rows={12}
                className="block w-full resize-y rounded-lg border border-[var(--color-line)] bg-[var(--color-bg)] px-3 py-2.5 font-mono text-[12px] leading-relaxed text-[var(--color-fg)] placeholder:text-[var(--color-fg-dim)] focus:border-[var(--color-accent)]/40 focus:outline-none"
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-[var(--color-line)] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[var(--color-line)] px-4 py-2 text-[12px] font-medium text-[var(--color-fg-muted)] transition-colors hover:bg-white/[0.03]"
          >
            Batal
          </button>
          <button
            onClick={(e) => {
              const form = (e.currentTarget.closest(".relative") as HTMLElement)?.querySelector("form");
              if (form) form.requestSubmit();
            }}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-xl bg-[var(--color-accent)] px-4 py-2 text-[12px] font-semibold text-[var(--color-accent-fg)] transition-all duration-[var(--dur-standard)] hover:brightness-110 disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[var(--color-accent-fg)]/30 border-t-[var(--color-accent-fg)]" />
                Menyimpan...
              </>
            ) : (
              <>
                <span
                  className="material-symbols-outlined text-[14px]"
                  style={{
                    fontVariationSettings:
                      '"FILL" 0, "wght" 400, "GRAD" 0, "opsz" 20',
                  }}
                >
                  {isEditing ? "save" : "add"}
                </span>
                {isEditing ? "Simpan Perubahan" : "Buat Artikel"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════════════════
   DELETE / ARCHIVE CONFIRM MODAL
   ═════════════════════════════════════════════════════════════════════════ */

interface DeleteConfirmModalProps {
  title: string;
  message: string;
  confirmLabel: string;
  variant?: "delete" | "archive" | "restore";
  onConfirm: () => Promise<void>;
  onClose: () => void;
}

export function DeleteConfirmModal({
  title,
  message,
  confirmLabel,
  variant = "delete",
  onConfirm,
  onClose,
}: DeleteConfirmModalProps) {
  const [busy, setBusy] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const btnColor =
    variant === "delete"
      ? "bg-red-500 hover:bg-red-400"
      : variant === "restore"
        ? "bg-[var(--color-accent)] hover:brightness-110"
        : "bg-[var(--color-amber)] hover:brightness-110 text-black";

  const iconMap: Record<string, string> = {
    delete: "delete",
    archive: "archive",
    restore: "unarchive",
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="mx-4 w-full max-w-[420px] rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-6">
        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
          <span
            className="material-symbols-outlined text-[20px] text-red-400"
            style={{
              fontVariationSettings:
                '"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20',
            }}
          >
            {iconMap[variant]}
          </span>
        </div>
        <h3 className="studio-display text-[16px] text-[var(--color-fg)]">
          {title}
        </h3>
        <p className="mt-2 text-[13px] leading-relaxed text-[var(--color-fg-muted)]">
          {message}
        </p>
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-xl border border-[var(--color-line)] px-4 py-2 text-[12px] font-medium text-[var(--color-fg-muted)] transition-colors hover:bg-white/[0.03]"
          >
            Batal
          </button>
          <button
            onClick={async () => {
              setBusy(true);
              try {
                await onConfirm();
              } finally {
                setBusy(false);
              }
            }}
            disabled={busy}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-[12px] font-semibold text-white transition-all disabled:opacity-50 ${btnColor}`}
          >
            {busy ? (
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : null}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
