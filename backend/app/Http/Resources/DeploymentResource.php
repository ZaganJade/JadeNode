<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DeploymentResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'public_id' => $this->public_id,
            'status' => $this->status,
            'hostname' => $this->hostname,
            'ip_address' => $this->ip_address,
            'specs_snapshot' => $this->specs_snapshot,
            'billing_cycle' => $this->billing_cycle,
            'current_period_start' => $this->current_period_start?->toIso8601String(),
            'current_period_end' => $this->current_period_end?->toIso8601String(),
            'auto_renew' => $this->auto_renew,
            'cancelled_at' => $this->cancelled_at?->toIso8601String(),
            'expired_at' => $this->expired_at?->toIso8601String(),
            'provisioning_sla_hours' => $this->provisioning_sla_hours,
            'provisioning_tasks' => ProvisioningTaskResource::collection($this->whenLoaded('provisioningTasks')),
            'resource_actions' => ResourceActionResource::collection($this->whenLoaded('resourceActions')),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
