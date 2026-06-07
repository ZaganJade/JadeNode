<?php

namespace Database\Seeders;

use App\Models\User;
use App\Modules\Auth\Models\BetaAccessRequest;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Seeds approved beta-access for the test customer
 * so they can proceed to checkout.
 */
class BetaAccessSeeder extends Seeder
{
    public function run(): void
    {
        $customer = User::where('email', 'test@jadenode.id')->first();
        if (! $customer) {
            $this->command->warn('Skipping BetaAccessSeeder: test customer not found.');
            return;
        }

        $admin = User::where('email', 'admin@jadenode.id')->first();

        BetaAccessRequest::firstOrCreate(
            ['user_id' => $customer->id],
            [
                'public_id'   => (string) Str::ulid(),
                'status'      => 'approved',
                'reason'      => 'Full-flow testing — need checkout access.',
                'admin_reason' => 'Approved for UAS testing purposes.',
                'reviewed_by'  => $admin?->id,
                'reviewed_at'  => now(),
            ],
        );

        $this->command->info('Seeded: approved beta-access for test@jadenode.id');
    }
}
