<?php

namespace App\Modules\Provider\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Provider extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'public_id',
        'name',
        'slug',
        'description',
        'is_first_party',
        'status',
        'verification_status',
        'support_email',
        'website_url',
        'logo_path',
        'commission_rate',
    ];

    protected $hidden = [
        'id',
    ];

    protected function casts(): array
    {
        return [
            'is_first_party' => 'boolean',
            'commission_rate' => 'decimal:2',
        ];
    }

    public function products()
    {
        return $this->hasMany(\App\Modules\Marketplace\Models\ResourceProduct::class, 'provider_id');
    }
}
