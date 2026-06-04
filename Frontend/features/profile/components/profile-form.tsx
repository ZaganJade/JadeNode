"use client";

import { useState, type FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { updateProfile, type User, type UpdateProfileData } from "@/lib/auth";
import { ApiException } from "@/lib/api";

const COUNTRIES = [
  { value: "ID", label: "Indonesia" },
  { value: "SG", label: "Singapore" },
  { value: "MY", label: "Malaysia" },
  { value: "TH", label: "Thailand" },
  { value: "PH", label: "Philippines" },
  { value: "VN", label: "Vietnam" },
  { value: "BN", label: "Brunei" },
  { value: "KH", label: "Cambodia" },
  { value: "LA", label: "Laos" },
  { value: "MM", label: "Myanmar" },
  { value: "TL", label: "Timor-Leste" },
  { value: "AU", label: "Australia" },
  { value: "NZ", label: "New Zealand" },
  { value: "JP", label: "Japan" },
  { value: "KR", label: "South Korea" },
  { value: "CN", label: "China" },
  { value: "IN", label: "India" },
  { value: "US", label: "United States" },
  { value: "GB", label: "United Kingdom" },
  { value: "DE", label: "Germany" },
] as const;

const TIMEZONES = [
  "Asia/Jakarta",
  "Asia/Makassar",
  "Asia/Jayapura",
  "Asia/Singapore",
  "Asia/Kuala_Lumpur",
  "Asia/Bangkok",
  "Asia/Manila",
  "Asia/Ho_Chi_Minh",
  "Asia/Brunei",
  "Asia/Phnom_Penh",
  "Asia/Vientiane",
  "Asia/Rangoon",
  "Asia/Dili",
  "Australia/Sydney",
  "Australia/Melbourne",
  "Australia/Perth",
  "Asia/Tokyo",
  "Asia/Seoul",
  "Asia/Shanghai",
  "Asia/Kolkata",
  "America/New_York",
  "America/Los_Angeles",
  "America/Chicago",
  "Europe/London",
  "Europe/Berlin",
  "UTC",
] as const;

interface ProfileFormProps {
  user: User;
  onUpdate?: (user: User) => void;
}

export function ProfileForm({ user, onUpdate }: ProfileFormProps) {
  const [form, setForm] = useState<UpdateProfileData>({
    name: user.name,
    phone: user.phone,
    country: user.country,
    timezone: user.timezone,
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors({});
    setMessage(null);
    setSaving(true);

    try {
      const res = await updateProfile(form);
      setMessage({ type: "success", text: "Profil berhasil diperbarui." });
      onUpdate?.(res.user);
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
            setMessage({ type: "error", text: error.message });
          }
        } else {
          setMessage({ type: "error", text: error.message });
        }
      } else {
        setMessage({
          type: "error",
          text: "Terjadi kesalahan. Silakan coba lagi.",
        });
      }
    } finally {
      setSaving(false);
    }
  }

  function updateField(field: keyof UpdateProfileData, value: string | null) {
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
    <form onSubmit={handleSubmit} className="space-y-5">
      {message && (
        <Alert variant={message.type === "success" ? "success" : "error"}>
          {message.text}
        </Alert>
      )}

      <Input
        id="profile-name"
        type="text"
        label="Nama Lengkap"
        placeholder="Nama lengkap"
        value={form.name ?? ""}
        onChange={(e) => updateField("name", e.target.value)}
        error={errors.name?.[0]}
      />

      <div className="space-y-1">
        <label
          htmlFor="profile-email"
          className="block text-sm font-medium text-foreground"
        >
          Email
        </label>
        <input
          id="profile-email"
          type="email"
          disabled
          value={user.email}
          className="block w-full max-w-md rounded-lg border border-secondary-200 bg-secondary-50 px-3 py-2 text-sm text-secondary-400"
        />
      </div>

      <Input
        id="profile-phone"
        type="text"
        label="Nomor Telepon"
        placeholder="+62 812 3456 7890"
        value={form.phone ?? ""}
        onChange={(e) => updateField("phone", e.target.value || null)}
        error={errors.phone?.[0]}
      />

      <div className="space-y-1">
        <label
          htmlFor="profile-country"
          className="block text-sm font-medium text-foreground"
        >
          Negara
        </label>
        <select
          id="profile-country"
          value={form.country ?? ""}
          onChange={(e) => updateField("country", e.target.value || null)}
          className="block w-full max-w-md rounded-lg border border-secondary-200 bg-white px-3 py-2 text-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
        >
          <option value="">Pilih negara</option>
          {COUNTRIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        {errors.country && (
          <p className="text-xs text-error-600">{errors.country[0]}</p>
        )}
      </div>

      <div className="space-y-1">
        <label
          htmlFor="profile-timezone"
          className="block text-sm font-medium text-foreground"
        >
          Zona Waktu
        </label>
        <select
          id="profile-timezone"
          value={form.timezone ?? ""}
          onChange={(e) => updateField("timezone", e.target.value || null)}
          className="block w-full max-w-md rounded-lg border border-secondary-200 bg-white px-3 py-2 text-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
        >
          <option value="">Pilih zona waktu</option>
          {TIMEZONES.map((tz) => (
            <option key={tz} value={tz}>
              {tz}
            </option>
          ))}
        </select>
        {errors.timezone && (
          <p className="text-xs text-error-600">{errors.timezone[0]}</p>
        )}
      </div>

      <Button type="submit" loading={saving}>
        {saving ? "Menyimpan..." : "Simpan Perubahan"}
      </Button>
    </form>
  );
}
