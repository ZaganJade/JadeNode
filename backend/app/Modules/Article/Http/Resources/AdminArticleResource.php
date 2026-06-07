<?php

namespace App\Modules\Article\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdminArticleResource extends JsonResource
{
    /**
     * Transform the resource for admin views.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'public_id' => $this->public_id,
            'title' => $this->title,
            'slug' => $this->slug,
            'excerpt' => $this->excerpt,
            'body' => $this->when(
                str_contains($request->path(), '/articles/') && !str_contains($request->path(), '/articles/archive'),
                $this->body
            ),
            'cover_image' => $this->cover_image,
            'category' => $this->category,
            'status' => $this->status,
            'reading_time' => $this->reading_time,
            'author' => [
                'id' => $this->whenLoaded('author', fn() => $this->author?->id),
                'name' => $this->whenLoaded('author', fn() => $this->author?->name),
            ],
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
            'deleted_at' => $this->deleted_at?->toIso8601String(),
        ];
    }
}
