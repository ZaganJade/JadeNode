<?php

namespace Database\Factories;

use App\Models\User;
use App\Modules\Order\Models\Payment;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class PaymentFactory extends Factory
{
    protected $model = Payment::class;

    public function definition(): array
    {
        return [
            'public_id' => Str::ulid()->toBase32(),
            'invoice_id' => \App\Modules\Order\Models\Invoice::factory(),
            'user_id' => User::factory(),
            'payment_method' => null,
            'gateway' => 'midtrans',
            'gateway_transaction_id' => null,
            'gateway_snap_token' => null,
            'amount_minor' => 10000000,
            'currency' => 'IDR',
            'status' => 'pending',
        ];
    }
}
