<?php

namespace App\Policies;

use App\Models\User;
use App\Modules\Support\Models\Ticket;

class TicketPolicy
{
    /**
     * Determine whether the user can view the ticket.
     */
    public function view(User $user, Ticket $ticket): bool
    {
        return (int) $ticket->user_id === (int) $user->id;
    }

    /**
     * Determine whether the user can reply to the ticket.
     */
    public function reply(User $user, Ticket $ticket): bool
    {
        return (int) $ticket->user_id === (int) $user->id;
    }

    /**
     * Determine whether the user can create a ticket.
     */
    public function create(User $user): bool
    {
        return true;
    }
}
