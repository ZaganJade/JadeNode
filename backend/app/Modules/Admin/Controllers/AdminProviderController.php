<?php

namespace App\Modules\Admin\Controllers;

use App\Http\Resources\AdminProviderResource;
use App\Models\ProviderProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminProviderController
{
    /**
     * List all provider profiles with search and filters.
     */
    public function index(Request $request): JsonResponse
    {
        $query = ProviderProfile::query()->withCount('listings');

        // Search by name or slug
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                  ->orWhere('slug', 'ilike', "%{$search}%");
            });
        }

        // Filter by status
        if ($request->filled('status')) {
            $status = $request->input('status');
            if ($status === 'active') {
                $query->where('is_active', true);
            } elseif ($status === 'inactive') {
                $query->where('is_active', false);
            }
        }

        // Filter by verification
        if ($request->filled('verified')) {
            $query->where('is_verified', $request->boolean('verified'));
        }

        $providers = $query
            ->orderBy('created_at', 'desc')
            ->paginate($request->input('per_page', 15));

        return response()->json([
            'data' => AdminProviderResource::collection($providers->items()),
            'meta' => [
                'current_page' => $providers->currentPage(),
                'last_page' => $providers->lastPage(),
                'per_page' => $providers->perPage(),
                'total' => $providers->total(),
            ],
        ]);
    }
}
