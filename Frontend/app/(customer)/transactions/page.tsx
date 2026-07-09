"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api, ApiException } from "@/lib/api";
import { formatPrice } from "@/lib/formatters";
import { RevealOnScroll } from "@/components/landing/reveal-on-scroll";

/* ═════════════════════════════════════════════════════════════════════════
   TYPES — matches InvoiceResource + nested PaymentResource / OrderResource
   ═════════════════════════════════════════════════════════════════════════ */

type PaymentStatus =
	| "pending"
	| "paid"
	| "failed"
	| "expired"
	| "cancelled"
	| "refund_pending"
	| "refunded";

type InvoiceStatus = "pending" | "paid" | "cancelled" | "void";

interface PaymentEntry {
	public_id: string;
	payment_method: string | null;
	gateway: string | null;
	amount_minor: number;
	currency: string;
	status: PaymentStatus;
	paid_at: string | null;
	expires_at: string | null;
	created_at: string;
}

interface OrderItem {
	product_name: string;
	billing_cycle: string;
	unit_price: number;
	quantity: number;
}

interface InvoiceApi {
	public_id: string;
	invoice_number: string;
	status: InvoiceStatus;
	subtotal_minor: number;
	total_minor: number;
	currency: string;
	due_at: string | null;
	paid_at: string | null;
	created_at: string;
	order?: {
		public_id: string;
		order_number: string | null;
		items?: OrderItem[];
	} | null;
	payments?: PaymentEntry[];
}

interface InvoicesResponse {
	data: InvoiceApi[];
}

/* ═════════════════════════════════════════════════════════════════════════
   STATUS CONFIGS
   ═════════════════════════════════════════════════════════════════════════ */

const PAYMENT_STATUS: Record<
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

type FilterKey = "all" | PaymentStatus;

const INVOICE_STATUS_BADGE: Record<
	InvoiceStatus,
	{ label: string; color: string; bg: string; border: string }
> = {
	paid: {
		label: "Lunas",
		color: "var(--color-success)",
		bg: "rgba(108,232,166,0.06)",
		border: "rgba(108,232,166,0.14)",
	},
	pending: {
		label: "Belum Lunas",
		color: "var(--color-amber)",
		bg: "rgba(245,179,71,0.06)",
		border: "rgba(245,179,71,0.14)",
	},
	cancelled: {
		label: "Invoice Batal",
		color: "var(--color-error)",
		bg: "rgba(255,122,122,0.06)",
		border: "rgba(255,122,122,0.14)",
	},
	void: {
		label: "Invoice Void",
		color: "var(--color-fg-dim)",
		bg: "rgba(255,255,255,0.02)",
		border: "rgba(255,255,255,0.05)",
	},
};

const FILTER_OPTIONS: { key: FilterKey; label: string }[] = [
	{ key: "all", label: "Semua" },
	{ key: "paid", label: "Berhasil" },
	{ key: "pending", label: "Menunggu" },
	{ key: "failed", label: "Gagal" },
	{ key: "expired", label: "Kadaluarsa" },
	{ key: "cancelled", label: "Dibatalkan" },
];

/* ═════════════════════════════════════════════════════════════════════════
   HELPERS
   ═════════════════════════════════════════════════════════════════════════ */

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

function formatDateShort(d: string): string {
	try {
		return new Date(d).toLocaleDateString("id-ID", {
			day: "numeric",
			month: "short",
			year: "numeric",
		});
	} catch {
		return d;
	}
}
void formatDateShort;

/** Flatten invoices → individual payment transactions for a timeline view */
interface TransactionRow {
	id: string;
	invoice_public_id: string;
	invoice_number: string;
	invoice_status: InvoiceStatus;
	order_number: string | null;
	product_summary: string;
	amount_minor: number;
	currency: string;
	status: PaymentStatus;
	payment_method: string | null;
	gateway: string | null;
	paid_at: string | null;
	created_at: string;
}

function flattenToTransactions(invoices: InvoiceApi[]): TransactionRow[] {
	const rows: TransactionRow[] = [];

	for (const inv of invoices) {
		const orderNum = inv.order?.order_number ?? null;
		const productNames =
			inv.order?.items
				?.map((i) => i.product_name)
				.filter(Boolean)
				.join(", ") ?? "Order";

		if (inv.payments && inv.payments.length > 0) {
			for (const pay of inv.payments) {
				rows.push({
					id: pay.public_id,
					invoice_public_id: inv.public_id,
					invoice_number: inv.invoice_number,
					invoice_status: inv.status,
					order_number: orderNum,
					product_summary: productNames,
					amount_minor: pay.amount_minor,
					currency: pay.currency,
					status: pay.status,
					payment_method: pay.payment_method,
					gateway: pay.gateway,
					paid_at: pay.paid_at,
					created_at: pay.created_at,
				});
			}
		} else {
			// Invoice with no payment records — still show as a transaction
			rows.push({
				id: inv.public_id,
				invoice_public_id: inv.public_id,
				invoice_number: inv.invoice_number,
				invoice_status: inv.status,
				order_number: orderNum,
				product_summary: productNames,
				amount_minor: inv.total_minor,
				currency: inv.currency,
				status:
					inv.status === "paid"
						? "paid"
						: inv.status === "cancelled"
							? "cancelled"
							: "pending",
				payment_method: null,
				gateway: null,
				paid_at: inv.paid_at,
				created_at: inv.created_at,
			});
		}
	}

	// Sort newest first
	rows.sort(
		(a, b) =>
			new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
	);

	return rows;
}

/* ═════════════════════════════════════════════════════════════════════════
   PAGE
   ═════════════════════════════════════════════════════════════════════════ */

export default function TransactionHistoryPage() {
	const [invoices, setInvoices] = useState<InvoiceApi[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [filter, setFilter] = useState<FilterKey>("all");
	const [completion, setCompletion] = useState<
		"all" | "complete" | "incomplete"
	>("all");

	const fetchInvoices = useCallback(async () => {
		setLoading(true);
		try {
			const res = await api.get<InvoicesResponse>("/api/v1/invoices");
			setInvoices(res.data ?? []);
			setError(null);
		} catch (err) {
			if (err instanceof ApiException && err.status === 401) return;
			setError(
				err instanceof Error ? err.message : "Gagal memuat riwayat transaksi.",
			);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchInvoices();
	}, [fetchInvoices]);

	const transactions = useMemo(
		() => flattenToTransactions(invoices),
		[invoices],
	);

	const filtered = useMemo(() => {
		let rows = transactions;
		// Completion filter: a transaction is "complete" when it reached a
		// terminal state (paid / refunded / failed / cancelled / expired), and
		// "incomplete" when it still needs action (pending).
		if (completion === "complete") {
			rows = rows.filter((t) => t.status !== "pending");
		} else if (completion === "incomplete") {
			rows = rows.filter((t) => t.status === "pending");
		}
		if (filter !== "all") {
			rows = rows.filter((t) => t.status === filter);
		}
		return rows;
	}, [transactions, filter, completion]);

	// Summary stats
	const stats = useMemo(() => {
		const total = transactions.length;
		const totalAmount = transactions
			.filter((t) => t.status === "paid")
			.reduce((sum, t) => sum + t.amount_minor, 0);
		const pendingCount = transactions.filter(
			(t) => t.status === "pending",
		).length;
		const failedCount = transactions.filter(
			(t) => t.status === "failed" || t.status === "cancelled",
		).length;
		return { total, totalAmount, pendingCount, failedCount };
	}, [transactions]);

	return (
		<RevealOnScroll>
			<div className="mx-auto w-full max-w-[1320px] px-6 py-8">
				{/* Header */}
				<section className="reveal-rise mb-8">
					<p className="studio-eyebrow text-[var(--color-accent)]">Transaksi</p>
					<h1 className="studio-display mt-3 text-[clamp(28px,4vw,44px)] text-[var(--color-fg)]">
						Riwayat Pembayaran
					</h1>
					<p className="mt-2 text-[13px] text-[var(--color-fg-muted)]">
						Semua transaksi dan riwayat pembayaran kamu dalam satu tempat.
					</p>
				</section>

				{/* Stats Cards */}
				<section className="reveal-rise mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
					<StatCard
						icon="receipt_long"
						label="Total Transaksi"
						value={String(stats.total)}
						accent="var(--color-accent)"
						accentSoft="var(--color-accent-soft)"
					/>
					<StatCard
						icon="account_balance_wallet"
						label="Total Dibayar"
						value={formatPrice(stats.totalAmount, "IDR")}
						accent="var(--color-success)"
						accentSoft="rgba(108,232,166,0.08)"
					/>
					<StatCard
						icon="schedule"
						label="Menunggu"
						value={String(stats.pendingCount)}
						accent="var(--color-amber)"
						accentSoft="rgba(245,179,71,0.08)"
					/>
					<StatCard
						icon="trending_down"
						label="Gagal/Batal"
						value={String(stats.failedCount)}
						accent="var(--color-error)"
						accentSoft="rgba(255,122,122,0.08)"
					/>
				</section>

				{/* Completion filter — penanda transaksi belum/selesai selesai */}
				<section className="reveal-rise mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-[var(--color-accent)]/20 bg-[var(--color-accent-soft)]/40 px-4 py-3">
					<span className="studio-eyebrow mr-2 text-[8px] text-[var(--color-fg-dim)]">
						Status Penyelesaian
					</span>
					{(
						[
							{ key: "all", label: "Semua", icon: "apps" },
							{ key: "incomplete", label: "Belum Selesai", icon: "pending" },
							{ key: "complete", label: "Selesai", icon: "task_alt" },
						] as const
					).map((opt) => {
						const isActive = completion === opt.key;
						return (
							<button
								key={opt.key}
								onClick={() => setCompletion(opt.key)}
								className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium transition-all duration-[var(--dur-standard)] ${
									isActive
										? "bg-[var(--color-accent)] text-[var(--color-accent-fg)]"
										: "text-[var(--color-fg-muted)] hover:bg-white/[0.05] hover:text-[var(--color-fg)]"
								}`}
							>
								<span
									className="material-symbols-outlined text-[14px]"
									style={{
										fontVariationSettings:
											'"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20',
									}}
								>
									{opt.icon}
								</span>
								{opt.label}
							</button>
						);
					})}
					<span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-[var(--color-amber)]/10 px-2.5 py-0.5 text-[10px] font-medium text-[var(--color-amber)]">
						<span className="h-1.5 w-1.5 rounded-full bg-[var(--color-amber)]" />
						{stats.pendingCount} butuh tindakan
					</span>
				</section>

				{/* Status detail filter */}
				<section className="reveal-rise mb-6 flex flex-wrap items-center gap-2 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)]/50 px-4 py-3">
					{FILTER_OPTIONS.map((opt) => {
						const isActive = filter === opt.key;
						return (
							<button
								key={opt.key}
								onClick={() => setFilter(opt.key)}
								className={`rounded-lg px-3 py-1.5 text-[11px] font-medium transition-all duration-[var(--dur-standard)] ${
									isActive
										? "bg-[var(--color-accent-soft)] text-[var(--color-accent)]"
										: "text-[var(--color-fg-muted)] hover:bg-white/[0.03] hover:text-[var(--color-fg)]"
								}`}
							>
								{opt.label}
							</button>
						);
					})}
					<span className="ml-auto font-mono text-[10px] text-[var(--color-fg-dim)]">
						{filtered.length} transaksi
					</span>
				</section>

				{error && (
					<div className="reveal-rise mb-6 flex items-center gap-2 rounded-2xl border border-[var(--color-error)]/20 bg-[var(--color-error)]/5 px-5 py-3">
						<span
							className="material-symbols-outlined text-[18px] text-[var(--color-error)]"
							style={{ fontVariationSettings: '"FILL" 0, "wght" 300' }}
						>
							error
						</span>
						<p className="text-[13px] text-[var(--color-error)]">{error}</p>
					</div>
				)}

				{/* Transaction List */}
				{loading ? (
					<div className="space-y-3">
						{[1, 2, 3, 4].map((i) => (
							<div
								key={i}
								className="animate-pulse rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)]/50 p-5"
							>
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-4">
										<div className="h-10 w-10 rounded-xl bg-[var(--color-surface-3)]" />
										<div className="space-y-2">
											<div className="h-3.5 w-44 rounded bg-[var(--color-surface-3)]" />
											<div className="h-2.5 w-28 rounded bg-[var(--color-surface-2)]" />
										</div>
									</div>
									<div className="space-y-2 text-right">
										<div className="ml-auto h-4 w-28 rounded bg-[var(--color-surface-3)]" />
										<div className="ml-auto h-2.5 w-20 rounded bg-[var(--color-surface-2)]" />
									</div>
								</div>
							</div>
						))}
					</div>
				) : filtered.length > 0 ? (
					<div className="reveal-rise space-y-3">
						{filtered.map((tx) => {
							const sc = PAYMENT_STATUS[tx.status] ?? PAYMENT_STATUS.pending;
							return (
								<div
									key={tx.id}
									className="group rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)]/50 p-5 transition-all duration-[var(--dur-standard)] hover:border-[var(--color-line-strong)] hover:bg-[var(--color-surface)]"
								>
									<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
										{/* Left: icon + info */}
										<div className="flex items-start gap-4">
											{/* Status icon */}
											<div
												className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border"
												style={{
													borderColor: sc.border,
													backgroundColor: sc.bg,
												}}
											>
												<span
													className="material-symbols-outlined text-[18px]"
													style={{
														color: sc.color,
														fontVariationSettings:
															'"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20',
													}}
												>
													{sc.icon}
												</span>
											</div>

											<div className="min-w-0">
												{/* Product / order number */}
												<p className="truncate text-[13px] font-semibold text-[var(--color-fg)]">
													{tx.product_summary}
												</p>
												{/* Invoice + order refs */}
												<div className="mt-1 flex flex-wrap items-center gap-2">
													<span className="font-mono text-[10px] text-[var(--color-fg-dim)]">
														{tx.invoice_number}
													</span>
													{(() => {
														const ib = INVOICE_STATUS_BADGE[tx.invoice_status];
														if (!ib) return null;
														return (
															<span
																className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[8px] font-semibold uppercase tracking-wider"
																style={{
																	color: ib.color,
																	backgroundColor: ib.bg,
																	borderColor: ib.border,
																}}
															>
																<span
																	className="h-1 w-1 rounded-full"
																	style={{ backgroundColor: ib.color }}
																/>
																{ib.label}
															</span>
														);
													})()}
													{tx.order_number && (
														<>
															<span className="text-[8px] text-[var(--color-fg-dim)]">
																·
															</span>
															<span className="text-[10px] text-[var(--color-fg-dim)]">
																{tx.order_number}
															</span>
														</>
													)}
												</div>
												{/* Date + method */}
												<div className="mt-1.5 flex flex-wrap items-center gap-2 text-[10px] text-[var(--color-fg-dim)]">
													<span>{formatDate(tx.paid_at ?? tx.created_at)}</span>
													{tx.payment_method && (
														<>
															<span>·</span>
															<span className="uppercase">
																{tx.payment_method}
															</span>
														</>
													)}
													{tx.gateway && (
														<>
															<span>·</span>
															<span>via {tx.gateway}</span>
														</>
													)}
												</div>
											</div>
										</div>

										{/* Right: amount + status + actions */}
										<div className="flex shrink-0 flex-col items-end gap-3 sm:flex-row sm:items-center sm:gap-4 sm:text-right">
											<div>
												<p
													className={`text-[15px] font-bold ${
														tx.status === "paid"
															? "text-[var(--color-success)]"
															: tx.status === "pending"
																? "text-[var(--color-amber)]"
																: "text-[var(--color-fg-muted)]"
													}`}
												>
													{tx.status === "refunded" ? "-" : ""}
													{formatPrice(tx.amount_minor, tx.currency)}
												</p>
											</div>
											<span
												className="whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider"
												style={{
													color: sc.color,
													backgroundColor: sc.bg,
													borderColor: sc.border,
												}}
											>
												{sc.label}
											</span>
											{/* Action buttons: pay / view invoice */}
											<div className="flex shrink-0 items-center gap-2">
												{tx.status === "pending" &&
												tx.invoice_status === "pending" ? (
													<Link
														href={`/invoices/${tx.invoice_public_id}`}
														className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-accent)] px-3 py-2 text-[11px] font-semibold text-[var(--color-accent-fg)] transition-all hover:brightness-110"
													>
														<span
															className="material-symbols-outlined text-[14px]"
															style={{
																fontVariationSettings:
																	'"FILL" 0, "wght" 400, "GRAD" 0, "opsz" 20',
															}}
														>
															payments
														</span>
														Bayar
													</Link>
												) : null}
												<Link
													href={`/invoices/${tx.invoice_public_id}`}
													className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-line)] px-3 py-2 text-[11px] font-medium text-[var(--color-fg-muted)] transition-colors hover:border-[var(--color-line-strong)] hover:text-[var(--color-fg)]"
												>
													<span
														className="material-symbols-outlined text-[14px]"
														style={{
															fontVariationSettings:
																'"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20',
														}}
													>
														receipt_long
													</span>
													Invoice
												</Link>
											</div>
										</div>
									</div>
								</div>
							);
						})}
					</div>
				) : (
					<div className="reveal-rise rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)]/50 py-16 text-center">
						<span
							className="material-symbols-outlined text-[40px] text-[var(--color-fg-dim)]"
							style={{
								fontVariationSettings:
									'"FILL" 0, "wght" 200, "GRAD" 0, "opsz" 40',
							}}
						>
							receipt_long
						</span>
						<h3 className="studio-display mt-4 text-[18px] text-[var(--color-fg)]">
							{filter === "all"
								? "Belum Ada Transaksi"
								: `Tidak ada transaksi ${FILTER_OPTIONS.find((f) => f.key === filter)?.label?.toLowerCase() ?? ""}`}
						</h3>
						<p className="mt-2 text-[13px] text-[var(--color-fg-muted)]">
							{filter === "all"
								? "Transaksi akan muncul setelah kamu melakukan pembayaran."
								: "Coba filter lain untuk melihat transaksi kamu."}
						</p>
					</div>
				)}
			</div>
		</RevealOnScroll>
	);
}

/* ═════════════════════════════════════════════════════════════════════════
   STAT CARD
   ═════════════════════════════════════════════════════════════════════════ */

function StatCard({
	icon,
	label,
	value,
	accent,
	accentSoft,
}: {
	icon: string;
	label: string;
	value: string;
	accent: string;
	accentSoft: string;
}) {
	return (
		<div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)]/50 p-4">
			<div className="flex items-center gap-3">
				<div
					className="flex h-9 w-9 items-center justify-center rounded-xl"
					style={{ backgroundColor: accentSoft }}
				>
					<span
						className="material-symbols-outlined text-[18px]"
						style={{
							color: accent,
							fontVariationSettings:
								'"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20',
						}}
					>
						{icon}
					</span>
				</div>
				<div>
					<p className="studio-eyebrow text-[7px] text-[var(--color-fg-dim)]">
						{label}
					</p>
					<p className="mt-0.5 text-[15px] font-bold" style={{ color: accent }}>
						{value}
					</p>
				</div>
			</div>
		</div>
	);
}
