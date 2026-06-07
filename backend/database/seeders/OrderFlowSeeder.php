<?php

namespace Database\Seeders;

use App\Models\User;
use App\Modules\Deployment\Models\Deployment;
use App\Modules\Deployment\Models\ProvisioningTask;
use App\Modules\Deployment\Models\ResourceAction;
use App\Modules\Order\Models\ProductPrice;
use App\Modules\Marketplace\Models\ResourceProduct;
use App\Modules\Order\Models\Invoice;
use App\Modules\Order\Models\Order;
use App\Modules\Order\Models\OrderItem;
use App\Modules\Order\Models\Payment;
use App\Modules\Order\Models\PaymentGatewayEvent;
use App\Modules\Order\Models\PaymentSyncAttempt;
use App\Modules\Provider\Models\Provider;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Seeds two complete order flows for the test customer:
 *
 * 1. PAID ORDER  → active deployment with completed provisioning
 *    (simulates: checkout → pay → deploy → provision)
 *
 * 2. PENDING ORDER → awaiting payment
 *    (simulates: checkout → waiting for snap token)
 *
 * Prices reference the MarketplaceSeeder product slugs.
 */
class OrderFlowSeeder extends Seeder
{
    public function run(): void
    {
        $customer = User::where('email', 'test@jadenode.id')->first();
        if (! $customer) {
            $this->command->warn('Skipping OrderFlowSeeder: test customer not found.');
            return;
        }

        $admin = User::where('email', 'admin@jadenode.id')->first();

        // Grab products seeded by MarketplaceSeeder
        $product1 = ResourceProduct::where('slug', 'vps-starter')->first();
        $product2 = ResourceProduct::where('slug', 'vps-basic')->first();
        $provider = Provider::where('slug', 'zaganjade')->first();

        if (! $product1 || ! $product2 || ! $provider) {
            $this->command->warn('Skipping OrderFlowSeeder: marketplace products not found. Run MarketplaceSeeder first.');
            return;
        }

        // ─────────────────────────────────────────────────────────
        // ORDER 1: PAID — VPS Starter monthly
        // ─────────────────────────────────────────────────────────

        $price1 = ProductPrice::where('product_id', $product1->id)
            ->where('billing_cycle', 'monthly')
            ->first();

        $order1 = Order::create([
            'public_id'         => (string) Str::ulid(),
            'user_id'           => $customer->id,
            'order_number'      => 'ORD-' . now()->format('Ymd') . '-0001',
            'status'            => 'paid',
            'billing_cycle'     => 'monthly',
            'billing_start_date' => now()->toDateString(),
            'billing_end_date'   => now()->addMonth()->toDateString(),
            'subtotal_minor'    => $price1?->gross_price_minor ?? 5_900_000,
            'currency'          => 'IDR',
            'idempotency_key'   => (string) Str::uuid(),
        ]);

        $orderItem1 = OrderItem::create([
            'public_id'       => (string) Str::ulid(),
            'order_id'        => $order1->id,
            'product_id'      => $product1->id,
            'provider_id'     => $provider->id,
            'product_snapshot' => [
                'name'   => $product1->name,
                'slug'   => $product1->slug,
                'region' => $product1->region,
                'specs'  => $product1->specs,
            ],
            'price_minor'     => $price1?->gross_price_minor ?? 5_900_000,
            'commission_rate' => $provider->commission_rate,
            'commission_minor' => (int) (($price1?->gross_price_minor ?? 5_900_000) * ($provider->commission_rate / 100)),
            'billing_cycle'   => 'monthly',
            'currency'        => 'IDR',
        ]);

        $invoice1 = Invoice::create([
            'public_id'      => (string) Str::ulid(),
            'order_id'      => $order1->id,
            'user_id'       => $customer->id,
            'invoice_number' => 'INV-' . now()->format('Ymd') . '-0001',
            'status'        => 'paid',
            'subtotal_minor' => $price1?->gross_price_minor ?? 5_900_000,
            'total_minor'    => $price1?->gross_price_minor ?? 5_900_000,
            'currency'      => 'IDR',
            'due_at'        => now()->addDays(7),
            'paid_at'       => now()->subHours(2),
        ]);

        $payment1 = Payment::create([
            'public_id'                => (string) Str::ulid(),
            'invoice_id'               => $invoice1->id,
            'user_id'                 => $customer->id,
            'payment_method'          => 'gopay',
            'gateway'                 => 'midtrans',
            'gateway_transaction_id'  => 'MIDTRANS-' . Str::random(12),
            'gateway_snap_token'      => 'snap_token_demo_' . Str::random(20),
            'gateway_payload'         => ['transaction_id' => 'MIDTRANS-' . Str::random(12), 'gross_amount' => 59000],
            'amount_minor'            => $price1?->gross_price_minor ?? 5_900_000,
            'currency'                => 'IDR',
            'status'                  => 'paid',
            'paid_at'                 => now()->subHours(2),
            'expires_at'              => now()->addDays(1),
        ]);

        // Payment gateway event (webhook log)
        PaymentGatewayEvent::create([
            'payment_id'               => $payment1->id,
            'gateway_transaction_id'   => $payment1->gateway_transaction_id,
            'event_type'               => 'payment_success',
            'payload'                  => [
                'transaction_status' => 'capture',
                'fraud_status'       => 'accept',
                'payment_type'      => 'gopay',
            ],
            'is_processed' => true,
            'processed_at' => now()->subHours(2),
            'created_at'   => now()->subHours(2),
        ]);

        // Deployment (active)
        $deployment1 = Deployment::create([
            'public_id'            => (string) Str::ulid(),
            'user_id'              => $customer->id,
            'order_id'             => $order1->id,
            'order_item_id'        => $orderItem1->id,
            'product_id'           => $product1->id,
            'provider_id'          => $provider->id,
            'status'               => 'active',
            'hostname'             => 'node-' . strtolower(Str::random(6)) . '.jadenode.id',
            'ip_address'           => '103.' . rand(100, 255) . '.' . rand(1, 255) . '.' . rand(1, 255),
            'access_credential_encrypted' => encrypt(json_encode(['root_password' => Str::random(16)])),
            'specs_snapshot'        => $product1->specs,
            'billing_cycle'        => 'monthly',
            'current_period_start' => now()->toDateString(),
            'current_period_end'   => now()->addMonth()->toDateString(),
            'auto_renew'           => true,
            'provisioning_sla_hours' => 24,
        ]);

        // Completed provisioning task
        ProvisioningTask::create([
            'public_id'     => (string) Str::ulid(),
            'deployment_id' => $deployment1->id,
            'assigned_to'   => $admin?->id,
            'status'        => 'completed',
            'due_at'        => now()->subHours(6),
            'started_at'    => now()->subHours(4),
            'completed_at'  => now()->subHours(2),
            'result_data'   => [
                'hostname'  => $deployment1->hostname,
                'ip_address' => $deployment1->ip_address,
                'provider_panel_url' => 'https://manage.zaganjade.id/server/abc123',
            ],
        ]);

        // Resource action (reboot — completed)
        ResourceAction::create([
            'public_id'     => (string) Str::ulid(),
            'deployment_id' => $deployment1->id,
            'user_id'       => $customer->id,
            'action_type'   => 'reboot',
            'status'        => 'completed',
            'reason'        => 'Scheduled maintenance reboot',
            'result'        => 'Server rebooted successfully at ' . now()->subDay()->toIso8601String(),
            'processed_by'  => $admin?->id,
            'processed_at'  => now()->subDay(),
        ]);

        // ─────────────────────────────────────────────────────────
        // ORDER 2: PENDING PAYMENT — VPS Basic quarterly
        // ─────────────────────────────────────────────────────────

        $price2 = ProductPrice::where('product_id', $product2->id)
            ->where('billing_cycle', 'quarterly')
            ->first();

        $order2 = Order::create([
            'public_id'         => (string) Str::ulid(),
            'user_id'           => $customer->id,
            'order_number'      => 'ORD-' . now()->format('Ymd') . '-0002',
            'status'            => 'pending_payment',
            'billing_cycle'     => 'quarterly',
            'billing_start_date' => now()->toDateString(),
            'billing_end_date'   => now()->addMonths(3)->toDateString(),
            'subtotal_minor'    => $price2?->gross_price_minor ?? 33_900_000,
            'currency'          => 'IDR',
            'idempotency_key'   => (string) Str::uuid(),
        ]);

        $orderItem2 = OrderItem::create([
            'public_id'       => (string) Str::ulid(),
            'order_id'        => $order2->id,
            'product_id'      => $product2->id,
            'provider_id'     => $provider->id,
            'product_snapshot' => [
                'name'   => $product2->name,
                'slug'   => $product2->slug,
                'region' => $product2->region,
                'specs'  => $product2->specs,
            ],
            'price_minor'     => $price2?->gross_price_minor ?? 33_900_000,
            'commission_rate' => $provider->commission_rate,
            'commission_minor' => (int) (($price2?->gross_price_minor ?? 33_900_000) * ($provider->commission_rate / 100)),
            'billing_cycle'   => 'quarterly',
            'currency'        => 'IDR',
        ]);

        $invoice2 = Invoice::create([
            'public_id'      => (string) Str::ulid(),
            'order_id'      => $order2->id,
            'user_id'       => $customer->id,
            'invoice_number' => 'INV-' . now()->format('Ymd') . '-0002',
            'status'        => 'pending',
            'subtotal_minor' => $price2?->gross_price_minor ?? 33_900_000,
            'total_minor'    => $price2?->gross_price_minor ?? 33_900_000,
            'currency'      => 'IDR',
            'due_at'        => now()->addDays(7),
        ]);

        $payment2 = Payment::create([
            'public_id'                => (string) Str::ulid(),
            'invoice_id'               => $invoice2->id,
            'user_id'                 => $customer->id,
            'payment_method'          => null,
            'gateway'                 => 'midtrans',
            'gateway_transaction_id'  => null,
            'gateway_snap_token'      => null,
            'gateway_payload'         => null,
            'amount_minor'            => $price2?->gross_price_minor ?? 33_900_000,
            'currency'                => 'IDR',
            'status'                  => 'pending',
            'expires_at'              => now()->addDays(1),
        ]);

        // Payment sync attempt (simulating auto-sync)
        PaymentSyncAttempt::create([
            'payment_id'    => $payment2->id,
            'trigger_type'  => 'auto',
            'result_status' => 'still_pending',
            'error_message' => null,
            'created_at'    => now()->subMinutes(30),
        ]);

        $this->command->info('Seeded: 2 orders (1 paid+deployed, 1 pending payment)');
    }
}
