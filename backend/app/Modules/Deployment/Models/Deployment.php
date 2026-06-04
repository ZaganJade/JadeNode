<?php

namespace App\Modules\Deployment\Models;

use App\Models\User;
use App\Modules\Marketplace\Models\ResourceProduct;
use App\Modules\Order\Models\Order;
use App\Modules\Order\Models\OrderItem;
use App\Modules\Provider\Models\Provider;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Deployment extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'public_id',
        'user_id',
        'order_id',
        'order_item_id',
        'product_id',
        'provider_id',
        'status',
        'hostname',
        'ip_address',
        'access_credential_encrypted',
        'specs_snapshot',
        'billing_cycle',
        'current_period_start',
        'current_period_end',
        'auto_renew',
        'cancelled_at',
        'expired_at',
        'provisioning_sla_hours',
    ];

    protected $hidden = [
        'id',
        'access_credential_encrypted',
    ];

    protected function casts(): array
    {
        return [
            'specs_snapshot' => 'array',
            'current_period_start' => 'date',
            'current_period_end' => 'date',
            'auto_renew' => 'boolean',
            'cancelled_at' => 'datetime',
            'expired_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function orderItem(): BelongsTo
    {
        return $this->belongsTo(OrderItem::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(ResourceProduct::class, 'product_id');
    }

    public function provider(): BelongsTo
    {
        return $this->belongsTo(Provider::class);
    }

    public function provisioningTasks(): HasMany
    {
        return $this->hasMany(ProvisioningTask::class);
    }

    public function resourceActions(): HasMany
    {
        return $this->hasMany(ResourceAction::class);
    }
}
