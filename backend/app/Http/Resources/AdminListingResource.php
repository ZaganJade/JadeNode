<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdminListingResource extends JsonResource
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
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'region' => $this->region,
            'specs_summary' => is_array($this->specs) ? implode(', ', $this->specs) : $this->specs,
            'availability_status' => $this->availability_status,
            'provisioning_sla_hours' => $this->provisioning_sla_hours,
            'is_active' => $this->is_active,
            'sort_order' => $this->display_priority,
            'provider' => [
                'public_id' => $this->whenLoaded('provider')?->public_id,
                'name' => $this->whenLoaded('provider')?->name,
            ],
            'category' => [
                'public_id' => $this->whenLoaded('category')?->public_id,
                'slug' => $this->whenLoaded('category')?->slug,
                'name' => $this->whenLoaded('category')?->name,
            ],
            'resource_type' => $this->resource_type ? [
                'slug' => $this->resource_type,
                'name' => ucfirst(str_replace('_', ' ', $this->resource_type)),
            ] : null,
            'prices' => AdminListingPriceResource::collection($this->whenLoaded('prices')),
            'last_audit' => $this->when($this->relationLoaded('latestAuditLog') && $this->latestAuditLog, function () {
                $log = $this->latestAuditLog;
                return [
                    'action' => $log->action,
                    'payload' => $log->payload,
                    'changed_at' => $log->created_at?->toIso8601String(),
                    'changed_by' => $log->relationLoaded('user') && $log->user ? [
                        'id' => $log->user->id,
                        'name' => $log->user->name,
                    ] : null,
                ];
            }),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
