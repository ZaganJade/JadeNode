<?php

namespace App\Modules\Auth\Controllers;

use App\Http\Requests\BetaAccessRequestRequest;
use App\Http\Resources\BetaAccessRequestResource;
use App\Modules\Auth\Models\BetaAccessRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class BetaAccessController
{
    /**
     * Submit a new beta access request.
     *
     * The user must be verified and must not have an active (pending or approved) request.
     */
    public function request(BetaAccessRequestRequest $httpRequest): JsonResponse
    {
        $user = $httpRequest->user();

        if (! $user->hasVerifiedEmail()) {
            return response()->json([
                'message' => 'Email belum terverifikasi. Silakan verifikasi email kamu terlebih dahulu.',
            ], 403);
        }

        // Check for existing active request
        $existingActive = BetaAccessRequest::forUser($user->id)->active()->first();

        if ($existingActive) {
            return response()->json([
                'message' => 'Kamu sudah memiliki permintaan beta access yang aktif.',
                'request' => new BetaAccessRequestResource($existingActive),
            ], 409);
        }

        $betaRequest = BetaAccessRequest::create([
            'user_id' => $user->id,
            'status' => 'pending',
            'reason' => $httpRequest->input('reason'),
            'public_id' => Str::ulid()->toBase32(),
        ]);

        return response()->json([
            'message' => 'Permintaan beta access berhasil dikirim.',
            'request' => new BetaAccessRequestResource($betaRequest),
        ], 201);
    }

    /**
     * Get the current user's beta access status.
     */
    public function status(Request $request): JsonResponse
    {
        $user = $request->user();

        $latestRequest = BetaAccessRequest::forUser($user->id)
            ->latest()
            ->first();

        if (! $latestRequest) {
            return response()->json([
                'status' => 'none',
                'request' => null,
            ]);
        }

        return response()->json([
            'status' => $latestRequest->status,
            'request' => new BetaAccessRequestResource($latestRequest),
        ]);
    }
}
