"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { logout as logoutApi } from "@/lib/auth";

const adminNavSections = [
	{
		label: "Operasional",
		items: [
			{ label: "Dashboard", href: "/admin", icon: "dashboard" },
			{ label: "Products", href: "/admin/products", icon: "memory" },
			{ label: "Providers", href: "/admin/providers", icon: "shield" },
			{ label: "Users", href: "/admin/users", icon: "group" },
		],
	},
	{
		label: "Konten",
		items: [
			{ label: "Artikel", href: "/admin/articles", icon: "newspaper" },
			{
				label: "Arsip Artikel",
				href: "/admin/articles/archive",
				icon: "inventory_2",
			},
		],
	},
	{
		label: "Infrastruktur",
		items: [
			{
				label: "Provisioning",
				href: "/admin/provisioning",
				icon: "construction",
			},
			{
				label: "Resource Actions",
				href: "/admin/resource-actions",
				icon: "dns",
			},
			{ label: "Beta Access", href: "/admin/beta-access", icon: "science" },
		],
	},
	{
		label: "Pelaporan",
		items: [
			{ label: "Transaksi", href: "/admin/transactions", icon: "receipt_long" },
			{ label: "Support", href: "/admin/tickets", icon: "support_agent" },
			{ label: "Audit Logs", href: "/admin/audit-logs", icon: "receipt_long" },
		],
	},
];

export function AdminSidebar() {
	const pathname = usePathname();
	const router = useRouter();

	async function handleLogout() {
		try {
			await logoutApi();
		} catch {
			// ignore — clear client state anyway
		}
		router.push("/login");
	}

	return (
		<aside className="flex h-full w-64 flex-col border-r border-[var(--color-line)] bg-[var(--color-surface)]">
			{/* Logo / Brand */}
			<div className="flex h-16 items-center gap-2.5 border-b border-[var(--color-line)] px-5">
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
						Admin Panel
					</span>
				</div>
			</div>

			{/* Navigation */}
			<nav className="flex-1 overflow-y-auto px-3 py-4">
				{adminNavSections.map((section, sIdx) => (
					<div key={section.label} className={sIdx > 0 ? "mt-6" : ""}>
						<p className="mb-2 px-3 studio-eyebrow text-[8px] text-[var(--color-fg-dim)]">
							{section.label}
						</p>
						<div className="space-y-0.5">
							{section.items.map((item) => {
								const isActive =
									item.href === "/admin"
										? pathname === "/admin"
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
										{/* Active indicator bar */}
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
											style={{
												fontVariationSettings:
													'"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20',
											}}
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

			{/* Profile & Logout */}
			<div className="border-t border-[var(--color-line)] px-3 py-3">
				<Link
					href="/admin/profile"
					className={cn(
						"studio-sidebar-link group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-[var(--dur-standard)]",
						pathname === "/admin/profile"
							? "bg-[var(--color-accent-soft)] text-[var(--color-accent)]"
							: "text-[var(--color-fg-muted)] hover:bg-white/[0.03] hover:text-[var(--color-fg)]",
					)}
				>
					{pathname === "/admin/profile" && (
						<span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-[var(--color-accent)]" />
					)}
					<span
						className={cn(
							"material-symbols-outlined text-[18px]",
							pathname === "/admin/profile"
								? "text-[var(--color-accent)]"
								: "text-[var(--color-fg-dim)] group-hover:text-[var(--color-fg-muted)]",
						)}
						style={{
							fontVariationSettings:
								'"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20',
						}}
					>
						account_circle
					</span>
					Profile
				</Link>

				<button
					onClick={handleLogout}
					className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-[var(--color-fg-muted)] transition-all duration-[var(--dur-standard)] hover:bg-red-500/10 hover:text-red-400"
				>
					<span
						className="material-symbols-outlined text-[18px] text-[var(--color-fg-dim)] group-hover:text-red-400"
						style={{
							fontVariationSettings:
								'"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20',
						}}
					>
						logout
					</span>
					Logout
				</button>
			</div>
		</aside>
	);
}
