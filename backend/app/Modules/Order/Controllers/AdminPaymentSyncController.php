<?php

namespace App\Modules\Order\Controllers;

use App\Modules\Order\Models\Payment;
use App\Modules\Order\Models\PaymentSyncAttempt;
use App\Modules\Order\Services\MidtransService;
use App\Modules\Order\Services\PaymentStateService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AdminPaymentSyncController
{
    /**
     * Admin-triggered payment sync against Midtrans.
     */
    public function sync(Request $request, string $paymentId): JsonResponse
    {
        $payment = Payment::where('public_id', $paymentId)->first();

        if (! $payment) {
            return response()->json([
                'message' => 'Pembayaran tidak ditemukan.',
            ], 404);
        }

        if (! $payment->gateway_transaction_id) {
            return response()->json([
                'message' => 'Pembayaran tidak memiliki gateway transaction ID.',
            ], 422);
        }

        $statusBefore = $payment->status;

        try {
            $midtransService = new MidtransService();
            $gatewayStatus = $midtransService->getTransactionStatus($payment->gateway_transaction_id);
        } catch (\RuntimeException $e) {
            // Record failed sync attempt
            PaymentSyncAttempt::create([
                'payment_id' => $payment->id,
                'trigger_type' => 'admin',
                'error_message' => $e->getMessage(),
                'created_at' => now(),
            ]);

            return response()->json([
                'message' => $e->getMessage(),
            ], 502);
        }

        $transactionStatus = $gatewayStatus['transaction_status'] ?? null;
        $fraudStatus = $gatewayStatus['fraud_status'] ?? null;

        $paymentStateService = new PaymentStateService();

        // Apply same state transitions as webhook
        switch ($transactionStatus) {
            case 'settlement':
                $paymentStateService->processPaymentPaid($payment);
                break;

            case 'capture':
                if ($fraudStatus === 'accept' || $fraudStatus === null) {
                    $paymentStateService->processPaymentPaid($payment);
                } else {
                    $paymentStateService->processPaymentFailed($payment, "Fraud status: {$fraudStatus}");
                }
                break;

            case 'deny':
                $paymentStateService->processPaymentFailed($payment, 'Transaction denied by gateway.');
                break;

            case 'cancel':
            case 'expire':
                $paymentStateService->processPaymentFailed($payment, "Transaction {$transactionStatus}.");
                break;
        }

        $payment->refresh();
        $statusAfter = $payment->status;

        // Record sync attempt
        PaymentSyncAttempt::create([
            'payment_id' => $payment->id,
            'trigger_type' => 'admin',
            'result_status' => $statusAfter,
            'created_at' => now(),
        ]);

        Log::info('Admin payment sync completed.', [
            'payment_id' => $payment->id,
            'status_before' => $statusBefore,
            'status_after' => $statusAfter,
            'gateway_status' => $transactionStatus,
        ]);

        return response()->json([
            'message' => 'Sinkronisasi pembayaran berhasil.',
            'data' => [
                'payment_id' => $payment->public_id,
                'status_before' => $statusBefore,
                'status_after' => $statusAfter,
                'gateway_transaction_status' => $transactionStatus,
            ],
        ]);
    }
}
