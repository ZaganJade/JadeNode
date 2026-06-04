<?php

namespace App\Modules\Admin\Controllers;

use App\Http\Requests\AdminUpdateListingRequest;
use App\Http\Resources\AdminListingResource;
use App\Models\AdminAuditLog;
use App\Models\ListingPrice;
use App\Models\ProductListing;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminListingController
{
    /**
     * List all product listings with provider, category, prices.
     * Supports search and filters.
     */
    public function index(Request $request): JsonResponse
    {
        $query = ProductListing::query()
            ->with(['provider', 'category', 'resourceType', 'prices', 'latestAuditLog.user']);

        // Search by name or slug
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                  ->orWhere('slug', 'ilike', "%{$search}%");
            });
        }

        // Filter by provider
        if ($request->filled('provider_id')) {
            $query->where('provider_profile_id', $request->input('provider_id'));
        }

        // Filter by category
        if ($request->filled('category_id')) {
            $query->where('category_id', $request->input('category_id'));
        }

        // Filter by availability status
        if ($request->filled('availability_status')) {
            $query->where('availability_status', $request->input('availability_status'));
        }

        // Filter by active status
        if ($request->filled('is_active')) {
            $query->where('is_active', filter_var($request->input('is_active'), FILTER_VALIDATE_BOOLEAN));
        }

        // Filter by region
        if ($request->filled('region')) {
            $query->where('region', $request->input('region'));
        }

        $sortBy = $request->input('sort_by', 'created_at');
        $sortDir = $request->input('sort_dir', 'desc');
        $allowedSorts = ['name', 'created_at', 'updated_at', 'provisioning_sla_hours', 'sort_order'];

        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortDir === 'asc' ? 'asc' : 'desc');
        }

        $perPage = $request->input('per_page', 25);
        $listings = $query->paginate($perPage);

        return response()->json([
            'data' => AdminListingResource::collection($listings),
            'meta' => [
                'current_page' => $listings->currentPage(),
                'last_page' => $listings->lastPage(),
                'per_page' => $listings->perPage(),
                'total' => $listings->total(),
            ],
        ]);
    }

    /**
     * Update a product listing's price, availability, SLA, and active status.
     * Audit logs the change.
     */
    public function update(AdminUpdateListingRequest $request, int $id): JsonResponse
    {
        $listing = ProductListing::with(['provider', 'category', 'resourceType', 'prices'])->find($id);

        if (! $listing) {
            return response()->json([
                'message' => 'Listing tidak ditemukan.',
            ], 404);
        }

        $changes = [];
        $payload = [];

        // Update availability_status
        if ($request->filled('availability_status')) {
            $old = $listing->availability_status;
            $new = $request->input('availability_status');
            if ($old !== $new) {
                $changes[] = 'availability_status';
                $payload['availability_status'] = ['old' => $old, 'new' => $new];
                $listing->availability_status = $new;
            }
        }

        // Update provisioning_sla_hours
        if ($request->filled('provisioning_sla_hours')) {
            $old = $listing->provisioning_sla_hours;
            $new = (int) $request->input('provisioning_sla_hours');
            if ($old !== $new) {
                $changes[] = 'provisioning_sla_hours';
                $payload['provisioning_sla_hours'] = ['old' => $old, 'new' => $new];
                $listing->provisioning_sla_hours = $new;
            }
        }

        // Update is_active
        if ($request->has('is_active') && $request->input('is_active') !== null) {
            $old = $listing->is_active;
            $new = (bool) $request->input('is_active');
            if ($old !== $new) {
                $changes[] = 'is_active';
                $payload['is_active'] = ['old' => $old, 'new' => $new];
                $listing->is_active = $new;
            }
        }

        // Save listing attribute changes
        if (! empty($changes)) {
            $listing->save();
        }

        // Update prices
        if ($request->has('prices') && is_array($request->input('prices'))) {
            $priceChanges = [];
            foreach ($request->input('prices') as $priceInput) {
                $cycle = $priceInput['billing_cycle'];
                $newMinor = (int) $priceInput['gross_price_minor'];

                $price = $listing->prices()->where('billing_cycle', $cycle)->first();
                if ($price) {
                    $oldPrice = (float) $price->price;
                    $newPrice = $newMinor / 100;
                    if (abs($oldPrice - $newPrice) > 0.001) {
                        $priceChanges[] = [
                            'billing_cycle' => $cycle,
                            'old_price' => $oldPrice,
                            'new_price' => $newPrice,
                        ];
                        $price->price = $newPrice;
                        $price->save();
                    }
                } else {
                    // Create new price entry
                    $listing->prices()->create([
                        'billing_cycle' => $cycle,
                        'price' => $newMinor / 100,
                        'currency' => 'IDR',
                        'unit_label' => $cycle === 'monthly' ? '/bulan' : '/tahun',
                        'is_default' => $cycle === 'monthly',
                        'public_id' => \Illuminate\Support\Str::ulid()->toBase32(),
                    ]);
                    $priceChanges[] = [
                        'billing_cycle' => $cycle,
                        'old_price' => null,
                        'new_price' => $newMinor / 100,
                    ];
                }
            }

            if (! empty($priceChanges)) {
                $changes[] = 'prices';
                $payload['prices'] = $priceChanges;
            }
        }

        // Audit log the change
        if (! empty($changes)) {
            AdminAuditLog::create([
                'user_id' => $request->user()->id,
                'action' => 'listing_updated',
                'subject_type' => ProductListing::class,
                'subject_id' => $listing->id,
                'payload' => [
                    'fields' => $changes,
                    'changes' => $payload,
                ],
            ]);
        }

        // Reload relationships
        $listing->load(['provider', 'category', 'resourceType', 'prices', 'latestAuditLog.user']);

        return response()->json([
            'message' => 'Listing berhasil diperbarui.',
            'data' => new AdminListingResource($listing),
        ]);
    }
}
