<?php

namespace App\Modules\Order\Services;

use App\Modules\Order\Models\Payment;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class MidtransService
{
    private string $serverKey;

    private bool $isProduction;

    private string $snapBaseUrl;

    private string $apiBaseUrl;

    public function __construct()
    {
        $this->serverKey = config('services.midtrans.server_key', env('MIDTRANS_SERVER_KEY', ''));
        $this->isProduction = config('services.midtrans.is_production', env('MIDTRANS_IS_PRODUCTION', false));
        $this->snapBaseUrl = $this->isProduction
            ? 'https://app.midtrans.com/snap/v1'
            : 'https://app.sandbox.midtrans.com/snap/v1';
        $this->apiBaseUrl = $this->isProduction
            ? 'https://api.midtrans.com/v2'
            : 'https://api.sandbox.midtrans.com/v2';
    }

    /**
     * Create a Midtrans Snap transaction for the given payment.
     *
     * @return array{snap_token: string, redirect_url: string}
     *
     * @throws \RuntimeException
     */
    public function createSnapTransaction(Payment $payment): array
    {
        $payment->load([
            'invoice.order.user',
            'invoice.order.items.product',
        ]);

        $order = $payment->invoice->order;
        $user = $order->user;

        $orderId = 'JN-'.$payment->public_id.'-'.strtoupper(Str::random(6));

        $payload = [
            'transaction_details' => [
                'order_id' => $orderId,
                'gross_amount' => (int) ($payment->amount_minor / 100),
            ],
            'customer_details' => [
                'first_name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone ?? '',
            ],
            'item_details' => $this->buildItemDetails($order),
        ];

        try {
            $response = Http::withHeaders([
                'Accept' => 'application/json',
                'Content-Type' => 'application/json',
                'Authorization' => 'Basic '.base64_encode($this->serverKey.':'),
            ])->post("{$this->snapBaseUrl}/transactions", $payload);
        } catch (ConnectionException $e) {
            Log::error('Midtrans connection failed', [
                'payment_id' => $payment->id,
                'error' => $e->getMessage(),
            ]);
            throw new \RuntimeException('Gagal terhubung ke payment gateway.');
        }

        if (! $response->successful()) {
            Log::error('Midtrans Snap creation failed', [
                'payment_id' => $payment->id,
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            throw new \RuntimeException('Gagal membuat transaksi Midtrans: '.$response->body());
        }

        $data = $response->json();

        $payment->update([
            'gateway_transaction_id' => $orderId,
            'gateway_snap_token' => $data['token'],
            'gateway_payload' => $payload,
        ]);

        return [
            'snap_token' => $data['token'],
            'redirect_url' => $data['redirect_url'],
        ];
    }

    /**
     * Validate Midtrans webhook signature.
     */
    public function verifySignature(array $payload): bool
    {
        $orderId = $payload['order_id'] ?? '';
        $statusCode = $payload['status_code'] ?? '';
        $grossAmount = $payload['gross_amount'] ?? '';
        $serverKey = $this->serverKey;

        $expected = hash('sha512', $orderId.$statusCode.$grossAmount.$serverKey);

        return hash_equals($expected, $payload['signature_key'] ?? '');
    }

    /**
     * Query Midtrans API for transaction status.
     *
     * @throws \RuntimeException
     */
    public function getTransactionStatus(string $transactionId): array
    {
        try {
            $response = Http::withHeaders([
                'Accept' => 'application/json',
                'Authorization' => 'Basic '.base64_encode($this->serverKey.':'),
            ])->get("{$this->apiBaseUrl}/{$transactionId}/status");
        } catch (ConnectionException $e) {
            Log::error('Midtrans status check failed', [
                'transaction_id' => $transactionId,
                'error' => $e->getMessage(),
            ]);
            throw new \RuntimeException('Gagal mengecek status transaksi.');
        }

        if (! $response->successful()) {
            throw new \RuntimeException('Gagal mengecek status transaksi Midtrans.');
        }

        return $response->json();
    }

    /**
     * Build Midtrans item_details from order items.
     */
    private function buildItemDetails($order): array
    {
        return $order->items->map(function ($item) {
            $name = $item->product_snapshot['name'] ?? 'Service';

            return [
                'id' => (string) $item->product_id,
                'price' => (int) ($item->price_minor / 100),
                'quantity' => 1,
                'name' => Str::limit($name, 50),
            ];
        })->values()->toArray();
    }
}
