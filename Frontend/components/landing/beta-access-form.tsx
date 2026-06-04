"use client";

import { useState } from "react";

type Status = "idle" | "submitting" | "success" | "error";

/**
 * Beta Access form with a 3-state machine. Submit is fully client-side here
 * (the real hookup is a future story). Errors and success are rendered as
 * proper status regions for screen-reader feedback.
 */
export function BetaAccessForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [reason, setReason] = useState("");

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!reason.trim()) {
      setStatus("error");
      return;
    }
    setStatus("submitting");
    window.setTimeout(() => setStatus("success"), 1200);
  };

  if (status === "success") {
    return (
      <div className="rounded-lg border border-accent/40 bg-accent-soft p-6 text-fg">
        <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-accent">
          <span className="material-symbols-outlined text-[16px]">check_circle</span>
          Beta access request received
        </div>
        <p className="mt-3 font-sans text-[14px] leading-relaxed text-fg-muted">
          Tim Operasional kami akan memverifikasi permintaan Anda dalam{" "}
          <span className="text-fg">2 hari kerja</span>. Setelah disetujui,
          Anda dapat membuat Order pertama. Status akan dikirim ke email Anda.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nama" placeholder="Nama lengkap" name="name" required />
        <Field
          label="Email kerja"
          placeholder="kamu@perusahaan.id"
          type="email"
          name="email"
          required
        />
      </div>
      <Field label="Organisasi" placeholder="Tim atau perusahaan" name="org" />

      <label className="block">
        <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.2em] text-fg-muted">
          Use case
        </span>
        <textarea
          rows={3}
          required
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Apa yang ingin Anda jalankan di JadeNode?"
          className="w-full rounded-md border border-line bg-surface px-3 py-2.5 font-sans text-[14px] text-fg placeholder:text-fg-dim focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
        />
      </label>

      {status === "error" && (
        <div
          role="alert"
          className="rounded-md border border-magenta/40 bg-magenta-soft px-3 py-2 font-sans text-[12px] text-magenta"
        >
          Mohon isi use case sebelum mengirim.
        </div>
      )}

      <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-mono text-[11px] text-fg-muted">
          Dengan mengirim form, Anda setuju dengan{" "}
          <a href="#" className="text-fg underline-offset-4 hover:underline">
            Ketentuan Layanan
          </a>
          .
        </p>
        <button
          type="submit"
          disabled={status === "submitting"}
          className="group relative inline-flex items-center justify-center gap-1.5 overflow-hidden rounded-md bg-accent px-5 py-2.5 font-sans text-[13px] font-semibold text-accent-fg transition-transform duration-[180ms] hover:-translate-y-0.5 disabled:opacity-60"
        >
          <span className="relative z-10">
            {status === "submitting" ? "Mengirim..." : "Ajukan Beta Access"}
          </span>
          {status !== "submitting" && (
            <span className="material-symbols-outlined relative z-10 text-[16px]">
              arrow_forward
            </span>
          )}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  placeholder,
  type = "text",
  name,
  required,
}: {
  label: string;
  placeholder: string;
  type?: string;
  name: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.2em] text-fg-muted">
        {label}
      </span>
      <input
        type={type}
        name={name}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-md border border-line bg-surface px-3 py-2.5 font-sans text-[14px] text-fg placeholder:text-fg-dim focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
      />
    </label>
  );
}
