<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdminListingPriceResource extends JsonResource
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
            'price' => (float) ($this->gross_price_minor / 100),
            'gross_price_minor' => (int) $this->gross_price_minor,
            'currency' => $this->currency,
            'unit_label' => $this->billing_cycle === 'monthly' ? '/bulan' : '/tahun',
            'is_default' => $this->is_default,
        ];
    }
}
