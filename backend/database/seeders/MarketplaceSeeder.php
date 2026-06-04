<?php

namespace Database\Seeders;

use App\Modules\Marketplace\Models\ProductCategory;
use App\Modules\Marketplace\Models\ResourceProduct;
use App\Modules\Order\Models\ProductPrice;
use App\Modules\Provider\Models\Provider;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class MarketplaceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // --- First-party Provider ---
        $provider = Provider::create([
            'public_id' => (string) Str::ulid(),
            'name' => 'ZaganJade',
            'slug' => 'zaganjade',
            'description' => 'ZaganJade is the operator and first-party provider of the JadeNode Marketplace, offering high-performance cloud infrastructure directly to customers.',
            'is_first_party' => true,
            'status' => 'active',
            'verification_status' => 'verified',
            'support_email' => 'support@jadenode.id',
            'website_url' => 'https://jadenode.id',
            'logo_path' => null,
            'commission_rate' => 15.00,
        ]);

        // --- Product Categories ---
        $vpsCategory = ProductCategory::create([
            'public_id' => (string) Str::ulid(),
            'name' => 'VPS',
            'slug' => 'vps',
            'description' => 'Virtual Private Servers with dedicated resources and full root access.',
            'sort_order' => 0,
            'is_active' => true,
        ]);

        $dedicatedCategory = ProductCategory::create([
            'public_id' => (string) Str::ulid(),
            'name' => 'Dedicated Server',
            'slug' => 'dedicated-server',
            'description' => 'Bare-metal servers with exclusive hardware for demanding workloads.',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        // --- VPS Products ---
        $vpsProducts = [
            [
                'name' => 'VPS Starter',
                'slug' => 'vps-starter',
                'description' => 'Entry-level virtual private server ideal for development, testing, and lightweight applications.',
                'resource_type' => 'vps',
                'region' => 'Jakarta (ID)',
                'availability_status' => 'available',
                'provisioning_sla_hours' => 24,
                'display_priority' => 10,
                'trust_indicators' => [
                    'provider_verified' => true,
                    'provisioning_sla_hours' => 24,
                    'dispute_protection' => true,
                ],
                'specs' => [
                    'cpu_cores' => 1,
                    'ram_gb' => 1,
                    'storage_gb' => 20,
                    'storage_type' => 'SSD',
                    'bandwidth_tb' => 1,
                    'ipv4' => 1,
                ],
                'prices' => [
                    ['billing_cycle' => 'monthly', 'gross_price_minor' => 5000000, 'is_default' => true],
                    ['billing_cycle' => 'yearly', 'gross_price_minor' => 50000000, 'is_default' => false],
                ],
            ],
            [
                'name' => 'VPS Basic',
                'slug' => 'vps-basic',
                'description' => 'Balanced virtual private server for small production websites and application hosting.',
                'resource_type' => 'vps',
                'region' => 'Jakarta (ID)',
                'availability_status' => 'available',
                'provisioning_sla_hours' => 24,
                'display_priority' => 20,
                'trust_indicators' => [
                    'provider_verified' => true,
                    'provisioning_sla_hours' => 24,
                    'dispute_protection' => true,
                ],
                'specs' => [
                    'cpu_cores' => 2,
                    'ram_gb' => 2,
                    'storage_gb' => 40,
                    'storage_type' => 'SSD',
                    'bandwidth_tb' => 2,
                    'ipv4' => 1,
                ],
                'prices' => [
                    ['billing_cycle' => 'monthly', 'gross_price_minor' => 10000000, 'is_default' => true],
                    ['billing_cycle' => 'yearly', 'gross_price_minor' => 100000000, 'is_default' => false],
                ],
            ],
            [
                'name' => 'VPS Pro',
                'slug' => 'vps-pro',
                'description' => 'High-performance virtual private server for production workloads, databases, and medium-traffic applications.',
                'resource_type' => 'vps',
                'region' => 'Jakarta (ID)',
                'availability_status' => 'available',
                'provisioning_sla_hours' => 24,
                'display_priority' => 30,
                'trust_indicators' => [
                    'provider_verified' => true,
                    'provisioning_sla_hours' => 24,
                    'dispute_protection' => true,
                ],
                'specs' => [
                    'cpu_cores' => 4,
                    'ram_gb' => 8,
                    'storage_gb' => 80,
                    'storage_type' => 'NVMe SSD',
                    'bandwidth_tb' => 4,
                    'ipv4' => 1,
                ],
                'prices' => [
                    ['billing_cycle' => 'monthly', 'gross_price_minor' => 25000000, 'is_default' => true],
                    ['billing_cycle' => 'yearly', 'gross_price_minor' => 250000000, 'is_default' => false],
                ],
            ],
            [
                'name' => 'VPS Enterprise',
                'slug' => 'vps-enterprise',
                'description' => 'Enterprise-grade virtual private server for high-traffic applications, heavy databases, and mission-critical workloads.',
                'resource_type' => 'vps',
                'region' => 'Jakarta (ID)',
                'availability_status' => 'limited',
                'provisioning_sla_hours' => 12,
                'display_priority' => 40,
                'trust_indicators' => [
                    'provider_verified' => true,
                    'provisioning_sla_hours' => 12,
                    'dispute_protection' => true,
                ],
                'specs' => [
                    'cpu_cores' => 8,
                    'ram_gb' => 16,
                    'storage_gb' => 160,
                    'storage_type' => 'NVMe SSD',
                    'bandwidth_tb' => 8,
                    'ipv4' => 1,
                ],
                'prices' => [
                    ['billing_cycle' => 'monthly', 'gross_price_minor' => 50000000, 'is_default' => true],
                    ['billing_cycle' => 'yearly', 'gross_price_minor' => 500000000, 'is_default' => false],
                ],
            ],
        ];

        foreach ($vpsProducts as $productData) {
            $prices = $productData['prices'];
            unset($productData['prices']);

            $product = ResourceProduct::create([
                'public_id' => (string) Str::ulid(),
                'provider_id' => $provider->id,
                'category_id' => $vpsCategory->id,
                ...$productData,
            ]);

            foreach ($prices as $priceData) {
                ProductPrice::create([
                    'public_id' => (string) Str::ulid(),
                    'product_id' => $product->id,
                    'currency' => 'IDR',
                    ...$priceData,
                ]);
            }
        }

        // --- Dedicated Server Product ---
        $dedicatedProducts = [
            [
                'name' => 'Dedicated Standard',
                'slug' => 'dedicated-standard',
                'description' => 'Bare-metal dedicated server with enterprise-grade hardware for CPU-intensive and IO-heavy workloads.',
                'resource_type' => 'dedicated',
                'region' => 'Jakarta (ID)',
                'availability_status' => 'available',
                'provisioning_sla_hours' => 48,
                'display_priority' => 50,
                'trust_indicators' => [
                    'provider_verified' => true,
                    'provisioning_sla_hours' => 48,
                    'dispute_protection' => true,
                ],
                'specs' => [
                    'cpu' => 'Intel Xeon E-2236 (6C/12T)',
                    'ram_gb' => 32,
                    'storage' => '2x 480GB SSD (RAID 1)',
                    'bandwidth_tb' => 10,
                    'ipv4' => 5,
                ],
                'prices' => [
                    ['billing_cycle' => 'monthly', 'gross_price_minor' => 150000000, 'is_default' => true],
                    ['billing_cycle' => 'yearly', 'gross_price_minor' => 1500000000, 'is_default' => false],
                ],
            ],
        ];

        foreach ($dedicatedProducts as $productData) {
            $prices = $productData['prices'];
            unset($productData['prices']);

            $product = ResourceProduct::create([
                'public_id' => (string) Str::ulid(),
                'provider_id' => $provider->id,
                'category_id' => $dedicatedCategory->id,
                ...$productData,
            ]);

            foreach ($prices as $priceData) {
                ProductPrice::create([
                    'public_id' => (string) Str::ulid(),
                    'product_id' => $product->id,
                    'currency' => 'IDR',
                    ...$priceData,
                ]);
            }
        }
    }
}
