<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_view_profile(): void
    {
        $user = User::factory()->create([
            'name' => 'John Doe',
            'email' => 'john@example.com',
        ]);

        $response = $this->actingAs($user)->getJson('/api/v1/profile');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'user' => [
                'id',
                'public_id',
                'name',
                'email',
                'email_verified_at',
                'role',
                'phone',
                'country',
                'timezone',
                'created_at',
            ],
        ]);
        $response->assertJsonPath('user.email', 'john@example.com');
    }

    public function test_authenticated_user_can_update_profile(): void
    {
        $user = User::factory()->create([
            'name' => 'John Doe',
            'phone' => null,
            'country' => null,
        ]);

        $response = $this->actingAs($user)->putJson('/api/v1/profile', [
            'name' => 'Jane Doe',
            'phone' => '+62812345678',
            'country' => 'ID',
            'timezone' => 'Asia/Jakarta',
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('user.name', 'Jane Doe');
        $response->assertJsonPath('user.phone', '+62812345678');
        $response->assertJsonPath('user.country', 'ID');
        $response->assertJsonPath('user.timezone', 'Asia/Jakarta');

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'name' => 'Jane Doe',
            'phone' => '+62812345678',
            'country' => 'ID',
            'timezone' => 'Asia/Jakarta',
        ]);
    }

    public function test_unauthenticated_user_cannot_view_profile(): void
    {
        $response = $this->getJson('/api/v1/profile');

        $response->assertStatus(401);
    }
}
