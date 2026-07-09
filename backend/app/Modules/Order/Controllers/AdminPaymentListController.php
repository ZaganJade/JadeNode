<?php

namespace App\Modules\Order\Controllers;

use App\Modules\Order\Models\Payment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminPaymentListController
{
    /**
     * List all payments with filtering for admin dashboard.
     *
     * Eager-loads the owning user, invoice, order, and order items so the
     * admin can see the transaction in full context (customer, product,
     * invoice number, order number).
     */
    public function index(Request $request): JsonResponse
    {
        $query = Payment::with(['user', 'invoice.order.items']);

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('payment_method')) {
            $query->where('payment_method', $request->input('payment_method'));
        }

        if ($request->filled('gateway')) {
            $query->where('gateway', $request->input('gateway'));
        }

        // Search across payment public_id, gateway transaction id, AND the
        // owning customer's name/email. Uses LOWER() for cross-DB
        // (SQLite + PostgreSQL) case-insensitive matching.
        if ($request->filled('search')) {
            $search = strtolower($request->input('search'));
            $query->where(function ($q) use ($search) {
                $q->whereRaw('LOWER(public_id) LIKE ?', ["%{$search}%"])
                  ->orWhereRaw('LOWER(gateway_transaction_id) LIKE ?', ["%{$search}%"])
                  ->orWhereHas('user', function ($u) use ($search) {
                      $u->whereRaw('LOWER(name) LIKE ?', ["%{$search}%"])
                        ->orWhereRaw('LOWER(email) LIKE ?', ["%{$search}%"]);
                  });
            });
        }

        $sortBy = $request->input('sort_by', 'created_at');
        $sortDir = $request->input('sort_dir', 'desc');

        $query->orderBy($sortBy, $sortDir === 'asc' ? 'asc' : 'desc');

        $payments = $query->paginate($request->input('per_page', 25));

        return response()->json([
            'data' => $payments->getCollection()->map(fn ($p) => [
                'id' => $p->id,
                'public_id' => $p->public_id,
                'user_name' => $p->user?->name,
                'user_email' => $p->user?->email,
                'status' => $p->status,
                'payment_method' => $p->payment_method,
                'gateway' => $p->gateway,
                'gateway_transaction_id' => $p->gateway_transaction_id,
                'amount_minor' => $p->amount_minor,
                'currency' => $p->currency,
                'invoice_number' => $p->invoice?->invoice_number,
                'invoice_public_id' => $p->invoice?->public_id,
                'invoice_status' => $p->invoice?->status,
                'order_number' => $p->invoice?->order?->order_number,
                'product_summary' => $p->invoice?->order?->items
                    ?->map(fn ($i) => $i->product_snapshot['name'] ?? null)
                    ->filter()
                    ->implode(', ') ?: null,
                'paid_at' => $p->paid_at?->toIso8601String(),
                'created_at' => $p->created_at->toIso8601String(),
            ])->values(),
            'meta' => [
                'current_page' => $payments->currentPage(),
                'last_page' => $payments->lastPage(),
                'per_page' => $payments->perPage(),
                'total' => $payments->total(),
            ],
        ]);
    }
}
