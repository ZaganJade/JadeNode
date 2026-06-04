"use client";

import { useState, useEffect } from "react";
import { getSession, type Session } from "@/lib/auth";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import {
  Package,
  Server,
  Ticket,
  Settings,
  LayoutDashboard,
} from "lucide-react";

export default function CustomerDashboardPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSession() {
      try {
        const s = await getSession();
        setSession(s);
      } catch {
        // Not authenticated
      } finally {
        setLoading(false);
      }
    }
    loadSession();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton width="280px" height="32px" />
        <Skeleton width="400px" height="16px" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton height="100px" />
          <Skeleton height="100px" />
          <Skeleton height="100px" />
        </div>
      </div>
    );
  }

  const user = session?.user;
  const firstName = user?.name?.split(" ")[0] ?? "User";
  const isVerified = user?.email_verified_at !== null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Selamat datang, {firstName}! 👋
        </h1>
        <p className="mt-1 text-sm text-secondary-500">
          Berikut ringkasan layanan dan aktivitas akun kamu.
        </p>
      </div>

      {/* Email verification banner */}
      {!isVerified && (
        <Alert variant="warning">
          <div className="flex items-center justify-between">
            <span>
              Email kamu belum diverifikasi. Silakan cek inbox atau{" "}
              <Link
                href="/verify-email"
                className="font-medium underline hover:text-warning-700"
              >
                kirim ulang email verifikasi
              </Link>
              .
            </span>
          </div>
        </Alert>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          {
            label: "Pesanan",
            value: "0",
            icon: Package,
            href: "/dashboard",
          },
          {
            label: "Deployment",
            value: "0",
            icon: Server,
            href: "/dashboard",
          },
          {
            label: "Tiket Dukungan",
            value: "0",
            icon: Ticket,
            href: "/dashboard",
          },
        ].map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="transition-shadow hover:shadow-md">
              <CardContent className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary-50">
                  <stat.icon className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-secondary-500">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {stat.value}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent>
            <div className="flex items-center gap-3">
              <LayoutDashboard className="h-5 w-5 text-primary-600" />
              <div>
                <h3 className="font-semibold text-foreground">Semua Layanan</h3>
                <p className="text-sm text-secondary-500">
                  Lihat dan kelola semua layanan aktif kamu.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Link href="/settings">
          <Card className="transition-shadow hover:shadow-md">
            <CardContent>
              <div className="flex items-center gap-3">
                <Settings className="h-5 w-5 text-primary-600" />
                <div>
                  <h3 className="font-semibold text-foreground">
                    Pengaturan Akun
                  </h3>
                  <p className="text-sm text-secondary-500">
                    Perbarui profil, password, dan preferensi.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Activity Placeholder */}
      <Card>
        <CardContent>
          <h2 className="text-lg font-semibold text-foreground">
            Deployment Terbaru
          </h2>
          <p className="mt-4 text-sm text-secondary-500">
            Belum ada deployment. Mulai dengan memesan product listing pertama
            kamu.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
