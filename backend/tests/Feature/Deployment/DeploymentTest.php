<?php

namespace Tests\Feature\Deployment;

use App\Models\User;
use App\Modules\Auth\Models\BetaAccessRequest;
use App\Modules\Deployment\Models\Deployment;
use App\Modules\Deployment\Models\ProvisioningTask;
use App\Modules\Deployment\Models\ResourceAction;
use App\Modules\Deployment\Models\SshKey;
use App\Modules\Deployment\Services\DeploymentService;
use App\Modules\Marketplace\Models\ProductCategory;
use App\Modules\Marketplace\Models\ResourceProduct;
use App\Modules\Order\Models\Invoice;
use App\Modules\Order\Models\Order;
use App\Modules\Order\Models\OrderItem;
use App\Modules\Order\Models\ProductPrice;
use App\Modules\Provider\Models\Provider;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class DeploymentTest extends TestCase
{
    use RefreshDatabase;

    private function createCustomer(array $overrides = []): User
    {
        return User::factory()->create(array_merge([
            'email_verified_at' => now(),
            'public_id' => Str::ulid()->toBase32(),
        ], $overrides));
    }

    private function createAdmin(): User
    {
        return User::factory()->create([
            'role' => 'admin',
            'email_verified_at' => now(),
            'public_id' => Str::ulid()->toBase32(),
        ]);
    }

    private function createProviderAndProduct(): array
    {
        $provider = Provider::create([
            'public_id' => Str::ulid()->toBase32(),
            'name' => 'Test Provider',
            'slug' => 'test-provider',
            'is_first_party' => true,
            'commission_rate' => 15.00,
        ]);

        $category = ProductCategory::create([
            'public_id' => Str::ulid()->toBase32(),
            'name' => 'VPS',
            'slug' => 'vps',
            'resource_type' => 'vps',
        ]);

        $product = ResourceProduct::create([
            'public_id' => Str::ulid()->toBase32(),
            'provider_id' => $provider->id,
            'category_id' => $category->id,
            'name' => 'VPS Starter',
            'slug' => 'vps-starter',
            'description' => 'A starter VPS',
            'resource_type' => 'vps',
            'region' => 'Jakarta',
            'availability_status' => 'available',
            'provisioning_sla_hours' => 24,
            'is_active' => true,
            'specs' => ['cpu' => 1, 'ram' => '1GB', 'storage' => '20GB SSD'],
        ]);

        ProductPrice::create([
            'public_id' => Str::ulid()->toBase32(),
            'product_id' => $product->id,
            'billing_cycle' => 'monthly',
            'gross_price_minor' => 5000000,
            'currency' => 'IDR',
            'is_default' => true,
        ]);

        return compact('provider', 'category', 'product');
    }

    private function createPaidOrder(User $user, ResourceProduct $product): Order
    {
        $order = Order::create([
            'public_id' => Str::ulid()->toBase32(),
            'user_id' => $user->id,
            'order_number' => 'ORD-' . strtoupper(Str::random(10)),
            'status' => 'paid',
            'billing_cycle' => 'monthly',
            'subtotal_minor' => 5000000,
            'currency' => 'IDR',
        ]);

        OrderItem::create([
            'public_id' => Str::ulid()->toBase32(),
            'order_id' => $order->id,
            'product_id' => $product->id,
            'provider_id' => $product->provider_id,
            'product_snapshot' => ['name' => $product->name],
            'price_minor' => 5000000,
            'commission_rate' => 15.00,
            'commission_minor' => 750000,
            'billing_cycle' => 'monthly',
            'currency' => 'IDR',
        ]);

        return $order;
    }

    private function createDeploymentWithTask(User $user, string $status = 'pending_provisioning'): array
    {
        ['product' => $product] = $this->createProviderAndProduct();
        $order = $this->createPaidOrder($user, $product);

        $deployment = Deployment::create([
            'public_id' => Str::ulid()->toBase32(),
            'user_id' => $user->id,
            'order_id' => $order->id,
            'order_item_id' => $order->items()->first()->id,
            'product_id' => $product->id,
            'provider_id' => $product->provider_id,
            'status' => $status,
            'specs_snapshot' => ['cpu' => 1, 'ram' => '1GB'],
            'billing_cycle' => 'monthly',
            'current_period_start' => now()->toDateString(),
            'current_period_end' => now()->addMonth()->toDateString(),
            'auto_renew' => true,
            'provisioning_sla_hours' => 24,
        ]);

        $task = ProvisioningTask::create([
            'public_id' => Str::ulid()->toBase32(),
            'deployment_id' => $deployment->id,
            'status' => $status === 'pending_provisioning' ? 'pending' : ($status === 'provisioning' ? 'provisioning' : 'pending'),
            'due_at' => now()->addHours(24),
            'overdue_at' => now()->addHours(36),
        ]);

        return compact('deployment', 'task', 'order', 'product');
    }

    // =====================
    // Test: paid order creates deployment and provisioning task
    // =====================
    public function test_paid_order_creates_deployment_and_provisioning_task(): void
    {
        $user = $this->createCustomer();
        ['product' => $product] = $this->createProviderAndProduct();
        $order = $this->createPaidOrder($user, $product);

        $service = new DeploymentService();
        $deployment = $service->createFromPaidOrder($order);

        $this->assertNotNull($deployment);
        $this->assertEquals('pending_provisioning', $deployment->status);
        $this->assertEquals($user->id, $deployment->user_id);
        $this->assertEquals($order->id, $deployment->order_id);

        $this->assertDatabaseHas('deployments', [
            'order_id' => $order->id,
            'status' => 'pending_provisioning',
        ]);

        $this->assertDatabaseHas('provisioning_tasks', [
            'deployment_id' => $deployment->id,
            'status' => 'pending',
        ]);
    }

    // =====================
    // Test: duplicate paid event is idempotent
    // =====================
    public function test_duplicate_paid_event_is_idempotent(): void
    {
        $user = $this->createCustomer();
        ['product' => $product] = $this->createProviderAndProduct();
        $order = $this->createPaidOrder($user, $product);

        $service = new DeploymentService();

        $first = $service->createFromPaidOrder($order);
        $second = $service->createFromPaidOrder($order);

        $this->assertEquals($first->id, $second->id);
        $this->assertDatabaseCount('deployments', 1);
        $this->assertDatabaseCount('provisioning_tasks', 1);
    }

    // =====================
    // Test: admin can mark provisioning started
    // =====================
    public function test_admin_can_mark_provisioning_started(): void
    {
        $customer = $this->createCustomer();
        $admin = $this->createAdmin();
        ['task' => $task] = $this->createDeploymentWithTask($customer);

        $response = $this->actingAs($admin)
            ->postJson("/api/v1/admin/provisioning-tasks/{$task->id}/start");

        $response->assertStatus(200);
        $response->assertJsonPath('task.status', 'provisioning');

        $this->assertDatabaseHas('provisioning_tasks', [
            'id' => $task->id,
            'status' => 'provisioning',
        ]);

        $this->assertDatabaseHas('deployments', [
            'id' => $task->deployment_id,
            'status' => 'provisioning',
        ]);
    }

    // =====================
    // Test: admin can complete provisioning
    // =====================
    public function test_admin_can_complete_provisioning(): void
    {
        $customer = $this->createCustomer();
        $admin = $this->createAdmin();
        ['task' => $task] = $this->createDeploymentWithTask($customer);

        // First start the provisioning
        $service = new DeploymentService();
        $service->markProvisioning($task);
        $task->refresh();

        $response = $this->actingAs($admin)
            ->postJson("/api/v1/admin/provisioning-tasks/{$task->id}/complete", [
                'hostname' => 'server01.example.com',
                'ip_address' => '192.168.1.100',
                'credential' => 'encrypted-credential-here',
            ]);

        $response->assertStatus(200);
        $response->assertJsonPath('task.status', 'completed');

        $this->assertDatabaseHas('deployments', [
            'id' => $task->deployment_id,
            'status' => 'active',
            'hostname' => 'server01.example.com',
            'ip_address' => '192.168.1.100',
        ]);
    }

    // =====================
    // Test: admin can fail provisioning
    // =====================
    public function test_admin_can_fail_provisioning(): void
    {
        $customer = $this->createCustomer();
        $admin = $this->createAdmin();
        ['task' => $task] = $this->createDeploymentWithTask($customer);

        // Start provisioning first
        $service = new DeploymentService();
        $service->markProvisioning($task);
        $task->refresh();

        $response = $this->actingAs($admin)
            ->postJson("/api/v1/admin/provisioning-tasks/{$task->id}/fail", [
                'reason' => 'Out of stock - no available nodes.',
            ]);

        $response->assertStatus(200);
        $response->assertJsonPath('task.status', 'failed');

        $this->assertDatabaseHas('deployments', [
            'id' => $task->deployment_id,
            'status' => 'failed',
        ]);

        $this->assertDatabaseHas('provisioning_tasks', [
            'id' => $task->id,
            'failure_reason' => 'Out of stock - no available nodes.',
        ]);
    }

    // =====================
    // Test: customer can list own deployments
    // =====================
    public function test_customer_can_list_own_deployments(): void
    {
        $user = $this->createCustomer();
        $this->createDeploymentWithTask($user, 'active');
        $this->createDeploymentWithTask($user, 'pending_provisioning');

        $response = $this->actingAs($user)
            ->getJson('/api/v1/deployments');

        $response->assertStatus(200);
        $this->assertCount(2, $response->json('data'));
    }

    // =====================
    // Test: customer can request start/stop/restart
    // =====================
    public function test_customer_can_request_start(): void
    {
        $user = $this->createCustomer();
        ['deployment' => $deployment] = $this->createDeploymentWithTask($user, 'stopped');

        $response = $this->actingAs($user)
            ->postJson("/api/v1/deployments/{$deployment->id}/action", [
                'action_type' => 'start',
            ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('resource_actions', [
            'deployment_id' => $deployment->id,
            'action_type' => 'start',
            'status' => 'pending',
        ]);
    }

    public function test_customer_can_request_stop(): void
    {
        $user = $this->createCustomer();
        ['deployment' => $deployment] = $this->createDeploymentWithTask($user, 'active');

        $response = $this->actingAs($user)
            ->postJson("/api/v1/deployments/{$deployment->id}/action", [
                'action_type' => 'stop',
            ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('resource_actions', [
            'deployment_id' => $deployment->id,
            'action_type' => 'stop',
            'status' => 'pending',
        ]);
    }

    public function test_customer_can_request_restart(): void
    {
        $user = $this->createCustomer();
        ['deployment' => $deployment] = $this->createDeploymentWithTask($user, 'active');

        $response = $this->actingAs($user)
            ->postJson("/api/v1/deployments/{$deployment->id}/action", [
                'action_type' => 'restart',
            ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('resource_actions', [
            'deployment_id' => $deployment->id,
            'action_type' => 'restart',
            'status' => 'pending',
        ]);
    }

    // =====================
    // Test: customer can cancel at period end
    // =====================
    public function test_customer_can_cancel_at_period_end(): void
    {
        $user = $this->createCustomer();
        ['deployment' => $deployment] = $this->createDeploymentWithTask($user, 'active');

        $response = $this->actingAs($user)
            ->postJson("/api/v1/deployments/{$deployment->id}/cancel-at-period-end");

        $response->assertStatus(200);

        $deployment->refresh();
        $this->assertFalse($deployment->auto_renew);
        $this->assertNotNull($deployment->cancelled_at);
    }

    // =====================
    // Test: cross-user deployment access denied
    // =====================
    public function test_cross_user_deployment_access_denied(): void
    {
        $user1 = $this->createCustomer();
        $user2 = $this->createCustomer();
        ['deployment' => $deployment] = $this->createDeploymentWithTask($user1, 'active');

        // user2 tries to view user1's deployment
        $response = $this->actingAs($user2)
            ->getJson("/api/v1/deployments/{$deployment->id}");

        $response->assertStatus(404);

        // user2 tries to cancel user1's deployment
        $response = $this->actingAs($user2)
            ->postJson("/api/v1/deployments/{$deployment->id}/cancel-at-period-end");

        $response->assertStatus(404);

        // user2 tries to request action on user1's deployment
        $response = $this->actingAs($user2)
            ->postJson("/api/v1/deployments/{$deployment->id}/action", [
                'action_type' => 'restart',
            ]);

        $response->assertStatus(404);
    }

    // =====================
    // Test: SSH key CRUD
    // =====================
    public function test_ssh_key_crud(): void
    {
        $user = $this->createCustomer();

        // Create SSH key
        $response = $this->actingAs($user)
            ->postJson('/api/v1/ssh-keys', [
                'name' => 'My Laptop Key',
                'public_key' => 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQC7vb28Y jane@example.com',
            ]);

        $response->assertStatus(201);
        $response->assertJsonPath('ssh_key.name', 'My Laptop Key');
        $sshKeyId = $response->json('ssh_key.id');

        $this->assertDatabaseHas('ssh_keys', [
            'user_id' => $user->id,
            'name' => 'My Laptop Key',
        ]);

        // List SSH keys
        $response = $this->actingAs($user)
            ->getJson('/api/v1/ssh-keys');

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data'));

        // Delete SSH key
        $response = $this->actingAs($user)
            ->deleteJson("/api/v1/ssh-keys/{$sshKeyId}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('ssh_keys', [
            'id' => $sshKeyId,
        ]);
    }

    public function test_ssh_key_invalid_format_rejected(): void
    {
        $user = $this->createCustomer();

        $response = $this->actingAs($user)
            ->postJson('/api/v1/ssh-keys', [
                'name' => 'Bad Key',
                'public_key' => 'not-a-valid-ssh-key',
            ]);

        $response->assertStatus(422);
        $response->assertJsonPath('message', 'Format public key tidak valid. Pastikan format SSH key benar (ssh-rsa, ssh-ed25519, ssh-ecdsa, ssh-dss).');
    }

    public function test_cannot_delete_other_users_ssh_key(): void
    {
        $user1 = $this->createCustomer();
        $user2 = $this->createCustomer();

        $sshKey = SshKey::create([
            'public_id' => Str::ulid()->toBase32(),
            'user_id' => $user1->id,
            'name' => 'User1 Key',
            'public_key' => 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQC7vb28Y user1@example.com',
            'fingerprint' => 'aa:bb:cc:dd:ee:ff:00:11:22:33:44:55:66:77:88:99',
        ]);

        // user2 tries to delete user1's key
        $response = $this->actingAs($user2)
            ->deleteJson("/api/v1/ssh-keys/{$sshKey->id}");

        $response->assertStatus(404);
        $this->assertDatabaseHas('ssh_keys', ['id' => $sshKey->id]);
    }

    // =====================
    // Test: admin can process resource action
    // =====================
    public function test_admin_can_process_resource_action(): void
    {
        $customer = $this->createCustomer();
        $admin = $this->createAdmin();
        ['deployment' => $deployment] = $this->createDeploymentWithTask($customer, 'active');

        // Customer requests restart
        $action = ResourceAction::create([
            'public_id' => Str::ulid()->toBase32(),
            'deployment_id' => $deployment->id,
            'user_id' => $customer->id,
            'action_type' => 'restart',
            'status' => 'pending',
        ]);

        // Admin processes action
        $response = $this->actingAs($admin)
            ->postJson("/api/v1/admin/resource-actions/{$action->id}/process", [
                'status' => 'completed',
                'result' => 'Server restarted successfully.',
            ]);

        $response->assertStatus(200);
        $response->assertJsonPath('action.status', 'completed');

        $this->assertDatabaseHas('resource_actions', [
            'id' => $action->id,
            'status' => 'completed',
            'result' => 'Server restarted successfully.',
        ]);
    }
}
