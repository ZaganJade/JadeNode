<?php

namespace App\Modules\Order\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'public_id',
        'invoice_id',
        'user_id',
        'payment_method',
        'gateway',
        'gateway_transaction_id',
        'gateway_snap_token',
        'gateway_payload',
        'amount_minor',
        'currency',
        'status',
        'paid_at',
        'expires_at',
    ];

    protected $hidden = [
        'id',
    ];

    protected function casts(): array
    {
        return [
            'gateway_payload' => 'array',
            'amount_minor' => 'integer',
            'paid_at' => 'datetime',
            'expires_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    public function gatewayEvents(): HasMany
    {
        return $this->hasMany(PaymentGatewayEvent::class);
    }

    public function syncAttempts(): HasMany
    {
        return $this->hasMany(PaymentSyncAttempt::class);
    }

    public function isPaid(): bool
    {
        return $this->status === 'paid';
    }

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isTerminal(): bool
    {
        return in_array($this->status, ['paid', 'failed', 'expired', 'cancelled']);
    }

    /**
     * Get the snap_token (alias for gateway_snap_token column).
     */
    public function getSnapTokenAttribute(): ?string
    {
        return $this->gateway_snap_token;
    }
}
