<?php

namespace Database\Factories;

use App\Modules\Marketplace\Models\ResourceProduct;
use App\Modules\Order\Models\OrderItem;
use App\Modules\Provider\Models\Provider;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class OrderItemFactory extends Factory
{
    protected $model = OrderItem::class;

    public function definition(): array
    {
        return [
            'public_id' => Str::ulid()->toBase32(),
            'order_id' => \App\Modules\Order\Models\Order::factory(),
            'product_id' => ResourceProduct::factory(),
            'provider_id' => Provider::factory(),
            'product_snapshot' => [
                'name' => 'VPS Starter',
                'slug' => 'vps-starter',
                'specs' => '2 vCPU, 4GB RAM, 80GB SSD',
                'region' => 'Jakarta',
                'resource_type' => 'vps',
            ],
            'price_minor' => 10000000,
            'commission_rate' => 15.00,
            'commission_minor' => 1500000,
            'billing_cycle' => 'monthly',
            'currency' => 'IDR',
        ];
    }
}
