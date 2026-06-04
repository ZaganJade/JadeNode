<?php

namespace App\Modules\Deployment\Controllers;

use App\Http\Requests\CompleteProvisioningRequest;
use App\Http\Resources\ProvisioningTaskResource;
use App\Modules\Deployment\Models\ProvisioningTask;
use App\Modules\Deployment\Services\DeploymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ProvisioningController
{
    public function __construct(
        private DeploymentService $deploymentService,
    ) {}

    /**
     * Admin: List all provisioning tasks with filters.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = ProvisioningTask::with(['deployment', 'assignee']);

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('deployment_id')) {
            $query->where('deployment_id', $request->input('deployment_id'));
        }

        $tasks = $query->latest()->paginate(15);

        return ProvisioningTaskResource::collection($tasks);
    }

    /**
     * Admin: Mark a provisioning task as started (provisioning).
     */
    public function start(Request $request, int $taskId): JsonResponse
    {
        $task = ProvisioningTask::findOrFail($taskId);

        if ($task->status !== 'pending') {
            return response()->json([
                'message' => 'Task tidak dalam status pending.',
            ], 422);
        }

        $this->deploymentService->markProvisioning($task);

        $task->refresh();

        return response()->json([
            'message' => 'Provisioning dimulai.',
            'task' => new ProvisioningTaskResource($task),
        ]);
    }

    /**
     * Admin: Mark a provisioning task as completed.
     */
    public function complete(CompleteProvisioningRequest $request, int $taskId): JsonResponse
    {
        $task = ProvisioningTask::findOrFail($taskId);

        if ($task->status !== 'provisioning') {
            return response()->json([
                'message' => 'Task tidak dalam status provisioning.',
            ], 422);
        }

        $this->deploymentService->markActive(
            $task,
            $request->input('hostname'),
            $request->input('ip_address'),
            $request->input('credential'),
        );

        $task->refresh();

        return response()->json([
            'message' => 'Provisioning selesai, deployment aktif.',
            'task' => new ProvisioningTaskResource($task),
        ]);
    }

    /**
     * Admin: Mark a provisioning task as failed.
     */
    public function fail(Request $request, int $taskId): JsonResponse
    {
        $request->validate([
            'reason' => 'required|string|max:2000',
        ]);

        $task = ProvisioningTask::findOrFail($taskId);

        if (! in_array($task->status, ['pending', 'provisioning'])) {
            return response()->json([
                'message' => 'Task tidak dapat di-fail dari status saat ini.',
            ], 422);
        }

        $this->deploymentService->markFailed($task, $request->input('reason'));

        $task->refresh();

        return response()->json([
            'message' => 'Provisioning gagal.',
            'task' => new ProvisioningTaskResource($task),
        ]);
    }
}
