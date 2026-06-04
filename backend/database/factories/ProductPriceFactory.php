<?php

namespace Database\Factories;

use App\Modules\Marketplace\Models\ResourceProduct;
use App\Modules\Order\Models\ProductPrice;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class ProductPriceFactory extends Factory
{
    protected $model = ProductPrice::class;

    public function definition(): array
    {
        return [
            'public_id' => Str::ulid()->toBase32(),
            'product_id' => ResourceProduct::factory(),
            'billing_cycle' => 'monthly',
            'gross_price_minor' => 10000000,
            'currency' => 'IDR',
            'is_default' => true,
        ];
    }
}
