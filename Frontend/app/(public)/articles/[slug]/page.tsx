"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getArticle, type ArticleData } from "@/lib/articles";
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

export default function PublicArticleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [article, setArticle] = useState<ArticleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await getArticle(slug);
        setArticle(res.data);
      } catch (err) {
        if (err instanceof ApiException && err.status === 404) {
          setError("Artikel tidak ditemukan.");
        } else {
          setError(
            err instanceof ApiException ? err.message : "Gagal memuat artikel.",
          );
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  if (loading) {
    return (
      <main className="studio relative min-h-screen overflow-x-hidden">
        <ScrollRail />
        <StudioNav />
        <div className="flex items-center justify-center py-32">
          <div className="relative h-10 w-10">
            <div className="absolute inset-0 rounded-full border-2 border-line" />
            <div className="absolute inset-0 animate-spin rounded-full border-2 border-t-accent" />
          </div>
        </div>
      </main>
    );
  }

  if (error || !article) {
    return (
      <main className="studio relative min-h-screen overflow-x-hidden">
        <ScrollRail />
        <StudioNav />
        <div className="mx-auto w-full max-w-[1320px] px-6 py-32 text-center">
          <span
            className="material-symbols-outlined text-[56px] text-fg-dim"
            style={{
              fontVariationSettings:
                '"FILL" 0, "wght" 100, "GRAD" 0, "opsz" 56',
            }}
          >
            {error === "Artikel tidak ditemukan." ? "find_in_page" : "cloud_off"}
          </span>
          <h2 className="studio-display mt-4 text-[20px] text-fg">
            {error ?? "Artikel tidak ditemukan"}
          </h2>
          <button
            onClick={() => router.push("/articles")}
            className="mt-6 rounded-xl border border-line px-5 py-2.5 text-[13px] font-medium text-fg-muted transition-colors hover:border-accent/30 hover:text-accent"
          >
            ← Kembali ke Artikel
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="studio relative min-h-screen overflow-x-hidden">
      <ScrollRail />
      <StudioNav />

      <RevealOnScroll>
        <article className="mx-auto w-full max-w-[780px] px-6 py-10">
          {/* Back link */}
          <Link
            href="/articles"
            className="reveal-rise inline-flex items-center gap-1.5 text-[12px] text-fg-dim transition-colors hover:text-accent"
          >
            <span
              className="material-symbols-outlined text-[16px]"
              style={{
                fontVariationSettings:
                  '"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20',
              }}
            >
              arrow_back
            </span>
            Kembali ke Artikel
          </Link>

          {/* Hero */}
          <header className="reveal-rise mt-8">
            {article.category && (
              <span className="studio-eyebrow text-[7px] font-semibold uppercase tracking-wider text-accent">
                {article.category}
              </span>
            )}
            <h1 className="studio-display mt-3 text-[clamp(24px,3.5vw,40px)] leading-[1.15] text-fg">
              {article.title}
            </h1>

            <div className="mt-5 flex flex-wrap items-center gap-4 border-b border-line pb-6">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft">
                  <span
                    className="material-symbols-outlined text-[16px] text-accent"
                    style={{
                      fontVariationSettings:
                        '"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20',
                    }}
                  >
                    person
                  </span>
                </div>
                <div>
                  <p className="text-[12px] font-medium text-fg">
                    {article.author?.name ?? "Unknown"}
                  </p>
                  <p className="text-[10px] text-fg-dim">
                    {formatDate(article.created_at)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-fg-dim">
                <span
                  className="material-symbols-outlined text-[14px]"
                  style={{
                    fontVariationSettings:
                      '"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20',
                  }}
                >
                  schedule
                </span>
                {article.reading_time} menit baca
              </div>
            </div>
          </header>

          {/* Cover image */}
          {article.cover_image && (
            <div className="reveal-rise mt-8 overflow-hidden rounded-2xl border border-line">
              <img
                src={article.cover_image}
                alt={article.title}
                className="w-full object-cover"
              />
            </div>
          )}

          {/* Body content */}
          <div
            className="reveal-rise mt-8 article-body text-[14px] leading-[1.8] text-fg-muted [&_h1]:studio-display [&_h1]:mt-10 [&_h1]:mb-4 [&_h1]:text-[24px] [&_h1]:text-fg [&_h2]:studio-display [&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:text-[20px] [&_h2]:text-fg [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-[16px] [&_h3]:font-semibold [&_h3]:text-fg [&_p]:mb-4 [&_a]:text-accent [&_a]:underline [&_a]:decoration-accent/30 [&_a]:underline-offset-2 [&_a:hover]:decoration-accent [&_ul]:mb-4 [&_ul]:ml-5 [&_ul]:list-disc [&_ol]:mb-4 [&_ol]:ml-5 [&_ol]:list-decimal [&_li]:mb-1.5 [&_blockquote]:my-6 [&_blockquote]:rounded-xl [&_blockquote]:border-l-[3px] [&_blockquote]:border-accent [&_blockquote]:bg-accent-soft [&_blockquote]:py-3 [&_blockquote]:pl-5 [&_blockquote]:pr-4 [&_blockquote]:text-[13px] [&_blockquote]:italic [&_blockquote]:text-fg [&_code]:rounded-md [&_code]:bg-surface-3 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[12px] [&_pre]:my-6 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:border [&_pre]:border-line [&_pre]:bg-surface [&_pre]:p-5 [&_img]:my-6 [&_img]:rounded-xl [&_hr]:my-8 [&_hr]:border-line [&_strong]:font-semibold [&_strong]:text-fg"
            dangerouslySetInnerHTML={{ __html: article.body ?? "" }}
          />

          {/* Bottom nav */}
          <div className="reveal-rise mt-12 border-t border-line pt-6">
            <Link
              href="/articles"
              className="inline-flex items-center gap-1.5 text-[12px] text-fg-dim transition-colors hover:text-accent"
            >
              <span
                className="material-symbols-outlined text-[16px]"
                style={{
                  fontVariationSettings:
                    '"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20',
                }}
              >
                arrow_back
              </span>
              Kembali ke Artikel
            </Link>
          </div>
        </article>
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
              href="/articles"
              className="text-[13px] text-fg-muted transition-colors hover:text-fg"
            >
              Artikel
            </Link>
            <Link
              href="/marketplace"
              className="text-[13px] text-fg-muted transition-colors hover:text-fg"
            >
              Marketplace
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
