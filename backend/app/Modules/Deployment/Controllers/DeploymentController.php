<?php

namespace App\Modules\Deployment\Controllers;

use App\Http\Requests\ResourceActionRequest;
use App\Http\Resources\DeploymentResource;
use App\Http\Resources\ResourceActionResource;
use App\Modules\Deployment\Models\Deployment;
use App\Modules\Deployment\Models\ResourceAction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Str;

class DeploymentController
{
    /**
     * Customer: List own deployments.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $deployments = Deployment::where('user_id', $request->user()->id)
            ->with(['provisioningTasks', 'resourceActions'])
            ->latest()
            ->paginate(15);

        return DeploymentResource::collection($deployments);
    }

    /**
     * Customer: Show deployment detail.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $deployment = Deployment::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->with(['provisioningTasks', 'resourceActions'])
            ->first();

        if (! $deployment) {
            return response()->json([
                'message' => 'Deployment tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'deployment' => new DeploymentResource($deployment),
        ]);
    }

    /**
     * Customer: Request a resource action (start/stop/restart).
     */
    public function requestAction(ResourceActionRequest $request, int $id): JsonResponse
    {
        $deployment = Deployment::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->first();

        if (! $deployment) {
            return response()->json([
                'message' => 'Deployment tidak ditemukan.',
            ], 404);
        }

        if (! in_array($deployment->status, ['active', 'stopped'])) {
            return response()->json([
                'message' => 'Deployment tidak dalam status yang memungkinkan aksi ini.',
            ], 422);
        }

        $actionType = $request->input('action_type');

        // Validate action makes sense for current status
        if ($actionType === 'start' && $deployment->status !== 'stopped') {
            return response()->json([
                'message' => 'Deployment harus dalam status stopped untuk di-start.',
            ], 422);
        }

        if ($actionType === 'stop' && $deployment->status !== 'active') {
            return response()->json([
                'message' => 'Deployment harus dalam status active untuk di-stop.',
            ], 422);
        }

        if ($actionType === 'restart' && $deployment->status !== 'active') {
            return response()->json([
                'message' => 'Deployment harus dalam status active untuk di-restart.',
            ], 422);
        }

        $action = ResourceAction::create([
            'public_id' => Str::ulid()->toBase32(),
            'deployment_id' => $deployment->id,
            'user_id' => $request->user()->id,
            'action_type' => $actionType,
            'status' => 'pending',
            'reason' => $request->input('reason'),
        ]);

        return response()->json([
            'message' => 'Aksi berhasil diminta.',
            'action' => new ResourceActionResource($action),
        ], 201);
    }

    /**
     * Customer: Cancel at period end (disable auto-renewal).
     */
    public function cancelAtPeriodEnd(Request $request, int $id): JsonResponse
    {
        $deployment = Deployment::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->first();

        if (! $deployment) {
            return response()->json([
                'message' => 'Deployment tidak ditemukan.',
            ], 404);
        }

        if ($deployment->status !== 'active') {
            return response()->json([
                'message' => 'Deployment harus dalam status active untuk dibatalkan.',
            ], 422);
        }

        if (! $deployment->auto_renew) {
            return response()->json([
                'message' => 'Auto-renewal sudah nonaktif untuk deployment ini.',
            ], 422);
        }

        $deployment->update([
            'auto_renew' => false,
            'cancelled_at' => now(),
        ]);

        return response()->json([
            'message' => 'Deployment akan berakhir pada akhir periode billing.',
            'deployment' => new DeploymentResource($deployment->fresh()),
        ]);
    }
}
