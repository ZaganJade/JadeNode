<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ResourceProductResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        // Get the default price or first price
        $defaultPrice = $this->whenLoaded('prices')
            ? $this->prices->first(fn ($price) => $price->is_default) ?? $this->prices->first()
            : null;

        // Format specs based on resource type
        $specs = $this->formatSpecs();

        return [
            'id' => $this->public_id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'resource_type' => ucfirst($this->resource_type),
            'region' => $this->region,
            'specs' => $specs,
            'price' => $defaultPrice ? $this->formatPrice($defaultPrice->gross_price_minor) : 0,
            'billing_cycle' => $defaultPrice ? $defaultPrice->billing_cycle : 'monthly',
            'currency' => $defaultPrice ? $defaultPrice->currency : 'IDR',
            'availability' => $this->availability_status,
            'provisioning_sla' => $this->formatSla($this->provisioning_sla_hours),
            'provider' => [
                'name' => $this->whenLoaded('provider')?->name,
                'verified' => $this->whenLoaded('provider')?->verification_status === 'verified',
            ],
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }

    /**
     * Format specs based on resource type.
     */
    protected function formatSpecs(): array
    {
        $specs = $this->specs ?? [];

        // Handle VPS specs format
        if (isset($specs['cpu_cores'])) {
            return [
                'cpu' => $specs['cpu_cores'] . ' vCPU',
                'ram' => $specs['ram_gb'] . ' GB RAM',
                'storage' => ($specs['storage_gb'] ?? 0) . ' GB ' . ($specs['storage_type'] ?? 'SSD'),
            ];
        }

        // Handle Dedicated server specs format
        if (isset($specs['cpu'])) {
            return [
                'cpu' => $specs['cpu'],
                'ram' => ($specs['ram_gb'] ?? 0) . ' GB RAM',
                'storage' => $specs['storage'] ?? 'N/A',
            ];
        }

        // Fallback
        return [
            'cpu' => 'N/A',
            'ram' => 'N/A',
            'storage' => 'N/A',
        ];
    }

    /**
     * Format price from minor units to major units.
     */
    protected function formatPrice(int $priceMinor): float
    {
        return $priceMinor / 100;
    }

    /**
     * Format SLA hours to human-readable format.
     */
    protected function formatSla(int $hours): string
    {
        if ($hours < 24) {
            return $hours . ' jam';
        }
        $days = floor($hours / 24);
        return $days . ' ' . ($days === 1 ? 'hari' : 'hari');
    }
}
