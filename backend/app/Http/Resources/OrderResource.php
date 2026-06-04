<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
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
            'order_number' => $this->order_number,
            'status' => $this->status,
            'billing_cycle' => $this->billing_cycle,
            'billing_start_date' => $this->billing_start_date?->toIso8601String(),
            'billing_end_date' => $this->billing_end_date?->toIso8601String(),
            'subtotal_minor' => $this->subtotal_minor,
            'currency' => $this->currency,
            'notes' => $this->notes,
            'items' => OrderItemResource::collection($this->whenLoaded('items')),
            'invoices' => InvoiceResource::collection($this->whenLoaded('invoices')),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
