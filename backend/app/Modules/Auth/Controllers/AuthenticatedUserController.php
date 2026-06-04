<?php

namespace App\Modules\Auth\Controllers;

use App\Http\Resources\UserResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthenticatedUserController
{
    /**
     * Display the current authenticated user with role/capabilities.
     */
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();

        $capabilities = match ($user->role) {
            'super_admin' => ['admin', 'finance', 'support', 'provider', 'customer'],
            'admin' => ['admin', 'finance', 'support', 'customer'],
            'finance_admin' => ['finance', 'customer'],
            'support_admin' => ['support', 'customer'],
            'provider' => ['provider', 'customer'],
            default => ['customer'],
        };

        return response()->json([
            'user' => new UserResource($user),
            'capabilities' => $capabilities,
        ]);
    }
}
