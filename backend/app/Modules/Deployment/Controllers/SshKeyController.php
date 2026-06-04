<?php

namespace App\Modules\Deployment\Controllers;

use App\Http\Requests\CreateSshKeyRequest;
use App\Http\Resources\SshKeyResource;
use App\Modules\Deployment\Models\SshKey;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Str;

class SshKeyController
{
    /**
     * List user's SSH keys.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $keys = SshKey::where('user_id', $request->user()->id)
            ->latest()
            ->get();

        return SshKeyResource::collection($keys);
    }

    /**
     * Create a new SSH key.
     */
    public function store(CreateSshKeyRequest $request): JsonResponse
    {
        $publicKey = trim($request->input('public_key'));

        if (! SshKey::isValidPublicKey($publicKey)) {
            return response()->json([
                'message' => 'Format public key tidak valid. Pastikan format SSH key benar (ssh-rsa, ssh-ed25519, ssh-ecdsa, ssh-dss).',
            ], 422);
        }

        $fingerprint = SshKey::generateFingerprint($publicKey);

        // Check for duplicate fingerprint
        $duplicate = SshKey::where('user_id', $request->user()->id)
            ->where('fingerprint', $fingerprint)
            ->exists();

        if ($duplicate) {
            return response()->json([
                'message' => 'SSH key dengan fingerprint ini sudah terdaftar.',
            ], 422);
        }

        $sshKey = SshKey::create([
            'public_id' => Str::ulid()->toBase32(),
            'user_id' => $request->user()->id,
            'name' => $request->input('name'),
            'public_key' => $publicKey,
            'fingerprint' => $fingerprint,
        ]);

        return response()->json([
            'message' => 'SSH key berhasil ditambahkan.',
            'ssh_key' => new SshKeyResource($sshKey),
        ], 201);
    }

    /**
     * Delete an SSH key.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $sshKey = SshKey::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->first();

        if (! $sshKey) {
            return response()->json([
                'message' => 'SSH key tidak ditemukan.',
            ], 404);
        }

        $sshKey->delete();

        return response()->json([
            'message' => 'SSH key berhasil dihapus.',
        ]);
    }
}
