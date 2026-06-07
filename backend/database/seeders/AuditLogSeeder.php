<?php

namespace Database\Seeders;

use App\Models\AdminAuditLog;
use App\Modules\Audit\Models\AuditLog;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Seeds audit trail entries for admin and system actions.
 */
class AuditLogSeeder extends Seeder
{
    public function run(): void
    {
        $admin    = User::where('email', 'admin@jadenode.id')->first();
        $customer = User::where('email', 'test@jadenode.id')->first();

        if (! $admin) {
            $this->command->warn('Skipping AuditLogSeeder: admin user not found.');
            return;
        }

        // ── Admin Audit Logs (legacy table) ──
        AdminAuditLog::create([
            'user_id'     => $admin->id,
            'action'      => 'approve_beta_access',
            'subject_type' => 'BetaAccessRequest',
            'subject_id'  => 1,
            'payload'     => ['status_before' => 'pending', 'status_after' => 'approved'],
        ]);

        AdminAuditLog::create([
            'user_id'     => $admin->id,
            'action'      => 'complete_provisioning',
            'subject_type' => 'ProvisioningTask',
            'subject_id'  => 1,
            'payload'     => ['hostname' => 'node-abc123.jadenode.id', 'ip' => '103.150.100.10'],
        ]);

        // ── Audit Logs (new table) ──
        AuditLog::create([
            'public_id'   => (string) Str::ulid(),
            'actor_id'    => $customer?->id,
            'actor_type'  => 'user',
            'action'      => 'user.register',
            'target_type' => 'User',
            'target_id'   => (string) $customer?->id,
            'metadata'    => ['email' => $customer?->email],
            'ip_address'  => '103.150.100.10',
            'user_agent'  => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131.0',
            'request_id'  => (string) Str::uuid(),
        ]);

        AuditLog::create([
            'public_id'   => (string) Str::ulid(),
            'actor_id'    => $customer?->id,
            'actor_type'  => 'user',
            'action'      => 'user.login',
            'target_type' => 'User',
            'target_id'   => (string) $customer?->id,
            'metadata'    => ['method' => 'sanctum_token'],
            'ip_address'  => '103.150.100.10',
            'user_agent'  => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131.0',
            'request_id'  => (string) Str::uuid(),
        ]);

        AuditLog::create([
            'public_id'   => (string) Str::ulid(),
            'actor_id'    => $admin->id,
            'actor_type'  => 'admin',
            'action'      => 'beta_access.approve',
            'target_type' => 'BetaAccessRequest',
            'target_id'   => '1',
            'metadata'    => ['admin_reason' => 'Approved for UAS testing'],
            'ip_address'  => '103.150.100.1',
            'user_agent'  => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131.0',
            'request_id'  => (string) Str::uuid(),
        ]);

        AuditLog::create([
            'public_id'   => (string) Str::ulid(),
            'actor_id'    => null,
            'actor_type'  => 'system',
            'action'      => 'payment.captured',
            'target_type' => 'Payment',
            'target_id'   => '1',
            'metadata'    => ['gateway' => 'midtrans', 'method' => 'gopay'],
            'ip_address'  => null,
            'user_agent'  => 'Midtrans Webhook',
            'request_id'  => (string) Str::uuid(),
        ]);

        $this->command->info('Seeded: 2 admin audit logs + 4 audit log entries');
    }
}
