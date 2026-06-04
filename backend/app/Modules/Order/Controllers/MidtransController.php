<?php

namespace App\Modules\Order\Controllers;

use App\Modules\Order\Models\Payment;
use App\Modules\Order\Services\MidtransService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * MidtransController — Customer-facing controller for initiating
 * Midtrans Snap checkout from the frontend.
 *
 * This controller complements PaymentController by providing a dedicated
 * endpoint that returns the snap_token for the frontend Snap.js integration.
 */
class MidtransController
{
    /**
     * Get or create a snap token for the given payment.
     */
    public function snapToken(Request $request, string $paymentId): JsonResponse
    {
        $user = $request->user();

        $payment = Payment::where('public_id', $paymentId)
            ->where('user_id', $user->id)
            ->where('status', 'pending')
            ->first();

        if (! $payment) {
            return response()->json([
                'message' => 'Pembayaran tidak ditemukan atau sudah diproses.',
            ], 404);
        }

        // Idempotent: return existing snap token
        if ($payment->gateway_snap_token) {
            return response()->json([
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

        return response()->json([
            'data' => [
                'snap_token' => $result['snap_token'],
                'redirect_url' => $result['redirect_url'],
                'payment_id' => $payment->public_id,
            ],
        ]);
    }
}
