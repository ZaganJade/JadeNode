"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface HealthResponse {
  app: string;
  version: string;
  status: string;
  timestamp: string;
}

interface ReadyResponse {
  status: "ready" | "unready";
  checks: {
    database: boolean;
    redis: boolean;
  };
  timestamp: string;
}

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

function StatusDot({ healthy }: { healthy: boolean | null }) {
  if (healthy === null) {
    return (
      <span className="inline-block h-2.5 w-2.5 rounded-full bg-secondary-400" />
    );
  }
  return (
    <span
      className={`inline-block h-2.5 w-2.5 rounded-full ${
        healthy
          ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]"
          : "bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.5)]"
      }`}
    />
  );
}

function StatusLabel({ healthy, label }: { healthy: boolean | null; label: string }) {
  const colorClass =
    healthy === null
      ? "text-secondary-400"
      : healthy
        ? "text-emerald-400"
        : "text-red-400";

  return <span className={`text-sm font-medium ${colorClass}`}>{label}</span>;
}

export default function ApiHealthPage() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [ready, setReady] = useState<ReadyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const [healthRes, readyRes] = await Promise.allSettled([
        fetch(`${BASE_URL}/api/v1/health`, {
          credentials: "include",
          headers: { Accept: "application/json" },
        }),
        fetch(`${BASE_URL}/api/v1/ready`, {
          credentials: "include",
          headers: { Accept: "application/json" },
        }),
      ]);

      if (healthRes.status === "fulfilled" && healthRes.value.ok) {
        setHealth(await healthRes.value.json());
      }
      if (readyRes.status === "fulfilled") {
        const r = readyRes.value;
        if (r.ok || r.status === 503) {
          setReady(await r.json());
        }
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
      setLastRefresh(new Date());
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30_000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-lg space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-xl font-bold text-foreground">
            System Health Monitor
          </h1>
          <p className="mt-1 text-xs text-foreground-muted">
            Status real-time backend JadeNode. Auto-refresh setiap 30 detik.
          </p>
          {lastRefresh && (
            <p className="mt-1 text-2xs text-foreground-dim">
              Terakhir diperbarui:{" "}
              {lastRefresh.toLocaleTimeString("id-ID")}
            </p>
          )}
        </div>

        {/* Application Health */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">
                Application
              </h2>
              {health && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                  <StatusDot healthy={health.status === "healthy"} />
                  Healthy
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading && !health ? (
              <div className="flex items-center justify-center py-6">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
              </div>
            ) : health ? (
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-2xs font-semibold uppercase tracking-wider text-foreground-muted">
                    App
                  </p>
                  <p className="mt-0.5 text-sm font-bold text-foreground">
                    {health.app}
                  </p>
                </div>
                <div>
                  <p className="text-2xs font-semibold uppercase tracking-wider text-foreground-muted">
                    Version
                  </p>
                  <p className="mt-0.5 font-mono text-sm text-foreground">
                    {health.version}
                  </p>
                </div>
                <div>
                  <p className="text-2xs font-semibold uppercase tracking-wider text-foreground-muted">
                    Timestamp
                  </p>
                  <p className="mt-0.5 font-mono text-xs text-foreground-dim">
                    {new Date(health.timestamp).toLocaleString("id-ID")}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-center text-sm text-red-400">
                Tidak dapat terhubung ke backend.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Readiness Checks */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">
                Dependency Checks
              </h2>
              {ready && (
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    ready.status === "ready"
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-red-500/10 text-red-400"
                  }`}
                >
                  <StatusDot healthy={ready.status === "ready"} />
                  {ready.status === "ready" ? "Ready" : "Unready"}
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading && !ready ? (
              <div className="flex items-center justify-center py-6">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
              </div>
            ) : ready ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg border border-surface-glass-border bg-surface-glass px-4 py-3">
                  <span className="text-sm font-medium text-foreground">
                    Database
                  </span>
                  <div className="flex items-center gap-2">
                    <StatusDot healthy={ready.checks.database} />
                    <StatusLabel
                      healthy={ready.checks.database}
                      label={ready.checks.database ? "Connected" : "Down"}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-surface-glass-border bg-surface-glass px-4 py-3">
                  <span className="text-sm font-medium text-foreground">
                    Redis
                  </span>
                  <div className="flex items-center gap-2">
                    <StatusDot healthy={ready.checks.redis} />
                    <StatusLabel
                      healthy={ready.checks.redis}
                      label={ready.checks.redis ? "Connected" : "Down"}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-center text-sm text-red-400">
                Tidak dapat memeriksa status dependency.
              </p>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-2xs text-foreground-dim">
          Auto-refresh aktif — data diperbarui setiap 30 detik.
        </p>
      </div>
    </div>
  );
}
