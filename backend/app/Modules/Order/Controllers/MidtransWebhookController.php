<?php

namespace App\Modules\Order\Controllers;

use App\Modules\Order\Models\Payment;
use App\Modules\Order\Models\PaymentGatewayEvent;
use App\Modules\Order\Services\MidtransService;
use App\Modules\Order\Services\PaymentStateService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class MidtransWebhookController
{
    /**
     * Handle incoming Midtrans webhook notifications.
     */
    public function handle(Request $request): JsonResponse
    {
        $payload = $request->all();

        Log::info('Midtrans webhook received', [
            'order_id' => $payload['order_id'] ?? null,
            'transaction_status' => $payload['transaction_status'] ?? null,
        ]);

        $midtransService = new MidtransService();

        // Validate signature
        if (! $midtransService->verifySignature($payload)) {
            Log::warning('Midtrans webhook signature validation failed', [
                'order_id' => $payload['order_id'] ?? null,
            ]);

            return response()->json([
                'message' => 'Signature tidak valid.',
            ], 403);
        }

        $gatewayTransactionId = $payload['order_id'] ?? null;
        $transactionStatus = $payload['transaction_status'] ?? null;
        $fraudStatus = $payload['fraud_status'] ?? null;

        if (! $gatewayTransactionId) {
            return response()->json([
                'message' => 'Missing order_id.',
            ], 400);
        }

        // Find payment by gateway_transaction_id
        $payment = Payment::where('gateway_transaction_id', $gatewayTransactionId)->first();

        if (! $payment) {
            Log::warning('Midtrans webhook: payment not found', [
                'gateway_transaction_id' => $gatewayTransactionId,
            ]);

            return response()->json([
                'message' => 'Pembayaran tidak ditemukan.',
            ], 404);
        }

        // Record gateway event
        $gatewayEvent = PaymentGatewayEvent::create([
            'payment_id' => $payment->id,
            'gateway_transaction_id' => $gatewayTransactionId,
            'event_type' => $transactionStatus,
            'payload' => $payload,
            'is_processed' => false,
            'created_at' => now(),
        ]);

        // Idempotency: skip if already in a terminal state
        if ($payment->isTerminal()) {
            $gatewayEvent->update([
                'is_processed' => true,
                'processed_at' => now(),
            ]);

            Log::info('Midtrans webhook: payment already in terminal state, skipping.', [
                'payment_id' => $payment->id,
                'status' => $payment->status,
            ]);

            return response()->json([
                'message' => 'Pembayaran sudah diproses.',
            ]);
        }

        $paymentStateService = new PaymentStateService();

        // Process based on transaction status
        $processed = $this->processTransactionStatus(
            $payment,
            $transactionStatus,
            $fraudStatus,
            $paymentStateService
        );

        if ($processed) {
            $gatewayEvent->update([
                'is_processed' => true,
                'processed_at' => now(),
            ]);
        }

        return response()->json([
            'message' => 'Webhook berhasil diproses.',
        ]);
    }

    /**
     * Map Midtrans transaction status to payment state transitions.
     */
    private function processTransactionStatus(
        Payment $payment,
        string $transactionStatus,
        ?string $fraudStatus,
        PaymentStateService $paymentStateService
    ): bool {
        switch ($transactionStatus) {
            case 'settlement':
                $paymentStateService->processPaymentPaid($payment);

                return true;

            case 'capture':
                if ($fraudStatus === 'accept' || $fraudStatus === null) {
                    $paymentStateService->processPaymentPaid($payment);
                } else {
                    $paymentStateService->processPaymentFailed(
                        $payment,
                        "Fraud status: {$fraudStatus}"
                    );
                }

                return true;

            case 'deny':
                $paymentStateService->processPaymentFailed($payment, 'Transaction denied by gateway.');

                return true;

            case 'cancel':
            case 'expire':
                $paymentStateService->processPaymentFailed($payment, "Transaction {$transactionStatus}.");

                return true;

            case 'pending':
                // No state change needed, still pending
                Log::info('Midtrans webhook: transaction still pending.', [
                    'payment_id' => $payment->id,
                ]);

                return true;

            default:
                Log::warning('Midtrans webhook: unknown transaction status.', [
                    'payment_id' => $payment->id,
                    'transaction_status' => $transactionStatus,
                ]);

                return false;
        }
    }
}
