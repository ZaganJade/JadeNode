"use client";

import { useState, type FormEvent } from "react";
import { register } from "@/lib/auth";
import { ApiException } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";

/* ═══════════════════ Studio Orange Hex Logo ═══════════════════ */

function HexLogo({ size = 40 }: { size?: number }) {
  return (
    <span
      className="relative grid shrink-0 place-items-center"
      style={{ width: size, height: size }}
    >
      <span
        className="absolute inset-0 rounded-lg"
        style={{ background: "rgba(255,116,0,0.15)" }}
      />
      <span
        className="absolute rounded-md"
        style={{
          inset: 2,
          background: "rgba(0,0,0,0.9)",
          border: "1px solid rgba(255,116,0,0.25)",
        }}
      />
      <span
        className="relative font-mono text-[11px] font-bold"
        style={{
          color: "rgba(255,116,0,0.9)",
          fontFamily: '"JetBrains Mono", monospace',
        }}
      >
        JN
      </span>
    </span>
  );
}

/* ═══════════════════ Studio Input Field ═══════════════════ */

function StudioInput({
  id,
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  error,
  eyebrow,
}: {
  id: string;
  label: string;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  eyebrow?: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <label
          htmlFor={id}
          className="text-[13px] font-medium"
          style={{ fontFamily: '"Satoshi", sans-serif', color: "rgba(255,255,255,0.7)" }}
        >
          {label}
        </label>
        {eyebrow && (
          <span
            className="font-mono text-[9px] uppercase tracking-[0.16em]"
            style={{ color: "rgba(255,255,255,0.2)" }}
          >
            {eyebrow}
          </span>
        )}
      </div>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border px-4 py-3 text-[13px] transition-all duration-300 focus:outline-none"
        style={{
          background: "rgba(255,255,255,0.03)",
          borderColor: error ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.08)",
          color: "rgba(255,255,255,0.9)",
          fontFamily: '"Satoshi", sans-serif',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "rgba(255,116,0,0.5)";
          e.currentTarget.style.boxShadow = "0 0 0 3px rgba(255,116,0,0.08)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = error
            ? "rgba(239,68,68,0.5)"
            : "rgba(255,255,255,0.08)";
          e.currentTarget.style.boxShadow = "none";
        }}
      />
      {error && (
        <p className="mt-2 text-[11px] text-red-400 font-mono">{error}</p>
      )}
    </div>
  );
}

/* ═══════════════════ Register Page ═══════════════════ */

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
  });
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [generalError, setGeneralError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors({});
    setGeneralError("");
    setLoading(true);

    try {
      await register(form);
      router.push("/login?registered=1");
    } catch (error) {
      if (error instanceof ApiException) {
        if (error.status === 422 && typeof error.detail === "object" && error.detail !== null) {
          const detail = error.detail as Record<string, unknown>;
          if ("errors" in detail) {
            setErrors(detail.errors as Record<string, string[]>);
          } else {
            setGeneralError(error.message);
          }
        } else {
          setGeneralError(error.message);
        }
      } else {
        setGeneralError("Terjadi kesalahan. Silakan coba lagi.");
      }
    } finally {
      setLoading(false);
    }
  }

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  return (
    <div className="studio relative min-h-screen flex items-center justify-center px-6">
      {/* ── Ambient backdrop ── */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0" style={{ background: "#050505" }} />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,116,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,116,0,0.04) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        <div
          className="absolute -right-[20%] -top-[10%] h-[600px] w-[600px] rounded-full opacity-[0.07]"
          style={{
            background: "radial-gradient(circle, #ff7400 0%, transparent 70%)",
            filter: "blur(80px)",
          }}
        />
        <div
          className="absolute -bottom-[15%] -left-[10%] h-[500px] w-[500px] rounded-full opacity-[0.05]"
          style={{
            background: "radial-gradient(circle, #ff7400 0%, transparent 70%)",
            filter: "blur(100px)",
          }}
        />
      </div>

      {/* ═══════════════════ Auth Card ═══════════════════ */}
      <div className="w-full max-w-[420px]">
        {/* ── Logo + brand ── */}
        <Link
          href="/"
          className="flex items-center justify-center gap-3 mb-10 group"
        >
          <HexLogo size={36} />
          <div className="flex flex-col">
            <span
              className="text-[18px] font-semibold tracking-tight"
              style={{
                fontFamily: '"Satoshi", sans-serif',
                color: "rgba(255,255,255,0.9)",
              }}
            >
              JadeNode
            </span>
            <span
              className="font-mono text-[8px] uppercase tracking-[0.24em] -mt-0.5"
              style={{ color: "rgba(255,116,0,0.5)" }}
            >
              Infrastructure Platform
            </span>
          </div>
        </Link>

        {/* ── Card ── */}
        <div
          className="rounded-2xl border p-8 md:p-10"
          style={{
            background: "rgba(10,10,10,0.8)",
            borderColor: "rgba(255,255,255,0.06)",
            backdropFilter: "blur(20px)",
            boxShadow:
              "0 0 0 1px rgba(255,116,0,0.03), 0 25px 50px -12px rgba(0,0,0,0.6)",
          }}
        >
          {/* Card header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="relative flex h-2 w-2">
                <span
                  className="absolute inline-flex h-full w-full rounded-full opacity-60"
                  style={{
                    background: "rgba(255,116,0,1)",
                    animation: "ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite",
                  }}
                />
                <span
                  className="relative inline-flex h-2 w-2 rounded-full"
                  style={{ background: "rgba(255,116,0,1)" }}
                />
              </span>
              <span
                className="font-mono text-[9px] uppercase tracking-[0.2em]"
                style={{ color: "rgba(255,116,0,0.6)" }}
              >
                New Account
              </span>
            </div>
            <h1
              className="text-[clamp(28px,4vw,36px)] font-semibold tracking-tight"
              style={{
                fontFamily: '"Satoshi", sans-serif',
                color: "rgba(255,255,255,0.95)",
              }}
            >
              Buat akun{" "}
              <span
                style={{
                  fontFamily: '"Instrument Serif", serif',
                  fontStyle: "italic",
                  color: "rgba(255,116,0,1)",
                }}
              >
                JadeNode
              </span>
            </h1>
            <p
              className="mt-3 text-[14px] leading-relaxed"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              Mulai deploy infrastruktur dalam hitungan menit.
            </p>
          </div>

          {/* Error banner */}
          {generalError && (
            <div
              className="rounded-lg border px-4 py-3 text-[13px] mb-6"
              style={{
                background: "rgba(239,68,68,0.06)",
                borderColor: "rgba(239,68,68,0.2)",
                color: "rgba(239,68,68,0.9)",
              }}
            >
              {generalError}
            </div>
          )}

          {/* ── Form ── */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <StudioInput
              id="name"
              label="Nama Lengkap"
              placeholder="Nama lengkap"
              value={form.name}
              onChange={(v) => updateField("name", v)}
              error={errors.name?.[0]}
            />
            <StudioInput
              id="email"
              label="Email"
              type="email"
              placeholder="nama@contoh.com"
              value={form.email}
              onChange={(v) => updateField("email", v)}
              error={errors.email?.[0]}
              eyebrow="required"
            />
            <StudioInput
              id="password"
              label="Password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(v) => updateField("password", v)}
              error={errors.password?.[0]}
              eyebrow="min. 8 chars"
            />
            <StudioInput
              id="confirm-password"
              label="Konfirmasi Password"
              type="password"
              placeholder="••••••••"
              value={form.password_confirmation}
              onChange={(v) => updateField("password_confirmation", v)}
              error={errors.password_confirmation?.[0]}
              eyebrow="verify"
            />

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full rounded-lg px-4 py-3.5 text-[14px] font-semibold transition-all duration-300 flex items-center justify-center gap-2 overflow-hidden"
              style={{
                background: loading
                  ? "rgba(255,116,0,0.3)"
                  : "rgba(255,116,0,1)",
                color: "#050505",
                fontFamily: '"Satoshi", sans-serif',
              }}
              onMouseEnter={(e) => {
                if (!loading)
                  e.currentTarget.style.background = "rgba(255,116,0,0.85)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = loading
                  ? "rgba(255,116,0,0.3)"
                  : "rgba(255,116,0,1)";
              }}
            >
              {loading ? (
                <>
                  <span
                    className="material-symbols-outlined text-[16px]"
                    style={{ animation: "spin 1s linear infinite" }}
                  >
                    refresh
                  </span>
                  <span>Mendaftar...</span>
                </>
              ) : (
                <>
                  <span>Daftar</span>
                  <span className="material-symbols-outlined text-[18px] transition-transform duration-300 group-hover:translate-x-0.5">
                    arrow_forward
                  </span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div
              className="flex-1 h-px"
              style={{ background: "rgba(255,255,255,0.06)" }}
            />
            <span
              className="font-mono text-[8px] uppercase tracking-[0.2em]"
              style={{ color: "rgba(255,255,255,0.15)" }}
            >
              atau
            </span>
            <div
              className="flex-1 h-px"
              style={{ background: "rgba(255,255,255,0.06)" }}
            />
          </div>

          {/* Login link */}
          <p
            className="text-center text-[13px]"
            style={{ color: "rgba(255,255,255,0.4)" }}
          >
            Sudah punya akun?{" "}
            <Link
              href="/login"
              className="font-medium transition-colors duration-300"
              style={{ color: "rgba(255,116,0,0.8)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "rgba(255,116,0,1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "rgba(255,116,0,0.8)";
              }}
            >
              Masuk
            </Link>
          </p>
        </div>

        {/* ── Footer tagline ── */}
        <div className="mt-8 flex flex-col items-center gap-3">
          <div className="flex items-center gap-2">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: "rgba(255,116,0,0.4)" }}
            />
            <span
              className="font-mono text-[8px] uppercase tracking-[0.24em]"
              style={{ color: "rgba(255,255,255,0.2)" }}
            >
              Built for financial correctness & trust
            </span>
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: "rgba(255,116,0,0.4)" }}
            />
          </div>
          <span
            className="font-mono text-[7px] uppercase tracking-[0.3em]"
            style={{ color: "rgba(255,255,255,0.12)" }}
          >
            HMAC-SHA256 · Idempotency-Key · OpenAPI 3.1
          </span>
        </div>
      </div>
    </div>
  );
}
