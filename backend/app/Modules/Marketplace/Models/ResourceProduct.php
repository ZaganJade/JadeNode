<?php

namespace App\Modules\Marketplace\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ResourceProduct extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'public_id',
        'provider_id',
        'category_id',
        'name',
        'slug',
        'description',
        'resource_type',
        'region',
        'availability_status',
        'provisioning_sla_hours',
        'display_priority',
        'is_active',
        'trust_indicators',
        'specs',
        'image',
    ];

    protected $hidden = [
        'id',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'trust_indicators' => 'array',
            'specs' => 'array',
        ];
    }

    public function provider()
    {
        return $this->belongsTo(\App\Modules\Provider\Models\Provider::class, 'provider_id');
    }

    public function category()
    {
        return $this->belongsTo(ProductCategory::class, 'category_id');
    }

    public function prices()
    {
        return $this->hasMany(\App\Modules\Order\Models\ProductPrice::class, 'product_id');
    }

    public function latestAuditLog()
    {
        return $this->hasOne(\App\Models\AdminAuditLog::class, 'subject_id')
            ->where('subject_type', static::class)
            ->latestOfMany();
    }
}
