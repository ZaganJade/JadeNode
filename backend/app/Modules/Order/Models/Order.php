<?php

namespace App\Modules\Order\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Order extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * Resolve the factory from the flat Database\Factories namespace,
     * since this model lives in a Modules sub-namespace.
     */    protected static function newFactory()
    {
        return \Database\Factories\OrderFactory::new();
    }

    protected $fillable = [
        'public_id',
        'user_id',
        'order_number',
        'status',
        'billing_cycle',
        'billing_start_date',
        'billing_end_date',
        'subtotal_minor',
        'currency',
        'idempotency_key',
        'notes',
    ];

    protected $hidden = [
        'id',
    ];

    protected function casts(): array
    {
        return [
            'billing_start_date' => 'date',
            'billing_end_date' => 'date',
            'subtotal_minor' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    public function firstInvoice(): HasOne
    {
        return $this->hasOne(Invoice::class)->oldestOfMany();
    }
}
