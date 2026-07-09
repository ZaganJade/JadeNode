"use client";

import { useState, useEffect, useCallback, type FormEvent } from "react";
import { cn } from "@/lib/utils";
import {
	adminCreateUser,
	adminUpdateUser,
	type AdminUserData,
	type CreateUserData,
	type UpdateUserData,
} from "@/lib/auth";
import { ApiException } from "@/lib/api";

/* ═════════════════════════════════════════════════════════════════════════
   USER FORM MODAL — create / edit
   ═════════════════════════════════════════════════════════════════════════ */

interface UserFormModalProps {
	open: boolean;
	mode: "create" | "edit";
	user?: AdminUserData | null;
	onClose: () => void;
	onSaved: (message: string) => void;
}

interface FormState {
	name: string;
	email: string;
	password: string;
	role: string;
	phone: string;
	country: string;
	email_verified: boolean;
}

const EMPTY: FormState = {
	name: "",
	email: "",
	password: "",
	role: "customer",
	phone: "",
	country: "",
	email_verified: true,
};

const ROLE_OPTIONS: Array<{ value: string; label: string; icon: string }> = [
	{ value: "customer", label: "Customer", icon: "person" },
	{ value: "provider", label: "Provider", icon: "business" },
	{ value: "admin", label: "Admin", icon: "admin_panel_settings" },
];

export function UserFormModal({
	open,
	mode,
	user,
	onClose,
	onSaved,
}: UserFormModalProps) {
	const [form, setForm] = useState<FormState>(EMPTY);
	const [errors, setErrors] = useState<Record<string, string[]>>({});
	const [submitting, setSubmitting] = useState(false);
	const [globalError, setGlobalError] = useState("");

	/* ── Populate form when opening / editing ── */
	useEffect(() => {
		if (!open) return;
		setErrors({});
		setGlobalError("");

		if (mode === "edit" && user) {
			setForm({
				name: user.name ?? "",
				email: user.email ?? "",
				password: "",
				role: user.role ?? "customer",
				phone: user.phone ?? "",
				country: user.country ?? "",
				email_verified: user.email_verified ?? false,
			});
		} else {
			setForm(EMPTY);
		}
	}, [open, mode, user]);

	/* ── Keyboard handler ── */
	const handleKeyDown = useCallback(
		(e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		},
		[onClose],
	);

	useEffect(() => {
		if (open) {
			document.addEventListener("keydown", handleKeyDown);
			document.body.style.overflow = "hidden";
		}
		return () => {
			document.removeEventListener("keydown", handleKeyDown);
			document.body.style.overflow = "";
		};
	}, [open, handleKeyDown]);

	function updateField(field: keyof FormState, value: string | boolean) {
		setForm((prev) => ({ ...prev, [field]: value }));
		if (errors[field]) {
			setErrors((prev) => {
				const n = { ...prev };
				delete n[field];
				return n;
			});
		}
	}

	async function handleSubmit(e: FormEvent) {
		e.preventDefault();
		setErrors({});
		setGlobalError("");
		setSubmitting(true);

		try {
			if (mode === "create") {
				const data: CreateUserData = {
					name: form.name,
					email: form.email,
					password: form.password,
					role: form.role,
					phone: form.phone || null,
					country: form.country || null,
					email_verified: form.email_verified,
				};
				const res = await adminCreateUser(data);
				onSaved(res.message || "Pengguna berhasil ditambahkan.");
			} else if (user) {
				const payload: UpdateUserData = {
					name: form.name,
					email: form.email,
					role: form.role,
					phone: form.phone || null,
					country: form.country || null,
					email_verified: form.email_verified,
				};
				// Only send password when provided.
				if (form.password) payload.password = form.password;
				const res = await adminUpdateUser(user.id, payload);
				onSaved(res.message || "Pengguna berhasil diperbarui.");
			}
		} catch (error) {
			if (error instanceof ApiException) {
				if (
					error.status === 422 &&
					typeof error.detail === "object" &&
					error.detail !== null
				) {
					const detail = error.detail as Record<string, unknown>;
					if ("errors" in detail) {
						setErrors(detail.errors as Record<string, string[]>);
					} else {
						setGlobalError(error.message);
					}
				} else {
					setGlobalError(error.message);
				}
			} else {
				setGlobalError("Terjadi kesalahan. Silakan coba lagi.");
			}
		} finally {
			setSubmitting(false);
		}
	}

	if (!open) return null;

	/* ── Shared input styles ── */
	const fieldCls =
		"block w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-bg)] px-3 py-2.5 text-[13px] text-[var(--color-fg)] placeholder:text-[var(--color-fg-dim)] transition-colors focus:border-[var(--color-accent)]/40 focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]/15";
	const selectCls = fieldCls;
	const labelCls =
		"block text-[11px] font-semibold uppercase tracking-wider text-[var(--color-fg-muted)] mb-1.5";
	const errorCls = "mt-1 text-[11px] text-[var(--color-error)]";

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			{/* Backdrop */}
			<div
				className="fixed inset-0 bg-black/60 backdrop-blur-[2px]"
				onClick={onClose}
				aria-hidden="true"
			/>

			{/* Modal Panel */}
			<div
				className="relative z-50 w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] shadow-2xl"
				role="dialog"
				aria-modal="true"
			>
				{/* Header */}
				<div className="flex items-center justify-between border-b border-[var(--color-line)] px-6 py-4">
					<div className="flex items-center gap-3">
						<div className="grid h-9 w-9 place-items-center rounded-xl border border-[var(--color-accent)]/20 bg-[var(--color-accent)]/10">
							<span
								className="material-symbols-outlined text-[18px] text-[var(--color-accent)]"
								style={{
									fontVariationSettings:
										'"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20',
								}}
							>
								{mode === "create" ? "person_add" : "edit"}
							</span>
						</div>
						<div>
							<h2 className="text-[15px] font-bold text-[var(--color-fg)]">
								{mode === "create" ? "Tambah Pengguna Baru" : "Edit Pengguna"}
							</h2>
							<p className="text-[11px] text-[var(--color-fg-dim)]">
								{mode === "create"
									? "Buat login identity baru di platform"
									: "Perbarui informasi pengguna"}
							</p>
						</div>
					</div>
					<button
						onClick={onClose}
						className="grid h-8 w-8 place-items-center rounded-lg border border-[var(--color-line)] text-[var(--color-fg-dim)] transition-colors hover:border-[var(--color-line-strong)] hover:text-[var(--color-fg)]"
						aria-label="Tutup"
					>
						<span
							className="material-symbols-outlined text-[18px]"
							style={{
								fontVariationSettings:
									'"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20',
							}}
						>
							close
						</span>
					</button>
				</div>

				{/* Form body */}
				<form
					onSubmit={handleSubmit}
					className="flex flex-1 flex-col overflow-hidden"
				>
					<div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
						{globalError && (
							<div className="rounded-lg border border-[var(--color-error)]/20 bg-[var(--color-error)]/5 px-4 py-3 text-[13px] text-[var(--color-error)]">
								{globalError}
							</div>
						)}

						{/* Row: Name + Email */}
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<div>
								<label className={labelCls}>Nama *</label>
								<input
									type="text"
									value={form.name}
									onChange={(e) => updateField("name", e.target.value)}
									placeholder="e.g. Budi Santoso"
									className={cn(
										fieldCls,
										errors.name && "border-[var(--color-error)]/50",
									)}
									autoFocus
								/>
								{errors.name && <p className={errorCls}>{errors.name[0]}</p>}
							</div>
							<div>
								<label className={labelCls}>Email *</label>
								<input
									type="email"
									value={form.email}
									onChange={(e) => updateField("email", e.target.value)}
									placeholder="nama@contoh.com"
									className={cn(
										fieldCls,
										errors.email && "border-[var(--color-error)]/50",
									)}
								/>
								{errors.email && <p className={errorCls}>{errors.email[0]}</p>}
							</div>
						</div>

						{/* Password */}
						<div>
							<label className={labelCls}>
								{mode === "create" ? "Password *" : "Password Baru"}
							</label>
							<input
								type="password"
								value={form.password}
								onChange={(e) => updateField("password", e.target.value)}
								placeholder={
									mode === "create"
										? "Minimal 8 karakter"
										: "Kosongkan jika tidak diubah"
								}
								className={cn(
									fieldCls,
									errors.password && "border-[var(--color-error)]/50",
								)}
								autoComplete="new-password"
							/>
							{errors.password ? (
								<p className={errorCls}>{errors.password[0]}</p>
							) : (
								mode === "edit" && (
									<p className="mt-1 text-[11px] text-[var(--color-fg-dim)]">
										Isi hanya untuk mereset password pengguna.
									</p>
								)
							)}
						</div>

						{/* Role */}
						<div>
							<label className={labelCls}>Role *</label>
							<div className="grid grid-cols-3 gap-3">
								{ROLE_OPTIONS.map((opt) => {
									const active = form.role === opt.value;
									return (
										<button
											key={opt.value}
											type="button"
											onClick={() => updateField("role", opt.value)}
											className={cn(
												"flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-[12px] font-medium transition-all",
												active
													? "border-[var(--color-accent)]/50 bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
													: "border-[var(--color-line)] text-[var(--color-fg-muted)] hover:border-[var(--color-line-strong)] hover:text-[var(--color-fg)]",
											)}
										>
											<span
												className="material-symbols-outlined text-[20px]"
												style={{
													fontVariationSettings:
														'"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 24',
												}}
											>
												{opt.icon}
											</span>
											{opt.label}
										</button>
									);
								})}
							</div>
							{errors.role && <p className={errorCls}>{errors.role[0]}</p>}
						</div>

						{/* Divider */}
						<div className="flex items-center gap-3">
							<div className="h-px flex-1 bg-[var(--color-line)]" />
							<span className="text-[9px] font-semibold uppercase tracking-widest text-[var(--color-fg-dim)]">
								Opsional
							</span>
							<div className="h-px flex-1 bg-[var(--color-line)]" />
						</div>

						{/* Row: Phone + Country */}
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<div>
								<label className={labelCls}>Telepon</label>
								<input
									type="text"
									value={form.phone}
									onChange={(e) => updateField("phone", e.target.value)}
									placeholder="+62 812 3456 7890"
									className={cn(
										fieldCls,
										errors.phone && "border-[var(--color-error)]/50",
									)}
								/>
								{errors.phone && <p className={errorCls}>{errors.phone[0]}</p>}
							</div>
							<div>
								<label className={labelCls}>Negara</label>
								<select
									value={form.country}
									onChange={(e) => updateField("country", e.target.value)}
									className={cn(
										selectCls,
										!form.country && "text-[var(--color-fg-dim)]",
									)}
								>
									<option value="">— Tidak diisi —</option>
									{COUNTRY_OPTIONS.map((c) => (
										<option key={c} value={c}>
											{c}
										</option>
									))}
								</select>
								{errors.country && (
									<p className={errorCls}>{errors.country[0]}</p>
								)}
							</div>
						</div>

						{/* Email verified toggle */}
						<div className="flex items-center gap-3">
							<button
								type="button"
								role="switch"
								aria-checked={form.email_verified}
								onClick={() =>
									updateField("email_verified", !form.email_verified)
								}
								className={cn(
									"relative h-6 w-11 rounded-full transition-colors duration-200",
									form.email_verified
										? "bg-[var(--color-accent)]"
										: "bg-[var(--color-line-strong)]",
								)}
							>
								<span
									className={cn(
										"absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200",
										form.email_verified
											? "translate-x-[22px]"
											: "translate-x-0.5",
									)}
								/>
							</button>
							<span className="text-[13px] text-[var(--color-fg-muted)]">
								Email terverifikasi{" "}
								{form.email_verified ? "" : "(belum diverifikasi)"}
							</span>
						</div>
					</div>

					{/* Footer */}
					<div className="flex items-center justify-end gap-3 border-t border-[var(--color-line)] px-6 py-4">
						<button
							type="button"
							onClick={onClose}
							className="rounded-lg border border-[var(--color-line)] px-4 py-2.5 text-[13px] font-medium text-[var(--color-fg-muted)] transition-colors hover:border-[var(--color-line-strong)] hover:text-[var(--color-fg)]"
						>
							Batal
						</button>
						<button
							type="submit"
							disabled={submitting}
							className={cn(
								"inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-[13px] font-semibold transition-all",
								"bg-[var(--color-accent)] text-[var(--color-accent-fg)] hover:brightness-110",
								"disabled:pointer-events-none disabled:opacity-50",
							)}
						>
							{submitting ? (
								<>
									<span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-t-transparent border-[var(--color-accent-fg)]" />
									{mode === "create" ? "Menyimpan..." : "Memperbarui..."}
								</>
							) : (
								<>
									<span
										className="material-symbols-outlined text-[16px]"
										style={{
											fontVariationSettings:
												'"FILL" 0, "wght" 400, "GRAD" 0, "opsz" 20',
										}}
									>
										{mode === "create" ? "person_add" : "save"}
									</span>
									{mode === "create" ? "Tambah Pengguna" : "Simpan Perubahan"}
								</>
							)}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}

const COUNTRY_OPTIONS = [
	"Indonesia",
	"Singapore",
	"Malaysia",
	"Japan",
	"South Korea",
	"India",
	"Vietnam",
	"Philippines",
	"Thailand",
	"Hong Kong",
	"UAE",
];

/* ═════════════════════════════════════════════════════════════════════════
   SUSPEND CONFIRMATION MODAL
   ═════════════════════════════════════════════════════════════════════════ */

interface SuspendConfirmModalProps {
	open: boolean;
	user: AdminUserData | null;
	onClose: () => void;
	onConfirm: () => void;
	processing: boolean;
}

export function SuspendConfirmModal({
	open,
	user,
	onClose,
	onConfirm,
	processing,
}: SuspendConfirmModalProps) {
	const handleKeyDown = useCallback(
		(e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		},
		[onClose],
	);

	useEffect(() => {
		if (open) {
			document.body.style.overflow = "hidden";
			document.addEventListener("keydown", handleKeyDown);
		}
		return () => {
			document.body.style.overflow = "";
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [open, handleKeyDown]);

	if (!open || !user) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			<div
				className="fixed inset-0 bg-black/60 backdrop-blur-[2px]"
				onClick={onClose}
				aria-hidden="true"
			/>
			<div className="relative z-50 w-full max-w-md rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] shadow-2xl">
				<div className="flex items-center gap-3 border-b border-[var(--color-line)] px-6 py-4">
					<div className="grid h-10 w-10 place-items-center rounded-xl border border-[var(--color-amber)]/20 bg-[rgba(245,179,71,0.1)]">
						<span
							className="material-symbols-outlined text-[20px] text-[var(--color-amber)]"
							style={{
								fontVariationSettings:
									'"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 20',
							}}
						>
							warning
						</span>
					</div>
					<div>
						<h2 className="text-[15px] font-bold text-[var(--color-fg)]">
							Nonaktifkan Pengguna
						</h2>
						<p className="text-[11px] text-[var(--color-fg-dim)]">
							Pengguna tidak dapat login sampai diaktifkan kembali
						</p>
					</div>
				</div>

				<div className="px-6 py-5">
					<p className="text-[13px] leading-relaxed text-[var(--color-fg-muted)]">
						Apakah kamu yakin ingin menonaktifkan{" "}
						<span className="font-semibold text-[var(--color-fg)]">
							{user.name}
						</span>
						?
					</p>

					<div className="mt-4 rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)] p-3">
						<div className="flex items-center gap-3">
							<div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-[var(--color-line)]">
								<span className="font-mono text-[9px] text-[var(--color-fg-dim)]">
									#{user.id}
								</span>
							</div>
							<div className="min-w-0 flex-1">
								<p className="truncate text-[13px] font-medium text-[var(--color-fg)]">
									{user.name}
								</p>
								<p className="truncate font-mono text-[10px] text-[var(--color-fg-dim)]">
									{user.email} · {user.role}
								</p>
							</div>
						</div>
					</div>
				</div>

				<div className="flex items-center justify-end gap-3 border-t border-[var(--color-line)] px-6 py-4">
					<button
						type="button"
						onClick={onClose}
						disabled={processing}
						className="rounded-lg border border-[var(--color-line)] px-4 py-2.5 text-[13px] font-medium text-[var(--color-fg-muted)] transition-colors hover:border-[var(--color-line-strong)] hover:text-[var(--color-fg)] disabled:opacity-50"
					>
						Batal
					</button>
					<button
						type="button"
						onClick={onConfirm}
						disabled={processing}
						className={cn(
							"inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-[13px] font-semibold transition-all",
							"bg-[var(--color-amber)] text-black hover:brightness-110",
							"disabled:pointer-events-none disabled:opacity-50",
						)}
					>
						{processing ? (
							<>
								<span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-t-transparent border-black" />
								Memproses...
							</>
						) : (
							<>
								<span
									className="material-symbols-outlined text-[16px]"
									style={{
										fontVariationSettings:
											'"FILL" 0, "wght" 400, "GRAD" 0, "opsz" 20',
									}}
								>
									block
								</span>
								Nonaktifkan
							</>
						)}
					</button>
				</div>
			</div>
		</div>
	);
}
