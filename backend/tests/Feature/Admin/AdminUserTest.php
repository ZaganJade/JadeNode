<?php

namespace Tests\Feature\Admin;

use App\Models\AdminAuditLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminUserTest extends TestCase
{
    use RefreshDatabase;

    private function adminUser(): User
    {
        return User::factory()->create([
            'role' => 'admin',
            'email_verified_at' => now(),
        ]);
    }

    private function customerUser(): User
    {
        return User::factory()->create([
            'role' => 'customer',
            'email_verified_at' => now(),
        ]);
    }

    // ─── LIST ───────────────────────────────────────────────────────────────

    public function test_admin_can_list_all_users(): void
    {
        $admin = $this->adminUser();
        User::factory()->count(3)->create(['role' => 'customer']);

        $response = $this->actingAs($admin)->getJson('/api/v1/admin/users');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [['id', 'public_id', 'name', 'email', 'role', 'suspended']],
            'meta' => ['current_page', 'last_page', 'per_page', 'total'],
        ]);
    }

    public function test_customer_cannot_access_admin_users(): void
    {
        $customer = $this->customerUser();

        $response = $this->actingAs($customer)->getJson('/api/v1/admin/users');

        $response->assertStatus(403);
    }

    public function test_admin_can_filter_users_by_role(): void
    {
        $admin = $this->adminUser();
        User::factory()->create(['role' => 'provider']);

        $response = $this->actingAs($admin)->getJson('/api/v1/admin/users?role=provider');

        $response->assertStatus(200);
        $this->assertTrue(
            collect($response->json('data'))->every(fn ($u) => $u['role'] === 'provider')
        );
    }

    // ─── SHOW ───────────────────────────────────────────────────────────────

    public function test_admin_can_view_single_user(): void
    {
        $admin = $this->adminUser();
        $target = User::factory()->create(['role' => 'customer']);

        $response = $this->actingAs($admin)->getJson("/api/v1/admin/users/{$target->id}");

        $response->assertStatus(200);
        $response->assertJsonPath('data.id', $target->id);
        $response->assertJsonPath('data.email', $target->email);
    }

    public function test_admin_show_returns_404_for_missing_user(): void
    {
        $admin = $this->adminUser();

        $response = $this->actingAs($admin)->getJson('/api/v1/admin/users/999999');

        $response->assertStatus(404);
    }

    // ─── CREATE ─────────────────────────────────────────────────────────────

    public function test_admin_can_create_user(): void
    {
        $admin = $this->adminUser();

        $response = $this->actingAs($admin)->postJson('/api/v1/admin/users', [
            'name' => 'Budi Santoso',
            'email' => 'budi@example.com',
            'password' => 'secret123',
            'role' => 'customer',
            'phone' => '+62 812 3456 7890',
            'country' => 'Indonesia',
            'email_verified' => true,
        ]);

        $response->assertStatus(201);
        $response->assertJsonPath('data.email', 'budi@example.com');
        $response->assertJsonPath('data.role', 'customer');
        $response->assertJsonPath('data.email_verified', true);

        $this->assertDatabaseHas('users', ['email' => 'budi@example.com']);

        // Audit log recorded
        $this->assertDatabaseHas('admin_audit_logs', [
            'action' => 'user_created',
            'subject_type' => User::class,
        ]);
    }

    public function test_admin_create_validates_required_fields(): void
    {
        $admin = $this->adminUser();

        $response = $this->actingAs($admin)->postJson('/api/v1/admin/users', []);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['name', 'email', 'password', 'role']);
    }

    public function test_admin_create_rejects_duplicate_email(): void
    {
        $admin = $this->adminUser();
        $existing = User::factory()->create(['email' => 'taken@example.com']);

        $response = $this->actingAs($admin)->postJson('/api/v1/admin/users', [
            'name' => 'Clone User',
            'email' => 'taken@example.com',
            'password' => 'secret123',
            'role' => 'customer',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['email']);
    }

    public function test_admin_create_rejects_invalid_role(): void
    {
        $admin = $this->adminUser();

        $response = $this->actingAs($admin)->postJson('/api/v1/admin/users', [
            'name' => 'Hacker',
            'email' => 'hack@example.com',
            'password' => 'secret123',
            'role' => 'superuser',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['role']);
    }

    // ─── UPDATE ─────────────────────────────────────────────────────────────

    public function test_admin_can_update_user(): void
    {
        $admin = $this->adminUser();
        $target = User::factory()->create(['role' => 'customer']);

        $response = $this->actingAs($admin)->putJson("/api/v1/admin/users/{$target->id}", [
            'name' => 'Updated Name',
            'role' => 'provider',
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('data.name', 'Updated Name');
        $response->assertJsonPath('data.role', 'provider');

        $this->assertDatabaseHas('users', [
            'id' => $target->id,
            'name' => 'Updated Name',
            'role' => 'provider',
        ]);

        $this->assertDatabaseHas('admin_audit_logs', ['action' => 'user_updated']);
    }

    public function test_admin_update_optional_password_leaves_unchanged(): void
    {
        $admin = $this->adminUser();
        $target = User::factory()->create();
        $originalHash = $target->password;

        $response = $this->actingAs($admin)->putJson("/api/v1/admin/users/{$target->id}", [
            'name' => 'New Name Only',
        ]);

        $response->assertStatus(200);
        $target->refresh();
        $this->assertSame($originalHash, $target->password);
    }

    public function test_admin_update_unique_email_excluding_self(): void
    {
        $admin = $this->adminUser();
        $other = User::factory()->create(['email' => 'other@example.com']);
        $target = User::factory()->create(['email' => 'me@example.com']);

        // Reusing own email is fine
        $response = $this->actingAs($admin)->putJson("/api/v1/admin/users/{$target->id}", [
            'email' => 'me@example.com',
        ]);

        $response->assertStatus(200);

        // Using someone else's email fails
        $response2 = $this->actingAs($admin)->putJson("/api/v1/admin/users/{$target->id}", [
            'email' => 'other@example.com',
        ]);

        $response2->assertStatus(422);
        $response2->assertJsonValidationErrors(['email']);
    }

    // ─── SUSPEND / DESTROY ──────────────────────────────────────────────────

    public function test_admin_can_suspend_customer(): void
    {
        $admin = $this->adminUser();
        $target = User::factory()->create(['role' => 'customer']);

        $response = $this->actingAs($admin)->deleteJson("/api/v1/admin/users/{$target->id}");

        $response->assertStatus(200);
        $this->assertNotNull($target->fresh()->suspended_at);
        $this->assertDatabaseHas('admin_audit_logs', ['action' => 'user_suspended']);
    }

    public function test_admin_cannot_suspend_self(): void
    {
        $admin = $this->adminUser();

        $response = $this->actingAs($admin)->deleteJson("/api/v1/admin/users/{$admin->id}");

        $response->assertStatus(403);
        $this->assertNull($admin->fresh()->suspended_at);
    }

    public function test_admin_cannot_suspend_another_admin(): void
    {
        $admin = $this->adminUser();
        $anotherAdmin = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin)->deleteJson("/api/v1/admin/users/{$anotherAdmin->id}");

        $response->assertStatus(403);
        $this->assertNull($anotherAdmin->fresh()->suspended_at);
    }

    // ─── RESTORE ────────────────────────────────────────────────────────────

    public function test_admin_can_restore_suspended_user(): void
    {
        $admin = $this->adminUser();
        $target = User::factory()->create([
            'role' => 'customer',
            'suspended_at' => now(),
        ]);

        $response = $this->actingAs($admin)->postJson("/api/v1/admin/users/{$target->id}/restore");

        $response->assertStatus(200);
        $this->assertNull($target->fresh()->suspended_at);
        $this->assertDatabaseHas('admin_audit_logs', ['action' => 'user_restored']);
    }

    // ─── VERIFY EMAIL ───────────────────────────────────────────────────────

    public function test_admin_can_force_verify_email(): void
    {
        $admin = $this->adminUser();
        $target = User::factory()->unverified()->create();

        $response = $this->actingAs($admin)->postJson("/api/v1/admin/users/{$target->id}/verify-email");

        $response->assertStatus(200);
        $this->assertNotNull($target->fresh()->email_verified_at);
        $this->assertDatabaseHas('admin_audit_logs', ['action' => 'user_email_verified']);
    }
}
