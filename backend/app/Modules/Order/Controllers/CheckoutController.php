<?php

namespace App\Modules\Order\Controllers;

use App\Http\Requests\CheckoutRequest;
use App\Http\Resources\OrderResource;
use App\Modules\Auth\Models\BetaAccessRequest;
use App\Modules\Marketplace\Models\ResourceProduct;
use App\Modules\Order\Models\Invoice;
use App\Modules\Order\Models\Order;
use App\Modules\Order\Models\OrderItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Str;

class CheckoutController
{
    /**
     * Create a new order (checkout).
     *
     * Requires: authenticated, verified email, approved beta access.
     */
    public function store(CheckoutRequest $request): JsonResponse
    {
        $user = $request->user();

        // Verify email is verified
        if (! $user->hasVerifiedEmail()) {
            return response()->json([
                'message' => 'Email belum terverifikasi. Silakan verifikasi email kamu terlebih dahulu.',
            ], 403);
        }

        // Verify beta access is approved
        $hasApproved = BetaAccessRequest::forUser($user->id)
            ->where('status', 'approved')
            ->exists();

        if (! $hasApproved) {
            return response()->json([
                'message' => 'Beta access diperlukan untuk melakukan checkout. Silakan ajukan permintaan beta access.',
            ], 403);
        }

        // Idempotency check
        $idempotencyKey = $request->input('idempotency_key');
        if ($idempotencyKey) {
            $existingOrder = Order::where('idempotency_key', $idempotencyKey)
                ->where('user_id', $user->id)
                ->first();

            if ($existingOrder) {
                $existingOrder->load(['items', 'invoices']);
                return response()->json([
                    'message' => 'Order sudah ada (idempotent).',
                    'order' => new OrderResource($existingOrder),
                ], 200);
            }
        }

        // Find product
        $product = ResourceProduct::where('slug', $request->input('product_slug'))
            ->with(['provider', 'prices'])
            ->first();

        if (! $product) {
            return response()->json([
                'message' => 'Produk tidak ditemukan.',
            ], 404);
        }

        // Check product is active and available
        if (! $product->is_active || $product->availability_status !== 'available') {
            return response()->json([
                'message' => 'Produk tidak tersedia untuk dipesan.',
            ], 422);
        }

        // Find price for the requested billing cycle
        $billingCycle = $request->input('billing_cycle');
        $price = $product->prices->firstWhere('billing_cycle', $billingCycle);

        if (! $price) {
            return response()->json([
                'message' => "Harga untuk billing cycle {$billingCycle} tidak tersedia untuk produk ini.",
            ], 422);
        }

        // Generate order number
        $orderNumber = 'ORD-' . strtoupper(Str::random(10));
        while (Order::where('order_number', $orderNumber)->exists()) {
            $orderNumber = 'ORD-' . strtoupper(Str::random(10));
        }

        // Create Order
        $order = Order::create([
            'public_id' => Str::ulid()->toBase32(),
            'user_id' => $user->id,
            'order_number' => $orderNumber,
            'status' => 'pending_payment',
            'billing_cycle' => $billingCycle,
            'subtotal_minor' => $price->gross_price_minor,
            'currency' => $price->currency,
            'idempotency_key' => $idempotencyKey,
        ]);

        // Create product snapshot
        $productSnapshot = [
            'name' => $product->name,
            'slug' => $product->slug,
            'specs' => $product->specs,
            'region' => $product->region,
            'resource_type' => $product->resource_type,
        ];

        // Calculate commission
        $commissionRate = $product->provider->commission_rate;
        $commissionMinor = (int) round($price->gross_price_minor * ($commissionRate / 100));

        // Create OrderItem
        OrderItem::create([
            'public_id' => Str::ulid()->toBase32(),
            'order_id' => $order->id,
            'product_id' => $product->id,
            'provider_id' => $product->provider_id,
            'product_snapshot' => $productSnapshot,
            'price_minor' => $price->gross_price_minor,
            'commission_rate' => $commissionRate,
            'commission_minor' => $commissionMinor,
            'billing_cycle' => $billingCycle,
            'currency' => $price->currency,
        ]);

        // Generate invoice number
        $invoiceNumber = 'INV-' . strtoupper(Str::random(10));
        while (Invoice::where('invoice_number', $invoiceNumber)->exists()) {
            $invoiceNumber = 'INV-' . strtoupper(Str::random(10));
        }

        // Create Invoice
        Invoice::create([
            'public_id' => Str::ulid()->toBase32(),
            'order_id' => $order->id,
            'user_id' => $user->id,
            'invoice_number' => $invoiceNumber,
            'status' => 'pending',
            'subtotal_minor' => $price->gross_price_minor,
            'total_minor' => $price->gross_price_minor,
            'currency' => $price->currency,
            'due_at' => now()->addHours(24),
        ]);

        $order->load(['items', 'invoices']);

        return response()->json([
            'message' => 'Order berhasil dibuat.',
            'order' => new OrderResource($order),
        ], 201);
    }

    /**
     * Show order detail with items, invoice, and payment status.
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $order = Order::where('public_id', $id)
            ->where('user_id', $request->user()->id)
            ->with(['items', 'invoices.payments'])
            ->first();

        if (! $order) {
            return response()->json([
                'message' => 'Order tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'order' => new OrderResource($order),
        ]);
    }

    /**
     * List user's orders with pagination.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $orders = Order::where('user_id', $request->user()->id)
            ->with(['items', 'invoices'])
            ->latest()
            ->paginate(15);

        return OrderResource::collection($orders);
    }
}
