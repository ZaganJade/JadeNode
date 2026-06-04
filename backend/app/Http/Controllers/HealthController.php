<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;

class HealthController extends Controller
{
    /**
     * Return application health status.
     */
    public function __invoke(): JsonResponse
    {
        return response()->json([
            'app' => 'JadeNode',
            'version' => '0.1.0',
            'status' => 'healthy',
            'timestamp' => Carbon::now()->toIso8601String(),
        ]);
    }

    /**
     * Return application readiness status with dependency checks.
     */
    public function ready(): JsonResponse
    {
        $checks = [
            'database' => false,
            'redis' => false,
        ];

        // Check database connection
        try {
            DB::connection()->getPdo();
            $checks['database'] = true;
        } catch (\Throwable) {
            $checks['database'] = false;
        }

        // Check Redis connection
        try {
            Redis::connection()->ping();
            $checks['redis'] = true;
        } catch (\Throwable) {
            $checks['redis'] = false;
        }

        $allHealthy = $checks['database'] && $checks['redis'];

        return response()->json([
            'status' => $allHealthy ? 'ready' : 'unready',
            'checks' => $checks,
            'timestamp' => Carbon::now()->toIso8601String(),
        ], $allHealthy ? 200 : 503);
    }
}
