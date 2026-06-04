<?php

namespace Tests\Feature\Admin;

use App\Models\AdminAuditLog;
use App\Models\Category;
use App\Models\ListingPrice;
use App\Models\ProductListing;
use App\Models\ProviderProfile;
use App\Models\ResourceType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminListingTest extends TestCase
{
    use RefreshDatabase;

    private function adminUser(): User
    {
        return User::factory()->create([
            'role' => 'admin',
            'email_verified_at' => now(),
        ]);
    }

    private function customerUser(): User
    {
        return User::factory()->create([
            'role' => 'customer',
            'email_verified_at' => now(),
        ]);
    }

    private function createListingWithPrice(array $listingAttrs = [], array $priceAttrs = []): ProductListing
    {
        $provider = ProviderProfile::factory()->create();
        $category = Category::factory()->create();
        $resourceType = ResourceType::factory()->create();

        $listing = ProductListing::factory()->create(array_merge([
            'provider_profile_id' => $provider->id,
            'category_id' => $category->id,
            'resource_type_id' => $resourceType->id,
            'is_active' => true,
            'availability_status' => 'available',
            'region' => 'Jakarta',
        ], $listingAttrs));

        ListingPrice::factory()->create(array_merge([
            'product_listing_id' => $listing->id,
            'billing_cycle' => 'monthly',
            'price' => 100000.00,
            'currency' => 'IDR',
            'is_default' => true,
        ], $priceAttrs));

        ListingPrice::factory()->create([
            'product_listing_id' => $listing->id,
            'billing_cycle' => 'yearly',
            'price' => 1000000.00,
            'currency' => 'IDR',
            'is_default' => false,
        ]);

        return $listing;
    }

    public function test_admin_can_list_all_listings(): void
    {
        $admin = $this->adminUser();
        $this->createListingWithPrice(['name' => 'VPS Alpha']);
        $this->createListingWithPrice(['name' => 'VPS Beta']);

        $response = $this->actingAs($admin)->getJson('/api/v1/admin/listings');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                '*' => [
                    'id',
                    'public_id',
                    'name',
                    'slug',
                    'region',
                    'availability_status',
                    'provisioning_sla_hours',
                    'is_active',
                    'provider',
                    'category',
                    'resource_type',
                    'prices',
                    'created_at',
                    'updated_at',
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

    public function test_admin_can_update_listing_availability(): void
    {
        $admin = $this->adminUser();
        $listing = $this->createListingWithPrice();

        $response = $this->actingAs($admin)->putJson("/api/v1/admin/listings/{$listing->id}", [
            'availability_status' => 'limited',
            'provisioning_sla_hours' => 48,
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('data.availability_status', 'limited');
        $response->assertJsonPath('data.provisioning_sla_hours', 48);

        $this->assertDatabaseHas('product_listings', [
            'id' => $listing->id,
            'availability_status' => 'limited',
            'provisioning_sla_hours' => 48,
        ]);
    }

    public function test_admin_can_update_listing_prices(): void
    {
        $admin = $this->adminUser();
        $listing = $this->createListingWithPrice();

        $response = $this->actingAs($admin)->putJson("/api/v1/admin/listings/{$listing->id}", [
            'prices' => [
                [
                    'billing_cycle' => 'monthly',
                    'gross_price_minor' => 150000,
                ],
            ],
        ]);

        $response->assertStatus(200);

        // Price should be stored as decimal (minor / 100)
        $this->assertDatabaseHas('listing_prices', [
            'product_listing_id' => $listing->id,
            'billing_cycle' => 'monthly',
            'price' => 1500.00,
        ]);
    }

    public function test_non_admin_cannot_update_listings(): void
    {
        $customer = $this->customerUser();
        $listing = $this->createListingWithPrice();

        $response = $this->actingAs($customer)->putJson("/api/v1/admin/listings/{$listing->id}", [
            'availability_status' => 'unavailable',
        ]);

        $response->assertStatus(403);
    }

    public function test_admin_listing_update_is_audit_logged(): void
    {
        $admin = $this->adminUser();
        $listing = $this->createListingWithPrice();

        $this->actingAs($admin)->putJson("/api/v1/admin/listings/{$listing->id}", [
            'availability_status' => 'waitlist',
        ]);

        $this->assertDatabaseHas('admin_audit_logs', [
            'user_id' => $admin->id,
            'action' => 'listing_updated',
            'subject_type' => ProductListing::class,
            'subject_id' => $listing->id,
        ]);

        $log = AdminAuditLog::where('subject_id', $listing->id)
            ->where('subject_type', ProductListing::class)
            ->first();

        $this->assertNotNull($log);
        $this->assertContains('availability_status', $log->payload['fields']);
    }
}
