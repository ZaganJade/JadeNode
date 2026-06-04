<?php

namespace Tests\Feature\Marketplace;

use App\Models\Category;
use App\Models\ListingPrice;
use App\Models\ProductListing;
use App\Models\ProviderProfile;
use App\Models\ResourceType;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ListingTest extends TestCase
{
    use RefreshDatabase;

    private ProviderProfile $provider;
    private Category $category;
    private ResourceType $resourceType;

    protected function setUp(): void
    {
        parent::setUp();

        $this->provider = ProviderProfile::factory()->create([
            'is_active' => true,
            'is_verified' => true,
        ]);

        $this->category = Category::factory()->create([
            'slug' => 'vps',
            'is_active' => true,
        ]);

        $this->resourceType = ResourceType::factory()->create([
            'slug' => 'vps',
            'is_active' => true,
        ]);
    }

    private function createListing(array $attributes = []): ProductListing
    {
        $listing = ProductListing::factory()->create(array_merge([
            'provider_profile_id' => $this->provider->id,
            'category_id' => $this->category->id,
            'resource_type_id' => $this->resourceType->id,
            'is_active' => true,
            'region' => 'Jakarta',
        ], $attributes));

        ListingPrice::factory()->create([
            'product_listing_id' => $listing->id,
            'billing_cycle' => 'monthly',
            'price' => 100000.00,
            'currency' => 'IDR',
            'is_default' => true,
        ]);

        return $listing;
    }

    public function test_can_list_active_listings(): void
    {
        $this->createListing(['name' => 'VPS Alpha']);
        $this->createListing(['name' => 'VPS Beta']);

        $response = $this->getJson('/api/v1/marketplace/listings');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                '*' => [
                    'public_id',
                    'name',
                    'slug',
                    'description',
                    'region',
                    'specs_summary',
                    'provisioning_sla_hours',
                    'is_active',
                    'provider',
                    'category',
                    'resource_type',
                    'prices',
                    'created_at',
                ],
            ],
            'meta' => [
                'current_page',
                'last_page',
                'per_page',
                'total',
            ],
        ]);
        $response->assertJsonPath('meta.total', 2);
    }

    public function test_inactive_listings_are_excluded(): void
    {
        $this->createListing(['name' => 'Active Listing', 'is_active' => true]);
        $this->createListing(['name' => 'Inactive Listing', 'is_active' => false]);

        $response = $this->getJson('/api/v1/marketplace/listings');

        $response->assertStatus(200);
        $response->assertJsonPath('meta.total', 1);
        $response->assertJsonPath('data.0.name', 'Active Listing');
    }

    public function test_can_filter_by_category(): void
    {
        $otherCategory = Category::factory()->create(['slug' => 'dedicated', 'is_active' => true]);

        $this->createListing(['name' => 'VPS Listing', 'category_id' => $this->category->id]);
        $this->createListing(['name' => 'Dedicated Listing', 'category_id' => $otherCategory->id]);

        $response = $this->getJson('/api/v1/marketplace/listings?category=vps');

        $response->assertStatus(200);
        $response->assertJsonPath('meta.total', 1);
        $response->assertJsonPath('data.0.name', 'VPS Listing');
    }

    public function test_can_filter_by_region(): void
    {
        $this->createListing(['name' => 'Jakarta VPS', 'region' => 'Jakarta']);
        $this->createListing(['name' => 'Singapore VPS', 'region' => 'Singapore']);

        $response = $this->getJson('/api/v1/marketplace/listings?region=Jakarta');

        $response->assertStatus(200);
        $response->assertJsonPath('meta.total', 1);
        $response->assertJsonPath('data.0.name', 'Jakarta VPS');
    }

    public function test_can_filter_by_price_range(): void
    {
        $cheap = $this->createListing(['name' => 'Cheap VPS']);
        $expensive = $this->createListing(['name' => 'Expensive VPS']);

        // Override default price
        ListingPrice::where('product_listing_id', $cheap->id)->update(['price' => 50000.00]);
        ListingPrice::where('product_listing_id', $expensive->id)->update(['price' => 500000.00]);

        $response = $this->getJson('/api/v1/marketplace/listings?min_price=40000&max_price=100000');

        $response->assertStatus(200);
        $response->assertJsonPath('meta.total', 1);
        $response->assertJsonPath('data.0.name', 'Cheap VPS');
    }

    public function test_can_sort_by_price_ascending(): void
    {
        $cheap = $this->createListing(['name' => 'Cheap']);
        $expensive = $this->createListing(['name' => 'Expensive']);

        ListingPrice::where('product_listing_id', $cheap->id)->update(['price' => 50000.00]);
        ListingPrice::where('product_listing_id', $expensive->id)->update(['price' => 300000.00]);

        $response = $this->getJson('/api/v1/marketplace/listings?sort=price_asc');

        $response->assertStatus(200);
        $response->assertJsonPath('data.0.name', 'Cheap');
    }

    public function test_pagination_defaults_to_12_per_page(): void
    {
        for ($i = 0; $i < 14; $i++) {
            $this->createListing(['name' => "VPS {$i}", 'slug' => "vps-{$i}"]);
        }

        $response = $this->getJson('/api/v1/marketplace/listings');

        $response->assertStatus(200);
        $response->assertJsonPath('meta.per_page', 12);
        $response->assertJsonPath('meta.total', 14);
        $this->assertCount(12, $response->json('data'));
    }

    public function test_can_show_listing_by_slug(): void
    {
        $listing = $this->createListing(['slug' => 'vps-starter']);

        $response = $this->getJson('/api/v1/marketplace/listings/vps-starter');

        $response->assertStatus(200);
        $response->assertJsonPath('data.slug', 'vps-starter');
        $response->assertJsonStructure([
            'data' => [
                'public_id',
                'name',
                'slug',
                'description',
                'region',
                'provider',
                'category',
                'resource_type',
                'prices',
            ],
        ]);
    }

    public function test_show_returns_404_for_nonexistent_or_inactive(): void
    {
        $response = $this->getJson('/api/v1/marketplace/listings/nonexistent');

        $response->assertStatus(404);
        $response->assertJsonPath('message', 'Produk tidak ditemukan.');

        $inactive = $this->createListing(['slug' => 'inactive-listing', 'is_active' => false]);

        $response = $this->getJson('/api/v1/marketplace/listings/inactive-listing');

        $response->assertStatus(404);
    }

    public function test_similar_products_returns_up_to_3_same_category_and_region(): void
    {
        $main = $this->createListing([
            'slug' => 'main-vps',
            'name' => 'Main VPS',
            'region' => 'Jakarta',
            'category_id' => $this->category->id,
        ]);

        // Create 4 similar (same category + region), but only 3 should be returned
        for ($i = 1; $i <= 4; $i++) {
            $this->createListing([
                'slug' => "similar-vps-{$i}",
                'name' => "Similar VPS {$i}",
                'region' => 'Jakarta',
                'category_id' => $this->category->id,
            ]);
        }

        // Create one in different region — should not appear
        $this->createListing([
            'slug' => 'different-region',
            'name' => 'Singapore VPS',
            'region' => 'Singapore',
            'category_id' => $this->category->id,
        ]);

        $response = $this->getJson('/api/v1/marketplace/listings/main-vps/similar');

        $response->assertStatus(200);
        $this->assertCount(3, $response->json('data'));
    }
}
