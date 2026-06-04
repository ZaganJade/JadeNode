<?php

namespace Tests\Feature\Support;

use App\Models\User;
use App\Modules\Support\Models\Ticket;
use App\Modules\Support\Models\TicketMessage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class TicketTest extends TestCase
{
    use RefreshDatabase;

    private function createUser(array $overrides = []): User
    {
        return User::factory()->create(array_merge([
            'email_verified_at' => now(),
            'public_id' => Str::ulid()->toBase32(),
        ], $overrides));
    }

    private function createAdmin(): User
    {
        return $this->createUser(['role' => 'admin']);
    }

    private function createTicket(User $user, array $overrides = []): Ticket
    {
        $ticket = Ticket::create(array_merge([
            'public_id' => Str::ulid()->toBase32(),
            'user_id' => $user->id,
            'subject' => 'Test Subject',
            'status' => 'open',
            'priority' => 'medium',
        ], $overrides));

        TicketMessage::create([
            'public_id' => Str::ulid()->toBase32(),
            'ticket_id' => $ticket->id,
            'user_id' => $user->id,
            'sender_type' => 'customer',
            'message' => 'Test message body',
        ]);

        return $ticket;
    }

    // ─── Customer Tests ─────────────────────────────────────────────────────

    public function test_authenticated_user_can_create_ticket(): void
    {
        $user = $this->createUser();

        $response = $this->actingAs($user)->postJson('/api/v1/tickets', [
            'subject' => 'VPS tidak bisa diakses',
            'message' => 'VPS saya sudah down sejak tadi malam.',
            'priority' => 'high',
        ]);

        $response->assertStatus(201);
        $response->assertJsonStructure([
            'message',
            'ticket' => [
                'id',
                'public_id',
                'subject',
                'status',
                'priority',
                'messages_count',
                'created_at',
            ],
        ]);
        $response->assertJsonPath('ticket.status', 'open');
        $response->assertJsonPath('ticket.priority', 'high');
        $response->assertJsonPath('ticket.subject', 'VPS tidak bisa diakses');

        $this->assertDatabaseHas('tickets', [
            'user_id' => $user->id,
            'subject' => 'VPS tidak bisa diakses',
            'status' => 'open',
            'priority' => 'high',
        ]);

        $this->assertDatabaseHas('ticket_messages', [
            'sender_type' => 'customer',
            'message' => 'VPS saya sudah down sejak tadi malam.',
        ]);
    }

    public function test_user_can_list_own_tickets(): void
    {
        $user = $this->createUser();
        $otherUser = $this->createUser();

        $this->createTicket($user, ['subject' => 'My Ticket']);
        $this->createTicket($otherUser, ['subject' => 'Other Ticket']);

        $response = $this->actingAs($user)->getJson('/api/v1/tickets');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data',
            'meta' => [
                'current_page',
                'last_page',
                'per_page',
                'total',
            ],
        ]);

        $this->assertCount(1, $response->json('data'));
        $this->assertEquals('My Ticket', $response->json('data.0.subject'));
    }

    public function test_user_can_reply_to_own_ticket(): void
    {
        $user = $this->createUser();
        $ticket = $this->createTicket($user);

        $response = $this->actingAs($user)->postJson("/api/v1/tickets/{$ticket->public_id}/reply", [
            'message' => 'Masih belum bisa diakses.',
        ]);

        $response->assertStatus(201);
        $response->assertJsonPath('ticket_message.message', 'Masih belum bisa diakses.');
        $response->assertJsonPath('ticket_message.sender_type', 'customer');

        $this->assertDatabaseHas('ticket_messages', [
            'ticket_id' => $ticket->id,
            'sender_type' => 'customer',
            'message' => 'Masih belum bisa diakses.',
        ]);

        $ticket->refresh();
        $this->assertNotNull($ticket->last_reply_at);
        $this->assertEquals('customer', $ticket->last_reply_by);
    }

    public function test_user_cannot_access_other_users_ticket(): void
    {
        $user1 = $this->createUser();
        $user2 = $this->createUser();
        $ticket = $this->createTicket($user1);

        // Cannot view
        $showResponse = $this->actingAs($user2)->getJson("/api/v1/tickets/{$ticket->public_id}");
        $showResponse->assertStatus(404);

        // Cannot reply
        $replyResponse = $this->actingAs($user2)->postJson("/api/v1/tickets/{$ticket->public_id}/reply", [
            'message' => 'Hacked!',
        ]);
        $replyResponse->assertStatus(404);
    }

    public function test_guest_cannot_create_ticket(): void
    {
        $response = $this->postJson('/api/v1/tickets', [
            'subject' => 'Test',
            'message' => 'Test message',
            'priority' => 'low',
        ]);

        $response->assertStatus(401);
    }

    public function test_create_ticket_validates_required_fields(): void
    {
        $user = $this->createUser();

        $response = $this->actingAs($user)->postJson('/api/v1/tickets', []);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['subject', 'message', 'priority']);
    }

    // ─── Admin Tests ────────────────────────────────────────────────────────

    public function test_admin_can_list_all_tickets(): void
    {
        $admin = $this->createAdmin();
        $user1 = $this->createUser();
        $user2 = $this->createUser();

        $this->createTicket($user1, ['subject' => 'Ticket 1']);
        $this->createTicket($user2, ['subject' => 'Ticket 2']);

        $response = $this->actingAs($admin)->getJson('/api/v1/admin/tickets');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data',
            'meta',
        ]);

        $this->assertCount(2, $response->json('data'));
    }

    public function test_admin_can_filter_tickets_by_status(): void
    {
        $admin = $this->createAdmin();
        $user = $this->createUser();

        $this->createTicket($user, ['status' => 'open']);
        $this->createTicket($user, ['status' => 'resolved']);

        $response = $this->actingAs($admin)->getJson('/api/v1/admin/tickets?status=open');

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data'));
        $this->assertEquals('open', $response->json('data.0.status'));
    }

    public function test_admin_can_reply_to_ticket(): void
    {
        $admin = $this->createAdmin();
        $user = $this->createUser();
        $ticket = $this->createTicket($user);

        $response = $this->actingAs($admin)->postJson("/api/v1/admin/tickets/{$ticket->public_id}/reply", [
            'message' => 'Kami sedang mengecek masalah Anda.',
        ]);

        $response->assertStatus(201);
        $response->assertJsonPath('ticket_message.sender_type', 'admin');
        $response->assertJsonPath('ticket_message.message', 'Kami sedang mengecek masalah Anda.');

        $ticket->refresh();
        $this->assertEquals('in_progress', $ticket->status);
        $this->assertEquals('admin', $ticket->last_reply_by);
    }

    public function test_admin_can_update_ticket_status(): void
    {
        $admin = $this->createAdmin();
        $user = $this->createUser();
        $ticket = $this->createTicket($user);

        $response = $this->actingAs($admin)->putJson("/api/v1/admin/tickets/{$ticket->public_id}/status", [
            'status' => 'resolved',
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('ticket.status', 'resolved');

        $this->assertDatabaseHas('tickets', [
            'id' => $ticket->id,
            'status' => 'resolved',
        ]);
    }

    public function test_admin_cannot_set_invalid_status(): void
    {
        $admin = $this->createAdmin();
        $user = $this->createUser();
        $ticket = $this->createTicket($user);

        $response = $this->actingAs($admin)->putJson("/api/v1/admin/tickets/{$ticket->public_id}/status", [
            'status' => 'invalid_status',
        ]);

        $response->assertStatus(422);
    }

    public function test_non_admin_cannot_access_admin_tickets(): void
    {
        $user = $this->createUser();

        $response = $this->actingAs($user)->getJson('/api/v1/admin/tickets');
        $response->assertStatus(403);
    }
}
