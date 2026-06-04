<?php

namespace App\Modules\Auth\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EmailVerificationController
{
    /**
     * Send a new email verification notification.
     */
    public function send(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->hasVerifiedEmail()) {
            return response()->json([
                'message' => 'Email sudah terverifikasi.',
            ]);
        }

        $user->sendEmailVerificationNotification();

        return response()->json([
            'message' => 'Email verifikasi telah dikirim.',
        ]);
    }

    /**
     * Verify the user's email address.
     */
    public function verify(Request $request): JsonResponse
    {
        $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'email'],
        ]);

        $user = $request->user();

        // Verify the token matches the hash stored for this user
        $hash = sha1($request->input('email'));

        if (! hash_equals($request->input('token'), $hash)) {
            return response()->json([
                'message' => 'Token verifikasi tidak valid.',
            ], 403);
        }

        if ($user->hasVerifiedEmail()) {
            return response()->json([
                'message' => 'Email sudah terverifikasi.',
            ]);
        }

        if ($user->email !== $request->input('email')) {
            return response()->json([
                'message' => 'Email tidak sesuai.',
            ], 403);
        }

        $user->markEmailAsVerified();

        return response()->json([
            'message' => 'Email berhasil diverifikasi.',
        ]);
    }
}
