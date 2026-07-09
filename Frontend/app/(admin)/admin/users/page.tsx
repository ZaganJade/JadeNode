"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RevealOnScroll } from "@/components/landing/reveal-on-scroll";
import { cn } from "@/lib/utils";
import {
	PageHeader,
	StatCard,
	BentoCard,
	DonutChart,
} from "@/components/admin/studio-ui";
import {
	adminListUsers,
	adminSuspendUser,
	adminRestoreUser,
	adminVerifyUserEmail,
	type AdminUserData,
	type AdminUserListResponse,
} from "@/lib/auth";
import { ApiException } from "@/lib/api";
import {
	UserFormModal,
	SuspendConfirmModal,
} from "@/features/admin/components/user-form-modal";

/* ═══════════════════════════════════════════════════════════════════════
   TYPES & CONFIGS
   ═══════════════════════════════════════════════════════════════════════ */

type UserRole = "customer" | "admin" | "provider";

const roleConfig: Record<
	UserRole,
	{ label: string; color: string; bg: string; border: string; icon: string }
> = {
	customer: {
		label: "Customer",
		color: "var(--color-accent)",
		bg: "var(--color-accent-soft)",
		border: "rgba(var(--accent-rgb),0.15)",
		icon: "person",
	},
	admin: {
		label: "Admin",
		color: "var(--color-magenta)",
		bg: "rgba(246,84,158,0.08)",
		border: "rgba(246,84,158,0.15)",
		icon: "admin_panel_settings",
	},
	provider: {
		label: "Provider",
		color: "var(--color-steel)",
		bg: "rgba(122,150,177,0.08)",
		border: "rgba(122,150,177,0.15)",
		icon: "business",
	},
};

const ROLE_DONUT_COLORS: Record<UserRole, string> = {
	customer: "var(--color-accent)",
	provider: "var(--color-steel)",
	admin: "var(--color-magenta)",
};

function Badge({
	label,
	color,
	bg,
	border,
}: {
	label: string;
	color: string;
	bg: string;
	border: string;
}) {
	return (
		<span
			className="rounded-full border px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider"
			style={{ color, backgroundColor: bg, borderColor: border }}
		>
			{label}
		</span>
	);
}

function formatDate(dateStr: string | null): string {
	if (!dateStr) return "—";
	return new Date(dateStr).toLocaleDateString("id-ID", {
		day: "numeric",
		month: "short",
		year: "numeric",
	});
}

/* ═══════════════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════════════ */

export default function AdminUsersPage() {
	const [data, setData] = useState<AdminUserListResponse | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [search, setSearch] = useState("");
	const [filterRole, setFilterRole] = useState("");
	const [filterVerified, setFilterVerified] = useState("");
	const [filterSuspended, setFilterSuspended] = useState("");
	const [expandedId, setExpandedId] = useState<number | null>(null);

	/* ── Create / edit / suspend state ── */
	const [modalOpen, setModalOpen] = useState(false);
	const [modalMode, setModalMode] = useState<"create" | "edit">("create");
	const [editingUser, setEditingUser] = useState<AdminUserData | null>(null);
	const [suspendTarget, setSuspendTarget] = useState<AdminUserData | null>(
		null,
	);
	const [processing, setProcessing] = useState(false);
	const [toast, setToast] = useState("");

	/* ── Data fetching ── */
	const fetchUsers = useCallback(
		async (page?: number) => {
			setLoading(true);
			setError("");
			try {
				const params: Record<string, string> = {};
				if (page) params.page = String(page);
				if (search) params.search = search;
				if (filterRole) params.role = filterRole;
				if (filterVerified) params.verified = filterVerified;
				if (filterSuspended) params.suspended = filterSuspended;
				const result = await adminListUsers(
					Object.keys(params).length > 0 ? params : undefined,
				);
				setData(result);
			} catch (err) {
				setError(
					err instanceof ApiException
						? err.message
						: "Gagal memuat data pengguna.",
				);
			} finally {
				setLoading(false);
			}
		},
		[search, filterRole, filterVerified, filterSuspended],
	);

	useEffect(() => {
		fetchUsers();
	}, [fetchUsers]);

	/* Auto-dismiss success toast */
	useEffect(() => {
		if (!toast) return;
		const t = setTimeout(() => setToast(""), 3200);
		return () => clearTimeout(t);
	}, [toast]);

	function openCreate() {
		setModalMode("create");
		setEditingUser(null);
		setModalOpen(true);
	}

	function openEdit(user: AdminUserData) {
		setModalMode("edit");
		setEditingUser(user);
		setModalOpen(true);
	}

	function handleSaved(message: string) {
		setModalOpen(false);
		setToast(message);
		fetchUsers(data?.meta.current_page);
	}

	async function confirmSuspend() {
		if (!suspendTarget) return;
		setProcessing(true);
		try {
			const res = await adminSuspendUser(suspendTarget.id);
			setToast(res.message || "Pengguna berhasil dinonaktifkan.");
			setSuspendTarget(null);
			fetchUsers(data?.meta.current_page);
		} catch (err) {
			setError(
				err instanceof ApiException
					? err.message
					: "Gagal menonaktifkan pengguna.",
			);
		} finally {
			setProcessing(false);
		}
	}

	async function handleRestore(user: AdminUserData) {
		try {
			const res = await adminRestoreUser(user.id);
			setToast(res.message || "Pengguna berhasil diaktifkan kembali.");
			fetchUsers(data?.meta.current_page);
		} catch (err) {
			setError(
				err instanceof ApiException
					? err.message
					: "Gagal mengaktifkan kembali pengguna.",
			);
		}
	}

	async function handleVerifyEmail(user: AdminUserData) {
		try {
			const res = await adminVerifyUserEmail(user.id);
			setToast(res.message || "Email berhasil diverifikasi.");
			fetchUsers(data?.meta.current_page);
		} catch (err) {
			setError(
				err instanceof ApiException
					? err.message
					: "Gagal memverifikasi email.",
			);
		}
	}

	/* ── Derived stats from loaded data ── */
	const users = data?.data ?? [];
	const total = data?.meta.total ?? 0;

	const stats = useMemo(() => {
		const customerCount = users.filter((u) => u.role === "customer").length;
		const providerCount = users.filter((u) => u.role === "provider").length;
		const adminCount = users.filter((u) => u.role === "admin").length;
		const verified = users.filter((u) => u.email_verified).length;
		const suspended = users.filter((u) => u.suspended).length;

		const roleMix = (["customer", "provider", "admin"] as UserRole[])
			.map((r) => ({
				label: roleConfig[r].label,
				value: users.filter((u) => u.role === r).length,
				color: ROLE_DONUT_COLORS[r],
			}))
			.filter((d) => d.value > 0);

		const verifMix = [
			{ label: "Verified", value: verified, color: "var(--color-success)" },
			{
				label: "Unverified",
				value: users.length - verified,
				color: "var(--color-error)",
			},
		];

		return {
			customerCount,
			providerCount,
			adminCount,
			verified,
			suspended,
			roleMix,
			verifMix,
		};
	}, [users]);

	const inputCls =
		"rounded-lg border border-[var(--color-line)] bg-black/40 px-3 py-2 text-[13px] text-[var(--color-fg)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]/20";

	return (
		<RevealOnScroll>
			<div className="relative mx-auto w-full max-w-[1320px] px-6 py-8">
				{/* Header */}
				<div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
					<PageHeader
						eyebrow="User Management"
						title="Manajemen Pengguna"
						subtitle="Kelola semua pengguna platform — customer, provider, dan admin."
						status={`${total} pengguna · ${stats.customerCount} customer`}
					/>
					<button
						type="button"
						onClick={openCreate}
						className="group inline-flex shrink-0 items-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 py-2.5 text-[13px] font-semibold text-[var(--color-accent-fg)] transition-all hover:brightness-110"
					>
						<span
							className="material-symbols-outlined text-[18px] transition-transform group-hover:rotate-90"
							style={{
								fontVariationSettings:
									'"FILL" 0, "wght" 400, "GRAD" 0, "opsz" 20',
							}}
						>
							person_add
						</span>
						Tambah Pengguna
					</button>
				</div>

				{/* Error */}
				{error && (
					<div className="mb-6 rounded-xl border border-[var(--color-error)]/20 bg-[var(--color-error)]/5 px-4 py-3 text-[13px] text-[var(--color-error)]">
						{error}
					</div>
				)}

				{/* KPI grid */}
				<section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
					<StatCard
						label="Total Users"
						value={total}
						icon="group"
						sub="Semua role"
						compact
						delay={0}
					/>
					<StatCard
						label="Customers"
						value={stats.customerCount}
						icon="person"
						sub="Pengguna aktif"
						accent
						compact
						delay={70}
					/>
					<StatCard
						label="Providers"
						value={stats.providerCount}
						icon="business"
						sub="Mitra infrastruktur"
						compact
						delay={140}
					/>
					<StatCard
						label="Verified"
						value={stats.verified}
						icon="mark_email_read"
						sub="Email terverifikasi"
						compact
						delay={210}
					/>
					<StatCard
						label="Suspended"
						value={stats.suspended}
						icon="block"
						sub="Akun dinonaktifkan"
						compact
						delay={280}
					/>
				</section>

				{/* Bento row: role mix + verification */}
				<section className="mb-8 grid gap-4 lg:grid-cols-3">
					<BentoCard
						eyebrow="Komposisi"
						title="Distribusi Role"
						className="lg:col-span-2"
						delay={0}
					>
						{stats.roleMix.length > 0 ? (
							<DonutChart
								data={stats.roleMix}
								centerValue={String(users.length)}
								centerLabel="Users"
							/>
						) : (
							<p className="py-8 text-center text-[12px] text-[var(--color-fg-muted)]">
								Belum ada data pengguna.
							</p>
						)}
					</BentoCard>

					<BentoCard eyebrow="Trust" title="Verifikasi Email" delay={120}>
						{users.length > 0 ? (
							<DonutChart
								data={stats.verifMix}
								centerValue={`${Math.round((stats.verified / users.length) * 100)}%`}
								centerLabel="Verified"
							/>
						) : (
							<p className="py-8 text-center text-[12px] text-[var(--color-fg-muted)]">
								Belum ada data.
							</p>
						)}
					</BentoCard>
				</section>

				{/* Filter Bar */}
				<div className="reveal-rise mb-6 flex flex-wrap items-end gap-3 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)]/50 p-4">
					<div className="flex-1 min-w-[200px]">
						<label className="mb-1 block studio-eyebrow text-[8px] text-[var(--color-fg-dim)]">
							Cari
						</label>
						<input
							type="text"
							placeholder="Nama atau email..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") fetchUsers();
							}}
							className={cn(inputCls, "w-full")}
						/>
					</div>
					<div className="w-32">
						<label className="mb-1 block studio-eyebrow text-[8px] text-[var(--color-fg-dim)]">
							Role
						</label>
						<select
							value={filterRole}
							onChange={(e) => setFilterRole(e.target.value)}
							className={cn(inputCls, "w-full")}
						>
							<option value="">Semua</option>
							<option value="customer">Customer</option>
							<option value="provider">Provider</option>
							<option value="admin">Admin</option>
						</select>
					</div>
					<div className="w-36">
						<label className="mb-1 block studio-eyebrow text-[8px] text-[var(--color-fg-dim)]">
							Verifikasi
						</label>
						<select
							value={filterVerified}
							onChange={(e) => setFilterVerified(e.target.value)}
							className={cn(inputCls, "w-full")}
						>
							<option value="">Semua</option>
							<option value="1">Verified</option>
							<option value="0">Unverified</option>
						</select>
					</div>
					<div className="w-36">
						<label className="mb-1 block studio-eyebrow text-[8px] text-[var(--color-fg-dim)]">
							Status
						</label>
						<select
							value={filterSuspended}
							onChange={(e) => setFilterSuspended(e.target.value)}
							className={cn(inputCls, "w-full")}
						>
							<option value="">Semua</option>
							<option value="0">Aktif</option>
							<option value="1">Dinonaktifkan</option>
						</select>
					</div>
					<button
						type="button"
						onClick={() => fetchUsers()}
						className="rounded-lg border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 px-4 py-2 text-[13px] font-medium text-[var(--color-accent)] transition-colors hover:bg-[var(--color-accent)]/20"
					>
						Terapkan
					</button>
				</div>

				{/* Loading */}
				{loading && !data ? (
					<div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)]/50 py-20">
						<div className="relative h-10 w-10">
							<div className="absolute inset-0 rounded-full border-2 border-[var(--color-line)]" />
							<div className="absolute inset-0 animate-spin rounded-full border-2 border-t-[var(--color-accent)]" />
						</div>
						<p className="studio-eyebrow mt-4 text-[9px] text-[var(--color-fg-dim)]">
							Memuat data pengguna...
						</p>
					</div>
				) : users.length === 0 ? (
					/* Empty */
					<div className="reveal-rise flex flex-col items-center justify-center rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)]/50 py-16">
						<span
							className="material-symbols-outlined text-[48px] text-[var(--color-fg-dim)]"
							style={{
								fontVariationSettings:
									'"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 40',
							}}
						>
							search_off
						</span>
						<h3 className="studio-display mt-4 text-[20px] text-[var(--color-fg)]">
							Tidak ada pengguna ditemukan
						</h3>
						<p className="mt-1 text-[12px] text-[var(--color-fg-muted)]">
							Coba ubah filter atau kata kunci pencarian.
						</p>
					</div>
				) : (
					/* User List */
					<div className="space-y-3">
						{users.map((user, idx) => {
							const rc =
								roleConfig[(user.role as UserRole) ?? "customer"] ??
								roleConfig.customer;
							const isExpanded = expandedId === user.id;
							return (
								<article
									key={user.id}
									className="studio-card reveal-rise rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)]/50 overflow-hidden"
									style={{ transitionDelay: `${idx * 40}ms` }}
								>
									<div
										className="flex cursor-pointer items-center gap-4 p-5"
										onClick={() => setExpandedId(isExpanded ? null : user.id)}
									>
										{/* Avatar */}
										<div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-[var(--color-line)] bg-black/40">
											<span
												className="material-symbols-outlined text-[22px]"
												style={{
													color: rc.color,
													fontVariationSettings:
														'"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 24',
												}}
											>
												{rc.icon}
											</span>
										</div>

										{/* Info */}
										<div className="flex-1 min-w-0">
											<div className="flex items-center gap-2 flex-wrap">
												<h3
													className={cn(
														"text-[14px] font-semibold truncate",
														user.suspended
															? "text-[var(--color-fg-dim)] line-through"
															: "text-[var(--color-fg)]",
													)}
												>
													{user.name}
												</h3>
												<Badge
													label={rc.label}
													color={rc.color}
													bg={rc.bg}
													border={rc.border}
												/>
												{!user.email_verified && (
													<Badge
														label="Unverified"
														color="var(--color-error)"
														bg="rgba(255,122,122,0.08)"
														border="rgba(255,122,122,0.15)"
													/>
												)}
												{user.suspended && (
													<Badge
														label="Suspended"
														color="var(--color-error)"
														bg="rgba(255,122,122,0.08)"
														border="rgba(255,122,122,0.15)"
													/>
												)}
											</div>
											<div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[var(--color-fg-muted)]">
												<span className="font-mono text-[10px]">
													{user.email}
												</span>
												{user.country && <span>{user.country}</span>}
												<span>Bergabung {formatDate(user.created_at)}</span>
											</div>
										</div>

										<span
											className={cn(
												"material-symbols-outlined text-[18px] text-[var(--color-fg-dim)] transition-transform duration-200",
												isExpanded && "rotate-180",
											)}
											style={{
												fontVariationSettings:
													'"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20',
											}}
										>
											expand_more
										</span>
									</div>

									{/* Expanded Detail */}
									{isExpanded && (
										<div className="border-t border-[var(--color-line)] bg-black/20 px-5 py-5">
											<div className="grid gap-6 lg:grid-cols-3">
												{/* Profile */}
												<div>
													<p className="studio-eyebrow text-[8px] text-[var(--color-fg-dim)] mb-3">
														Profil
													</p>
													<div className="space-y-2 text-[12px]">
														<div className="flex items-center gap-2 text-[var(--color-fg-muted)]">
															<span
																className="material-symbols-outlined text-[14px] text-[var(--color-fg-dim)]"
																style={{
																	fontVariationSettings:
																		'"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20',
																}}
															>
																badge
															</span>
															<span className="font-mono text-[10px]">
																{user.public_id}
															</span>
														</div>
														{user.phone && (
															<div className="flex items-center gap-2 text-[var(--color-fg-muted)]">
																<span
																	className="material-symbols-outlined text-[14px] text-[var(--color-fg-dim)]"
																	style={{
																		fontVariationSettings:
																			'"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20',
																	}}
																>
																	phone
																</span>
																<span className="font-mono text-[10px]">
																	{user.phone}
																</span>
															</div>
														)}
														<div className="flex items-center gap-2 text-[var(--color-fg-muted)]">
															<span
																className="material-symbols-outlined text-[14px] text-[var(--color-fg-dim)]"
																style={{
																	fontVariationSettings:
																		'"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20',
																}}
															>
																schedule
															</span>
															<span>
																Email{" "}
																{user.email_verified
																	? "terverifikasi"
																	: "belum terverifikasi"}
															</span>
														</div>
														{user.suspended_at && (
															<div className="flex items-center gap-2 text-[var(--color-error)]">
																<span
																	className="material-symbols-outlined text-[14px]"
																	style={{
																		fontVariationSettings:
																			'"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20',
																	}}
																>
																	block
																</span>
																<span>
																	Dinonaktifkan {formatDate(user.suspended_at)}
																</span>
															</div>
														)}
													</div>
												</div>

												{/* Role & meta */}
												<div>
													<p className="studio-eyebrow text-[8px] text-[var(--color-fg-dim)] mb-3">
														Meta
													</p>
													<div className="grid grid-cols-2 gap-2">
														<div className="rounded-lg border border-[var(--color-line)]/60 bg-black/30 px-3 py-2">
															<p className="studio-display text-[15px] text-[var(--color-fg)] capitalize">
																{user.role}
															</p>
															<p className="text-[9px] text-[var(--color-fg-dim)]">
																Role
															</p>
														</div>
														<div className="rounded-lg border border-[var(--color-line)]/60 bg-black/30 px-3 py-2">
															<p className="studio-display text-[15px] text-[var(--color-fg)]">
																{user.country ?? "—"}
															</p>
															<p className="text-[9px] text-[var(--color-fg-dim)]">
																Negara
															</p>
														</div>
													</div>
												</div>

												{/* Actions */}
												<div>
													<p className="studio-eyebrow text-[8px] text-[var(--color-fg-dim)] mb-3">
														Aksi
													</p>
													<div className="space-y-2">
														<button
															onClick={() => openEdit(user)}
															className="flex w-full items-center gap-2 rounded-lg border border-[var(--color-accent)]/20 bg-[var(--color-accent-soft)] px-3 py-2 text-[12px] font-medium text-[var(--color-accent)] transition-colors hover:bg-[var(--color-accent)]/20"
														>
															<span
																className="material-symbols-outlined text-[16px]"
																style={{
																	fontVariationSettings:
																		'"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20',
																}}
															>
																edit
															</span>
															Edit Pengguna
														</button>
														{!user.email_verified && (
															<button
																onClick={() => handleVerifyEmail(user)}
																className="flex w-full items-center gap-2 rounded-lg border border-[var(--color-success)]/20 bg-[rgba(108,232,166,0.08)] px-3 py-2 text-[12px] font-medium text-[var(--color-success)] transition-colors hover:bg-[rgba(108,232,166,0.15)]"
															>
																<span
																	className="material-symbols-outlined text-[16px]"
																	style={{
																		fontVariationSettings:
																			'"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20',
																	}}
																>
																	mark_email_read
																</span>
																Verifikasi Email
															</button>
														)}
														{!user.suspended ? (
															<button
																onClick={() => setSuspendTarget(user)}
																disabled={
																	user.role === "admin" ||
																	user.role === "super_admin"
																}
																className="flex w-full items-center gap-2 rounded-lg border border-[var(--color-amber)]/20 bg-[rgba(245,179,71,0.08)] px-3 py-2 text-[12px] font-medium text-[var(--color-amber)] transition-colors hover:bg-[rgba(245,179,71,0.15)] disabled:cursor-not-allowed disabled:opacity-40"
															>
																<span
																	className="material-symbols-outlined text-[16px]"
																	style={{
																		fontVariationSettings:
																			'"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20',
																	}}
																>
																	block
																</span>
																Nonaktifkan
															</button>
														) : (
															<button
																onClick={() => handleRestore(user)}
																className="flex w-full items-center gap-2 rounded-lg border border-[var(--color-success)]/20 bg-[rgba(108,232,166,0.08)] px-3 py-2 text-[12px] font-medium text-[var(--color-success)] transition-colors hover:bg-[rgba(108,232,166,0.15)]"
															>
																<span
																	className="material-symbols-outlined text-[16px]"
																	style={{
																		fontVariationSettings:
																			'"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20',
																	}}
																>
																	play_circle
																</span>
																Aktifkan Kembali
															</button>
														)}
													</div>
												</div>
											</div>
										</div>
									)}
								</article>
							);
						})}
					</div>
				)}

				{/* Pagination */}
				{data && data.meta.last_page > 1 && (
					<div className="mt-8 flex items-center justify-between rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)]/50 px-5 py-3">
						<button
							type="button"
							disabled={data.meta.current_page <= 1}
							onClick={() => fetchUsers(data.meta.current_page - 1)}
							className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-[12px] font-medium text-[var(--color-fg-muted)] transition-colors hover:border-[var(--color-line-strong)] hover:text-[var(--color-fg)] disabled:pointer-events-none disabled:opacity-40"
						>
							<span
								className="material-symbols-outlined text-[14px]"
								style={{
									fontVariationSettings:
										'"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20',
								}}
							>
								chevron_left
							</span>
							Sebelumnya
						</button>
						<span className="studio-eyebrow text-[8px] text-[var(--color-fg-dim)]">
							Halaman {data.meta.current_page} dari {data.meta.last_page} ·{" "}
							{data.meta.total} pengguna
						</span>
						<button
							type="button"
							disabled={data.meta.current_page >= data.meta.last_page}
							onClick={() => fetchUsers(data.meta.current_page + 1)}
							className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-[12px] font-medium text-[var(--color-fg-muted)] transition-colors hover:border-[var(--color-line-strong)] hover:text-[var(--color-fg)] disabled:pointer-events-none disabled:opacity-40"
						>
							Berikutnya
							<span
								className="material-symbols-outlined text-[14px]"
								style={{
									fontVariationSettings:
										'"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20',
								}}
							>
								chevron_right
							</span>
						</button>
					</div>
				)}

				<footer className="mt-8 border-t border-[var(--color-line)]/70 py-4">
					<span className="studio-eyebrow text-[9px] text-[var(--color-fg-dim)]">
						{users.length} pengguna ditampilkan · {total} total
					</span>
				</footer>
			</div>

			{/* Success Toast */}
			{toast && (
				<div className="fixed bottom-6 right-6 z-[60] animate-[slideInUp_360ms_var(--ease-signature)]">
					<div className="flex items-center gap-2.5 rounded-xl border border-[var(--color-accent)]/20 bg-[var(--color-surface)] px-4 py-3 shadow-2xl">
						<div className="grid h-7 w-7 place-items-center rounded-lg bg-[var(--color-accent)]/10">
							<span
								className="material-symbols-outlined text-[16px] text-[var(--color-accent)]"
								style={{
									fontVariationSettings:
										'"FILL" 0, "wght" 400, "GRAD" 0, "opsz" 20',
								}}
							>
								check_circle
							</span>
						</div>
						<span className="text-[13px] font-medium text-[var(--color-fg)]">
							{toast}
						</span>
					</div>
				</div>
			)}

			{/* Create / Edit User Modal */}
			<UserFormModal
				open={modalOpen}
				mode={modalMode}
				user={editingUser}
				onClose={() => setModalOpen(false)}
				onSaved={handleSaved}
			/>

			{/* Suspend Confirmation Modal */}
			<SuspendConfirmModal
				open={suspendTarget !== null}
				user={suspendTarget}
				onClose={() => setSuspendTarget(null)}
				onConfirm={confirmSuspend}
				processing={processing}
			/>
		</RevealOnScroll>
	);
}
