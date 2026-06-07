<?php

namespace Database\Seeders;

use App\Models\User;
use App\Modules\Deployment\Models\SshKey;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Seeds an SSH key for the test customer.
 */
class SshKeySeeder extends Seeder
{
    public function run(): void
    {
        $customer = User::where('email', 'test@jadenode.id')->first();
        if (! $customer) {
            $this->command->warn('Skipping SshKeySeeder: test customer not found.');
            return;
        }

        $publicKey = 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI' . Str::random(43) . ' test@jadenode.id';

        SshKey::firstOrCreate(
            ['user_id' => $customer->id, 'name' => 'test-laptop'],
            [
                'public_id'  => (string) Str::ulid(),
                'public_key' => $publicKey,
                'fingerprint' => SshKey::generateFingerprint($publicKey),
                'last_used_at' => now()->subDays(3),
            ],
        );

        $this->command->info('Seeded: SSH key "test-laptop" for test@jadenode.id');
    }
}
