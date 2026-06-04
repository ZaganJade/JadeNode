"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Server,
  CreditCard,
  Users,
  LifeBuoy,
  Settings,
  ShieldCheck,
  FlaskConical,
  FileText,
  Cpu,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";

const adminNavSections = [
  {
    label: "Operasional",
    items: [
      {
        label: "Dashboard",
        href: "/admin",
        icon: LayoutDashboard,
      },
      {
        label: "Beta Access",
        href: "/admin/beta-access",
        icon: FlaskConical,
      },
      {
        label: "Providers",
        href: "/admin/providers",
        icon: ShieldCheck,
      },
      {
        label: "Products",
        href: "/admin/products",
        icon: Cpu,
      },
      {
        label: "Users",
        href: "/admin/users",
        icon: Users,
      },
      {
        label: "Payments",
        href: "/admin/payments",
        icon: CreditCard,
      },
      {
        label: "Provisioning",
        href: "/admin/provisioning",
        icon: Wrench,
      },
      {
        label: "Resource Actions",
        href: "/admin/resource-actions",
        icon: Server,
      },
      {
        label: "Support",
        href: "/admin/tickets",
        icon: LifeBuoy,
      },
      {
        label: "Audit Logs",
        href: "/admin/audit-logs",
        icon: FileText,
      },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-56 flex-col border-r border-surface-glass-border bg-surface-glass backdrop-blur-xl">
      <div className="flex h-14 items-center border-b border-surface-glass-border px-4">
        <Link href="/admin" className="text-sm font-bold gradient-text">
          JadeNode Admin
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto p-3">
        {adminNavSections.map((section) => (
          <div key={section.label} className="mb-4">
            <p className="mb-1 px-3 text-2xs font-medium uppercase tracking-wider text-foreground-muted">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md px-3 py-1.5 text-sm transition-colors",
                      isActive
                        ? "bg-amber-brand/15 text-amber-brand font-medium"
                        : "text-foreground/60 hover:bg-foreground/5 hover:text-foreground",
                    )}
                  >
                    <item.icon className="h-3.5 w-3.5" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
