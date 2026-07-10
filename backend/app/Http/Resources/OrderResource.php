<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * Shape aligns with the customer frontend Order/OrderDetail interfaces:
     * exposes `total` (minor units) and a top-level `provider` summary
     * derived from the first order item when eager-loaded.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        // Derive the order-level provider from the first loaded item.
        $firstItem = $this->relationLoaded('items') && $this->items->isNotEmpty()
            ? $this->items->first()
            : null;
        $provider = ($firstItem && $firstItem->relationLoaded('provider') && $firstItem->provider)
            ? [
                'name' => $firstItem->provider->name,
                'verified' => $firstItem->provider->verification_status === 'verified',
            ]
            : null;

        return [
            'public_id' => $this->public_id,
            'order_number' => $this->order_number,
            'status' => $this->status,
            'billing_cycle' => $this->billing_cycle,
            'billing_start_date' => $this->billing_start_date?->toIso8601String(),
            'billing_end_date' => $this->billing_end_date?->toIso8601String(),
            'total' => (int) ($this->subtotal_minor ?? 0),
            'currency' => $this->currency,
            'notes' => $this->notes,
            'provider' => $provider,
            'items' => OrderItemResource::collection($this->whenLoaded('items')),
            'invoice' => $this->whenLoaded('invoices', function () {
                $first = $this->invoices->first();

                return $first ? new InvoiceResource($first) : null;
            }),
            'invoices' => InvoiceResource::collection($this->whenLoaded('invoices')),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
