<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderItemResource extends JsonResource
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
            'product_snapshot' => $this->product_snapshot,
            'price_minor' => $this->price_minor,
            'commission_rate' => $this->commission_rate,
            'billing_cycle' => $this->billing_cycle,
            'currency' => $this->currency,
            'provider' => [
                'public_id' => $this->whenLoaded('provider')?->public_id,
                'name' => $this->whenLoaded('provider')?->name,
            ],
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
