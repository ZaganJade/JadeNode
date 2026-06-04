<?php

namespace Database\Factories;

use App\Models\User;
use App\Modules\Order\Models\Invoice;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class InvoiceFactory extends Factory
{
    protected $model = Invoice::class;

    public function definition(): array
    {
        return [
            'public_id' => Str::ulid()->toBase32(),
            'order_id' => \App\Modules\Order\Models\Order::factory(),
            'user_id' => User::factory(),
            'invoice_number' => 'INV-'.strtoupper(Str::random(10)),
            'status' => 'pending',
            'subtotal_minor' => 10000000,
            'total_minor' => 10000000,
            'currency' => 'IDR',
            'due_at' => now()->addHours(24),
        ];
    }
}
