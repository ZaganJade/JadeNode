<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProviderProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'public_id',
        'name',
        'slug',
        'description',
        'is_first_party',
        'is_verified',
        'is_active',
        'website_url',
        'support_email',
    ];

    protected $hidden = [
        'id',
    ];

    protected function casts(): array
    {
        return [
            'is_first_party' => 'boolean',
            'is_verified' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function listings(): HasMany
    {
        return $this->hasMany(ProductListing::class);
    }
}
