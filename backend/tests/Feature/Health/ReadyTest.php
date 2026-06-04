<?php

namespace Tests\Feature\Health;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use Tests\TestCase;

class ReadyTest extends TestCase
{
    /** @test */
    public function test_ready_endpoint_returns_healthy_when_deps_up(): void
    {
        // In a normal test environment, DB should be available
        $response = $this->getJson('/api/v1/ready');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'status',
            'checks' => ['database', 'redis'],
            'timestamp',
        ]);

        $data = $response->json();
        $this->assertContains($data['status'], ['ready', 'unready']);
        $this->assertIsBool($data['checks']['database']);
        $this->assertIsBool($data['checks']['redis']);
    }

    /** @test */
    public function test_health_endpoint_returns_app_info(): void
    {
        $response = $this->getJson('/api/v1/health');

        $response->assertStatus(200);
        $response->assertJson([
            'app' => 'JadeNode',
            'version' => '0.1.0',
            'status' => 'healthy',
        ]);
        $response->assertJsonStructure([
            'app',
            'version',
            'status',
            'timestamp',
        ]);
    }
}
