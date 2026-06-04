<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ListingPrice extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_listing_id',
        'billing_cycle',
        'price',
        'currency',
        'unit_label',
        'is_default',
    ];

    protected $hidden = [
        'id',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'is_default' => 'boolean',
        ];
    }

    public function listing(): BelongsTo
    {
        return $this->belongsTo(ProductListing::class, 'product_listing_id');
    }
}
