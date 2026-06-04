<?php

namespace App\Modules\Deployment\Services;

use App\Modules\Deployment\Models\Deployment;
use App\Modules\Deployment\Models\ProvisioningTask;
use App\Modules\Marketplace\Models\ResourceProduct;
use App\Modules\Order\Models\Order;
use App\Modules\Order\Models\OrderItem;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class DeploymentService
{
    /**
     * Create a Deployment and ProvisioningTask from a paid Order.
     *
     * Idempotent: if a deployment already exists for this order, skip.
     */
    public function createFromPaidOrder(Order $order): ?Deployment
    {
        // Load items if not already loaded
        $order->loadMissing('items');

        $orderItem = $order->items->first();

        if (! $orderItem) {
            Log::warning('Cannot create deployment: order has no items.', [
                'order_id' => $order->id,
            ]);

            return null;
        }

        // Idempotency: check if deployment already exists for this order
        $existingDeployment = Deployment::where('order_id', $order->id)->first();

        if ($existingDeployment) {
            Log::info('Deployment already exists for order, skipping.', [
                'order_id' => $order->id,
                'deployment_id' => $existingDeployment->id,
            ]);

            return $existingDeployment;
        }

        // Load product for specs and SLA
        $product = ResourceProduct::with('provider')->find($orderItem->product_id);

        if (! $product) {
            Log::warning('Cannot create deployment: product not found.', [
                'order_id' => $order->id,
                'product_id' => $orderItem->product_id,
            ]);

            return null;
        }

        $slaHours = $product->provisioning_sla_hours ?? 24;

        // Create Deployment
        $deployment = Deployment::create([
            'public_id' => Str::ulid()->toBase32(),
            'user_id' => $order->user_id,
            'order_id' => $order->id,
            'order_item_id' => $orderItem->id,
            'product_id' => $orderItem->product_id,
            'provider_id' => $orderItem->provider_id,
            'status' => 'pending_provisioning',
            'specs_snapshot' => $product->specs,
            'billing_cycle' => $orderItem->billing_cycle,
            'current_period_start' => now()->toDateString(),
            'current_period_end' => $this->calculatePeriodEnd($orderItem->billing_cycle),
            'auto_renew' => true,
            'provisioning_sla_hours' => $slaHours,
        ]);

        // Create ProvisioningTask
        ProvisioningTask::create([
            'public_id' => Str::ulid()->toBase32(),
            'deployment_id' => $deployment->id,
            'status' => 'pending',
            'due_at' => now()->addHours($slaHours),
            'overdue_at' => now()->addHours($slaHours + 12), // 12h buffer after SLA
        ]);

        Log::info('Deployment and provisioning task created.', [
            'order_id' => $order->id,
            'deployment_id' => $deployment->id,
        ]);

        return $deployment;
    }

    /**
     * Transition a provisioning task to provisioning state.
     */
    public function markProvisioning(ProvisioningTask $task): void
    {
        if ($task->status !== 'pending') {
            return;
        }

        $task->update([
            'status' => 'provisioning',
            'started_at' => now(),
        ]);

        $task->deployment->update([
            'status' => 'provisioning',
        ]);

        Log::info('Provisioning task started.', [
            'task_id' => $task->id,
            'deployment_id' => $task->deployment_id,
        ]);
    }

    /**
     * Complete a provisioning task and set deployment active.
     */
    public function markActive(ProvisioningTask $task, string $hostname, string $ipAddress, ?string $credential): void
    {
        if ($task->status !== 'provisioning') {
            return;
        }

        $task->update([
            'status' => 'completed',
            'completed_at' => now(),
            'result_data' => [
                'hostname' => $hostname,
                'ip_address' => $ipAddress,
            ],
        ]);

        $task->deployment->update([
            'status' => 'active',
            'hostname' => $hostname,
            'ip_address' => $ipAddress,
            'access_credential_encrypted' => $credential,
        ]);

        Log::info('Provisioning task completed, deployment activated.', [
            'task_id' => $task->id,
            'deployment_id' => $task->deployment_id,
        ]);
    }

    /**
     * Fail a provisioning task and mark deployment as failed.
     */
    public function markFailed(ProvisioningTask $task, string $reason): void
    {
        if (! in_array($task->status, ['pending', 'provisioning'])) {
            return;
        }

        $task->update([
            'status' => 'failed',
            'completed_at' => now(),
            'failure_reason' => $reason,
        ]);

        $task->deployment->update([
            'status' => 'failed',
        ]);

        Log::info('Provisioning task failed.', [
            'task_id' => $task->id,
            'deployment_id' => $task->deployment_id,
            'reason' => $reason,
        ]);
    }

    /**
     * Calculate the period end date based on billing cycle.
     */
    private function calculatePeriodEnd(string $billingCycle): string
    {
        return match ($billingCycle) {
            'monthly' => now()->addMonth()->toDateString(),
            'yearly' => now()->addYear()->toDateString(),
            default => now()->addMonth()->toDateString(),
        };
    }
}
