<?php

namespace App\Modules\Admin\Controllers;

use App\Http\Requests\AdminStoreListingRequest;
use App\Http\Requests\AdminUpdateListingRequest;
use App\Http\Resources\AdminListingResource;
use App\Models\AdminAuditLog;
use App\Modules\Marketplace\Models\ProductCategory;
use App\Modules\Marketplace\Models\ResourceProduct;
use App\Modules\Order\Models\ProductPrice;
use App\Modules\Provider\Models\Provider;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AdminListingController
{
    /**
     * List all product listings with provider, category, prices.
     * Supports search and filters.
     */
    public function index(Request $request): JsonResponse
    {
        $query = ResourceProduct::query()
            ->with(['provider', 'category', 'prices', 'latestAuditLog.user']);

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
            $query->where('provider_id', $request->input('provider_id'));
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
        $allowedSorts = ['name', 'created_at', 'updated_at', 'provisioning_sla_hours', 'display_priority'];

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
     * Provide the select-option data needed to populate the create/edit form:
     * active providers, active categories, and distinct existing values to
     * suggest for the free-text resource_type and region fields.
     */
    public function formOptions(): JsonResponse
    {
        $providers = Provider::orderBy('name')
            ->get(['id', 'public_id', 'name'])
            ->map(fn (Provider $p) => [
                'id' => $p->id,
                'public_id' => $p->public_id,
                'name' => $p->name,
            ]);

        $categories = ProductCategory::where('is_active', true)
            ->orderBy('sort_order')
            ->get(['id', 'public_id', 'name', 'slug'])
            ->map(fn (ProductCategory $c) => [
                'id' => $c->id,
                'public_id' => $c->public_id,
                'name' => $c->name,
                'slug' => $c->slug,
            ]);

        return response()->json([
            'providers' => $providers,
            'categories' => $categories,
            'resource_types' => ResourceProduct::query()
                ->whereNotNull('resource_type')
                ->distinct()
                ->orderBy('resource_type')
                ->pluck('resource_type'),
            'regions' => ResourceProduct::query()
                ->whereNotNull('region')
                ->distinct()
                ->orderBy('region')
                ->pluck('region'),
            'availability_options' => ['available', 'limited', 'waitlist', 'unavailable'],
            'billing_cycles' => ['monthly', 'yearly'],
        ]);
    }

    /**
     * Create a new product listing with its prices. Audit logs the creation.
     */
    public function store(AdminStoreListingRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $listing = new ResourceProduct();
        $listing->public_id = (string) Str::ulid();
        $listing->provider_id = $validated['provider_id'];
        $listing->category_id = $validated['category_id'];
        $listing->name = $validated['name'];
        $listing->slug = $validated['slug'];
        $listing->description = $validated['description'] ?? null;
        $listing->resource_type = $validated['resource_type'];
        $listing->region = $validated['region'];
        $listing->availability_status = $validated['availability_status'];
        $listing->provisioning_sla_hours = $validated['provisioning_sla_hours'];
        $listing->display_priority = $validated['display_priority'] ?? 0;
        $listing->is_active = $validated['is_active'] ?? true;
        $listing->specs = ! empty($validated['specs']) ? $validated['specs'] : null;
        $listing->trust_indicators = [
            'provider_verified' => true,
            'provisioning_sla_hours' => $validated['provisioning_sla_hours'],
            'dispute_protection' => true,
        ];
        $listing->save();

        foreach ($validated['prices'] as $priceInput) {
            $listing->prices()->create([
                'public_id' => (string) Str::ulid(),
                'billing_cycle' => $priceInput['billing_cycle'],
                'gross_price_minor' => (int) $priceInput['gross_price_minor'],
                'currency' => 'IDR',
                'is_default' => $priceInput['billing_cycle'] === 'monthly',
            ]);
        }

        AdminAuditLog::create([
            'user_id' => $request->user()->id,
            'action' => 'listing_created',
            'subject_type' => ResourceProduct::class,
            'subject_id' => $listing->id,
            'payload' => [
                'name' => $listing->name,
                'slug' => $listing->slug,
                'provider_id' => $listing->provider_id,
                'category_id' => $listing->category_id,
            ],
        ]);

        $listing->load(['provider', 'category', 'prices', 'latestAuditLog.user']);

        return response()->json([
            'message' => 'Produk berhasil dibuat.',
            'data' => new AdminListingResource($listing),
        ], 201);
    }

    /**
     * Update a product listing's price, availability, SLA, and active status.
     * Audit logs the change.
     */
    public function update(AdminUpdateListingRequest $request, int $id): JsonResponse
    {
        $listing = ResourceProduct::with(['provider', 'category', 'prices'])->find($id);

        if (! $listing) {
            return response()->json([
                'message' => 'Listing tidak ditemukan.',
            ], 404);
        }

        $changes = [];
        $payload = [];

        // Update simple scalar fields (name, description, resource_type, region, display_priority)
        $simpleFields = ['name', 'description', 'resource_type', 'region', 'display_priority'];
        foreach ($simpleFields as $field) {
            if (! $request->has($field)) {
                continue;
            }
            $new = $field === 'display_priority'
                ? (int) $request->input($field)
                : $request->input($field);
            $old = $listing->{$field};
            if ($old !== $new) {
                $changes[] = $field;
                $payload[$field] = ['old' => $old, 'new' => $new];
                $listing->{$field} = $new;
            }
        }

        // Update specs (replace the whole spec map when provided)
        if ($request->has('specs') && is_array($request->input('specs'))) {
            $new = $request->input('specs');
            $old = $listing->specs;
            if ($old !== $new) {
                $changes[] = 'specs';
                $payload['specs'] = ['old' => $old, 'new' => $new];
                $listing->specs = $new;
            }
        }

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
                    $oldMinor = (int) $price->gross_price_minor;
                    if ($oldMinor !== $newMinor) {
                        $priceChanges[] = [
                            'billing_cycle' => $cycle,
                            'old_gross_price_minor' => $oldMinor,
                            'new_gross_price_minor' => $newMinor,
                        ];
                        $price->gross_price_minor = $newMinor;
                        $price->save();
                    }
                } else {
                    // Create new price entry
                    $listing->prices()->create([
                        'billing_cycle' => $cycle,
                        'gross_price_minor' => $newMinor,
                        'currency' => 'IDR',
                        'is_default' => $cycle === 'monthly',
                        'public_id' => \Illuminate\Support\Str::ulid()->toBase32(),
                    ]);
                    $priceChanges[] = [
                        'billing_cycle' => $cycle,
                        'old_gross_price_minor' => null,
                        'new_gross_price_minor' => $newMinor,
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
                'subject_type' => ResourceProduct::class,
                'subject_id' => $listing->id,
                'payload' => [
                    'fields' => $changes,
                    'changes' => $payload,
                ],
            ]);
        }

        // Reload relationships
        $listing->load(['provider', 'category', 'prices', 'latestAuditLog.user']);

        return response()->json([
            'message' => 'Listing berhasil diperbarui.',
            'data' => new AdminListingResource($listing),
        ]);
    }

    /**
     * Soft-delete a product listing. Audit logs the deletion.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $listing = ResourceProduct::find($id);

        if (! $listing) {
            return response()->json([
                'message' => 'Listing tidak ditemukan.',
            ], 404);
        }

        $snapshot = [
            'name' => $listing->name,
            'slug' => $listing->slug,
            'provider_id' => $listing->provider_id,
            'category_id' => $listing->category_id,
        ];

        $listing->delete();

        AdminAuditLog::create([
            'user_id' => $request->user()->id,
            'action' => 'listing_deleted',
            'subject_type' => ResourceProduct::class,
            'subject_id' => $id,
            'payload' => $snapshot,
        ]);

        return response()->json([
            'message' => 'Produk berhasil dihapus.',
        ]);
    }
}
