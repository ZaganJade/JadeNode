<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureIsAdmin
{
    /**
     * Handle an incoming request.
     *
     * Ensures the authenticated user has an admin or super_admin role.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->user() || ! in_array($request->user()->role, ['admin', 'super_admin'])) {
            return response()->json([
                'message' => 'Akses ditolak. Kamu tidak memiliki izin admin.',
            ], 403);
        }

        return $next($request);
    }
}
