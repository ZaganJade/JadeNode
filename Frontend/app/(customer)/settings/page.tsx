"use client";

import { useState, useEffect } from "react";
import { getProfile, type User } from "@/lib/auth";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { ProfileForm } from "@/features/profile/components/profile-form";

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

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton width="200px" height="28px" />
          <Skeleton width="300px" height="16px" className="mt-2" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton width="120px" height="24px" />
          </CardHeader>
          <CardContent className="space-y-5">
            <Skeleton height="40px" />
            <Skeleton height="40px" />
            <Skeleton height="40px" />
            <Skeleton height="40px" />
            <Skeleton height="40px" />
            <Skeleton width="160px" height="40px" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pengaturan</h1>
          <p className="mt-1 text-sm text-secondary-500">
            Kelola profil dan preferensi akun kamu.
          </p>
        </div>
        <Alert variant="error">{loadError}</Alert>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Pengaturan</h1>
        <p className="mt-1 text-sm text-secondary-500">
          Kelola profil dan preferensi akun kamu.
        </p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-foreground">Profil</h2>
        </CardHeader>
        <CardContent>
          <ProfileForm
            user={user}
            onUpdate={(updatedUser) => setUser(updatedUser)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
