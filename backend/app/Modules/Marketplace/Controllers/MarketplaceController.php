<?php

namespace App\Modules\Marketplace\Controllers;

use App\Http\Requests\MarketplaceFilterRequest;
use App\Http\Resources\ResourceProductResource;
use App\Modules\Marketplace\Models\ResourceProduct;
use Illuminate\Http\JsonResponse;

class MarketplaceController
{
    /**
     * List active resource products with filters, sorting, and pagination.
     */
    public function index(MarketplaceFilterRequest $request): JsonResponse
    {
        $query = ResourceProduct::query()
            ->where('is_active', true)
            ->with(['provider', 'category', 'prices']);

        // Filter by category slug
        if ($request->filled('category')) {
            $query->whereHas('category', function ($q) use ($request) {
                $q->where('slug', $request->input('category'));
            });
        }

        // Filter by resource type
        if ($request->filled('resource_type')) {
            $query->where('resource_type', $request->input('resource_type'));
        }

        // Filter by region
        if ($request->filled('region')) {
            $query->where('region', 'like', '%' . $request->input('region') . '%');
        }

        // Filter by billing cycle
        if ($request->filled('billing_cycle')) {
            $query->whereHas('prices', function ($q) use ($request) {
                $q->where('billing_cycle', $request->input('billing_cycle'));
            });
        }

        // Filter by price range (applied to prices relationship)
        if ($request->filled('min_price') || $request->filled('max_price')) {
            $query->whereHas('prices', function ($q) use ($request) {
                // Convert to minor units (multiply by 100)
                if ($request->filled('min_price')) {
                    $q->where('gross_price_minor', '>=', $request->input('min_price') * 100);
                }
                if ($request->filled('max_price')) {
                    $q->where('gross_price_minor', '<=', $request->input('max_price') * 100);
                }
            });
        }

        // Search by name
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', '%' . $search . '%')
                  ->orWhere('description', 'ilike', '%' . $search . '%');
            });
        }

        // Sorting
        $sort = $request->input('sort', 'newest');
        switch ($sort) {
            case 'price_asc':
                $query->addSelect([
                    'min_price' => \App\Modules\Order\Models\ProductPrice::selectRaw('MIN(gross_price_minor)')
                        ->whereColumn('product_id', 'resource_products.id'),
                ])->orderBy('min_price', 'asc');
                break;
            case 'price_desc':
                $query->addSelect([
                    'min_price' => \App\Modules\Order\Models\ProductPrice::selectRaw('MIN(gross_price_minor)')
                        ->whereColumn('product_id', 'resource_products.id'),
                ])->orderBy('min_price', 'desc');
                break;
            case 'name':
                $query->orderBy('name', 'asc');
                break;
            case 'newest':
            default:
                $query->orderBy('created_at', 'desc');
                break;
        }

        $perPage = $request->input('per_page', 12);

        $listings = $query->paginate($perPage);

        return response()->json([
            'data' => ResourceProductResource::collection($listings),
            'meta' => [
                'current_page' => $listings->currentPage(),
                'last_page' => $listings->lastPage(),
                'per_page' => $listings->perPage(),
                'total' => $listings->total(),
            ],
        ]);
    }

    /**
     * Show a single resource product by slug.
     */
    public function show(string $slug): JsonResponse
    {
        $listing = ResourceProduct::query()
            ->where('is_active', true)
            ->with(['provider', 'category', 'prices'])
            ->where('slug', $slug)
            ->first();

        if (! $listing) {
            return response()->json([
                'message' => 'Produk tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'data' => new ResourceProductResource($listing),
        ]);
    }
}
