<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Str;

class VerifyEmailNotification extends Notification
{
    use Queueable;

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
        $verificationUrl = $this->verificationUrl($notifiable);

        return (new MailMessage)
            ->subject('Verifikasi Email JadeNode')
            ->greeting('Halo ' . $notifiable->name . '!')
            ->line('Klik tombol di bawah untuk memverifikasi alamat email kamu.')
            ->action('Verifikasi Email', $verificationUrl)
            ->line('Jika kamu tidak membuat akun JadeNode, abaikan email ini.')
            ->salutation('Salam, Tim JadeNode');
    }

    /**
     * Build the verification URL pointing to the frontend.
     *
     * Generates a cryptographically secure random token and stores it
     * on the user model so it can be verified later.
     */
    protected function verificationUrl(object $notifiable): string
    {
        $frontendUrl = config('app.frontend_url', config('app.url'));

        // Generate a random token and persist it
        $token = Str::random(40);
        $notifiable->update([
            'email_verification_token' => hash('sha256', $token),
        ]);

        return $frontendUrl
            . '/verify-email'
            . '?token=' . $token
            . '&email=' . urlencode($notifiable->getEmailForVerification());
    }
}
