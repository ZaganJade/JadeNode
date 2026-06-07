<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdminProviderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'public_id' => $this->public_id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'is_first_party' => $this->is_first_party,
            'is_verified' => $this->is_verified,
            'is_active' => $this->is_active,
            'website_url' => $this->website_url,
            'support_email' => $this->support_email,
            'listings_count' => $this->whenCounted('listings') ?? $this->listings->count() ?? 0,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
