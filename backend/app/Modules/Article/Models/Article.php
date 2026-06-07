<?php

namespace App\Modules\Article\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Article extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'public_id',
        'user_id',
        'title',
        'slug',
        'excerpt',
        'body',
        'cover_image',
        'category',
        'status',
        'reading_time',
    ];

    protected $hidden = [
        'id',
    ];

    protected static function booted(): void
    {
        static::creating(function (self $article) {
            if (empty($article->public_id)) {
                $article->public_id = 'art_' . Str::ulid();
            }
            if (empty($article->slug)) {
                $article->slug = Str::slug($article->title);
            }
            if ($article->reading_time === 0 || $article->reading_time === null) {
                $article->reading_time = max(1, (int) ceil(str_word_count(strip_tags($article->body)) / 200));
            }
        });

        static::updating(function (self $article) {
            if ($article->isDirty('title') && !$article->isDirty('slug')) {
                $article->slug = Str::slug($article->title);
            }
            if ($article->isDirty('body')) {
                $article->reading_time = max(1, (int) ceil(str_word_count(strip_tags($article->body)) / 200));
            }
        });
    }

    public function author()
    {
        return $this->belongsTo(\App\Models\User::class, 'user_id');
    }

    public function scopePublished($query)
    {
        return $query->where('status', 'published');
    }

    public function scopeArchived($query)
    {
        return $query->where('status', 'archived');
    }

    public function isPublished(): bool
    {
        return $this->status === 'published';
    }

    public function isArchived(): bool
    {
        return $this->status === 'archived';
    }
}
