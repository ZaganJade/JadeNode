<?php

namespace App\Policies;

use App\Models\User;

class AdminPolicy
{
    /**
     * Determine whether the user can access the admin area.
     */
    public function access(User $user): bool
    {
        return in_array($user->role, ['admin', 'super_admin']);
    }

    /**
     * Determine whether the user can manage product listings.
     */
    public function manageListings(User $user): bool
    {
        return $user->role === 'admin';
    }

    /**
     * Determine whether the user can manage beta access.
     */
    public function manageBetaAccess(User $user): bool
    {
        return $user->role === 'admin';
    }

    /**
     * Determine whether the user can manage provisioning.
     */
    public function manageProvisioning(User $user): bool
    {
        return $user->role === 'admin';
    }

    /**
     * Determine whether the user can manage payments.
     */
    public function managePayments(User $user): bool
    {
        return $user->role === 'admin';
    }

    /**
     * Determine whether the user can manage tickets.
     */
    public function manageTickets(User $user): bool
    {
        return in_array($user->role, ['admin', 'support']);
    }
}
