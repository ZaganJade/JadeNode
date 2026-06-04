<?php

namespace App\Modules\Order\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductPrice extends Model
{
    use HasFactory;

    protected $fillable = [
        'public_id',
        'product_id',
        'billing_cycle',
        'gross_price_minor',
        'currency',
        'is_default',
    ];

    protected $hidden = [
        'id',
    ];

    protected function casts(): array
    {
        return [
            'is_default' => 'boolean',
        ];
    }

    public function product()
    {
        return $this->belongsTo(\App\Modules\Marketplace\Models\ResourceProduct::class, 'product_id');
    }
}
