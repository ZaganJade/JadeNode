<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use App\Modules\Auth\Models\BetaAccessRequest;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class AdminBetaAccessTest extends TestCase
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

    public function test_admin_can_list_pending_requests(): void
    {
        $admin = $this->adminUser();
        $customer = $this->customerUser();

        BetaAccessRequest::create([
            'user_id' => $customer->id,
            'status' => 'pending',
            'reason' => 'I want beta access',
            'public_id' => \Illuminate\Support\Str::ulid()->toBase32(),
        ]);

        $response = $this->actingAs($admin)->getJson('/api/v1/admin/beta-access');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                '*' => [
                    'id',
                    'public_id',
                    'user',
                    'status',
                    'reason',
                    'created_at',
                ],
            ],
            'meta' => [
                'current_page',
                'last_page',
                'per_page',
                'total',
            ],
        ]);
        $response->assertJsonPath('meta.total', 1);
    }

    public function test_admin_can_approve_request(): void
    {
        Notification::fake();

        $admin = $this->adminUser();
        $customer = $this->customerUser();

        $betaRequest = BetaAccessRequest::create([
            'user_id' => $customer->id,
            'status' => 'pending',
            'public_id' => \Illuminate\Support\Str::ulid()->toBase32(),
        ]);

        $response = $this->actingAs($admin)->putJson("/api/v1/admin/beta-access/{$betaRequest->id}", [
            'status' => 'approved',
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('request.status', 'approved');

        $this->assertDatabaseHas('beta_access_requests', [
            'id' => $betaRequest->id,
            'status' => 'approved',
            'reviewed_by' => $admin->id,
        ]);

        Notification::assertSentTo($customer, \App\Notifications\BetaAccessDecisionNotification::class);
    }

    public function test_admin_can_reject_request_with_reason(): void
    {
        Notification::fake();

        $admin = $this->adminUser();
        $customer = $this->customerUser();

        $betaRequest = BetaAccessRequest::create([
            'user_id' => $customer->id,
            'status' => 'pending',
            'public_id' => \Illuminate\Support\Str::ulid()->toBase32(),
        ]);

        $response = $this->actingAs($admin)->putJson("/api/v1/admin/beta-access/{$betaRequest->id}", [
            'status' => 'rejected',
            'admin_reason' => 'Platform is at capacity.',
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('request.status', 'rejected');

        $this->assertDatabaseHas('beta_access_requests', [
            'id' => $betaRequest->id,
            'status' => 'rejected',
            'reviewed_by' => $admin->id,
        ]);

        Notification::assertSentTo($customer, \App\Notifications\BetaAccessDecisionNotification::class);
    }

    public function test_non_admin_cannot_access_beta_access_admin(): void
    {
        $customer = $this->customerUser();

        $response = $this->actingAs($customer)->getJson('/api/v1/admin/beta-access');

        $response->assertStatus(403);
    }

    public function test_approval_notifies_user(): void
    {
        Notification::fake();

        $admin = $this->adminUser();
        $customer = $this->customerUser();

        $betaRequest = BetaAccessRequest::create([
            'user_id' => $customer->id,
            'status' => 'pending',
            'public_id' => \Illuminate\Support\Str::ulid()->toBase32(),
        ]);

        $this->actingAs($admin)->putJson("/api/v1/admin/beta-access/{$betaRequest->id}", [
            'status' => 'approved',
        ]);

        Notification::assertSentTo(
            $customer,
            \App\Notifications\BetaAccessDecisionNotification::class,
            function ($notification) {
                return $notification->betaRequest->status === 'approved';
            }
        );
    }
}
