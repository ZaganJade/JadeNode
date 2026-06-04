<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureOwnsResource
{
    /**
     * Handle an incoming request.
     *
     * Checks that the authenticated user owns the specified resource.
     * Expects the route parameter to contain a model with a user_id column.
     *
     * Usage in routes:
     *   ->middleware(EnsureOwnsResource::class . ':order')
     *
     * The middleware will look for the route parameter named 'order' and
     * compare its user_id to the authenticated user's id.
     */
    public function handle(Request $request, Closure $next, string $resourceParam = 'id'): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json([
                'message' => 'Tidak terautentikasi.',
            ], 401);
        }

        $resource = $request->route($resourceParam);

        if (! $resource) {
            return response()->json([
                'message' => 'Resource tidak ditemukan.',
            ], 404);
        }

        // If it's a model instance, check user_id directly
        if (is_object($resource) && property_exists($resource, 'user_id')) {
            if ((int) $resource->user_id !== (int) $user->id) {
                return response()->json([
                    'message' => 'Akses ditolak. Kamu tidak memiliki resource ini.',
                ], 403);
            }
        }

        return $next($request);
    }
}
