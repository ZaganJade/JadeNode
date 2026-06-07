<?php

namespace App\Modules\Deployment\Controllers;

use App\Http\Resources\ResourceActionResource;
use App\Modules\Deployment\Models\Deployment;
use App\Modules\Deployment\Models\ResourceAction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ResourceActionController
{
    /**
     * Admin: List all resource actions across all deployments.
     */
    public function adminIndex(Request $request): AnonymousResourceCollection
    {
        $actions = ResourceAction::query()
            ->with(['deployment', 'user']);

        if ($request->filled('status')) {
            $actions->where('status', $request->input('status'));
        }

        return ResourceActionResource::collection(
            $actions->latest()->paginate(15)
        );
    }

    /**
     * List actions for a deployment.
     */
    public function index(Request $request, string $deploymentId): AnonymousResourceCollection
    {
        $deployment = Deployment::where('public_id', $deploymentId)
            ->where('user_id', $request->user()->id)
            ->first();

        if (! $deployment) {
            abort(404, 'Deployment tidak ditemukan.');
        }

        $actions = ResourceAction::where('deployment_id', $deployment->id)
            ->latest()
            ->paginate(15);

        return ResourceActionResource::collection($actions);
    }

    /**
     * Admin: Process a resource action (mark completed or failed).
     */
    public function process(Request $request, int $actionId): JsonResponse
    {
        $request->validate([
            'status' => 'required|string|in:completed,failed',
            'result' => 'nullable|string|max:2000',
        ]);

        $action = ResourceAction::findOrFail($actionId);

        if ($action->status !== 'pending' && $action->status !== 'processing') {
            return response()->json([
                'message' => 'Aksi sudah diproses.',
            ], 422);
        }

        $newStatus = $request->input('status');

        $action->update([
            'status' => $newStatus,
            'result' => $request->input('result'),
            'processed_by' => $request->user()->id,
            'processed_at' => now(),
        ]);

        // Update deployment status based on action
        $deployment = $action->deployment;

        if ($newStatus === 'completed') {
            match ($action->action_type) {
                'start' => $deployment->update(['status' => 'active']),
                'stop' => $deployment->update(['status' => 'stopped']),
                'restart' => $deployment->update(['status' => 'active']),
                default => null,
            };
        }

        return response()->json([
            'message' => 'Aksi berhasil diproses.',
            'action' => new ResourceActionResource($action->fresh()),
        ]);
    }
}
