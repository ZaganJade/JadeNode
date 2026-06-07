"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { listArticles, type ArticleData } from "@/lib/articles";
import { ApiException } from "@/lib/api";

function formatDate(d: string) {
  try {
    return new Date(d).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return d;
  }
}

/**
 * Landing page articles section — fetches the 3 latest published articles
 * from the public API and renders them as editorial-style cards.
 */
export function LandingArticles() {
  const [articles, setArticles] = useState<ArticleData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listArticles({ per_page: "3" })
      .then((res) => setArticles(res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Skeleton while loading
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="animate-pulse rounded-2xl border border-line bg-surface/50 p-6"
          >
            <div className="h-40 rounded-xl bg-surface-3" />
            <div className="mt-5 h-4 w-3/4 rounded bg-surface-3" />
            <div className="mt-3 h-3 w-full rounded bg-surface-2" />
            <div className="mt-2 h-3 w-1/2 rounded bg-surface-2" />
            <div className="mt-5 flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-surface-3" />
              <div className="h-3 w-20 rounded bg-surface-2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // No articles yet — show a subtle CTA
  if (articles.length === 0) {
    return (
      <div className="rounded-2xl border border-line bg-surface/30 py-16 text-center">
        <span
          className="material-symbols-outlined text-[36px] text-fg-dim"
          style={{
            fontVariationSettings: '"FILL" 0, "wght" 200, "GRAD" 0, "opsz" 36',
          }}
        >
          newspaper
        </span>
        <p className="mt-3 text-[14px] text-fg-muted">
          Artikel terbaru sedang disiapkan. Nantikan update dari tim kami.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {articles.map((article, idx) => (
        <Link
          key={article.public_id}
          href={`/articles/${article.slug}`}
          className="group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-surface/50 transition-all duration-300 hover:border-line-strong hover:bg-surface"
          style={{ animationDelay: `${idx * 80}ms` }}
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
                  className="material-symbols-outlined text-[44px] text-fg-dim/20"
                  style={{
                    fontVariationSettings:
                      '"FILL" 0, "wght" 100, "GRAD" 0, "opsz" 44',
                  }}
                >
                  newspaper
                </span>
              </div>
            )}
            {/* Category pill */}
            {article.category && (
              <span className="absolute left-3 top-3 rounded-full border border-accent/20 bg-accent-soft px-2.5 py-0.5 studio-eyebrow text-[7px] font-semibold uppercase tracking-wider text-accent">
                {article.category}
              </span>
            )}
            {/* Gradient overlay at bottom */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-surface/80 to-transparent" />
          </div>

          {/* Content */}
          <div className="flex flex-1 flex-col p-6">
            <h3 className="studio-display text-[15px] font-semibold leading-snug text-fg transition-colors group-hover:text-accent">
              {article.title}
            </h3>
            {article.excerpt && (
              <p className="mt-2.5 line-clamp-2 text-[12px] leading-relaxed text-fg-muted">
                {article.excerpt}
              </p>
            )}

            {/* Author + meta */}
            <div className="mt-auto flex items-center gap-3 pt-5">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-soft">
                <span
                  className="material-symbols-outlined text-[14px] text-accent"
                  style={{
                    fontVariationSettings:
                      '"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20',
                  }}
                >
                  person
                </span>
              </div>
              <div>
                <p className="text-[11px] font-medium text-fg">
                  {article.author?.name ?? "Tim JadeNode"}
                </p>
                <div className="flex items-center gap-1.5 text-[9px] text-fg-dim">
                  <span>{formatDate(article.created_at)}</span>
                  <span>·</span>
                  <span>{article.reading_time} min</span>
                </div>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
