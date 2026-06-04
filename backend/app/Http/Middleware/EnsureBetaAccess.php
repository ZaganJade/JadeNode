<?php

namespace App\Http\Middleware;

use App\Modules\Auth\Models\BetaAccessRequest;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureBetaAccess
{
    /**
     * Handle an incoming request.
     *
     * Ensures the authenticated user has approved beta access.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->user()) {
            return response()->json([
                'message' => 'Autentikasi diperlukan.',
            ], 401);
        }

        $hasApproved = BetaAccessRequest::forUser($request->user()->id)
            ->where('status', 'approved')
            ->exists();

        if (! $hasApproved) {
            return response()->json([
                'message' => 'Beta access diperlukan untuk mengakses fitur ini. Silakan ajukan permintaan beta access.',
            ], 403);
        }

        return $next($request);
    }
}
