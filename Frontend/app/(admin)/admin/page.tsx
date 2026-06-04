"use client";

import Link from "next/link";

const NAV_SECTIONS = [
  {
    title: "Operasional",
    items: [
      { label: "Product Listings", href: "/admin/products", desc: "Kelola harga, ketersediaan, dan SLA listing." },
      { label: "Beta Access", href: "/admin/beta-access", desc: "Review permintaan akses beta customer." },
      { label: "Provisioning Queue", href: "/admin/provisioning", desc: "Kelola tugas provisioning deployment." },
      { label: "Resource Actions", href: "/admin/resource-actions", desc: "Proses aksi start, stop, restart deployment." },
      { label: "Audit Logs", href: "/admin/audit-logs", desc: "Riwayat aksi sensitif di platform." },
    ],
  },
];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="mt-0.5 text-xs text-foreground-muted">
          Ringkasan operasional JadeNode.
        </p>
      </div>

      {/* KPI Cards — Dense operational grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Users", value: "—", sub: "semua role" },
          { label: "Beta Requests", value: "—", sub: "pending review" },
          { label: "Orders", value: "—", sub: "total" },
          { label: "Revenue", value: "—", sub: "gross IDR" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-surface-glass-border bg-surface-glass px-4 py-3"
          >
            <p className="text-2xs font-semibold uppercase tracking-wider text-foreground-muted">
              {stat.label}
            </p>
            <p className="mt-1 text-lg font-bold text-foreground font-mono">
              {stat.value}
            </p>
            <p className="text-2xs text-foreground-dim">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Quick Links */}
      <div className="space-y-3">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title}>
            <h2 className="mb-2 text-2xs font-semibold uppercase tracking-wider text-foreground-muted">
              {section.title}
            </h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group rounded-lg border border-surface-glass-border bg-surface-glass px-4 py-3 transition-colors hover:border-amber-brand/20 hover:bg-surface-elevated"
                >
                  <p className="text-sm font-medium text-foreground group-hover:text-amber-brand transition-colors">
                    {item.label}
                  </p>
                  <p className="text-2xs text-foreground-dim">{item.desc}</p>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="rounded-lg border border-surface-glass-border bg-surface-glass">
        <div className="border-b border-surface-glass-border px-4 py-2">
          <h2 className="text-2xs font-semibold uppercase tracking-wider text-foreground-muted">
            Aktivitas Terbaru
          </h2>
        </div>
        <div className="px-4 py-4">
          <p className="text-xs text-foreground-dim">
            Belum ada aktivitas untuk ditampilkan.
          </p>
        </div>
      </div>
    </div>
  );
}
