<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Seeds users required for full-flow testing.
 *
 * - admin@jadenode.id  (role: admin)   → admin panel access
 * - test@jadenode.id   (role: customer, verified) → dashboard + checkout
 */
class UserSeeder extends Seeder
{
    public function run(): void
    {
        // ── Admin ──
        User::firstOrCreate(
            ['email' => 'admin@jadenode.id'],
            [
                'public_id'       => (string) Str::ulid(),
                'name'            => 'Admin JadeNode',
                'password'        => 'password', // hashed via model cast
                'role'            => 'admin',
                'phone'           => '+6281234567890',
                'country'         => 'ID',
                'timezone'        => 'Asia/Jakarta',
                'email_verified_at' => now(),
            ],
        );

        // ── Test Customer (verified email) ──
        User::firstOrCreate(
            ['email' => 'test@jadenode.id'],
            [
                'public_id'        => (string) Str::ulid(),
                'name'             => 'Zagan Jade',
                'password'         => 'password',
                'role'             => 'customer',
                'phone'            => '+6282345678901',
                'country'          => 'ID',
                'timezone'         => 'Asia/Jakarta',
                'email_verified_at' => now(),
            ],
        );

        $this->command->info('Seeded: admin@jadenode.id, test@jadenode.id (password: password)');
    }
}
