<?php

namespace App\Modules\Order\Controllers;

use App\Http\Resources\OrderResource;
use App\Modules\Auth\Models\BetaAccessRequest;
use App\Modules\Marketplace\Models\ResourceProduct;
use App\Modules\Order\Models\Invoice;
use App\Modules\Order\Models\Order;
use App\Modules\Order\Models\OrderItem;
use App\Modules\Order\Models\Payment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Multi-item cart checkout.
 *
 * Converts a client-side cart into ONE Order containing multiple OrderItems,
 * ONE Invoice (summed total), and ONE pending Payment. This is additive and
 * does not touch the existing single-item CheckoutController flow.
 */
class CartCheckoutController
{
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        // Gate: verified email + approved beta access (same policy as single-item checkout).
        if (! $user->hasVerifiedEmail()) {
            return response()->json([
                'message' => 'Email belum terverifikasi. Silakan verifikasi email kamu terlebih dahulu.',
            ], 403);
        }

        $hasApproved = BetaAccessRequest::forUser($user->id)
            ->where('status', 'approved')
            ->exists();

        if (! $hasApproved) {
            return response()->json([
                'message' => 'Beta access diperlukan untuk melakukan checkout. Silakan ajukan permintaan beta access.',
            ], 403);
        }

        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.product_slug' => 'required|string',
            'items.*.billing_cycle' => 'required|string|in:monthly,yearly',
            'items.*.quantity' => 'nullable|integer|min:1|max:99',
            'idempotency_key' => 'nullable|string',
        ]);

        // Idempotency: return the existing order on retry.
        $idempotencyKey = $validated['idempotency_key'] ?? null;
        if ($idempotencyKey) {
            $existing = Order::where('idempotency_key', $idempotencyKey)
                ->where('user_id', $user->id)
                ->first();
            if ($existing) {
                $existing->load(['items.provider', 'invoices']);

                return response()->json([
                    'message' => 'Order sudah ada (idempotent).',
                    'order' => new OrderResource($existing),
                ], 200);
            }
        }

        // Resolve & validate every line before creating anything.
        $lines = [];
        $cycles = [];
        $totalMinor = 0;
        $currency = 'IDR';

        foreach ($validated['items'] as $line) {
            $product = ResourceProduct::where('slug', $line['product_slug'])
                ->with(['provider', 'prices'])
                ->first();

            if (! $product) {
                return response()->json([
                    'message' => "Produk {$line['product_slug']} tidak ditemukan.",
                ], 404);
            }

            if (! $product->is_active || $product->availability_status !== 'available') {
                return response()->json([
                    'message' => "Produk {$product->name} tidak tersedia untuk dipesan.",
                ], 422);
            }

            $price = $product->prices->firstWhere('billing_cycle', $line['billing_cycle']);
            if (! $price) {
                return response()->json([
                    'message' => "Harga billing cycle {$line['billing_cycle']} tidak tersedia untuk {$product->name}.",
                ], 422);
            }

            $quantity = (int) ($line['quantity'] ?? 1);
            $currency = $price->currency;
            $cycles[] = $line['billing_cycle'];
            $totalMinor += $price->gross_price_minor * $quantity;

            $lines[] = [
                'product' => $product,
                'price' => $price,
                'billing_cycle' => $line['billing_cycle'],
                'quantity' => $quantity,
            ];
        }

        $orderBillingCycle = count(array_unique($cycles)) === 1 ? $cycles[0] : 'mixed';

        $order = DB::transaction(function () use ($user, $lines, $totalMinor, $currency, $orderBillingCycle, $idempotencyKey) {
            $orderNumber = $this->uniqueNumber('ORD', Order::class, 'order_number');

            $order = Order::create([
                'public_id' => Str::ulid()->toBase32(),
                'user_id' => $user->id,
                'order_number' => $orderNumber,
                'status' => 'pending_payment',
                'billing_cycle' => $orderBillingCycle,
                'subtotal_minor' => $totalMinor,
                'currency' => $currency,
                'idempotency_key' => $idempotencyKey,
            ]);

            foreach ($lines as $line) {
                $product = $line['product'];
                $price = $line['price'];
                $commissionRate = $product->provider->commission_rate;
                $commissionMinor = (int) round($price->gross_price_minor * ($commissionRate / 100));

                $snapshot = [
                    'name' => $product->name,
                    'slug' => $product->slug,
                    'specs' => $product->specs,
                    'region' => $product->region,
                    'resource_type' => $product->resource_type,
                    'provisioning_sla' => $product->provisioning_sla ?? null,
                ];

                // One OrderItem per unit (no quantity column in the schema).
                for ($i = 0; $i < $line['quantity']; $i++) {
                    OrderItem::create([
                        'public_id' => Str::ulid()->toBase32(),
                        'order_id' => $order->id,
                        'product_id' => $product->id,
                        'provider_id' => $product->provider_id,
                        'product_snapshot' => $snapshot,
                        'price_minor' => $price->gross_price_minor,
                        'commission_rate' => $commissionRate,
                        'commission_minor' => $commissionMinor,
                        'billing_cycle' => $line['billing_cycle'],
                        'currency' => $price->currency,
                    ]);
                }
            }

            $invoice = Invoice::create([
                'public_id' => Str::ulid()->toBase32(),
                'order_id' => $order->id,
                'user_id' => $user->id,
                'invoice_number' => $this->uniqueNumber('INV', Invoice::class, 'invoice_number'),
                'status' => 'pending',
                'subtotal_minor' => $totalMinor,
                'total_minor' => $totalMinor,
                'currency' => $currency,
                'due_at' => now()->addHours(24),
            ]);

            // Create the pending Payment so POST /orders/{id}/pay can issue a Snap token.
            Payment::create([
                'public_id' => (string) Str::ulid(),
                'invoice_id' => $invoice->id,
                'user_id' => $user->id,
                'gateway' => 'midtrans',
                'amount_minor' => $totalMinor,
                'currency' => $currency,
                'status' => 'pending',
                'expires_at' => now()->addHours(24),
            ]);

            return $order;
        });

        $order->load(['items.provider', 'invoices']);

        return response()->json([
            'message' => 'Order berhasil dibuat.',
            'order' => new OrderResource($order),
        ], 201);
    }

    /**
     * Generate a collision-free prefixed number, e.g. ORD-ABC123XYZ0.
     */
    private function uniqueNumber(string $prefix, string $modelClass, string $column): string
    {
        do {
            $candidate = $prefix.'-'.strtoupper(Str::random(10));
        } while ($modelClass::where($column, $candidate)->exists());

        return $candidate;
    }
}
