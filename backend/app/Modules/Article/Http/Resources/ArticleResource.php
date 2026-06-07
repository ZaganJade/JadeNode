<?php

namespace App\Modules\Article\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ArticleResource extends JsonResource
{
    /**
     * Transform the resource into a JSON array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'public_id' => $this->public_id,
            'title' => $this->title,
            'slug' => $this->slug,
            'excerpt' => $this->excerpt,
            'body' => $this->when(
                $request->routeIs('*.show') || $request->routeIs('*.articles.show') || str_contains($request->path(), '/articles/'),
                $this->body
            ),
            'cover_image' => $this->cover_image,
            'category' => $this->category,
            'status' => $this->status,
            'reading_time' => $this->reading_time,
            'author' => [
                'name' => $this->whenLoaded('author', fn() => $this->author?->name),
            ],
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
