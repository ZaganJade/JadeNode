<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProductListing extends Model
{
    use HasFactory;

    protected $fillable = [
        'public_id',
        'provider_profile_id',
        'category_id',
        'resource_type_id',
        'name',
        'slug',
        'description',
        'region',
        'specs_summary',
        'availability_status',
        'provisioning_sla_hours',
        'is_active',
        'sort_order',
    ];

    protected $hidden = [
        'id',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'provisioning_sla_hours' => 'integer',
            'sort_order' => 'integer',
        ];
    }

    /**
     * Scope: only active listings.
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function provider(): BelongsTo
    {
        return $this->belongsTo(ProviderProfile::class, 'provider_profile_id');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function resourceType(): BelongsTo
    {
        return $this->belongsTo(ResourceType::class);
    }

    public function prices(): HasMany
    {
        return $this->hasMany(ListingPrice::class);
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(AdminAuditLog::class, 'subject_id')
            ->where('subject_type', static::class);
    }

    public function latestAuditLog()
    {
        return $this->hasOne(AdminAuditLog::class, 'subject_id')
            ->where('subject_type', static::class)
            ->latestOfMany();
    }
}
