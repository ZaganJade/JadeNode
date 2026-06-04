<?php

namespace Database\Factories;

use App\Models\ProviderProfile;
use App\Models\User;
use App\Modules\Order\Models\Order;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class OrderFactory extends Factory
{
    protected $model = Order::class;

    public function definition(): array
    {
        return [
            'public_id' => Str::ulid()->toBase32(),
            'user_id' => User::factory(),
            'order_number' => 'ORD-'.strtoupper(Str::random(10)),
            'status' => 'pending_payment',
            'billing_cycle' => 'monthly',
            'subtotal_minor' => 10000000,
            'currency' => 'IDR',
        ];
    }
}
