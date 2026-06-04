<?php

namespace App\Modules\Order\Controllers;

use App\Modules\Order\Models\Order;
use App\Modules\Order\Models\Payment;
use App\Modules\Order\Services\MidtransService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentController
{
    /**
     * Create or retrieve a Snap transaction for the given order's pending payment.
     */
    public function create(Request $request, int $orderId): JsonResponse
    {
        $user = $request->user();

        $order = Order::where('id', $orderId)
            ->where('user_id', $user->id)
            ->first();

        if (! $order) {
            return response()->json([
                'message' => 'Order tidak ditemukan.',
            ], 404);
        }

        // Find the pending payment for this order
        $payment = Payment::where('user_id', $user->id)
            ->whereHas('invoice', function ($query) use ($orderId) {
                $query->where('order_id', $orderId);
            })
            ->where('status', 'pending')
            ->first();

        if (! $payment) {
            return response()->json([
                'message' => 'Tidak ada pembayaran pending untuk order ini.',
            ], 404);
        }

        // Idempotent: if snap token already exists, return it
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
            $midtransService = new MidtransService();
            $result = $midtransService->createSnapTransaction($payment);
        } catch (\RuntimeException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 502);
        }

        // Refresh payment to get updated gateway_snap_token
        $payment->refresh();

        return response()->json([
            'message' => 'Transaksi berhasil dibuat.',
            'data' => [
                'snap_token' => $result['snap_token'],
                'redirect_url' => $result['redirect_url'],
                'payment_id' => $payment->public_id,
            ],
        ]);
    }

    /**
     * Get the status of a payment.
     */
    public function status(Request $request, string $paymentId): JsonResponse
    {
        $user = $request->user();

        $payment = Payment::where('public_id', $paymentId)
            ->where('user_id', $user->id)
            ->first();

        if (! $payment) {
            return response()->json([
                'message' => 'Pembayaran tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'data' => [
                'payment_id' => $payment->public_id,
                'status' => $payment->status,
                'payment_method' => $payment->payment_method,
                'gateway' => $payment->gateway,
                'amount_minor' => $payment->amount_minor,
                'currency' => $payment->currency,
                'paid_at' => $payment->paid_at?->toIso8601String(),
                'created_at' => $payment->created_at->toIso8601String(),
            ],
        ]);
    }
}
