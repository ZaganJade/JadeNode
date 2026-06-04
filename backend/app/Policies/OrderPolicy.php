<?php

namespace App\Policies;

use App\Models\User;
use App\Modules\Order\Models\Order;

class OrderPolicy
{
    /**
     * Determine whether the user can view the order.
     */
    public function view(User $user, Order $order): bool
    {
        return (int) $order->user_id === (int) $user->id;
    }

    /**
     * Determine whether the user can create an order.
     */
    public function create(User $user): bool
    {
        return ! is_null($user->email_verified_at);
    }
}
