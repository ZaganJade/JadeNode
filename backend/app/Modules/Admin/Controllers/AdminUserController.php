<?php

namespace App\Modules\Admin\Controllers;

use App\Http\Requests\AdminStoreUserRequest;
use App\Http\Requests\AdminUpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\AdminAuditLog;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AdminUserController
{
    /**
     * List all users with search and filters.
     */
    public function index(Request $request): JsonResponse
    {
        $query = User::query();

        // Search by name or email
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                  ->orWhere('email', 'ilike', "%{$search}%");
            });
        }

        // Filter by role
        if ($request->filled('role')) {
            $query->where('role', $request->input('role'));
        }

        // Filter by email verification status
        if ($request->filled('verified')) {
            if (filter_var($request->input('verified'), FILTER_VALIDATE_BOOLEAN)) {
                $query->whereNotNull('email_verified_at');
            } else {
                $query->whereNull('email_verified_at');
            }
        }

        // Filter by suspension status
        if ($request->filled('suspended')) {
            if (filter_var($request->input('suspended'), FILTER_VALIDATE_BOOLEAN)) {
                $query->whereNotNull('suspended_at');
            } else {
                $query->whereNull('suspended_at');
            }
        }

        $users = $query
            ->orderBy('created_at', 'desc')
            ->paginate($request->input('per_page', 15));

        return response()->json([
            'data' => UserResource::collection($users->items()),
            'meta' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
            ],
        ]);
    }

    /**
     * Show a single user.
     */
    public function show(int $id): JsonResponse
    {
        $user = User::find($id);

        if (! $user) {
            return response()->json([
                'message' => 'Pengguna tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'data' => new UserResource($user),
        ]);
    }

    /**
     * Create a new user. Audit logs the creation.
     */
    public function store(AdminStoreUserRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $user = new User();
        $user->public_id = (string) Str::ulid();
        $user->name = $validated['name'];
        $user->email = $validated['email'];
        $user->password = $validated['password'];
        $user->role = $validated['role'];
        $user->phone = $validated['phone'] ?? null;
        $user->country = $validated['country'] ?? null;
        $user->timezone = 'UTC';

        if (isset($validated['email_verified']) && $validated['email_verified']) {
            $user->email_verified_at = now();
        }

        $user->save();

        AdminAuditLog::create([
            'user_id' => $request->user()->id,
            'action' => 'user_created',
            'subject_type' => User::class,
            'subject_id' => $user->id,
            'payload' => [
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ],
        ]);

        return response()->json([
            'message' => 'Pengguna berhasil dibuat.',
            'data' => new UserResource($user),
        ], 201);
    }

    /**
     * Update an existing user. Audit logs the change.
     */
    public function update(AdminUpdateUserRequest $request, int $id): JsonResponse
    {
        $user = User::find($id);

        if (! $user) {
            return response()->json([
                'message' => 'Pengguna tidak ditemukan.',
            ], 404);
        }

        $validated = $request->validated();
        $changes = [];

        foreach (['name', 'email', 'role', 'phone', 'country'] as $field) {
            if (array_key_exists($field, $validated) && $user->{$field} !== $validated[$field]) {
                $changes[$field] = ['old' => $user->{$field}, 'new' => $validated[$field]];
                $user->{$field} = $validated[$field];
            }
        }

        // Password reset only when a non-empty value is provided.
        if (array_key_exists('password', $validated) && filled($validated['password'])) {
            $user->password = $validated['password'];
            $changes['password'] = ['reset' => true];
        }

        // Force email verification toggle.
        if (array_key_exists('email_verified', $validated)) {
            $wantVerified = (bool) $validated['email_verified'];
            if ($wantVerified && $user->email_verified_at === null) {
                $user->email_verified_at = now();
                $changes['email_verified'] = ['old' => false, 'new' => true];
            } elseif (! $wantVerified && $user->email_verified_at !== null) {
                $user->email_verified_at = null;
                $changes['email_verified'] = ['old' => true, 'new' => false];
            }
        }

        if (! empty($changes)) {
            $user->save();

            AdminAuditLog::create([
                'user_id' => $request->user()->id,
                'action' => 'user_updated',
                'subject_type' => User::class,
                'subject_id' => $user->id,
                'payload' => ['changes' => $changes],
            ]);
        }

        return response()->json([
            'message' => 'Pengguna berhasil diperbarui.',
            'data' => new UserResource($user),
        ]);
    }

    /**
     * Suspend a user (soft "delete"). Guarded so admins cannot suspend
     * themselves or other operational admins.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $user = User::find($id);

        if (! $user) {
            return response()->json([
                'message' => 'Pengguna tidak ditemukan.',
            ], 404);
        }

        $actor = $request->user();

        // Guard: cannot suspend yourself.
        if ($user->id === $actor->id) {
            return response()->json([
                'message' => 'Kamu tidak dapat menonaktifkan akunmu sendiri.',
            ], 403);
        }

        // Guard: cannot suspend operational admins (prevents lockout).
        if ($user->isAdmin()) {
            return response()->json([
                'message' => 'Menonaktifkan akun admin tidak diizinkan.',
            ], 403);
        }

        $user->suspended_at = now();
        $user->save();

        AdminAuditLog::create([
            'user_id' => $actor->id,
            'action' => 'user_suspended',
            'subject_type' => User::class,
            'subject_id' => $user->id,
            'payload' => [
                'name' => $user->name,
                'email' => $user->email,
            ],
        ]);

        return response()->json([
            'message' => 'Pengguna berhasil dinonaktifkan.',
        ]);
    }

    /**
     * Restore a previously suspended user.
     */
    public function restore(Request $request, int $id): JsonResponse
    {
        $user = User::find($id);

        if (! $user) {
            return response()->json([
                'message' => 'Pengguna tidak ditemukan.',
            ], 404);
        }

        $user->suspended_at = null;
        $user->save();

        AdminAuditLog::create([
            'user_id' => $request->user()->id,
            'action' => 'user_restored',
            'subject_type' => User::class,
            'subject_id' => $user->id,
            'payload' => [
                'name' => $user->name,
                'email' => $user->email,
            ],
        ]);

        return response()->json([
            'message' => 'Pengguna berhasil diaktifkan kembali.',
            'data' => new UserResource($user),
        ]);
    }

    /**
     * Force-verify a user's email.
     */
    public function verifyEmail(Request $request, int $id): JsonResponse
    {
        $user = User::find($id);

        if (! $user) {
            return response()->json([
                'message' => 'Pengguna tidak ditemukan.',
            ], 404);
        }

        $user->email_verified_at = now();
        $user->save();

        AdminAuditLog::create([
            'user_id' => $request->user()->id,
            'action' => 'user_email_verified',
            'subject_type' => User::class,
            'subject_id' => $user->id,
            'payload' => [
                'email' => $user->email,
            ],
        ]);

        return response()->json([
            'message' => 'Email pengguna berhasil diverifikasi.',
            'data' => new UserResource($user),
        ]);
    }
}
