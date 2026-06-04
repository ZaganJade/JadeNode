<?php

namespace App\Modules\Order\Services;

use App\Modules\Order\Models\Payment;
use Illuminate\Support\Facades\Log;

class PaymentStateService
{
    /**
     * Process a payment that has been confirmed as paid.
     *
     * Idempotent: if already paid, returns without changes.
     */
    public function processPaymentPaid(Payment $payment): void
    {
        if ($payment->isPaid()) {
            Log::info('Payment already paid, skipping.', ['payment_id' => $payment->id]);

            return;
        }

        $payment->update([
            'status' => 'paid',
            'paid_at' => now(),
        ]);

        // Mark invoice paid
        $invoice = $payment->invoice;
        if ($invoice && $invoice->status !== 'paid') {
            $invoice->update([
                'status' => 'paid',
                'paid_at' => now(),
            ]);
        }

        // Mark order paid
        $order = $invoice?->order;
        if ($order && $order->status !== 'paid') {
            $order->update([
                'status' => 'paid',
            ]);
        }

        Log::info('Payment processed as paid.', [
            'payment_id' => $payment->id,
            'invoice_id' => $invoice?->id,
            'order_id' => $order?->id,
        ]);

        // Dispatch provisioning task creation event
        event('order.paid', [$order]);
    }

    /**
     * Process a payment that has failed or expired.
     *
     * Idempotent: if already in a terminal state, returns without changes.
     */
    public function processPaymentFailed(Payment $payment, string $reason): void
    {
        if ($payment->isTerminal()) {
            Log::info('Payment already in terminal state, skipping.', [
                'payment_id' => $payment->id,
                'status' => $payment->status,
            ]);

            return;
        }

        $payment->update([
            'status' => 'failed',
        ]);

        Log::info('Payment processed as failed.', [
            'payment_id' => $payment->id,
            'reason' => $reason,
        ]);
    }
}
