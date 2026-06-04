<?php

namespace App\Modules\Deployment\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SshKey extends Model
{
    use HasFactory;

    protected $fillable = [
        'public_id',
        'user_id',
        'name',
        'public_key',
        'fingerprint',
        'last_used_at',
    ];

    protected $hidden = [
        'id',
    ];

    protected function casts(): array
    {
        return [
            'last_used_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Generate an SSH fingerprint from a public key string.
     */
    public static function generateFingerprint(string $publicKey): string
    {
        $keyContent = trim($publicKey);

        // Extract the base64 part (ssh-rsa AAAA... user@host)
        $parts = preg_split('/\s+/', $keyContent);
        $base64 = $parts[1] ?? $keyContent;

        $decoded = base64_decode($base64, true);
        if ($decoded === false) {
            return md5($keyContent);
        }

        $hash = md5($decoded);

        return implode(':', str_split($hash, 2));
    }

    /**
     * Validate that a string looks like an SSH public key.
     */
    public static function isValidPublicKey(string $publicKey): bool
    {
        $keyContent = trim($publicKey);

        return (bool) preg_match(
            '/^ssh-(rsa|ed25519|ecdsa|dss)\s+[A-Za-z0-9+\/]+=*\s*.*/',
            $keyContent
        );
    }
}
