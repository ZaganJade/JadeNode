<?php

namespace App\Modules\Auth\Controllers;

use App\Http\Requests\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Auth\Events\Registered;

class RegisterController
{
    /**
     * Register a new user.
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $user = User::create([
            'name' => $request->input('name'),
            'email' => $request->input('email'),
            'password' => Hash::make($request->input('password')),
            'role' => 'customer',
            'public_id' => Str::ulid()->toBase32(),
        ]);

        event(new Registered($user));

        return response()->json([
            'message' => 'Registrasi berhasil. Silakan verifikasi email kamu.',
            'user' => new UserResource($user),
        ], 201);
    }
}
