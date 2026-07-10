"use client";

import { useState, useEffect } from "react";
import { getProfile, type User } from "@/lib/auth";
import { Alert } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { ProfileForm } from "@/features/profile/components/profile-form";
import { RevealOnScroll } from "@/components/landing/reveal-on-scroll";

export default function CustomerSettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await getProfile();
        setUser(res.user);
      } catch {
        setLoadError(
          "Gagal memuat profil. Pastikan kamu sudah masuk dan coba lagi.",
        );
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <RevealOnScroll>
        <div className="mx-auto w-full max-w-[1040px] px-6 py-10">
          <header className="reveal-rise mb-10">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-fg-dim)]">
              JadeNode · Customer
            </p>
            <div className="mt-2 h-9 w-48 animate-pulse rounded bg-[var(--color-surface-3)]" />
          </header>
          <div className="reveal-rise rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)]/50 p-6">
            <div className="mb-5 h-6 w-40 animate-pulse rounded bg-[var(--color-surface-3)]" />
            <div className="space-y-5">
              <Skeleton height="56px" />
              <Skeleton height="56px" />
              <Skeleton height="56px" />
              <Skeleton height="56px" />
              <Skeleton width="160px" height="40px" />
            </div>
          </div>
        </div>
      </RevealOnScroll>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (loadError) {
    return (
      <RevealOnScroll>
        <div className="mx-auto w-full max-w-[1040px] px-6 py-10">
          <header className="reveal-rise mb-10">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-fg-dim)]">
              JadeNode · Customer
            </p>
            <h1 className="mt-2 text-[32px] font-bold leading-none tracking-tight text-[var(--color-fg)]">
              Pengaturan
            </h1>
          </header>
          <Alert variant="error">{loadError}</Alert>
        </div>
      </RevealOnScroll>
    );
  }

  if (!user) return null;

  // ── Main ───────────────────────────────────────────────────────────────────
  return (
    <RevealOnScroll>
      <div className="mx-auto w-full max-w-[1040px] px-6 py-10">
        {/* ────────────────────── HEADER ────────────────────── */}
        <header className="reveal-rise mb-10 flex items-end justify-between gap-6">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-fg-dim)]">
              JadeNode · Customer
            </p>
            <h1 className="mt-2 text-[32px] font-bold leading-none tracking-tight text-[var(--color-fg)]">
              Pengaturan
            </h1>
            <p className="mt-3 text-sm text-[var(--color-fg-muted)]">
              Kelola profil dan preferensi akun kamu.
            </p>
          </div>
          <span className="hidden truncate rounded-full border border-[var(--color-line)] px-3 py-1.5 font-mono text-[10px] text-[var(--color-fg-dim)] sm:block">
            {user.email}
          </span>
        </header>

        {/* ────────────────────── PROFILE CARD ────────────────────── */}
        <section className="reveal-rise overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)]/50">
          <div className="border-b border-[var(--color-line)]/70 px-6 py-5">
            <div className="flex items-center gap-3">
              <span
                className="grid h-9 w-9 place-items-center rounded-full bg-[var(--color-accent-soft)] font-mono text-[11px] font-bold text-[var(--color-accent)]"
                aria-hidden
              >
                {(user.name ?? user.email)[0]?.toUpperCase()}
              </span>
              <div>
                <h2 className="text-base font-semibold text-[var(--color-fg)]">
                  Profil
                </h2>
                <p className="text-xs text-[var(--color-fg-dim)]">
                  Informasi ini tampil di invoice dan tiket dukungan.
                </p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <ProfileForm
              user={user}
              onUpdate={(updatedUser) => setUser(updatedUser)}
            />
          </div>
        </section>
      </div>
    </RevealOnScroll>
  );
}
