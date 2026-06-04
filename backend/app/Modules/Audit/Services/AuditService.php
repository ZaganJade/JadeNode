<?php

namespace App\Modules\Audit\Services;

use App\Modules\Audit\Models\AuditLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;
use Illuminate\Support\Str;

class AuditService
{
    /**
     * Create an audit log entry with current request context.
     */
    public function log(
        string $action,
        ?string $targetType = null,
        ?string $targetId = null,
        array $metadata = [],
    ): AuditLog {
        $user = Auth::user();

        $actorType = 'system';
        $actorId = null;

        if ($user) {
            $actorId = $user->id;
            $actorType = in_array($user->role, ['admin', 'super_admin']) ? 'admin' : 'user';
        }

        return AuditLog::create([
            'public_id' => (string) Str::ulid(),
            'actor_id' => $actorId,
            'actor_type' => $actorType,
            'action' => $action,
            'target_type' => $targetType ?? 'system',
            'target_id' => $targetId,
            'metadata' => ! empty($metadata) ? $metadata : null,
            'ip_address' => Request::ip(),
            'user_agent' => Request::userAgent(),
            'request_id' => Request::header('X-Request-ID'),
            'created_at' => now(),
        ]);
    }

    /**
     * Static helper for easy access.
     */
    public static function audit(
        string $action,
        ?string $targetType = null,
        ?string $targetId = null,
        array $metadata = [],
    ): AuditLog {
        return (new self())->log($action, $targetType, $targetId, $metadata);
    }
}
