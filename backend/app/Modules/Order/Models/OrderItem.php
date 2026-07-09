<?php

namespace App\Modules\Order\Models;

use App\Models\ProviderProfile;
use App\Modules\Marketplace\Models\ResourceProduct;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderItem extends Model
{
    use HasFactory;

    /**
     * Resolve the factory from the flat Database\Factories namespace.
     */
    protected static function newFactory()
    {
        return \Database\Factories\OrderItemFactory::new();
    }

    protected $fillable = [
        'public_id',
        'order_id',
        'product_id',
        'provider_id',
        'product_snapshot',
        'price_minor',
        'commission_rate',
        'commission_minor',
        'billing_cycle',
        'currency',
    ];

    protected $hidden = [
        'id',
    ];

    protected function casts(): array
    {
        return [
            'product_snapshot' => 'array',
            'price_minor' => 'integer',
            'commission_rate' => 'decimal:2',
            'commission_minor' => 'integer',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(ResourceProduct::class, 'product_id');
    }

    public function provider(): BelongsTo
    {
        return $this->belongsTo(ProviderProfile::class, 'provider_id');
    }
}
