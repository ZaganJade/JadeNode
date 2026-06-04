<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BetaAccessRequestResource extends JsonResource
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
            'user' => [
                'name' => $this->whenLoaded('user') ? $this->user->name : $this->user?->name,
                'email' => $this->whenLoaded('user') ? $this->user->email : $this->user?->email,
            ],
            'status' => $this->status,
            'reason' => $this->reason,
            'admin_reason' => $this->admin_reason ?? null,
            'reviewed_by' => $this->whenLoaded('reviewer')
                ? [
                    'name' => $this->reviewer->name,
                    'email' => $this->reviewer->email,
                ]
                : null,
            'reviewed_at' => $this->reviewed_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
