<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Modules\Auth\Models\BetaAccessRequest;

class BetaAccessDecisionNotification extends Notification
{
    use Queueable;

    public function __construct(
        public BetaAccessRequest $betaRequest,
        public ?string $adminReason = null,
    ) {}

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $isApproved = $this->betaRequest->status === 'approved';

        $mail = (new MailMessage)
            ->subject($isApproved
                ? 'Beta Access JadeNode Disetujui'
                : 'Permintaan Beta Access JadeNode Ditolak')
            ->greeting('Halo ' . $notifiable->name . '!');

        if ($isApproved) {
            $mail->line('Selamat! Permintaan beta access kamu telah disetujui.')
                 ->line('Kamu sekarang bisa melakukan checkout untuk membeli layanan di JadeNode Marketplace.')
                 ->action('Mulai Belanja', config('app.frontend_url', config('app.url')) . '/marketplace');
        } else {
            $mail->line('Maaf, permintaan beta access kamu ditolak.');

            if ($this->adminReason) {
                $mail->line('Alasan: ' . $this->adminReason);
            }

            $mail->line('Kamu bisa mengajukan permintaan baru kapan saja.');
        }

        $mail->salutation('Salam, Tim JadeNode');

        return $mail;
    }
}
