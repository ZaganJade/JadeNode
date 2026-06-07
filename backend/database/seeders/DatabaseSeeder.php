<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * Order matters — each seeder depends on records created by prior ones.
     *
     * Flow:  Users → Marketplace → BetaAccess → OrderFlow → SshKey → Support → Audit
     */
    public function run(): void
    {
        $this->call([
            // 1. Users (admin + test customer with verified email)
            UserSeeder::class,

            // 2. Marketplace data (provider, categories, products, prices)
            MarketplaceSeeder::class,

            // 3. Approved beta-access for test customer
            BetaAccessSeeder::class,

            // 4. Orders, invoices, payments, deployments, provisioning, resource actions
            OrderFlowSeeder::class,

            // 5. SSH keys for test customer
            SshKeySeeder::class,

            // 6. Support tickets + messages
            SupportSeeder::class,

            // 7. Admin audit logs + audit trail
            AuditLogSeeder::class,
        ]);

        $this->command->newLine();
        $this->command->info('✅ Full database seeded successfully!');
        $this->command->info('');
        $this->command->info('Test credentials:');
        $this->command->info('  Customer: test@jadenode.id / password');
        $this->command->info('  Admin:    admin@jadenode.id / password');
        $this->command->newLine();
    }
}
