<?php

namespace App\Modules\Order\Controllers;

use App\Modules\Order\Models\Payment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminPaymentListController
{
    /**
     * List all payments with filtering for admin dashboard.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Payment::with(['user', 'invoice.order']);

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('payment_method')) {
            $query->where('payment_method', $request->input('payment_method'));
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('public_id', 'ilike', "%{$search}%")
                  ->orWhere('gateway_transaction_id', 'ilike', "%{$search}%");
            });
        }

        $sortBy = $request->input('sort_by', 'created_at');
        $sortDir = $request->input('sort_dir', 'desc');

        $query->orderBy($sortBy, $sortDir === 'asc' ? 'asc' : 'desc');

        $payments = $query->paginate($request->input('per_page', 25));

        return response()->json([
            'data' => $payments->map(fn ($p) => [
                'id' => $p->id,
                'public_id' => $p->public_id,
                'user_name' => $p->user?->name,
                'user_email' => $p->user?->email,
                'status' => $p->status,
                'payment_method' => $p->payment_method,
                'amount_minor' => $p->amount_minor,
                'currency' => $p->currency,
                'gateway_transaction_id' => $p->gateway_transaction_id,
                'paid_at' => $p->paid_at?->toIso8601String(),
                'created_at' => $p->created_at->toIso8601String(),
            ]),
            'meta' => [
                'current_page' => $payments->currentPage(),
                'last_page' => $payments->lastPage(),
                'per_page' => $payments->perPage(),
                'total' => $payments->total(),
            ],
        ]);
    }
}
