<?php

namespace App\Modules\Auth\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

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
     *
     * Validates the token by hashing it and comparing against the stored
     * hash in the user's email_verification_token column.
     */
    public function verify(Request $request): JsonResponse
    {
        $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'email'],
        ]);

        $user = $request->user();

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

        // Compare hashed token against stored hash
        $tokenHash = Hash::sha256($request->input('token'));

        if (! $user->email_verification_token || ! hash_equals($user->email_verification_token, $tokenHash)) {
            return response()->json([
                'message' => 'Token verifikasi tidak valid atau sudah kadaluarsa.',
            ], 403);
        }

        $user->markEmailAsVerified();

        // Clear the token after successful verification
        $user->update([
            'email_verification_token' => null,
        ]);

        return response()->json([
            'message' => 'Email berhasil diverifikasi.',
        ]);
    }
}
