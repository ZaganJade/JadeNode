<?php

namespace Database\Factories;

use App\Modules\Provider\Models\Provider;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class ProviderFactory extends Factory
{
    protected $model = Provider::class;

    public function definition(): array
    {
        $name = fake()->unique()->company();

        return [
            'public_id' => Str::ulid()->toBase32(),
            'name' => $name,
            'slug' => Str::slug($name),
            'description' => fake()->sentence(),
            'is_first_party' => false,
            'status' => 'active',
            'verification_status' => 'verified',
            'support_email' => fake()->companyEmail(),
            'website_url' => fake()->url(),
            'commission_rate' => 15.00,
        ];
    }
}
