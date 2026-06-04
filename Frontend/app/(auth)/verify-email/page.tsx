"use client";

import { useState, useEffect, type FormEvent, Suspense } from "react";
import { verifyEmail, resendVerification } from "@/lib/auth";
import { ApiException } from "@/lib/api";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

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

/* ═══════════════════ Verify Email Content ═══════════════════ */

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [status, setStatus] = useState<"idle" | "verifying" | "success" | "error">(
    token && email ? "verifying" : "idle",
  );
  const [message, setMessage] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  useEffect(() => {
    if (!token || !email) return;

    async function doVerify() {
      try {
        const res = await verifyEmail(token!, email!);
        setMessage(res.message);
        setStatus("success");
      } catch (error) {
        if (error instanceof ApiException) {
          setMessage(error.message);
        } else {
          setMessage("Terjadi kesalahan saat verifikasi.");
        }
        setStatus("error");
      }
    }

    doVerify();
  }, [token, email]);

  async function handleResend(e: FormEvent) {
    e.preventDefault();
    setResendLoading(true);
    setResendMessage("");

    try {
      const res = await resendVerification();
      setResendMessage(res.message);
    } catch (error) {
      if (error instanceof ApiException) {
        setResendMessage(error.message);
      } else {
        setResendMessage("Gagal mengirim ulang email verifikasi.");
      }
    } finally {
      setResendLoading(false);
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

      {/* ═══════════════════ Card ═══════════════════ */}
      <div className="w-full max-w-[420px]">
        {/* ── Logo + brand ── */}
        <Link
          href="/"
          className="flex items-center justify-center gap-3 mb-10"
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
          className="rounded-2xl border p-8 md:p-10 text-center"
          style={{
            background: "rgba(10,10,10,0.8)",
            borderColor: "rgba(255,255,255,0.06)",
            backdropFilter: "blur(20px)",
            boxShadow:
              "0 0 0 1px rgba(255,116,0,0.03), 0 25px 50px -12px rgba(0,0,0,0.6)",
          }}
        >
          {/* Icon */}
          <div
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-full mb-6"
            style={{ background: "rgba(255,116,0,0.08)" }}
          >
            <span
              className="material-symbols-outlined text-[28px]"
              style={{ color: "rgba(255,116,0,0.8)" }}
            >
              mail
            </span>
          </div>

          {/* Eyebrow */}
          <div className="flex items-center justify-center gap-2 mb-4">
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
              Email Verification
            </span>
          </div>

          <h1
            className="text-[clamp(28px,4vw,36px)] font-semibold tracking-tight"
            style={{
              fontFamily: '"Satoshi", sans-serif',
              color: "rgba(255,255,255,0.95)",
            }}
          >
            Verifikasi{" "}
            <span
              style={{
                fontFamily: '"Instrument Serif", serif',
                fontStyle: "italic",
                color: "rgba(255,116,0,1)",
              }}
            >
              Email
            </span>
          </h1>

          {status === "verifying" && (
            <div className="mt-6 flex flex-col items-center gap-3">
              <span
                className="material-symbols-outlined text-[20px]"
                style={{ animation: "spin 1s linear infinite", color: "rgba(255,116,0,0.6)" }}
              >
                refresh
              </span>
              <p
                className="text-[14px]"
                style={{ color: "rgba(255,255,255,0.4)" }}
              >
                Memverifikasi email kamu...
              </p>
            </div>
          )}

          {status === "success" && (
            <div className="space-y-6 mt-6">
              <div
                className="rounded-lg border px-4 py-3 text-[13px]"
                style={{
                  background: "rgba(255,116,0,0.06)",
                  borderColor: "rgba(255,116,0,0.2)",
                  color: "rgba(255,116,0,0.9)",
                }}
              >
                {message}
              </div>
              <Link
                href="/login"
                className="group inline-flex items-center gap-2 rounded-lg px-6 py-3 text-[14px] font-semibold transition-all duration-300"
                style={{
                  background: "rgba(255,116,0,1)",
                  color: "#050505",
                  fontFamily: '"Satoshi", sans-serif',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,116,0,0.85)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,116,0,1)";
                }}
              >
                <span>Masuk ke Akun</span>
                <span className="material-symbols-outlined text-[18px] transition-transform duration-300 group-hover:translate-x-0.5">
                  arrow_forward
                </span>
              </Link>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-6 mt-6">
              <div
                className="rounded-lg border px-4 py-3 text-[13px]"
                style={{
                  background: "rgba(239,68,68,0.06)",
                  borderColor: "rgba(239,68,68,0.2)",
                  color: "rgba(239,68,68,0.9)",
                }}
              >
                {message}
              </div>
              <button
                onClick={handleResend}
                disabled={resendLoading}
                className="group w-full rounded-lg px-4 py-3.5 text-[14px] font-semibold transition-all duration-300 flex items-center justify-center gap-2"
                style={{
                  background: resendLoading
                    ? "rgba(255,116,0,0.3)"
                    : "rgba(255,116,0,1)",
                  color: "#050505",
                  fontFamily: '"Satoshi", sans-serif',
                }}
                onMouseEnter={(e) => {
                  if (!resendLoading)
                    e.currentTarget.style.background = "rgba(255,116,0,0.85)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = resendLoading
                    ? "rgba(255,116,0,0.3)"
                    : "rgba(255,116,0,1)";
                }}
              >
                {resendLoading ? (
                  <>
                    <span
                      className="material-symbols-outlined text-[16px]"
                      style={{ animation: "spin 1s linear infinite" }}
                    >
                      refresh
                    </span>
                    <span>Mengirim...</span>
                  </>
                ) : (
                  "Kirim Ulang Email Verifikasi"
                )}
              </button>
            </div>
          )}

          {status === "idle" && (
            <div className="space-y-6 mt-6">
              <p
                className="text-[14px] leading-relaxed"
                style={{ color: "rgba(255,255,255,0.4)" }}
              >
                Kami telah mengirim link verifikasi ke email kamu. Silakan cek
                inbox dan klik link tersebut untuk mengaktifkan akun.
              </p>
              {resendMessage && (
                <div
                  className="rounded-lg border px-4 py-3 text-[13px]"
                  style={{
                    background: "rgba(255,116,0,0.06)",
                    borderColor: "rgba(255,116,0,0.2)",
                    color: "rgba(255,116,0,0.9)",
                  }}
                >
                  {resendMessage}
                </div>
              )}
              <button
                onClick={handleResend}
                disabled={resendLoading}
                className="group w-full rounded-lg px-4 py-3.5 text-[14px] font-semibold transition-all duration-300 flex items-center justify-center gap-2"
                style={{
                  background: resendLoading
                    ? "rgba(255,116,0,0.3)"
                    : "rgba(255,116,0,1)",
                  color: "#050505",
                  fontFamily: '"Satoshi", sans-serif',
                }}
                onMouseEnter={(e) => {
                  if (!resendLoading)
                    e.currentTarget.style.background = "rgba(255,116,0,0.85)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = resendLoading
                    ? "rgba(255,116,0,0.3)"
                    : "rgba(255,116,0,1)";
                }}
              >
                {resendLoading ? (
                  <>
                    <span
                      className="material-symbols-outlined text-[16px]"
                      style={{ animation: "spin 1s linear infinite" }}
                    >
                      refresh
                    </span>
                    <span>Mengirim...</span>
                  </>
                ) : (
                  "Kirim Ulang Email Verifikasi"
                )}
              </button>
            </div>
          )}
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
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div
          className="flex min-h-screen items-center justify-center"
          style={{ background: "#050505" }}
        >
          <div className="flex items-center gap-3">
            <HexLogo size={28} />
            <span
              className="font-mono text-[10px] uppercase tracking-[0.2em]"
              style={{ color: "rgba(255,255,255,0.3)" }}
            >
              Loading...
            </span>
          </div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
