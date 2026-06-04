<?php

namespace Database\Factories;

use App\Models\ListingPrice;
use App\Models\ProductListing;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ListingPrice>
 */
class ListingPriceFactory extends Factory
{
    protected $model = ListingPrice::class;

    public function definition(): array
    {
        return [
            'product_listing_id' => ProductListing::factory(),
            'billing_cycle' => fake()->randomElement(['monthly', 'yearly', 'hourly']),
            'price' => fake()->randomFloat(2, 10000, 1000000),
            'currency' => 'IDR',
            'unit_label' => '/bulan',
            'is_default' => true,
        ];
    }
}
