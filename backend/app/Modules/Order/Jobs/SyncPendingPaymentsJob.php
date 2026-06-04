<?php

namespace App\Modules\Order\Jobs;

use App\Modules\Order\Models\Payment;
use App\Modules\Order\Models\PaymentSyncAttempt;
use App\Modules\Order\Services\MidtransService;
use App\Modules\Order\Services\PaymentStateService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SyncPendingPaymentsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct()
    {
        //
    }

    public function handle(): void
    {
        $cutoff = now()->subMinutes(15);

        $pendingPayments = Payment::where('status', 'pending')
            ->where('created_at', '<=', $cutoff)
            ->whereNotNull('gateway_transaction_id')
            ->get();

        Log::info('SyncPendingPaymentsJob running.', [
            'count' => $pendingPayments->count(),
        ]);

        $midtransService = new MidtransService();
        $paymentStateService = new PaymentStateService();

        foreach ($pendingPayments as $payment) {
            $this->syncPayment($payment, $midtransService, $paymentStateService);
        }
    }

    private function syncPayment(
        Payment $payment,
        MidtransService $midtransService,
        PaymentStateService $paymentStateService
    ): void {
        $statusBefore = $payment->status;

        try {
            $gatewayStatus = $midtransService->getTransactionStatus(
                $payment->gateway_transaction_id
            );
        } catch (\RuntimeException $e) {
            PaymentSyncAttempt::create([
                'payment_id' => $payment->id,
                'trigger_type' => 'scheduled',
                'error_message' => $e->getMessage(),
                'created_at' => now(),
            ]);

            Log::warning('SyncPendingPaymentsJob: failed to check status.', [
                'payment_id' => $payment->id,
                'error' => $e->getMessage(),
            ]);

            return;
        }

        $transactionStatus = $gatewayStatus['transaction_status'] ?? null;
        $fraudStatus = $gatewayStatus['fraud_status'] ?? null;

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

        PaymentSyncAttempt::create([
            'payment_id' => $payment->id,
            'trigger_type' => 'scheduled',
            'result_status' => $payment->status,
            'created_at' => now(),
        ]);
    }
}
