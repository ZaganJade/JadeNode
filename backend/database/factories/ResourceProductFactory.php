<?php

namespace Database\Factories;

use App\Modules\Marketplace\Models\ProductCategory;
use App\Modules\Marketplace\Models\ResourceProduct;
use App\Modules\Provider\Models\Provider;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class ResourceProductFactory extends Factory
{
    protected $model = ResourceProduct::class;

    public function definition(): array
    {
        $name = fake()->unique()->words(3, true);

        return [
            'public_id' => Str::ulid()->toBase32(),
            'provider_id' => Provider::factory(),
            'category_id' => ProductCategory::factory(),
            'name' => ucfirst($name),
            'slug' => Str::slug($name),
            'description' => fake()->paragraph(),
            'resource_type' => 'vps',
            'region' => fake()->randomElement(['Jakarta', 'Singapore', 'Tokyo', 'Amsterdam']),
            'availability_status' => 'available',
            'provisioning_sla_hours' => 24,
            'display_priority' => 0,
            'is_active' => true,
            'specs' => [
                'cpu' => '2 vCPU',
                'ram' => '4GB',
                'storage' => '80GB SSD',
            ],
        ];
    }
}
