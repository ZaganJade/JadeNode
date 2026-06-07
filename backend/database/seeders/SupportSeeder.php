<?php

namespace Database\Seeders;

use App\Models\User;
use App\Modules\Support\Models\Ticket;
use App\Modules\Support\Models\TicketMessage;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Seeds support tickets for the test customer.
 *
 * 1 open ticket with 3 messages (customer → admin → customer)
 * 1 resolved ticket with 2 messages
 */
class SupportSeeder extends Seeder
{
    public function run(): void
    {
        $customer = User::where('email', 'test@jadenode.id')->first();
        $admin     = User::where('email', 'admin@jadenode.id')->first();

        if (! $customer) {
            $this->command->warn('Skipping SupportSeeder: test customer not found.');
            return;
        }

        // ── Ticket 1: Open ──
        $ticket1 = Ticket::create([
            'public_id'    => (string) Str::ulid(),
            'user_id'      => $customer->id,
            'subject'      => 'Tidak bisa akses VPS via SSH',
            'status'       => 'open',
            'priority'     => 'high',
            'category'     => 'technical',
            'last_reply_at' => now()->subHours(1),
            'last_reply_by' => 'customer',
        ]);

        TicketMessage::create([
            'public_id'   => (string) Str::ulid(),
            'ticket_id'   => $ticket1->id,
            'user_id'     => $customer->id,
            'sender_type' => 'customer',
            'message'     => 'Halo, saya sudah mencoba SSH ke IP yang diberikan tapi koneksi selalu timeout. Mohon bantuannya.',
        ]);

        if ($admin) {
            TicketMessage::create([
                'public_id'   => (string) Str::ulid(),
                'ticket_id'   => $ticket1->id,
                'user_id'     => $admin->id,
                'sender_type' => 'admin',
                'message'     => 'Terima kasih sudah melapor. Kami cek dulu di sisi infrastruktur — mohon tunggu 15-30 menit.',
            ]);
        }

        TicketMessage::create([
            'public_id'   => (string) Str::ulid(),
            'ticket_id'   => $ticket1->id,
            'user_id'     => $customer->id,
            'sender_type' => 'customer',
            'message'     => 'Siap, ditunggu. Terima kasih banyak.',
        ]);

        // ── Ticket 2: Resolved ──
        $ticket2 = Ticket::create([
            'public_id'    => (string) Str::ulid(),
            'user_id'      => $customer->id,
            'subject'      => 'Permintaan upgrade RAM',
            'status'       => 'resolved',
            'priority'     => 'low',
            'category'     => 'billing',
            'last_reply_at' => now()->subDays(2),
            'last_reply_by' => 'admin',
        ]);

        TicketMessage::create([
            'public_id'   => (string) Str::ulid(),
            'ticket_id'   => $ticket2->id,
            'user_id'     => $customer->id,
            'sender_type' => 'customer',
            'message'     => 'Bisakah saya upgrade RAM dari 1GB ke 2GB untuk VPS Starter saya?',
        ]);

        if ($admin) {
            TicketMessage::create([
                'public_id'   => (string) Str::ulid(),
                'ticket_id'   => $ticket2->id,
                'user_id'     => $admin->id,
                'sender_type' => 'admin',
                'message'     => 'Bisa! Silakan buat order baru di marketplace dengan paket yang lebih tinggi, lalu buat ticket untuk migrasi data. Kami akan bantu prosesnya.',
            ]);
        }

        $this->command->info('Seeded: 2 tickets (1 open, 1 resolved)');
    }
}
