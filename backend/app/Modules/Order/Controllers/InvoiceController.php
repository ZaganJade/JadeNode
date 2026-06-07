<?php

namespace App\Modules\Order\Controllers;

use App\Modules\Order\Models\Invoice;
use App\Modules\Order\Models\Payment;
use App\Modules\Order\Services\MidtransService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Str;

class InvoiceController
{
    /**
     * Customer: List own invoices with pagination.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $invoices = Invoice::where('user_id', $request->user()->id)
            ->with(['order.items', 'payments'])
            ->latest()
            ->paginate(15);

        return \App\Http\Resources\InvoiceResource::collection($invoices);
    }

    /**
     * Customer: Show a single invoice detail.
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $invoice = Invoice::where('public_id', $id)
            ->where('user_id', $request->user()->id)
            ->with(['order.items', 'payments'])
            ->first();

        if (! $invoice) {
            return response()->json([
                'message' => 'Invoice tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'invoice' => new \App\Http\Resources\InvoiceResource($invoice),
        ]);
    }

    /**
     * Customer: Pay a pending invoice via Midtrans Snap.
     *
     * Ensures a pending Payment exists (creating one if the invoice was made
     * before payments were attached), then returns a Snap token.
     */
    public function pay(Request $request, string $id): JsonResponse
    {
        $user = $request->user();

        $invoice = Invoice::where('public_id', $id)
            ->where('user_id', $user->id)
            ->first();

        if (! $invoice) {
            return response()->json(['message' => 'Invoice tidak ditemukan.'], 404);
        }

        if ($invoice->status === 'paid') {
            return response()->json(['message' => 'Invoice sudah dibayar.'], 422);
        }

        if (in_array($invoice->status, ['cancelled', 'void'], true)) {
            return response()->json(['message' => 'Invoice tidak dapat dibayar.'], 422);
        }

        $payment = Payment::where('invoice_id', $invoice->id)
            ->where('status', 'pending')
            ->first();

        if (! $payment) {
            $payment = Payment::create([
                'public_id' => (string) Str::ulid(),
                'invoice_id' => $invoice->id,
                'user_id' => $user->id,
                'gateway' => 'midtrans',
                'amount_minor' => $invoice->total_minor,
                'currency' => $invoice->currency,
                'status' => 'pending',
                'expires_at' => now()->addHours(24),
            ]);
        }

        // Idempotent: reuse an existing Snap token.
        if ($payment->gateway_snap_token) {
            return response()->json([
                'message' => 'Snap token sudah tersedia.',
                'data' => [
                    'snap_token' => $payment->gateway_snap_token,
                    'payment_id' => $payment->public_id,
                ],
            ]);
        }

        try {
            $result = (new MidtransService())->createSnapTransaction($payment);
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 502);
        }

        return response()->json([
            'message' => 'Transaksi berhasil dibuat.',
            'data' => [
                'snap_token' => $result['snap_token'],
                'redirect_url' => $result['redirect_url'] ?? null,
                'payment_id' => $payment->public_id,
            ],
        ]);
    }
}
