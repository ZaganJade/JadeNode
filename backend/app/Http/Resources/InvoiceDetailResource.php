<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Flat InvoiceDetail shape consumed by the customer invoice detail page
 * (/invoices/[id]). Unlike InvoiceResource (which nests the order and exposes
 * a payments collection), this resource:
 *   - flattens order_public_id / order_number,
 *   - exposes a top-level `items` array of derivable line items
 *     (description / quantity / unit_price / subtotal),
 *   - exposes a single `payment` object (the settled payment) or null.
 *
 * Expects `order.items` and `payments` to be eager-loaded.
 */
class InvoiceDetailResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $order = $this->whenLoaded('order');
        $items = [];

        if ($order && $order->relationLoaded('items')) {
            foreach ($order->items as $item) {
                $snapshot = $item->product_snapshot ?? [];
                $quantity = (int) ($item->quantity ?? 1);
                $unitPrice = (int) ($item->price_minor ?? 0);

                $items[] = [
                    'description' => $snapshot['name'] ?? null,
                    'quantity' => $quantity,
                    'unit_price' => $unitPrice,
                    'subtotal' => $unitPrice * $quantity,
                ];
            }
        }

        // The settled payment for this invoice (if any).
        $payment = null;
        if ($this->relationLoaded('payments')) {
            $settled = $this->payments->first(fn ($p) => $p->status === 'paid')
                ?? $this->payments->first();

            if ($settled) {
                $payment = [
                    'method' => $settled->payment_method,
                    'paid_at' => $settled->paid_at?->toIso8601String(),
                    'amount' => (int) ($settled->amount_minor ?? 0),
                    'currency' => $settled->currency,
                    'reference' => $settled->gateway_transaction_id,
                ];
            }
        }

        return [
            'public_id' => $this->public_id,
            'invoice_number' => $this->invoice_number,
            'status' => $this->status,
            'subtotal' => (int) ($this->subtotal_minor ?? 0),
            'total' => (int) ($this->total_minor ?? 0),
            'currency' => $this->currency,
            'order_public_id' => $order?->public_id,
            'order_number' => $order?->order_number,
            'due_date' => $this->due_at?->toIso8601String(),
            'paid_at' => $this->paid_at?->toIso8601String(),
            'items' => $items,
            'payment' => $payment,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
