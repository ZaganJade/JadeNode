"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, ApiException } from "@/lib/api";
import { RevealOnScroll } from "@/components/landing/reveal-on-scroll";

// ─── Types ──────────────────────────────────────────────────────────────────

type TicketPriority = "low" | "medium" | "high" | "urgent";

interface TicketResponse {
  message: string;
  ticket: {
    public_id: string;
  };
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function NewTicketPage() {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [priority, setPriority] = useState<TicketPriority>("medium");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string[]>
  >({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setValidationErrors({});
    setSubmitting(true);

    try {
      const data = await api.post<TicketResponse>("/api/v1/tickets", {
        subject,
        priority,
        message,
      });

      router.push(`/tickets/${data.ticket.public_id}`);
    } catch (err) {
      if (err instanceof ApiException && err.status === 422) {
        const detail = err.detail as { errors?: Record<string, string[]> };
        setValidationErrors(detail?.errors ?? {});
      } else {
        setError(
          err instanceof ApiException
            ? err.message
            : "Gagal membuat tiket.",
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  const priorityOptions: { value: TicketPriority; label: string; desc: string }[] = [
    { value: "low", label: "Low", desc: "Pertanyaan umum" },
    { value: "medium", label: "Medium", desc: "Masalah standar" },
    { value: "high", label: "High", desc: "Masalah penting" },
    { value: "urgent", label: "Urgent", desc: "Masalah kritis" },
  ];

  return (
    <RevealOnScroll>
      <div className="mx-auto w-full max-w-[1040px] px-6 py-10">
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/tickets"
        className="inline-flex items-center gap-1 text-sm text-[var(--color-accent)]/60 transition-colors hover:text-[var(--color-accent)]"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
          />
        </svg>
        Kembali ke Support
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-[32px] font-bold leading-none tracking-tight text-[var(--color-fg)]">Buat Tiket Baru</h1>
        <p className="mt-2 text-sm text-[var(--color-fg-muted)]">
          Jelaskan masalah Anda dan tim kami akan segera membantu.
        </p>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface-2)] p-6 backdrop-blur-[24px]"
      >
        <div className="space-y-6">
          {/* Error */}
          {error && (
            <div className="rounded-xl border border-[var(--color-error)]/20 bg-[var(--color-error)]/[0.05] px-4 py-3 text-sm text-[var(--color-error)]">
              {error}
            </div>
          )}

          {/* Subject */}
          <div className="space-y-2">
            <label
              htmlFor="subject"
              className="block font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--color-accent)]/60"
            >
              Subjek
            </label>
            <input
              id="subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Contoh: VPS tidak bisa diakses"
              maxLength={255}
              className="block w-full rounded-xl border border-[var(--color-accent-soft)] bg-[var(--color-surface-2)] px-4 py-3 text-sm text-[var(--color-fg)] placeholder-[var(--color-fg)]/30 transition-colors focus:border-[var(--color-accent)]/30 focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]/20"
            />
            {validationErrors.subject && (
              <p className="text-xs text-[var(--color-error)]">
                {validationErrors.subject[0]}
              </p>
            )}
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <label className="block font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--color-accent)]/60">
              Prioritas
            </label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {priorityOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPriority(opt.value)}
                  className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                    priority === opt.value
                      ? "border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                      : "border-[var(--color-line)] bg-[rgba(25,20,0,0.3)] text-[var(--color-fg-muted)] hover:border-[var(--color-accent-soft)]"
                  }`}
                >
                  <span className="block text-sm font-medium">{opt.label}</span>
                  <span className="block text-[10px] opacity-60">
                    {opt.desc}
                  </span>
                </button>
              ))}
            </div>
            {validationErrors.priority && (
              <p className="text-xs text-[var(--color-error)]">
                {validationErrors.priority[0]}
              </p>
            )}
          </div>

          {/* Message */}
          <div className="space-y-2">
            <label
              htmlFor="message"
              className="block font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--color-accent)]/60"
            >
              Pesan
            </label>
            <textarea
              id="message"
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Jelaskan masalah Anda secara detail..."
              className="block w-full rounded-xl border border-[var(--color-accent-soft)] bg-[var(--color-surface-2)] px-4 py-3 text-sm text-[var(--color-fg)] placeholder-[var(--color-fg)]/30 transition-colors focus:border-[var(--color-accent)]/30 focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]/20"
            />
            {validationErrors.message && (
              <p className="text-xs text-[var(--color-error)]">
                {validationErrors.message[0]}
              </p>
            )}
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3">
            <Link
              href="/tickets"
              className="rounded-full border border-[var(--color-line)] bg-[var(--color-surface-2)] px-6 py-2.5 text-sm font-medium text-[var(--color-fg-muted)] transition-colors hover:border-[var(--color-accent)]/30 hover:text-[var(--color-fg)]"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={submitting || !subject.trim() || !message.trim()}
              className="inline-flex items-center rounded-full bg-[var(--color-accent)] px-6 py-2.5 text-sm font-semibold text-[#0D0B00] shadow-[0_0_20px_var(--color-accent-soft)] transition-all hover:shadow-[0_0_30px_rgba(198,242,74,0.4)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-[#0D0B00]/20 border-t-[#0D0B00]" />
                  Mengirim...
                </>
              ) : (
                "Kirim Tiket"
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
      </div>
    </RevealOnScroll>
    );
}
