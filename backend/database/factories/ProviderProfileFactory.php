<?php

namespace Database\Factories;

use App\Models\ProviderProfile;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ProviderProfile>
 */
class ProviderProfileFactory extends Factory
{
    protected $model = ProviderProfile::class;

    public function definition(): array
    {
        $name = fake()->unique()->company();

        return [
            'public_id' => Str::ulid()->toBase32(),
            'name' => $name,
            'slug' => Str::slug($name),
            'description' => fake()->sentence(),
            'is_first_party' => false,
            'is_verified' => true,
            'is_active' => true,
            'website_url' => fake()->url(),
            'support_email' => fake()->companyEmail(),
        ];
    }
}
