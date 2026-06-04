<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ListingPriceResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'billing_cycle' => $this->billing_cycle,
            'price' => (float) $this->price,
            'currency' => $this->currency,
            'unit_label' => $this->unit_label,
            'is_default' => $this->is_default,
        ];
    }
}
