"use client";

import { useState, type FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import Link from "next/link";
import { register as registerApi } from "@/lib/auth";
import { ApiException } from "@/lib/api";
import type { RegisterData } from "@/lib/auth";

interface RegisterFormProps {
  onSuccess?: () => void;
}

export function RegisterForm({ onSuccess }: RegisterFormProps) {
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

    // Client-side validation
    if (form.password !== form.password_confirmation) {
      setErrors({
        password_confirmation: ["Konfirmasi password tidak cocok."],
      });
      return;
    }

    if (form.password.length < 8) {
      setErrors({ password: ["Password minimal 8 karakter."] });
      return;
    }

    setErrors({});
    setGeneralError("");
    setLoading(true);

    try {
      await registerApi(form as RegisterData);
      onSuccess?.();
    } catch (error) {
      if (error instanceof ApiException) {
        if (
          error.status === 422 &&
          typeof error.detail === "object" &&
          error.detail !== null
        ) {
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
    <Card className="w-full max-w-sm">
      <CardHeader>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Daftar</h1>
          <p className="mt-2 text-sm text-secondary-500">
            Buat akun JadeNode baru
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {generalError && <Alert variant="error">{generalError}</Alert>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="name"
              type="text"
              label="Nama Lengkap"
              placeholder="Nama lengkap"
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              error={errors.name?.[0]}
            />
            <Input
              id="email"
              type="email"
              label="Email"
              placeholder="nama@contoh.com"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              error={errors.email?.[0]}
            />
            <div>
              <Input
                id="password"
                type="password"
                label="Password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => updateField("password", e.target.value)}
                error={errors.password?.[0]}
              />
              <p className="mt-1 text-xs text-secondary-400">
                Minimal 8 karakter, termasuk huruf besar, huruf kecil, dan
                angka.
              </p>
            </div>
            <Input
              id="confirm-password"
              type="password"
              label="Konfirmasi Password"
              placeholder="••••••••"
              value={form.password_confirmation}
              onChange={(e) =>
                updateField("password_confirmation", e.target.value)
              }
              error={errors.password_confirmation?.[0]}
            />
            <Button type="submit" loading={loading} className="w-full">
              {loading ? "Mendaftar..." : "Daftar"}
            </Button>
          </form>

          <p className="text-center text-sm text-secondary-500">
            Sudah punya akun?{" "}
            <Link
              href="/login"
              className="font-medium text-primary-600 hover:text-primary-700"
            >
              Masuk
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
