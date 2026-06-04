<?php

namespace Tests\Feature\Authorization;

use App\Models\User;
use App\Modules\Deployment\Models\Deployment;
use App\Modules\Order\Models\Order;
use App\Modules\Support\Models\Ticket;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PolicyTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function test_user_cannot_view_other_users_order(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();

        $order = Order::create([
            'public_id' => '01HXORDER01',
            'user_id' => $owner->id,
            'order_number' => 'ORD-001',
            'status' => 'pending',
            'billing_cycle' => 'monthly',
            'subtotal_minor' => 100000,
            'currency' => 'IDR',
        ]);

        // Owner can view
        $this->assertTrue(
            $this->app->make(\Illuminate\Contracts\Auth\Access\Gate::class)
                ->forUser($owner)
                ->allows('view', $order)
        );

        // Other user cannot view
        $this->assertFalse(
            $this->app->make(\Illuminate\Contracts\Auth\Access\Gate::class)
                ->forUser($other)
                ->allows('view', $order)
        );
    }

    /** @test */
    public function test_user_cannot_view_other_users_deployment(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();

        $deployment = Deployment::create([
            'public_id' => '01HXDEPLOY01',
            'user_id' => $owner->id,
            'status' => 'active',
            'hostname' => 'server-01',
        ]);

        $gate = $this->app->make(\Illuminate\Contracts\Auth\Access\Gate::class);

        $this->assertTrue($gate->forUser($owner)->allows('view', $deployment));
        $this->assertFalse($gate->forUser($other)->allows('view', $deployment));
    }

    /** @test */
    public function test_user_cannot_view_other_users_ticket(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();

        $ticket = Ticket::create([
            'public_id' => '01HXTICKET01',
            'user_id' => $owner->id,
            'subject' => 'Test ticket',
            'status' => 'open',
            'priority' => 'normal',
            'category' => 'general',
        ]);

        $gate = $this->app->make(\Illuminate\Contracts\Auth\Access\Gate::class);

        $this->assertTrue($gate->forUser($owner)->allows('view', $ticket));
        $this->assertFalse($gate->forUser($other)->allows('view', $ticket));
    }

    /** @test */
    public function test_customer_cannot_access_admin_routes(): void
    {
        $customer = User::factory()->create(['role' => 'customer']);

        $response = $this->actingAs($customer)
            ->getJson('/api/v1/admin/audit-logs');

        $response->assertStatus(403);
    }

    /** @test */
    public function test_unverified_user_cannot_checkout(): void
    {
        $unverified = User::factory()->create([
            'email_verified_at' => null,
            'role' => 'customer',
        ]);

        // The OrderPolicy::create checks email_verified_at
        $gate = $this->app->make(\Illuminate\Contracts\Auth\Access\Gate::class);

        $this->assertFalse($gate->forUser($unverified)->allows('create', \App\Modules\Order\Models\Order::class));

        $verified = User::factory()->create([
            'email_verified_at' => now(),
            'role' => 'customer',
        ]);

        $this->assertTrue($gate->forUser($verified)->allows('create', \App\Modules\Order\Models\Order::class));
    }
}
