<?php

namespace Database\Factories;

use App\Models\ProductListing;
use App\Models\ProviderProfile;
use App\Models\Category;
use App\Models\ResourceType;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ProductListing>
 */
class ProductListingFactory extends Factory
{
    protected $model = ProductListing::class;

    public function definition(): array
    {
        $name = fake()->unique()->words(3, true);

        return [
            'public_id' => Str::ulid()->toBase32(),
            'provider_profile_id' => ProviderProfile::factory(),
            'category_id' => Category::factory(),
            'resource_type_id' => ResourceType::factory(),
            'name' => ucfirst($name),
            'slug' => Str::slug($name),
            'description' => fake()->paragraph(),
            'region' => fake()->randomElement(['Jakarta', 'Singapore', 'Tokyo', 'Amsterdam']),
            'specs_summary' => '2 vCPU, 4GB RAM, 80GB SSD',
            'provisioning_sla_hours' => fake()->randomElement([1, 2, 4, 24]),
            'is_active' => true,
            'sort_order' => 0,
        ];
    }
}
