<?php

namespace Tests\Feature\Order;

use App\Models\User;
use App\Modules\Auth\Models\BetaAccessRequest;
use App\Modules\Marketplace\Models\ProductCategory;
use App\Modules\Marketplace\Models\ResourceProduct;
use App\Modules\Order\Models\ProductPrice;
use App\Modules\Provider\Models\Provider;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Contract test: the customer invoice detail endpoint must return the FLAT
 * InvoiceDetail shape the frontend (/invoices/[id]) consumes — items at the
 * top level, order fields flattened, and a single `payment` object.
 */
class InvoiceDetailTest extends TestCase
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
            'specs' => ['cpu' => 1, 'ram' => '1GB'],
        ]);

        ProductPrice::create([
            'public_id' => Str::ulid()->toBase32(),
            'product_id' => $product->id,
            'billing_cycle' => 'monthly',
            'gross_price_minor' => 5000000,
            'currency' => 'IDR',
            'is_default' => true,
        ]);

        return $product;
    }

    public function test_invoice_detail_returns_flat_shape_with_top_level_items(): void
    {
        $user = $this->verifiedUserWithBeta();
        $this->createActiveProduct();

        $create = $this->actingAs($user)->postJson('/api/v1/orders', [
            'product_slug' => 'vps-starter',
            'billing_cycle' => 'monthly',
        ]);
        $create->assertStatus(201);

        // The order creation produces an invoice — pull its public_id.
        $invoice = $create->json('order.invoices.0') ?? null;
        $invoicePublicId = $invoice['public_id'] ?? null;
        $this->assertNotNull($invoicePublicId, 'Order should produce an invoice.');

        $response = $this->actingAs($user)->getJson("/api/v1/invoices/{$invoicePublicId}");

        $response->assertStatus(200);

        // FLAT contract the frontend expects — items at top level, order fields
        // flattened, NOT a nested `order` object.
        $response->assertJsonStructure([
            'invoice' => [
                'public_id',
                'invoice_number',
                'status',
                'subtotal',
                'total',
                'currency',
                'order_public_id',
                'order_number',
                'due_date',
                'paid_at',
                'items' => [
                    ['description', 'quantity', 'unit_price', 'subtotal'],
                ],
                'payment',
                'created_at',
                'updated_at',
            ],
        ]);

        // Items must be derivable line items (not raw order items).
        $items = $response->json('invoice.items');
        $this->assertNotEmpty($items);
        $this->assertEquals('VPS Starter', $items[0]['description']);
        $this->assertSame(1, $items[0]['quantity']);
        $this->assertSame(5000000, $items[0]['subtotal']);

        // Order fields must be flat — no nested `order` object on the detail shape.
        $this->assertNotNull($response->json('invoice.order_public_id'));
        $this->assertNotNull($response->json('invoice.order_number'));
    }

    public function test_invoice_detail_payment_is_null_when_unpaid(): void
    {
        $user = $this->verifiedUserWithBeta();
        $this->createActiveProduct();

        $create = $this->actingAs($user)->postJson('/api/v1/orders', [
            'product_slug' => 'vps-starter',
            'billing_cycle' => 'monthly',
        ]);
        $invoicePublicId = $create->json('order.invoices.0.public_id');

        $response = $this->actingAs($user)->getJson("/api/v1/invoices/{$invoicePublicId}");

        $response->assertStatus(200);
        // Unpaid invoice → payment must be null (frontend guards on this).
        $this->assertNull($response->json('invoice.payment'));
    }

    public function test_invoice_detail_payment_object_when_paid(): void
    {
        $user = $this->verifiedUserWithBeta();
        $this->createActiveProduct();

        $create = $this->actingAs($user)->postJson('/api/v1/orders', [
            'product_slug' => 'vps-starter',
            'billing_cycle' => 'monthly',
        ]);
        $invoicePublicId = $create->json('order.invoices.0.public_id');

        // Mark invoice paid + attach a payment record (simulate a settled payment).
        $invoice = \App\Modules\Order\Models\Invoice::where('public_id', $invoicePublicId)->first();
        $invoice->update(['status' => 'paid', 'paid_at' => now()]);
        \App\Modules\Order\Models\Payment::create([
            'public_id' => (string) Str::ulid(),
            'invoice_id' => $invoice->id,
            'user_id' => $user->id,
            'gateway' => 'midtrans',
            'payment_method' => 'gopay',
            'gateway_transaction_id' => 'TX-123',
            'amount_minor' => $invoice->total_minor,
            'currency' => $invoice->currency,
            'status' => 'paid',
            'paid_at' => now(),
            'expires_at' => now()->addDay(),
        ]);

        $response = $this->actingAs($user)->getJson("/api/v1/invoices/{$invoicePublicId}");

        $response->assertStatus(200);
        $payment = $response->json('invoice.payment');
        $this->assertIsArray($payment, 'Paid invoice must expose a single payment object.');
        $this->assertSame('gopay', $payment['method']);
        $this->assertSame('TX-123', $payment['reference']);
        $this->assertSame($invoice->total_minor, $payment['amount']);
    }

    public function test_invoice_detail_404_for_other_users_invoice(): void
    {
        $owner = $this->verifiedUserWithBeta();
        $intruder = $this->verifiedUserWithBeta();
        $this->createActiveProduct();

        $create = $this->actingAs($owner)->postJson('/api/v1/orders', [
            'product_slug' => 'vps-starter',
            'billing_cycle' => 'monthly',
        ]);
        $invoicePublicId = $create->json('order.invoices.0.public_id');

        $this->actingAs($intruder)
            ->getJson("/api/v1/invoices/{$invoicePublicId}")
            ->assertStatus(404);
    }
}
