"use client";

import { useState, type FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import Link from "next/link";
import { login as loginApi } from "@/lib/auth";
import { ApiException } from "@/lib/api";

interface LoginFormProps {
  onSuccess?: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [generalError, setGeneralError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors({});
    setGeneralError("");
    setLoading(true);

    try {
      await loginApi(form.email, form.password);
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
          <h1 className="text-2xl font-bold text-foreground">Masuk</h1>
          <p className="mt-2 text-sm text-secondary-500">
            Masuk ke akun JadeNode kamu
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {generalError && <Alert variant="error">{generalError}</Alert>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="email"
              type="email"
              label="Email"
              placeholder="nama@contoh.com"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              error={errors.email?.[0]}
            />
            <Input
              id="password"
              type="password"
              label="Password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => updateField("password", e.target.value)}
              error={errors.password?.[0]}
            />
            <Button type="submit" loading={loading} className="w-full">
              {loading ? "Memproses..." : "Masuk"}
            </Button>
          </form>

          <p className="text-center text-sm text-secondary-500">
            Belum punya akun?{" "}
            <Link
              href="/register"
              className="font-medium text-primary-600 hover:text-primary-700"
            >
              Daftar
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
