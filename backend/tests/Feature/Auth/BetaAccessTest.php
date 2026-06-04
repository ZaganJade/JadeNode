<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use App\Modules\Auth\Models\BetaAccessRequest;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BetaAccessTest extends TestCase
{
    use RefreshDatabase;

    private function verifiedUser(): User
    {
        return User::factory()->create([
            'email_verified_at' => now(),
        ]);
    }

    private function unverifiedUser(): User
    {
        return User::factory()->create([
            'email_verified_at' => null,
        ]);
    }

    public function test_verified_user_can_request_beta_access(): void
    {
        $user = $this->verifiedUser();

        $response = $this->actingAs($user)->postJson('/api/v1/beta-access/request', [
            'reason' => 'I want to test the platform.',
        ]);

        $response->assertStatus(201);
        $response->assertJsonStructure([
            'message',
            'request' => [
                'id',
                'public_id',
                'status',
                'reason',
                'created_at',
            ],
        ]);
        $response->assertJsonPath('request.status', 'pending');
        $response->assertJsonPath('request.reason', 'I want to test the platform.');

        $this->assertDatabaseHas('beta_access_requests', [
            'user_id' => $user->id,
            'status' => 'pending',
        ]);
    }

    public function test_unverified_user_cannot_request_beta_access(): void
    {
        $user = $this->unverifiedUser();

        $response = $this->actingAs($user)->postJson('/api/v1/beta-access/request', [
            'reason' => 'Please let me in.',
        ]);

        $response->assertStatus(403);
        $response->assertJsonPath('message', 'Email belum terverifikasi. Silakan verifikasi email kamu terlebih dahulu.');

        $this->assertDatabaseMissing('beta_access_requests', [
            'user_id' => $user->id,
        ]);
    }

    public function test_user_cannot_create_duplicate_active_request(): void
    {
        $user = $this->verifiedUser();

        BetaAccessRequest::create([
            'user_id' => $user->id,
            'status' => 'pending',
            'public_id' => \Illuminate\Support\Str::ulid()->toBase32(),
        ]);

        $response = $this->actingAs($user)->postJson('/api/v1/beta-access/request', [
            'reason' => 'Another request',
        ]);

        $response->assertStatus(409);
        $response->assertJsonPath('message', 'Kamu sudah memiliki permintaan beta access yang aktif.');
    }

    public function test_user_can_view_own_beta_access_status(): void
    {
        $user = $this->verifiedUser();

        BetaAccessRequest::create([
            'user_id' => $user->id,
            'status' => 'pending',
            'reason' => 'Testing',
            'public_id' => \Illuminate\Support\Str::ulid()->toBase32(),
        ]);

        $response = $this->actingAs($user)->getJson('/api/v1/beta-access/status');

        $response->assertStatus(200);
        $response->assertJsonPath('status', 'pending');
        $response->assertJsonStructure([
            'status',
            'request' => [
                'id',
                'public_id',
                'status',
            ],
        ]);
    }

    public function test_user_without_request_shows_none_status(): void
    {
        $user = $this->verifiedUser();

        $response = $this->actingAs($user)->getJson('/api/v1/beta-access/status');

        $response->assertStatus(200);
        $response->assertJsonPath('status', 'none');
        $response->assertJsonPath('request', null);
    }
}
