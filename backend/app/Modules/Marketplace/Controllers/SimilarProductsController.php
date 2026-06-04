<?php

namespace App\Modules\Marketplace\Controllers;

use App\Http\Resources\ListingResource;
use App\Models\ProductListing;
use Illuminate\Http\JsonResponse;

class SimilarProductsController
{
    /**
     * Find up to 3 similar products (same category, same region, exclude current).
     */
    public function index(string $productSlug): JsonResponse
    {
        $listing = ProductListing::query()
            ->active()
            ->where('slug', $productSlug)
            ->with(['category', 'resourceType'])
            ->first();

        if (! $listing) {
            return response()->json([
                'message' => 'Produk tidak ditemukan.',
            ], 404);
        }

        $similar = ProductListing::query()
            ->active()
            ->where('id', '!=', $listing->id)
            ->where('category_id', $listing->category_id)
            ->where('region', $listing->region)
            ->with(['provider', 'category', 'resourceType', 'prices'])
            ->limit(3)
            ->get();

        return response()->json([
            'data' => ListingResource::collection($similar),
        ]);
    }
}
