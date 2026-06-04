<?php

namespace App\Modules\Admin\Controllers;

use App\Http\Requests\AdminBetaAccessReviewRequest;
use App\Http\Resources\BetaAccessRequestResource;
use App\Modules\Auth\Models\BetaAccessRequest;
use App\Notifications\BetaAccessDecisionNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminBetaAccessController
{
    /**
     * List pending beta access requests with user info.
     */
    public function index(Request $request): JsonResponse
    {
        $requests = BetaAccessRequest::with(['user', 'reviewer'])
            ->orderByDesc('created_at')
            ->paginate($request->input('per_page', 15));

        return response()->json([
            'data' => BetaAccessRequestResource::collection($requests),
            'meta' => [
                'current_page' => $requests->currentPage(),
                'last_page' => $requests->lastPage(),
                'per_page' => $requests->perPage(),
                'total' => $requests->total(),
            ],
        ]);
    }

    /**
     * Review (approve or reject) a beta access request.
     */
    public function review(AdminBetaAccessReviewRequest $httpRequest, int $id): JsonResponse
    {
        $betaRequest = BetaAccessRequest::with(['user', 'reviewer'])->find($id);

        if (! $betaRequest) {
            return response()->json([
                'message' => 'Permintaan beta access tidak ditemukan.',
            ], 404);
        }

        if ($betaRequest->status !== 'pending') {
            return response()->json([
                'message' => 'Permintaan ini sudah ditinjau.',
            ], 409);
        }

        $newStatus = $httpRequest->input('status');
        $adminReason = $httpRequest->input('admin_reason');

        $betaRequest->update([
            'status' => $newStatus,
            'admin_reason' => $adminReason,
            'reviewed_by' => $httpRequest->user()->id,
            'reviewed_at' => now(),
        ]);

        // Reload relationships after update
        $betaRequest->load(['user', 'reviewer']);

        // Notify the user about the decision
        $betaRequest->user->notify(
            new BetaAccessDecisionNotification($betaRequest, $adminReason)
        );

        return response()->json([
            'message' => $newStatus === 'approved'
                ? 'Permintaan beta access disetujui.'
                : 'Permintaan beta access ditolak.',
            'request' => new BetaAccessRequestResource($betaRequest),
        ]);
    }
}
