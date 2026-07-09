<?php

namespace App\Modules\Order\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Invoice extends Model
{
    use HasFactory;

    /**
     * Resolve the factory from the flat Database\Factories namespace.
     */
    protected static function newFactory()
    {
        return \Database\Factories\InvoiceFactory::new();
    }

    protected $fillable = [
        'public_id',
        'order_id',
        'user_id',
        'invoice_number',
        'status',
        'subtotal_minor',
        'total_minor',
        'currency',
        'due_at',
        'paid_at',
    ];

    protected $hidden = [
        'id',
    ];

    protected function casts(): array
    {
        return [
            'subtotal_minor' => 'integer',
            'total_minor' => 'integer',
            'due_at' => 'datetime',
            'paid_at' => 'datetime',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }
}
