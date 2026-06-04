<?php

namespace Tests\Feature;

use Tests\TestCase;

class HealthTest extends TestCase
{
    /**
     * Test that the health endpoint returns a successful response
     * with the expected JSON shape.
     */
    public function test_health_endpoint_returns_200_with_expected_shape(): void
    {
        $response = $this->getJson('/api/v1/health');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'app',
            'version',
            'status',
            'timestamp',
        ]);

        $response->assertJson([
            'app' => 'JadeNode',
            'version' => '0.1.0',
            'status' => 'healthy',
        ]);
    }
}
