<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderItemResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * Shape aligns with the customer frontend OrderItem interface:
     * product_name, specs, region, billing_cycle, unit_price, quantity, subtotal.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $snapshot = $this->product_snapshot ?? [];
        $quantity = (int) ($this->quantity ?? 1);
        $unitPrice = (int) ($this->price_minor ?? 0);
        $specs = $snapshot['specs'] ?? [];
        // Normalize specs to an object regardless of how it was stored.
        if (is_string($specs)) {
            $specs = $specs !== '' ? ['Spesifikasi' => $specs] : [];
        } elseif (! is_array($specs)) {
            $specs = [];
        }

        return [
            'public_id' => $this->public_id,
            'product_name' => $snapshot['name'] ?? null,
            'specs' => $specs,
            'region' => $snapshot['region'] ?? null,
            'resource_type' => $snapshot['resource_type'] ?? null,
            'billing_cycle' => $this->billing_cycle,
            'currency' => $this->currency,
            'unit_price' => $unitPrice,
            'quantity' => $quantity,
            'subtotal' => $unitPrice * $quantity,
            // provider is optional — only serialized when eager-loaded.
            'provider' => $this->whenLoaded('provider', fn () => [
                'name' => $this->provider->name,
                'verified' => $this->provider->verification_status === 'verified',
            ]),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
