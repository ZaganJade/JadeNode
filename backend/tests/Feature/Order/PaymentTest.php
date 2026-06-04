<?php

namespace Tests\Feature\Order;

use App\Modules\Auth\Models\BetaAccessRequest;
use App\Modules\Marketplace\Models\ResourceProduct;
use App\Modules\Order\Models\Invoice;
use App\Modules\Order\Models\Order;
use App\Modules\Order\Models\OrderItem;
use App\Modules\Order\Models\Payment;
use App\Modules\Provider\Models\Provider;
use App\Models\Category;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Tests\TestCase;

class PaymentTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private Order $order;

    private Invoice $invoice;

    private Payment $payment;

    protected function setUp(): void
    {
        parent::setUp();

        // Create user with verified email
        $this->user = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        // Approve beta access
        BetaAccessRequest::create([
            'user_id' => $this->user->id,
            'status' => 'approved',
            'public_id' => Str::ulid()->toBase32(),
        ]);

        // Create provider, category, product, price
        $provider = Provider::factory()->create();
        $category = \App\Modules\Marketplace\Models\ProductCategory::factory()->create();
        $product = ResourceProduct::factory()->create([
            'provider_id' => $provider->id,
            'category_id' => $category->id,
        ]);
        \App\Modules\Order\Models\ProductPrice::factory()->create([
            'product_id' => $product->id,
            'billing_cycle' => 'monthly',
            'gross_price_minor' => 10000000,
            'currency' => 'IDR',
        ]);

        // Create order, order item, invoice, payment
        $this->order = Order::factory()->create([
            'user_id' => $this->user->id,
            'subtotal_minor' => 10000000,
        ]);

        OrderItem::factory()->create([
            'order_id' => $this->order->id,
            'product_id' => $product->id,
            'provider_id' => $provider->id,
            'price_minor' => 10000000,
        ]);

        $this->invoice = Invoice::factory()->create([
            'order_id' => $this->order->id,
            'user_id' => $this->user->id,
            'total_minor' => 10000000,
        ]);

        $this->payment = Payment::factory()->create([
            'user_id' => $this->user->id,
            'invoice_id' => $this->invoice->id,
            'amount_minor' => 10000000,
            'status' => 'pending',
            'gateway_transaction_id' => null,
            'gateway_snap_token' => null,
        ]);
    }

    public function test_can_create_snap_transaction_for_pending_payment(): void
    {
        Http::fake([
            '*/snap/v1/transactions' => Http::response([
                'token' => 'test-snap-token-123',
                'redirect_url' => 'https://app.sandbox.midtrans.com/snap/v2/test-snap-token-123',
            ], 201),
        ]);

        $response = $this->actingAs($this->user)
            ->postJson("/api/v1/orders/{$this->order->id}/pay");

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Transaksi berhasil dibuat.',
                'data' => [
                    'snap_token' => 'test-snap-token-123',
                ],
            ]);

        $this->assertDatabaseHas('payments', [
            'id' => $this->payment->id,
            'gateway_snap_token' => 'test-snap-token-123',
        ]);
    }

    public function test_duplicate_payment_creation_is_idempotent(): void
    {
        // Set snap_token first (simulate first creation)
        $this->payment->update([
            'gateway_snap_token' => 'existing-snap-token',
            'gateway_transaction_id' => 'existing-gateway-id',
        ]);

        $response = $this->actingAs($this->user)
            ->postJson("/api/v1/orders/{$this->order->id}/pay");

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Snap token sudah tersedia.',
                'data' => [
                    'snap_token' => 'existing-snap-token',
                ],
            ]);

        // Ensure no HTTP call was made to Midtrans
        Http::assertNothingSent();
    }

    public function test_webhook_validates_signature(): void
    {
        $serverKey = 'test-server-key';
        config(['services.midtrans.server_key' => $serverKey]);

        $orderId = 'JN-TEST-123';
        $this->payment->update(['gateway_transaction_id' => $orderId]);

        $payload = [
            'order_id' => $orderId,
            'status_code' => '200',
            'gross_amount' => '100000.00',
            'signature_key' => 'invalid-signature',
            'transaction_status' => 'settlement',
        ];

        $response = $this->postJson('/api/v1/webhooks/midtrans', $payload);

        $response->assertStatus(403)
            ->assertJson([
                'message' => 'Signature tidak valid.',
            ]);
    }

    public function test_webhook_marks_payment_paid_on_settlement(): void
    {
        $serverKey = 'test-server-key';
        config(['services.midtrans.server_key' => $serverKey]);

        $orderId = 'JN-TEST-'.$this->payment->public_id;
        $this->payment->update(['gateway_transaction_id' => $orderId]);

        $signature = hash('sha512', $orderId.'200'.'100000.00'.$serverKey);

        $payload = [
            'order_id' => $orderId,
            'status_code' => '200',
            'gross_amount' => '100000.00',
            'signature_key' => $signature,
            'transaction_status' => 'settlement',
            'fraud_status' => 'accept',
        ];

        $response = $this->postJson('/api/v1/webhooks/midtrans', $payload);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Webhook berhasil diproses.',
            ]);

        $this->assertDatabaseHas('payments', [
            'id' => $this->payment->id,
            'status' => 'paid',
        ]);

        $this->assertDatabaseHas('invoices', [
            'id' => $this->invoice->id,
            'status' => 'paid',
        ]);

        $this->assertDatabaseHas('orders', [
            'id' => $this->order->id,
            'status' => 'paid',
        ]);

        // Check gateway event was recorded
        $this->assertDatabaseHas('payment_gateway_events', [
            'payment_id' => $this->payment->id,
            'event_type' => 'settlement',
            'is_processed' => true,
        ]);
    }

    public function test_duplicate_webhook_is_idempotent(): void
    {
        $serverKey = 'test-server-key';
        config(['services.midtrans.server_key' => $serverKey]);

        $orderId = 'JN-TEST-'.$this->payment->public_id;
        $this->payment->update([
            'gateway_transaction_id' => $orderId,
            'status' => 'paid',
            'paid_at' => now(),
        ]);
        $this->invoice->update(['status' => 'paid', 'paid_at' => now()]);
        $this->order->update(['status' => 'paid']);

        $signature = hash('sha512', $orderId.'200'.'100000.00'.$serverKey);

        $payload = [
            'order_id' => $orderId,
            'status_code' => '200',
            'gross_amount' => '100000.00',
            'signature_key' => $signature,
            'transaction_status' => 'settlement',
            'fraud_status' => 'accept',
        ];

        // Duplicate webhook
        $response = $this->postJson('/api/v1/webhooks/midtrans', $payload);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Pembayaran sudah diproses.',
            ]);

        // Verify gateway event was still recorded
        $this->assertDatabaseHas('payment_gateway_events', [
            'payment_id' => $this->payment->id,
            'is_processed' => true,
        ]);
    }

    public function test_admin_can_trigger_payment_sync(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->payment->update([
            'gateway_transaction_id' => 'JN-SYNC-TEST-123',
        ]);

        Http::fake([
            '*/v2/JN-SYNC-TEST-123/status' => Http::response([
                'transaction_status' => 'settlement',
                'fraud_status' => 'accept',
                'order_id' => 'JN-SYNC-TEST-123',
            ], 200),
        ]);

        $response = $this->actingAs($admin)
            ->postJson("/api/v1/admin/payments/{$this->payment->public_id}/sync");

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Sinkronisasi pembayaran berhasil.',
                'data' => [
                    'status_after' => 'paid',
                    'gateway_transaction_status' => 'settlement',
                ],
            ]);

        $this->assertDatabaseHas('payments', [
            'id' => $this->payment->id,
            'status' => 'paid',
        ]);
    }

    public function test_sync_records_attempt(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->payment->update([
            'gateway_transaction_id' => 'JN-SYNC-ATTEMPT-123',
        ]);

        Http::fake([
            '*/v2/JN-SYNC-ATTEMPT-123/status' => Http::response([
                'transaction_status' => 'expire',
                'order_id' => 'JN-SYNC-ATTEMPT-123',
            ], 200),
        ]);

        $this->actingAs($admin)
            ->postJson("/api/v1/admin/payments/{$this->payment->public_id}/sync");

        $this->assertDatabaseHas('payment_sync_attempts', [
            'payment_id' => $this->payment->id,
            'trigger_type' => 'admin',
            'result_status' => 'failed',
        ]);
    }
}
