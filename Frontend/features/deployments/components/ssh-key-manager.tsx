"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────────────────────────

interface SshKey {
  id: string;
  name: string;
  fingerprint: string;
  public_key: string;
  created_at: string;
}

interface SshKeyManagerProps {
  /** Initial list of SSH keys */
  initialKeys?: SshKey[];
  /** API base for SSH key operations */
  apiBase?: string;
  className?: string;
}

// ─── Key format validation ──────────────────────────────────────────────────

function validatePublicKey(key: string): string | null {
  const trimmed = key.trim();
  if (!trimmed) return "Public key tidak boleh kosong.";

  // Basic SSH public key format: type + base64 + optional comment
  const sshKeyPattern =
    /^(ssh-(rsa|ed25519|dss|ecdsa(-sk)?)|ecdsa-sk)\s+[A-Za-z0-9+/]+=*\s*.*/;
  if (!sshKeyPattern.test(trimmed)) {
    return "Format public key tidak valid. Pastikan format: ssh-xxx AAAA... comment";
  }

  return null;
}

// ─── Format date ────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

// ─── Component ──────────────────────────────────────────────────────────────

export function SshKeyManager({
  initialKeys = [],
  apiBase = "/api/v1/ssh-keys",
  className,
}: SshKeyManagerProps) {
  const [keys, setKeys] = useState<SshKey[]>(initialKeys);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyValue, setNewKeyValue] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [addLoading, setAddLoading] = useState(false);

  // Delete state
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  // ── Add key ─────────────────────────────────────────────────────────────
  const handleAddKey = useCallback(async () => {
    setAddError(null);

    if (!newKeyName.trim()) {
      setAddError("Nama key wajib diisi.");
      return;
    }

    const keyError = validatePublicKey(newKeyValue);
    if (keyError) {
      setAddError(keyError);
      return;
    }

    setAddLoading(true);
    try {
      const res = await fetch(apiBase, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newKeyName.trim(),
          public_key: newKeyValue.trim(),
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(
          body && "message" in body
            ? String(body.message)
            : "Gagal menambahkan SSH key.",
        );
      }

      const created = await res.json();
      setKeys((prev) => [...prev, created]);
      setNewKeyName("");
      setNewKeyValue("");
      setShowAddForm(false);
    } catch (err) {
      setAddError(
        err instanceof Error ? err.message : "Gagal menambahkan SSH key.",
      );
    } finally {
      setAddLoading(false);
    }
  }, [newKeyName, newKeyValue, apiBase]);

  // ── Delete key ──────────────────────────────────────────────────────────
  const handleDeleteKey = useCallback(
    async (keyId: string) => {
      setDeleteLoading(keyId);
      setError(null);

      try {
        const res = await fetch(`${apiBase}/${keyId}`, {
          method: "DELETE",
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error("Gagal menghapus SSH key.");
        }

        setKeys((prev) => prev.filter((k) => k.id !== keyId));
        setDeleteConfirm(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Gagal menghapus SSH key.",
        );
      } finally {
        setDeleteLoading(null);
      }
    },
    [apiBase],
  );

  return (
    <div
      className={cn(
        "rounded-xl border border-[rgba(255,191,0,0.08)] bg-[rgba(25,20,0,0.4)] p-4 backdrop-blur-[24px]",
        className,
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-[#FFBF00]/60">
          SSH Keys
        </h3>
        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="rounded-md border border-[rgba(255,191,0,0.12)] bg-[rgba(25,20,0,0.6)] px-3 py-1 text-[10px] font-medium text-[#FFBF00] transition-colors hover:bg-[rgba(255,191,0,0.08)]"
        >
          {showAddForm ? "Batal" : "+ Tambah Key"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <p className="mb-3 text-xs text-[#ffb5ab]">{error}</p>
      )}

      {/* Add form */}
      {showAddForm && (
        <div className="mb-4 rounded-lg border border-[rgba(255,191,0,0.1)] bg-[rgba(13,11,0,0.4)] p-4 space-y-3">
          <div>
            <label className="block mb-1 text-[10px] font-medium uppercase tracking-wider text-[#F5F5F0]/40">
              Nama Key
            </label>
            <input
              type="text"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="contoh: laptop-personal"
              className="block w-full rounded-md border border-[rgba(255,191,0,0.1)] bg-[rgba(13,11,0,0.6)] px-3 py-2 text-sm text-[#F5F5F0] placeholder:text-[#F5F5F0]/20 focus:border-[#FFBF00]/30 focus:outline-none focus:ring-1 focus:ring-[#FFBF00]/20"
            />
          </div>
          <div>
            <label className="block mb-1 text-[10px] font-medium uppercase tracking-wider text-[#F5F5F0]/40">
              Public Key
            </label>
            <textarea
              value={newKeyValue}
              onChange={(e) => setNewKeyValue(e.target.value)}
              placeholder="ssh-ed25519 AAAAC3NzaC1lZDI1NTE5... user@host"
              rows={3}
              className="block w-full rounded-md border border-[rgba(255,191,0,0.1)] bg-[rgba(13,11,0,0.6)] px-3 py-2 font-mono text-xs text-[#F5F5F0] placeholder:text-[#F5F5F0]/20 focus:border-[#FFBF00]/30 focus:outline-none focus:ring-1 focus:ring-[#FFBF00]/20 resize-none"
            />
          </div>

          {addError && (
            <p className="text-xs text-[#ffb5ab]">{addError}</p>
          )}

          <button
            type="button"
            onClick={handleAddKey}
            disabled={addLoading}
            className="rounded-md bg-[#FFBF00] px-4 py-2 text-xs font-semibold text-[#0D0B00] transition-all hover:shadow-[0_0_16px_rgba(255,191,0,0.25)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {addLoading ? "Menambahkan..." : "Tambah SSH Key"}
          </button>
        </div>
      )}

      {/* Key list */}
      {keys.length === 0 && !showAddForm ? (
        <p className="text-xs text-[#F5F5F0]/30 py-4 text-center">
          Belum ada SSH key. Tambahkan key untuk akses deployment.
        </p>
      ) : (
        <div className="space-y-2">
          {keys.map((key) => (
            <div
              key={key.id}
              className="flex items-center justify-between rounded-lg border border-[rgba(255,191,0,0.06)] bg-[rgba(13,11,0,0.3)] px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <svg
                    className="h-4 w-4 shrink-0 text-[#FFBF00]/40"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"
                    />
                  </svg>
                  <span className="text-sm font-medium text-[#F5F5F0] truncate">
                    {key.name}
                  </span>
                </div>
                <p className="mt-1 font-mono text-[10px] text-[#F5F5F0]/30 truncate">
                  {key.fingerprint}
                </p>
                <p className="mt-0.5 text-[10px] text-[#F5F5F0]/20">
                  Ditambahkan {formatDate(key.created_at)}
                </p>
              </div>

              {/* Delete */}
              {deleteConfirm === key.id ? (
                <div className="flex items-center gap-2 ml-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleDeleteKey(key.id)}
                    disabled={deleteLoading === key.id}
                    className="rounded bg-[#ffb5ab]/15 px-2 py-1 text-[10px] font-medium text-[#ffb5ab] transition-colors hover:bg-[#ffb5ab]/25 disabled:opacity-50"
                  >
                    {deleteLoading === key.id ? "..." : "Hapus"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirm(null)}
                    className="rounded px-2 py-1 text-[10px] font-medium text-[#F5F5F0]/40 transition-colors hover:text-[#F5F5F0]"
                  >
                    Batal
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setDeleteConfirm(key.id)}
                  className="ml-3 shrink-0 rounded p-1 text-[#F5F5F0]/20 transition-colors hover:text-[#ffb5ab]"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                    />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
