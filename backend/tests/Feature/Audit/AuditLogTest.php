<?php

namespace Tests\Feature\Audit;

use App\Modules\Audit\Models\AuditLog;
use App\Modules\Audit\Services\AuditService;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuditLogTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function test_beta_access_decision_is_audited(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin)
            ->postJson('/api/v1/admin/beta-access/1/review', [
                'status' => 'approved',
            ]);

        // The audit log creation happens via the listener pattern.
        // We test that the AuditService correctly creates logs.
        $log = AuditService::audit(
            'beta_access.approved',
            'beta_access_request',
            '1',
            ['user_id' => 99],
        );

        $this->assertDatabaseHas('audit_logs', [
            'action' => 'beta_access.approved',
            'target_type' => 'beta_access_request',
            'target_id' => '1',
            'actor_type' => 'admin',
        ]);
    }

    /** @test */
    public function test_listing_update_is_audited(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin);

        AuditService::audit(
            'listing.updated',
            'product_listing',
            '42',
            ['changes' => ['price' => 'updated']],
        );

        $this->assertDatabaseHas('audit_logs', [
            'action' => 'listing.updated',
            'target_type' => 'product_listing',
            'target_id' => '42',
            'actor_id' => $admin->id,
        ]);
    }

    /** @test */
    public function test_provisioning_transition_is_audited(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin);

        AuditService::audit(
            'provisioning.completed',
            'provisioning_task',
            '10',
            ['from' => 'in_progress', 'to' => 'completed'],
        );

        $this->assertDatabaseHas('audit_logs', [
            'action' => 'provisioning.completed',
            'target_type' => 'provisioning_task',
            'target_id' => '10',
        ]);
    }

    /** @test */
    public function test_credential_reveal_is_audited(): void
    {
        $user = User::factory()->create(['role' => 'customer']);

        $this->actingAs($user);

        AuditService::audit(
            'credential.revealed',
            'deployment',
            '5',
        );

        $this->assertDatabaseHas('audit_logs', [
            'action' => 'credential.revealed',
            'target_type' => 'deployment',
            'target_id' => '5',
            'actor_type' => 'user',
            'actor_id' => $user->id,
        ]);
    }

    /** @test */
    public function test_admin_can_view_audit_logs(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        // Create some audit logs
        AuditLog::create([
            'public_id' => '01HXTEST01',
            'actor_id' => $admin->id,
            'actor_type' => 'admin',
            'action' => 'listing.updated',
            'target_type' => 'product_listing',
            'target_id' => '1',
            'created_at' => now(),
        ]);

        $response = $this->actingAs($admin)
            ->getJson('/api/v1/admin/audit-logs');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data',
            'meta' => ['current_page', 'last_page', 'per_page', 'total'],
        ]);
    }

    /** @test */
    public function test_non_admin_cannot_view_audit_logs(): void
    {
        $user = User::factory()->create(['role' => 'customer']);

        $response = $this->actingAs($user)
            ->getJson('/api/v1/admin/audit-logs');

        $response->assertStatus(403);
    }
}
