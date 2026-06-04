<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ListingResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'public_id' => $this->public_id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'region' => $this->region,
            'specs_summary' => $this->specs_summary,
            'provisioning_sla_hours' => $this->provisioning_sla_hours,
            'is_active' => $this->is_active,
            'provider' => [
                'public_id' => $this->whenLoaded('provider')?->public_id,
                'name' => $this->whenLoaded('provider')?->name,
                'is_verified' => $this->whenLoaded('provider')?->is_verified,
            ],
            'category' => [
                'slug' => $this->whenLoaded('category')?->slug,
                'name' => $this->whenLoaded('category')?->name,
            ],
            'resource_type' => [
                'slug' => $this->whenLoaded('resourceType')?->slug,
                'name' => $this->whenLoaded('resourceType')?->name,
            ],
            'prices' => ListingPriceResource::collection($this->whenLoaded('prices')),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
