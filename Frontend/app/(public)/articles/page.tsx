"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  listArticles,
  getArticleCategories,
  type ArticleData,
  type ArticleListResponse,
} from "@/lib/articles";
import { ApiException } from "@/lib/api";
import { RevealOnScroll } from "@/components/landing/reveal-on-scroll";
import { StudioNav } from "@/components/landing/studio/studio-nav";
import { ScrollRail } from "@/components/landing/studio/scroll-rail";

function formatDate(d: string) {
  try {
    return new Date(d).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return d;
  }
}

export default function PublicArticlesPage() {
  const [data, setData] = useState<ArticleListResponse | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("");

  const fetchArticles = useCallback(
    async (page?: number) => {
      setLoading(true);
      setError("");
      try {
        const params: Record<string, string> = {};
        if (page) params.page = String(page);
        if (searchQuery) params.search = searchQuery;
        if (activeCategory) params.category = activeCategory;
        setData(await listArticles(params));
      } catch (err) {
        setError(
          err instanceof ApiException ? err.message : "Gagal memuat artikel.",
        );
      } finally {
        setLoading(false);
      }
    },
    [searchQuery, activeCategory],
  );

  useEffect(() => {
    getArticleCategories()
      .then((res) => setCategories(res.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  return (
    <main className="studio relative min-h-screen overflow-x-hidden">
      <ScrollRail />
      <StudioNav />

      {/* Hero */}
      <section className="border-b border-line/60">
        <div className="mx-auto w-full max-w-[1320px] px-6 pt-28 pb-12">
          <div className="flex items-center gap-3">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
            </span>
            <p className="studio-eyebrow text-accent">Knowledge Base</p>
          </div>
          <h1 className="studio-hero-title mt-5 text-[clamp(40px,7vw,72px)] text-fg">
            Artikel
          </h1>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-fg-muted">
            Panduan, tutorial, pengumuman, dan insight infrastruktur dari tim
            JadeNode.
          </p>
        </div>
      </section>

      <RevealOnScroll>
        <div className="mx-auto w-full max-w-[1320px] px-6 py-10">
          {/* Search & Filters */}
          <section className="reveal-rise mb-8 flex flex-wrap items-end gap-3 rounded-2xl border border-line bg-surface/50 p-4">
            <div className="min-w-[200px] flex-1">
              <label className="studio-eyebrow mb-1.5 block text-[7px] text-fg-dim">
                Cari Artikel
              </label>
              <div className="relative">
                <span
                  className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[16px] text-fg-dim"
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
                  placeholder="Judul atau konten..."
                  className="block w-full rounded-lg border border-line bg-bg py-2 pl-9 pr-3 text-[13px] text-fg placeholder:text-fg-dim focus:border-accent/40 focus:outline-none"
                />
              </div>
            </div>
            <div className="w-44">
              <label className="studio-eyebrow mb-1.5 block text-[7px] text-fg-dim">
                Kategori
              </label>
              <select
                value={activeCategory}
                onChange={(e) => setActiveCategory(e.target.value)}
                className="block w-full rounded-lg border border-line bg-bg px-2.5 py-2 text-[13px] text-fg focus:border-accent/40 focus:outline-none"
              >
                <option value="">Semua Kategori</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            {data && (
              <span className="ml-auto font-mono text-[11px] text-fg-dim">
                {data.meta.total} artikel
              </span>
            )}
          </section>

          {error && (
            <div className="reveal-rise mb-6 flex items-center gap-2 rounded-2xl border border-error/20 bg-error/5 px-5 py-3">
              <span
                className="material-symbols-outlined text-[18px] text-error"
                style={{ fontVariationSettings: '"FILL" 0, "wght" 300' }}
              >
                error
              </span>
              <p className="text-[13px] text-error">{error}</p>
            </div>
          )}

          {/* Article Grid */}
          {loading && !data ? (
            <div className="flex items-center justify-center py-20">
              <div className="relative h-10 w-10">
                <div className="absolute inset-0 rounded-full border-2 border-line" />
                <div className="absolute inset-0 animate-spin rounded-full border-2 border-t-accent" />
              </div>
            </div>
          ) : data && data.data.length > 0 ? (
            <>
              <div className="reveal-rise grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {data.data.map((article) => (
                  <ArticleCard key={article.public_id} article={article} />
                ))}
              </div>

              {data.meta.last_page > 1 && (
                <div className="reveal-rise mt-8 flex items-center justify-between rounded-2xl border border-line bg-surface/50 px-5 py-3">
                  <button
                    disabled={data.meta.current_page <= 1}
                    onClick={() => fetchArticles(data.meta.current_page - 1)}
                    className="rounded-lg border border-line px-3 py-1.5 text-[11px] font-medium text-fg-muted transition-colors hover:border-accent/30 hover:text-accent disabled:opacity-50"
                  >
                    Sebelumnya
                  </button>
                  <span className="studio-eyebrow text-[8px] text-fg-dim">
                    Halaman {data.meta.current_page} dari {data.meta.last_page}
                  </span>
                  <button
                    disabled={data.meta.current_page >= data.meta.last_page}
                    onClick={() => fetchArticles(data.meta.current_page + 1)}
                    className="rounded-lg border border-line px-3 py-1.5 text-[11px] font-medium text-fg-muted transition-colors hover:border-accent/30 hover:text-accent disabled:opacity-50"
                  >
                    Berikutnya
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="reveal-rise rounded-2xl border border-line bg-surface/50 py-16 text-center">
              <span
                className="material-symbols-outlined text-[40px] text-fg-dim"
                style={{
                  fontVariationSettings:
                    '"FILL" 0, "wght" 200, "GRAD" 0, "opsz" 40',
                }}
              >
                article
              </span>
              <p className="mt-3 text-[14px] text-fg-muted">
                Belum ada artikel yang dipublikasikan.
              </p>
            </div>
          )}
        </div>
      </RevealOnScroll>

      {/* Footer */}
      <footer className="border-t border-line/70 px-6 py-10">
        <div className="mx-auto flex max-w-[1320px] items-center justify-between">
          <span className="studio-eyebrow text-[10px] text-fg-dim">
            © 2026 JadeNode Marketplace
          </span>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-[13px] text-fg-muted transition-colors hover:text-fg"
            >
              Beranda
            </Link>
            <Link
              href="/marketplace"
              className="text-[13px] text-fg-muted transition-colors hover:text-fg"
            >
              Marketplace
            </Link>
            <Link
              href="/layanan"
              className="text-[13px] text-fg-muted transition-colors hover:text-fg"
            >
              Layanan
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

function ArticleCard({ article }: { article: ArticleData }) {
  return (
    <Link
      href={`/articles/${article.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-surface/70 transition-all duration-[var(--dur-standard)] hover:border-line-strong hover:bg-surface"
    >
      {/* Cover image */}
      <div className="relative h-44 overflow-hidden bg-surface-2">
        {article.cover_image ? (
          <img
            src={article.cover_image}
            alt={article.title}
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span
              className="material-symbols-outlined text-[48px] text-fg-dim/30"
              style={{
                fontVariationSettings:
                  '"FILL" 0, "wght" 100, "GRAD" 0, "opsz" 48',
              }}
            >
              newspaper
            </span>
          </div>
        )}
        {article.category && (
          <span className="absolute left-3 top-3 rounded-full border border-accent/20 bg-accent-soft px-2.5 py-0.5 studio-eyebrow text-[7px] font-semibold uppercase tracking-wider text-accent">
            {article.category}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="studio-display text-[15px] font-semibold leading-snug text-fg transition-colors group-hover:text-accent">
          {article.title}
        </h3>
        {article.excerpt && (
          <p className="mt-2 line-clamp-2 text-[12px] leading-relaxed text-fg-muted">
            {article.excerpt}
          </p>
        )}
        <div className="mt-auto flex items-center gap-3 pt-4">
          <div className="flex items-center gap-1.5 text-[10px] text-fg-dim">
            <span
              className="material-symbols-outlined text-[14px]"
              style={{
                fontVariationSettings:
                  '"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20',
              }}
            >
              person
            </span>
            {article.author?.name ?? "Unknown"}
          </div>
          <span className="text-[10px] text-fg-dim">·</span>
          <div className="flex items-center gap-1.5 text-[10px] text-fg-dim">
            <span
              className="material-symbols-outlined text-[14px]"
              style={{
                fontVariationSettings:
                  '"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20',
              }}
            >
              schedule
            </span>
            {article.reading_time} min
          </div>
          <span className="text-[10px] text-fg-dim">·</span>
          <span className="text-[10px] text-fg-dim">
            {formatDate(article.created_at)}
          </span>
        </div>
      </div>
    </Link>
  );
}
