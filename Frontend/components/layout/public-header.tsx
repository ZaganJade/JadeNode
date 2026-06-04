"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSession, logout, type Session } from "@/lib/auth";

export function PublicHeader() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const s = await getSession();
        setSession(s);
      } catch {
        setSession(null);
      }
    }
    load();
  }, []);

  async function handleLogout() {
    try {
      await logout();
    } catch {
      // Ignore errors
    }
    setSession(null);
    setMenuOpen(false);
    router.push("/");
  }

  const isAuthenticated = session?.authenticated ?? false;
  const user = session?.user;

  return (
    <header className="sticky top-0 z-40 border-b border-surface-glass-border bg-[#0D0B00]/80 backdrop-blur-xl supports-[backdrop-filter]:bg-[#0D0B00]/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 sm:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold gradient-text">JadeNode</span>
        </Link>

        <nav className="hidden items-center gap-6 sm:flex">
          <Link
            href="/marketplace"
            className="text-sm font-medium text-foreground/60 transition-colors hover:text-foreground"
          >
            Marketplace
          </Link>
          <Link
            href="#"
            className="text-sm font-medium text-foreground/60 transition-colors hover:text-foreground"
          >
            Docs
          </Link>
        </nav>

        {isAuthenticated ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground/70 transition-colors hover:bg-foreground/5"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-brand/15 text-sm font-semibold text-amber-brand">
                {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
              </span>
              <span className="hidden sm:inline">{user?.name?.split(" ")[0]}</span>
              <svg
                className={`h-4 w-4 transition-transform ${menuOpen ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                />
              </svg>
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 z-50 mt-2 w-48 rounded-lg border border-surface-glass-border bg-surface-glass backdrop-blur-xl py-1 shadow-elevated">
                  <Link
                    href="/dashboard"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2 text-sm text-foreground/70 hover:bg-foreground/5 hover:text-foreground"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2 text-sm text-foreground/70 hover:bg-foreground/5 hover:text-foreground"
                  >
                    Pengaturan
                  </Link>
                  <hr className="my-1 border-surface-glass-border" />
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="block w-full px-4 py-2 text-left text-sm text-error-400 hover:bg-error-500/10"
                  >
                    Keluar
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-foreground/60 transition-colors hover:text-foreground"
            >
              Masuk
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-gradient-to-r from-amber-brand to-amber-brand-dark px-4 py-2 text-sm font-semibold text-[#0D0B00] transition-all hover:brightness-110"
            >
              Daftar
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
