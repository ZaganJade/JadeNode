<?php

namespace Tests\Feature\Admin;

use App\Modules\Order\Models\Invoice;
use App\Modules\Order\Models\Order;
use App\Modules\Order\Models\OrderItem;
use App\Modules\Order\Models\Payment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminPaymentListTest extends TestCase
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

    /**
     * Create a full order → invoice → payment chain owned by a customer.
     */
    private function createTransactionChain(User $customer, array $paymentAttrs = [], array $orderAttrs = []): array
    {
        $order = Order::factory()->create(array_merge([
            'user_id' => $customer->id,
            'order_number' => 'ORD-TEST-' . strtoupper(uniqid()),
        ], $orderAttrs));

        OrderItem::factory()->create([
            'order_id' => $order->id,
            'product_snapshot' => ['name' => 'VPS Starter', 'slug' => 'vps-starter'],
        ]);

        $invoice = Invoice::factory()->create([
            'order_id' => $order->id,
            'user_id' => $customer->id,
            'invoice_number' => 'INV-TEST-' . strtoupper(uniqid()),
        ]);

        $payment = Payment::factory()->create(array_merge([
            'invoice_id' => $invoice->id,
            'user_id' => $customer->id,
        ], $paymentAttrs));

        return [$order, $invoice, $payment];
    }

    // ─── LIST ───────────────────────────────────────────────────────────────

    public function test_admin_can_list_all_payments(): void
    {
        $admin = $this->adminUser();
        $customer = $this->customerUser();
        $this->createTransactionChain($customer, ['status' => 'paid']);

        $response = $this->actingAs($admin)->getJson('/api/v1/admin/payments');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [[
                'public_id', 'user_name', 'user_email', 'status',
                'amount_minor', 'currency', 'created_at',
            ]],
            'meta' => ['current_page', 'last_page', 'per_page', 'total'],
        ]);
    }

    public function test_admin_list_includes_invoice_and_order_context(): void
    {
        $admin = $this->adminUser();
        $customer = User::factory()->create(['name' => 'Budi Test', 'email' => 'budi@test.id']);
        [$order, $invoice, $payment] = $this->createTransactionChain($customer, ['status' => 'pending']);

        $response = $this->actingAs($admin)->getJson('/api/v1/admin/payments');

        $response->assertStatus(200);

        $row = collect($response->json('data'))->firstWhere('public_id', $payment->public_id);
        $this->assertNotNull($row, 'Payment not found in response.');
        $this->assertSame('Budi Test', $row['user_name']);
        $this->assertSame($invoice->invoice_number, $row['invoice_number']);
        $this->assertSame($order->order_number, $row['order_number']);
        $this->assertNotEmpty($row['product_summary']);
    }

    public function test_customer_cannot_access_admin_payments(): void
    {
        $customer = $this->customerUser();

        $response = $this->actingAs($customer)->getJson('/api/v1/admin/payments');

        $response->assertStatus(403);
    }

    public function test_admin_can_filter_payments_by_status(): void
    {
        $admin = $this->adminUser();
        $customer = $this->customerUser();
        $this->createTransactionChain($customer, ['status' => 'paid']);
        $this->createTransactionChain($customer, ['status' => 'pending']);

        $response = $this->actingAs($admin)->getJson('/api/v1/admin/payments?status=paid');

        $response->assertStatus(200);
        $this->assertTrue(
            collect($response->json('data'))->every(fn ($p) => $p['status'] === 'paid')
        );
    }

    public function test_admin_can_search_payments_by_customer_email(): void
    {
        $admin = $this->adminUser();
        $target = User::factory()->create(['email' => 'findable@example.com']);
        $other = User::factory()->create(['email' => 'other@example.com']);
        $this->createTransactionChain($target);
        $this->createTransactionChain($other);

        $response = $this->actingAs($admin)->getJson('/api/v1/admin/payments?search=findable');

        $response->assertStatus(200);
        $rows = collect($response->json('data'));
        $this->assertTrue($rows->every(fn ($p) => $p['user_email'] === 'findable@example.com'));
    }

    public function test_admin_can_filter_payments_by_gateway(): void
    {
        $admin = $this->adminUser();
        $customer = $this->customerUser();
        $this->createTransactionChain($customer, ['gateway' => 'midtrans']);
        $this->createTransactionChain($customer, ['gateway' => 'manual']);

        $response = $this->actingAs($admin)->getJson('/api/v1/admin/payments?gateway=midtrans');

        $response->assertStatus(200);
        $this->assertTrue(
            collect($response->json('data'))->every(fn ($p) => $p['gateway'] === 'midtrans')
        );
    }

    // ─── SYNC GUARD ─────────────────────────────────────────────────────────

    public function test_admin_sync_without_gateway_transaction_id_returns_422(): void
    {
        $admin = $this->adminUser();
        $customer = $this->customerUser();
        [, , $payment] = $this->createTransactionChain($customer, [
            'gateway_transaction_id' => null,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($admin)
            ->postJson("/api/v1/admin/payments/{$payment->public_id}/sync");

        $response->assertStatus(422);
    }

    public function test_admin_sync_missing_payment_returns_404(): void
    {
        $admin = $this->adminUser();

        $response = $this->actingAs($admin)
            ->postJson('/api/v1/admin/payments/NONEXISTENT/sync');

        $response->assertStatus(404);
    }

    public function test_customer_cannot_trigger_sync(): void
    {
        $customer = $this->customerUser();
        [, , $payment] = $this->createTransactionChain($customer, [
            'gateway_transaction_id' => 'TX-123',
            'status' => 'pending',
        ]);

        $response = $this->actingAs($customer)
            ->postJson("/api/v1/admin/payments/{$payment->public_id}/sync");

        $response->assertStatus(403);
    }
}
