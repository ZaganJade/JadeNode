<?php

namespace Tests\Feature\Order;

use App\Models\User;
use App\Modules\Auth\Models\BetaAccessRequest;
use App\Modules\Marketplace\Models\ProductCategory;
use App\Modules\Marketplace\Models\ResourceProduct;
use App\Modules\Order\Models\Order;
use App\Modules\Order\Models\ProductPrice;
use App\Modules\Provider\Models\Provider;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class CheckoutTest extends TestCase
{
    use RefreshDatabase;

    private function verifiedUserWithBeta(): User
    {
        $user = User::factory()->create([
            'email_verified_at' => now(),
            'public_id' => Str::ulid()->toBase32(),
        ]);

        BetaAccessRequest::create([
            'user_id' => $user->id,
            'status' => 'approved',
            'public_id' => Str::ulid()->toBase32(),
        ]);

        return $user;
    }

    private function verifiedUserWithoutBeta(): User
    {
        return User::factory()->create([
            'email_verified_at' => now(),
            'public_id' => Str::ulid()->toBase32(),
        ]);
    }

    private function unverifiedUser(): User
    {
        return User::factory()->create([
            'email_verified_at' => null,
            'public_id' => Str::ulid()->toBase32(),
        ]);
    }

    private function createActiveProduct(): ResourceProduct
    {
        $provider = Provider::create([
            'public_id' => Str::ulid()->toBase32(),
            'name' => 'Test Provider',
            'slug' => 'test-provider',
            'is_first_party' => true,
            'commission_rate' => 15.00,
        ]);

        $category = ProductCategory::create([
            'public_id' => Str::ulid()->toBase32(),
            'name' => 'VPS',
            'slug' => 'vps',
            'resource_type' => 'vps',
        ]);

        $product = ResourceProduct::create([
            'public_id' => Str::ulid()->toBase32(),
            'provider_id' => $provider->id,
            'category_id' => $category->id,
            'name' => 'VPS Starter',
            'slug' => 'vps-starter',
            'description' => 'A starter VPS',
            'resource_type' => 'vps',
            'region' => 'Jakarta',
            'availability_status' => 'available',
            'is_active' => true,
            'specs' => ['cpu' => 1, 'ram' => '1GB', 'storage' => '20GB SSD'],
        ]);

        ProductPrice::create([
            'public_id' => Str::ulid()->toBase32(),
            'product_id' => $product->id,
            'billing_cycle' => 'monthly',
            'gross_price_minor' => 5000000,
            'currency' => 'IDR',
            'is_default' => true,
        ]);

        ProductPrice::create([
            'public_id' => Str::ulid()->toBase32(),
            'product_id' => $product->id,
            'billing_cycle' => 'yearly',
            'gross_price_minor' => 50000000,
            'currency' => 'IDR',
            'is_default' => false,
        ]);

        return $product;
    }

    public function test_beta_approved_user_can_create_order(): void
    {
        $user = $this->verifiedUserWithBeta();
        $product = $this->createActiveProduct();

        $response = $this->actingAs($user)->postJson('/api/v1/orders', [
            'product_slug' => 'vps-starter',
            'billing_cycle' => 'monthly',
        ]);

        $response->assertStatus(201);
        $response->assertJsonStructure([
            'message',
            'order' => [
                'public_id',
                'order_number',
                'status',
                'billing_cycle',
                'total',
                'currency',
                'items',
                'invoices',
                'created_at',
            ],
        ]);
        $response->assertJsonPath('order.status', 'pending_payment');
        $response->assertJsonPath('order.billing_cycle', 'monthly');
        $response->assertJsonPath('order.total', 5000000);

        $this->assertDatabaseHas('orders', [
            'user_id' => $user->id,
            'status' => 'pending_payment',
        ]);

        $this->assertDatabaseHas('order_items', [
            'price_minor' => 5000000,
            'billing_cycle' => 'monthly',
        ]);

        $this->assertDatabaseHas('invoices', [
            'user_id' => $user->id,
            'status' => 'pending',
            'total_minor' => 5000000,
        ]);
    }

    public function test_unverified_user_cannot_checkout(): void
    {
        $user = $this->unverifiedUser();
        $this->createActiveProduct();

        $response = $this->actingAs($user)->postJson('/api/v1/orders', [
            'product_slug' => 'vps-starter',
            'billing_cycle' => 'monthly',
        ]);

        $response->assertStatus(403);

        $this->assertDatabaseMissing('orders', [
            'user_id' => $user->id,
        ]);
    }

    public function test_user_without_beta_cannot_checkout(): void
    {
        $user = $this->verifiedUserWithoutBeta();
        $this->createActiveProduct();

        $response = $this->actingAs($user)->postJson('/api/v1/orders', [
            'product_slug' => 'vps-starter',
            'billing_cycle' => 'monthly',
        ]);

        $response->assertStatus(403);

        $this->assertDatabaseMissing('orders', [
            'user_id' => $user->id,
        ]);
    }

    public function test_cannot_order_unavailable_product(): void
    {
        $user = $this->verifiedUserWithBeta();
        $product = $this->createActiveProduct();

        // Make product unavailable
        $product->update(['availability_status' => 'sold_out']);

        $response = $this->actingAs($user)->postJson('/api/v1/orders', [
            'product_slug' => 'vps-starter',
            'billing_cycle' => 'monthly',
        ]);

        $response->assertStatus(422);
        $response->assertJsonPath('message', 'Produk tidak tersedia untuk dipesan.');
    }

    public function test_cannot_order_inactive_product(): void
    {
        $user = $this->verifiedUserWithBeta();
        $product = $this->createActiveProduct();

        // Deactivate product
        $product->update(['is_active' => false]);

        $response = $this->actingAs($user)->postJson('/api/v1/orders', [
            'product_slug' => 'vps-starter',
            'billing_cycle' => 'monthly',
        ]);

        $response->assertStatus(422);
        $response->assertJsonPath('message', 'Produk tidak tersedia untuk dipesan.');
    }

    public function test_duplicate_idempotent_checkout(): void
    {
        $user = $this->verifiedUserWithBeta();
        $this->createActiveProduct();

        $idempotencyKey = 'idem-' . Str::random(10);

        // First request
        $firstResponse = $this->actingAs($user)->postJson('/api/v1/orders', [
            'product_slug' => 'vps-starter',
            'billing_cycle' => 'monthly',
            'idempotency_key' => $idempotencyKey,
        ]);

        $firstResponse->assertStatus(201);
        $firstOrderId = $firstResponse->json('order.public_id');
        $firstOrderNumber = $firstResponse->json('order.order_number');

        // Second request with same idempotency key
        $secondResponse = $this->actingAs($user)->postJson('/api/v1/orders', [
            'product_slug' => 'vps-starter',
            'billing_cycle' => 'monthly',
            'idempotency_key' => $idempotencyKey,
        ]);

        $secondResponse->assertStatus(200);
        $secondResponse->assertJsonPath('order.public_id', $firstOrderId);
        $secondResponse->assertJsonPath('order.order_number', $firstOrderNumber);

        // Only one order should exist
        $this->assertDatabaseCount('orders', 1);
    }

    public function test_order_snapshots_product_data(): void
    {
        $user = $this->verifiedUserWithBeta();
        $product = $this->createActiveProduct();

        $response = $this->actingAs($user)->postJson('/api/v1/orders', [
            'product_slug' => 'vps-starter',
            'billing_cycle' => 'monthly',
        ]);

        $response->assertStatus(201);

        $items = $response->json('order.items');
        $this->assertCount(1, $items);

        $item = $items[0];
        $this->assertEquals('VPS Starter', $item['product_name']);
        $this->assertEquals('Jakarta', $item['region']);
        $this->assertEquals('vps', $item['resource_type']);
        $this->assertIsArray($item['specs']);
    }

    public function test_user_can_view_own_order(): void
    {
        $user = $this->verifiedUserWithBeta();
        $this->createActiveProduct();

        $createResponse = $this->actingAs($user)->postJson('/api/v1/orders', [
            'product_slug' => 'vps-starter',
            'billing_cycle' => 'monthly',
        ]);

        $createResponse->assertStatus(201);
        $orderPublicId = $createResponse->json('order.public_id');

        $showResponse = $this->actingAs($user)->getJson("/api/v1/orders/{$orderPublicId}");

        $showResponse->assertStatus(200);
        $showResponse->assertJsonStructure([
            'order' => [
                'public_id',
                'order_number',
                'status',
                'total',
                'items',
                'invoice',
            ],
        ]);
    }

    public function test_user_cannot_view_other_users_order(): void
    {
        $user1 = $this->verifiedUserWithBeta();
        $user2 = $this->verifiedUserWithBeta();
        $this->createActiveProduct();

        $createResponse = $this->actingAs($user1)->postJson('/api/v1/orders', [
            'product_slug' => 'vps-starter',
            'billing_cycle' => 'monthly',
        ]);

        $createResponse->assertStatus(201);
        $orderPublicId = $createResponse->json('order.public_id');

        // user2 tries to view user1's order
        $showResponse = $this->actingAs($user2)->getJson("/api/v1/orders/{$orderPublicId}");

        $showResponse->assertStatus(404);
    }

    public function test_user_can_list_own_orders(): void
    {
        $user = $this->verifiedUserWithBeta();
        $this->createActiveProduct();

        // Create two orders
        $this->actingAs($user)->postJson('/api/v1/orders', [
            'product_slug' => 'vps-starter',
            'billing_cycle' => 'monthly',
        ]);

        $this->actingAs($user)->postJson('/api/v1/orders', [
            'product_slug' => 'vps-starter',
            'billing_cycle' => 'yearly',
        ]);

        $response = $this->actingAs($user)->getJson('/api/v1/orders');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data',
            'links',
            'meta',
        ]);

        $this->assertCount(2, $response->json('data'));
    }

    public function test_guest_cannot_create_order(): void
    {
        $this->createActiveProduct();

        $response = $this->postJson('/api/v1/orders', [
            'product_slug' => 'vps-starter',
            'billing_cycle' => 'monthly',
        ]);

        $response->assertStatus(401);
    }

    public function test_checkout_validates_required_fields(): void
    {
        $user = $this->verifiedUserWithBeta();

        $response = $this->actingAs($user)->postJson('/api/v1/orders', []);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['product_slug', 'billing_cycle']);
    }

    public function test_checkout_validates_billing_cycle(): void
    {
        $user = $this->verifiedUserWithBeta();
        $this->createActiveProduct();

        $response = $this->actingAs($user)->postJson('/api/v1/orders', [
            'product_slug' => 'vps-starter',
            'billing_cycle' => 'weekly',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['billing_cycle']);
    }
}
