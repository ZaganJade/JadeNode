<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
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
            'email' => $this->email,
            'email_verified' => $this->email_verified_at !== null,
            'email_verified_at' => $this->email_verified_at?->toIso8601String(),
            'role' => $this->role,
            'phone' => $this->phone,
            'country' => $this->country,
            'timezone' => $this->timezone,
            'suspended' => $this->isSuspended(),
            'suspended_at' => $this->suspended_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
