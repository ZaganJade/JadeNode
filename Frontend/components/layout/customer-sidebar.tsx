"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Server,
  Receipt,
  Wallet,
  LifeBuoy,
  Settings,
  FlaskConical,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Orders",
    href: "/orders",
    icon: Receipt,
  },
  {
    label: "Invoice",
    href: "/invoices",
    icon: Receipt,
  },
  {
    label: "Deployments",
    href: "/deployments",
    icon: Server,
  },
  {
    label: "Support",
    href: "/tickets",
    icon: LifeBuoy,
  },
  {
    label: "Pengaturan",
    href: "/settings",
    icon: Settings,
  },
  {
    label: "Beta Access",
    href: "/beta-access",
    icon: FlaskConical,
  },
];

export function CustomerSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-60 flex-col border-r border-surface-glass-border bg-surface-glass backdrop-blur-xl">
      <div className="flex h-16 items-center border-b border-surface-glass-border px-4">
        <Link href="/" className="text-lg font-bold gradient-text">
          JadeNode
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-amber-brand/15 text-amber-brand"
                  : "text-foreground/60 hover:bg-foreground/5 hover:text-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
