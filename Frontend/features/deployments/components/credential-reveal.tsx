"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";

interface CredentialRevealProps {
  /** The API endpoint to fetch the credential from */
  credentialEndpoint: string;
  /** Label for the credential type */
  label?: string;
  className?: string;
}

export function CredentialReveal({
  credentialEndpoint,
  label = "Password",
  className,
}: CredentialRevealProps) {
  const [revealed, setRevealed] = useState(false);
  const [credential, setCredential] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-hide after 30 seconds
  useEffect(() => {
    if (!revealed || !credential) return;

    setCountdown(30);

    intervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    timerRef.current = setTimeout(() => {
      setRevealed(false);
      setCredential(null);
      setCooldown(true);
      // 60-second cooldown
      setTimeout(() => setCooldown(false), 60_000);
    }, 30_000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [revealed, credential]);

  const handleReveal = useCallback(async () => {
    if (loading || cooldown || revealed) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(credentialEndpoint, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        if (res.status === 429) {
          setError("Terlalu banyak permintaan. Coba lagi dalam beberapa menit.");
          setCooldown(true);
          setTimeout(() => setCooldown(false), 60_000);
          return;
        }
        throw new Error(
          body && "message" in body ? String(body.message) : "Gagal mengambil kredensial.",
        );
      }

      const data = await res.json();
      setCredential(data.credential ?? data.password ?? "");
      setRevealed(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal mengambil kredensial.",
      );
    } finally {
      setLoading(false);
    }
  }, [credentialEndpoint, loading, cooldown, revealed]);

  const handleCopy = useCallback(() => {
    if (!credential) return;
    navigator.clipboard.writeText(credential).catch(() => {});
  }, [credential]);

  const maskedDisplay = "••••••••••••••••";

  return (
    <div
      className={cn(
        "rounded-xl border border-[rgba(255,191,0,0.08)] bg-[rgba(25,20,0,0.4)] p-4 backdrop-blur-[24px]",
        className,
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-[#FFBF00]/60">
          {label}
        </p>
        {revealed && credential && (
          <span className="text-[10px] font-mono text-[#FFBF00]/40">
            Tersembunyi dalam {countdown}s
          </span>
        )}
      </div>

      {/* Credential display */}
      <div className="flex items-center gap-3 rounded-lg border border-[rgba(255,191,0,0.06)] bg-[rgba(13,11,0,0.5)] px-4 py-3">
        <div className="flex-1 min-w-0">
          {revealed && credential ? (
            <p className="font-mono text-sm text-[#F5F5F0] break-all">
              {credential}
            </p>
          ) : (
            <p className="font-mono text-sm text-[#F5F5F0]/25 tracking-widest">
              {maskedDisplay}
            </p>
          )}
        </div>

        {revealed && credential && (
          <button
            type="button"
            onClick={handleCopy}
            className="shrink-0 rounded-md border border-[rgba(255,191,0,0.12)] bg-[rgba(25,20,0,0.6)] px-3 py-1.5 text-[10px] font-medium text-[#F5F5F0]/60 transition-colors hover:border-[rgba(255,191,0,0.3)] hover:text-[#F5F5F0]"
          >
            Copy
          </button>
        )}
      </div>

      {/* Reveal button */}
      {!revealed && (
        <button
          type="button"
          onClick={handleReveal}
          disabled={loading || cooldown}
          className="mt-3 w-full rounded-lg border border-[rgba(255,191,0,0.12)] bg-[rgba(25,20,0,0.6)] px-4 py-2 text-xs font-medium text-[#F5F5F0]/60 transition-colors hover:border-[rgba(255,191,0,0.3)] hover:text-[#F5F5F0] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-[#F5F5F0]/20 border-t-[#FFBF00]" />
              Mengambil...
            </span>
          ) : cooldown ? (
            "Rate limited — coba lagi nanti"
          ) : (
            "Tampilkan Kredensial"
          )}
        </button>
      )}

      {/* Error */}
      {error && (
        <p className="mt-2 text-xs text-[#ffb5ab]">{error}</p>
      )}

      {/* Warning */}
      <p className="mt-3 text-[10px] text-[#F5F5F0]/25">
        ⚠ Kredensial akan tersembunyi otomatis dalam 30 detik. Rate limit: 3x per menit.
      </p>
    </div>
  );
}
