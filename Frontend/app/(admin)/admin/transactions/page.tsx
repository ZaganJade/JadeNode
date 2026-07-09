"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { PageHeader, StatCard } from "@/components/admin/studio-ui";
import {
	adminListPayments,
	adminSyncPayment,
	type AdminPaymentData,
	type AdminPaymentListResponse,
} from "@/lib/auth";
import { ApiException } from "@/lib/api";
import { formatPrice } from "@/lib/formatters";

/* ═══════════════════════════════════════════════════════════════════════
   TYPES & CONFIGS
   ═══════════════════════════════════════════════════════════════════════ */

type PaymentStatus =
	| "pending"
	| "paid"
	| "failed"
	| "expired"
	| "cancelled"
	| "refund_pending"
	| "refunded";

const STATUS_CONFIG: Record<
	PaymentStatus,
	{ label: string; icon: string; color: string; bg: string; border: string }
> = {
	paid: {
		label: "Berhasil",
		icon: "check_circle",
		color: "var(--color-success)",
		bg: "rgba(108,232,166,0.06)",
		border: "rgba(108,232,166,0.14)",
	},
	pending: {
		label: "Menunggu",
		icon: "schedule",
		color: "var(--color-amber)",
		bg: "rgba(245,179,71,0.06)",
		border: "rgba(245,179,71,0.14)",
	},
	failed: {
		label: "Gagal",
		icon: "cancel",
		color: "var(--color-error)",
		bg: "rgba(255,122,122,0.06)",
		border: "rgba(255,122,122,0.14)",
	},
	expired: {
		label: "Kadaluarsa",
		icon: "timer_off",
		color: "var(--color-fg-dim)",
		bg: "rgba(255,255,255,0.02)",
		border: "rgba(255,255,255,0.05)",
	},
	cancelled: {
		label: "Dibatalkan",
		icon: "block",
		color: "var(--color-error)",
		bg: "rgba(255,122,122,0.06)",
		border: "rgba(255,122,122,0.14)",
	},
	refund_pending: {
		label: "Refund Pending",
		icon: "autorenew",
		color: "var(--color-steel)",
		bg: "rgba(122,150,177,0.06)",
		border: "rgba(122,150,177,0.14)",
	},
	refunded: {
		label: "Dikembalikan",
		icon: "undo",
		color: "var(--color-steel)",
		bg: "rgba(122,150,177,0.06)",
		border: "rgba(122,150,177,0.14)",
	},
};

const STATUS_OPTIONS: { value: string; label: string }[] = [
	{ value: "", label: "Semua Status" },
	{ value: "paid", label: "Berhasil" },
	{ value: "pending", label: "Menunggu" },
	{ value: "failed", label: "Gagal" },
	{ value: "expired", label: "Kadaluarsa" },
	{ value: "cancelled", label: "Dibatalkan" },
];

function getStatusConfig(status: string): {
	label: string;
	icon: string;
	color: string;
	bg: string;
	border: string;
} {
	return (
		STATUS_CONFIG[status as PaymentStatus] ?? {
			label: status,
			icon: "help",
			color: "var(--color-fg-dim)",
			bg: "rgba(255,255,255,0.02)",
			border: "rgba(255,255,255,0.05)",
		}
	);
}

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

function formatDate(d: string | null): string {
	if (!d) return "—";
	try {
		return new Date(d).toLocaleDateString("id-ID", {
			day: "numeric",
			month: "short",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	} catch {
		return d;
	}
}

/* ═══════════════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════════════ */

export default function AdminTransactionsPage() {
	const [data, setData] = useState<AdminPaymentListResponse | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [search, setSearch] = useState("");
	const [filterStatus, setFilterStatus] = useState("");
	const [filterGateway, setFilterGateway] = useState("");
	const [expandedId, setExpandedId] = useState<string | null>(null);
	const [syncing, setSyncing] = useState<string | null>(null);
	const [toast, setToast] = useState("");

	const fetchPayments = useCallback(
		async (page?: number) => {
			setLoading(true);
			setError("");
			try {
				const params: Record<string, string> = {};
				if (page) params.page = String(page);
				if (search) params.search = search;
				if (filterStatus) params.status = filterStatus;
				if (filterGateway) params.gateway = filterGateway;
				const result = await adminListPayments(
					Object.keys(params).length > 0 ? params : undefined,
				);
				setData(result);
			} catch (err) {
				setError(
					err instanceof ApiException
						? err.message
						: "Gagal memuat data transaksi.",
				);
			} finally {
				setLoading(false);
			}
		},
		[search, filterStatus, filterGateway],
	);

	useEffect(() => {
		fetchPayments();
	}, [fetchPayments]);

	useEffect(() => {
		if (!toast) return;
		const t = setTimeout(() => setToast(""), 3600);
		return () => clearTimeout(t);
	}, [toast]);

	async function handleSync(payment: AdminPaymentData) {
		setSyncing(payment.public_id);
		try {
			const res = await adminSyncPayment(payment.public_id);
			const changed = res.data?.status_before !== res.data?.status_after;
			setToast(
				changed
					? `Sync selesai: status ${res.data?.status_before} → ${res.data?.status_after}.`
					: res.message || "Sinkronisasi berhasil. Tidak ada perubahan status.",
			);
			fetchPayments(data?.meta.current_page);
		} catch (err) {
			setError(
				err instanceof ApiException
					? err.message
					: "Gagal menyinkronkan pembayaran.",
			);
		} finally {
			setSyncing(null);
		}
	}

	/* ── Derived financial summary ── */
	const payments = data?.data ?? [];
	const total = data?.meta.total ?? 0;

	const stats = useMemo(() => {
		const paid = payments.filter((p) => p.status === "paid");
		const pending = payments.filter((p) => p.status === "pending");
		const failed = payments.filter((p) =>
			["failed", "cancelled", "expired"].includes(p.status),
		);
		const totalPaid = paid.reduce((sum, p) => sum + p.amount_minor, 0);
		const totalPending = pending.reduce((sum, p) => sum + p.amount_minor, 0);
		return {
			paidCount: paid.length,
			pendingCount: pending.length,
			failedCount: failed.length,
			totalPaid,
			totalPending,
		};
	}, [payments]);

	const inputCls =
		"rounded-lg border border-[var(--color-line)] bg-black/40 px-3 py-2 text-[13px] text-[var(--color-fg)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]/20";

	return (
		<div className="relative mx-auto w-full max-w-[1320px] px-6 py-8">
			{/* Header */}
			<PageHeader
				eyebrow="Transaction Management"
				title="Kelola Transaksi"
				subtitle="Pantau semua transaksi pembayaran platform dan sinkronkan transaksi yang tertunda."
				status={`${total} transaksi · ${stats.paidCount} berhasil`}
			/>

			{/* Error */}
			{error && (
				<div className="mb-6 rounded-xl border border-[var(--color-error)]/20 bg-[var(--color-error)]/5 px-4 py-3 text-[13px] text-[var(--color-error)]">
					{error}
				</div>
			)}

			{/* KPI grid */}
			<section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
				<StatCard
					label="Total Transaksi"
					value={total}
					icon="receipt_long"
					sub="Semua status"
					compact
					delay={0}
				/>
				<StatCard
					label="Total Berhasil"
					value={formatPrice(stats.totalPaid, "IDR")}
					icon="account_balance_wallet"
					sub={`${stats.paidCount} transaksi`}
					compact
					delay={70}
				/>
				<StatCard
					label="Menunggu"
					value={formatPrice(stats.totalPending, "IDR")}
					icon="schedule"
					sub={`${stats.pendingCount} transaksi`}
					compact
					delay={140}
				/>
				<StatCard
					label="Gagal/Batal"
					value={stats.failedCount}
					icon="trending_down"
					sub="Perlu perhatian"
					compact
					delay={210}
				/>
				<StatCard
					label="Sukses Rate"
					value={
						payments.length > 0
							? `${Math.round((stats.paidCount / payments.length) * 100)}%`
							: "—"
					}
					icon="show_chart"
					sub="Konversi"
					compact
					delay={280}
				/>
			</section>

			{/* Filter Bar */}
			<div className="reveal-rise mb-6 flex flex-wrap items-end gap-3 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)]/50 p-4">
				<div className="flex-1 min-w-[220px]">
					<label className="mb-1 block studio-eyebrow text-[8px] text-[var(--color-fg-dim)]">
						Cari
					</label>
					<input
						type="text"
						placeholder="Customer, email, payment ID, atau gateway tx..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") fetchPayments();
						}}
						className={cn(inputCls, "w-full")}
					/>
				</div>
				<div className="w-40">
					<label className="mb-1 block studio-eyebrow text-[8px] text-[var(--color-fg-dim)]">
						Status
					</label>
					<select
						value={filterStatus}
						onChange={(e) => setFilterStatus(e.target.value)}
						className={cn(inputCls, "w-full")}
					>
						{STATUS_OPTIONS.map((o) => (
							<option key={o.value} value={o.value}>
								{o.label}
							</option>
						))}
					</select>
				</div>
				<div className="w-36">
					<label className="mb-1 block studio-eyebrow text-[8px] text-[var(--color-fg-dim)]">
						Gateway
					</label>
					<select
						value={filterGateway}
						onChange={(e) => setFilterGateway(e.target.value)}
						className={cn(inputCls, "w-full")}
					>
						<option value="">Semua</option>
						<option value="midtrans">Midtrans</option>
						<option value="manual">Manual</option>
					</select>
				</div>
				<button
					type="button"
					onClick={() => fetchPayments()}
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
						Memuat data transaksi...
					</p>
				</div>
			) : payments.length === 0 ? (
				<div className="reveal-rise flex flex-col items-center justify-center rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)]/50 py-16">
					<span
						className="material-symbols-outlined text-[48px] text-[var(--color-fg-dim)]"
						style={{
							fontVariationSettings:
								'"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 40',
						}}
					>
						receipt_long
					</span>
					<h3 className="studio-display mt-4 text-[20px] text-[var(--color-fg)]">
						Tidak ada transaksi ditemukan
					</h3>
					<p className="mt-1 text-[12px] text-[var(--color-fg-muted)]">
						Coba ubah filter atau kata kunci pencarian.
					</p>
				</div>
			) : (
				/* Transaction List */
				<div className="space-y-3">
					{payments.map((payment, idx) => {
						const sc = getStatusConfig(payment.status);
						const isExpanded = expandedId === payment.public_id;
						const isPending = payment.status === "pending";
						return (
							<article
								key={payment.public_id}
								className="studio-card reveal-rise rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)]/50 overflow-hidden"
								style={{ transitionDelay: `${idx * 40}ms` }}
							>
								<div
									className="flex cursor-pointer items-center gap-4 p-5"
									onClick={() =>
										setExpandedId(isExpanded ? null : payment.public_id)
									}
								>
									{/* Status icon */}
									<div
										className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border"
										style={{ borderColor: sc.border, backgroundColor: sc.bg }}
									>
										<span
											className="material-symbols-outlined text-[22px]"
											style={{
												color: sc.color,
												fontVariationSettings:
													'"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 24',
											}}
										>
											{sc.icon}
										</span>
									</div>

									{/* Info */}
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-2 flex-wrap">
											<h3 className="text-[14px] font-semibold truncate text-[var(--color-fg)]">
												{payment.product_summary || "Transaksi"}
											</h3>
											<Badge
												label={sc.label}
												color={sc.color}
												bg={sc.bg}
												border={sc.border}
											/>
											{payment.invoice_status &&
												payment.invoice_status !== payment.status && (
													<Badge
														label={`Invoice: ${payment.invoice_status}`}
														color="var(--color-fg-muted)"
														bg="rgba(255,255,255,0.03)"
														border="rgba(255,255,255,0.06)"
													/>
												)}
										</div>
										<div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[var(--color-fg-muted)]">
											<span>{payment.user_name ?? "—"}</span>
											{payment.invoice_number && (
												<span className="font-mono text-[10px]">
													{payment.invoice_number}
												</span>
											)}
											<span>
												{formatDate(payment.paid_at ?? payment.created_at)}
											</span>
										</div>
									</div>

									{/* Amount */}
									<div className="hidden sm:block text-right shrink-0">
										<p
											className="text-[15px] font-bold"
											style={{
												color:
													payment.status === "paid"
														? "var(--color-success)"
														: "var(--color-fg)",
											}}
										>
											{formatPrice(payment.amount_minor, payment.currency)}
										</p>
										<p className="studio-eyebrow text-[7px] text-[var(--color-fg-dim)]">
											{payment.gateway?.toUpperCase() ?? "—"}
										</p>
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
											{/* Customer & Order */}
											<div>
												<p className="studio-eyebrow text-[8px] text-[var(--color-fg-dim)] mb-3">
													Customer & Order
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
															person
														</span>
														<span className="truncate">
															{payment.user_name ?? "—"}
														</span>
													</div>
													<div className="flex items-center gap-2 text-[var(--color-fg-muted)]">
														<span
															className="material-symbols-outlined text-[14px] text-[var(--color-fg-dim)]"
															style={{
																fontVariationSettings:
																	'"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20',
															}}
														>
															mail
														</span>
														<span className="font-mono text-[10px] truncate">
															{payment.user_email ?? "—"}
														</span>
													</div>
													{payment.order_number && (
														<div className="flex items-center gap-2 text-[var(--color-fg-muted)]">
															<span
																className="material-symbols-outlined text-[14px] text-[var(--color-fg-dim)]"
																style={{
																	fontVariationSettings:
																		'"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20',
																}}
															>
																shopping_bag
															</span>
															<span className="font-mono text-[10px]">
																{payment.order_number}
															</span>
														</div>
													)}
													{payment.invoice_number && (
														<div className="flex items-center gap-2 text-[var(--color-fg-muted)]">
															<span
																className="material-symbols-outlined text-[14px] text-[var(--color-fg-dim)]"
																style={{
																	fontVariationSettings:
																		'"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20',
																}}
															>
																receipt_long
															</span>
															<span className="font-mono text-[10px]">
																{payment.invoice_number}
															</span>
														</div>
													)}
												</div>
											</div>

											{/* Payment Detail */}
											<div>
												<p className="studio-eyebrow text-[8px] text-[var(--color-fg-dim)] mb-3">
													Detail Pembayaran
												</p>
												<div className="grid grid-cols-2 gap-2">
													<div className="rounded-lg border border-[var(--color-line)]/60 bg-black/30 px-3 py-2">
														<p className="studio-display text-[15px] text-[var(--color-fg)]">
															{formatPrice(
																payment.amount_minor,
																payment.currency,
															)}
														</p>
														<p className="text-[9px] text-[var(--color-fg-dim)]">
															Jumlah
														</p>
													</div>
													<div className="rounded-lg border border-[var(--color-line)]/60 bg-black/30 px-3 py-2">
														<p className="studio-display text-[15px] text-[var(--color-fg)] capitalize">
															{payment.payment_method ?? "—"}
														</p>
														<p className="text-[9px] text-[var(--color-fg-dim)]">
															Metode
														</p>
													</div>
													<div className="rounded-lg border border-[var(--color-line)]/60 bg-black/30 px-3 py-2">
														<p className="studio-display text-[13px] text-[var(--color-fg)] capitalize">
															{payment.gateway ?? "—"}
														</p>
														<p className="text-[9px] text-[var(--color-fg-dim)]">
															Gateway
														</p>
													</div>
													<div className="rounded-lg border border-[var(--color-line)]/60 bg-black/30 px-3 py-2">
														<p className="studio-display text-[13px] text-[var(--color-fg)]">
															{formatDate(payment.paid_at)}
														</p>
														<p className="text-[9px] text-[var(--color-fg-dim)]">
															Dibayar
														</p>
													</div>
												</div>
												{payment.gateway_transaction_id && (
													<div className="mt-2 rounded-lg border border-[var(--color-line)]/60 bg-black/30 px-3 py-2">
														<p className="font-mono text-[10px] text-[var(--color-fg-muted)] truncate">
															{payment.gateway_transaction_id}
														</p>
														<p className="text-[9px] text-[var(--color-fg-dim)]">
															Gateway TX ID
														</p>
													</div>
												)}
											</div>

											{/* Actions */}
											<div>
												<p className="studio-eyebrow text-[8px] text-[var(--color-fg-dim)] mb-3">
													Aksi
												</p>
												<div className="space-y-2">
													<button
														onClick={() => handleSync(payment)}
														disabled={
															!isPending ||
															!payment.gateway_transaction_id ||
															syncing === payment.public_id
														}
														title={
															!isPending
																? "Hanya transaksi pending yang bisa disinkronkan"
																: !payment.gateway_transaction_id
																	? "Tidak ada gateway transaction ID"
																	: "Sinkronkan status dari gateway"
														}
														className="flex w-full items-center gap-2 rounded-lg border border-[var(--color-accent)]/20 bg-[var(--color-accent-soft)] px-3 py-2 text-[12px] font-medium text-[var(--color-accent)] transition-colors hover:bg-[var(--color-accent)]/20 disabled:cursor-not-allowed disabled:opacity-40"
													>
														{syncing === payment.public_id ? (
															<span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent" />
														) : (
															<span
																className="material-symbols-outlined text-[16px]"
																style={{
																	fontVariationSettings:
																		'"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20',
																}}
															>
																sync
															</span>
														)}
														Sinkronkan Gateway
													</button>
													{payment.invoice_public_id && (
														<div className="rounded-lg border border-[var(--color-line)]/60 bg-black/30 px-3 py-2.5 text-[11px] text-[var(--color-fg-dim)]">
															<span className="font-mono text-[10px]">
																{payment.public_id}
															</span>
															<p className="mt-0.5 text-[9px]">Payment ID</p>
														</div>
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
						onClick={() => fetchPayments(data.meta.current_page - 1)}
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
						{data.meta.total} transaksi
					</span>
					<button
						type="button"
						disabled={data.meta.current_page >= data.meta.last_page}
						onClick={() => fetchPayments(data.meta.current_page + 1)}
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
		</div>
	);
}
