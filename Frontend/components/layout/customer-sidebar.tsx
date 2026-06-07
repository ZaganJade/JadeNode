"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { logout as logoutApi } from "@/lib/auth";

const navSections = [
  {
    label: "Utama",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: "space_dashboard" },
      { label: "Orders", href: "/orders", icon: "shopping_bag" },
      { label: "Deployments", href: "/deployments", icon: "dns" },
    ],
  },
  {
    label: "Keuangan",
    items: [
      { label: "Invoice", href: "/invoices", icon: "receipt_long" },
      { label: "Riwayat Bayar", href: "/transactions", icon: "account_balance_wallet" },
    ],
  },
  {
    label: "Konten",
    items: [
      { label: "Artikel", href: "/articles", icon: "newspaper" },
    ],
  },
  {
    label: "Dukungan",
    items: [
      { label: "Support", href: "/tickets", icon: "support_agent" },
      { label: "Beta Access", href: "/beta-access", icon: "science" },
    ],
  },
];

const bottomNav = [
  { label: "Pengaturan", href: "/settings", icon: "settings" },
];

export function CustomerSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    try {
      await logoutApi();
    } catch {
      // ignore – clear client state anyway
    }
    router.push("/login");
  }

  return (
    <aside className="flex h-full w-64 flex-col border-r border-[var(--color-line)] bg-[var(--color-surface)]">
      {/* Logo / Brand */}
      <div className="flex h-16 items-center gap-2.5 border-b border-[var(--color-line)] px-5">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="relative grid h-7 w-7 place-items-center">
            <span
              className="absolute inset-0 bg-[var(--color-accent)]"
              style={{
                clipPath:
                  "polygon(50% 0, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)",
              }}
            />
            <span className="relative font-mono text-[10px] font-bold text-[var(--color-accent-fg)]">
              JN
            </span>
          </span>
          <div className="flex flex-col">
            <span className="studio-display text-sm font-bold text-[var(--color-fg)]">
              Jade<span className="text-[var(--color-accent)]">Node</span>
            </span>
            <span className="studio-eyebrow text-[8px] text-[var(--color-fg-dim)]">
              Customer Panel
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {navSections.map((section, sIdx) => (
          <div key={section.label} className={sIdx > 0 ? "mt-6" : ""}>
            <p className="mb-2 px-3 studio-eyebrow text-[8px] text-[var(--color-fg-dim)]">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive =
                  item.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "studio-sidebar-link group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-[var(--dur-standard)]",
                      isActive
                        ? "bg-[var(--color-accent-soft)] text-[var(--color-accent)]"
                        : "text-[var(--color-fg-muted)] hover:bg-white/[0.03] hover:text-[var(--color-fg)]",
                    )}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-[var(--color-accent)]" />
                    )}
                    <span
                      className={cn(
                        "material-symbols-outlined text-[18px]",
                        isActive
                          ? "text-[var(--color-accent)]"
                          : "text-[var(--color-fg-dim)] group-hover:text-[var(--color-fg-muted)]",
                      )}
                      style={{ fontVariationSettings: '"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20' }}
                    >
                      {item.icon}
                    </span>
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom nav */}
      <div className="border-t border-[var(--color-line)] px-3 py-3">
        {bottomNav.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-[var(--dur-standard)]",
                isActive
                  ? "bg-[var(--color-accent-soft)] text-[var(--color-accent)]"
                  : "text-[var(--color-fg-muted)] hover:bg-white/[0.03] hover:text-[var(--color-fg)]",
              )}
            >
              <span
                className={cn(
                  "material-symbols-outlined text-[18px]",
                  isActive
                    ? "text-[var(--color-accent)]"
                    : "text-[var(--color-fg-dim)]",
                )}
                style={{ fontVariationSettings: '"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20' }}
              >
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}

        {/* Profile link */}
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-[var(--dur-standard)]",
            pathname === "/settings"
              ? "bg-[var(--color-accent-soft)] text-[var(--color-accent)]"
              : "text-[var(--color-fg-muted)] hover:bg-white/[0.03] hover:text-[var(--color-fg)]",
          )}
        >
          <span
            className={cn(
              "material-symbols-outlined text-[18px]",
              pathname === "/settings"
                ? "text-[var(--color-accent)]"
                : "text-[var(--color-fg-dim)]",
            )}
            style={{ fontVariationSettings: '"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20' }}
          >
            account_circle
          </span>
          Profile
        </Link>

        {/* Logout button */}
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-[var(--color-fg-muted)] transition-all duration-[var(--dur-standard)] hover:bg-red-500/10 hover:text-red-400"
        >
          <span
            className="material-symbols-outlined text-[18px] text-[var(--color-fg-dim)]"
            style={{ fontVariationSettings: '"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20' }}
          >
            logout
          </span>
          Logout
        </button>

        {/* Status */}
        <div className="mt-3 px-3">
          <div className="flex items-center gap-2">
            <span className="pulse-dot h-2 w-2 rounded-full bg-[var(--color-success)]" />
            <span className="studio-eyebrow text-[8px] text-[var(--color-fg-dim)]">
              System Operational
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
