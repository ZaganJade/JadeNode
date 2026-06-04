<?php

namespace App\Policies;

use App\Models\User;
use App\Modules\Deployment\Models\Deployment;

class DeploymentPolicy
{
    /**
     * Determine whether the user can view the deployment.
     */
    public function view(User $user, Deployment $deployment): bool
    {
        return (int) $deployment->user_id === (int) $user->id;
    }

    /**
     * Determine whether the user can request an action on the deployment.
     */
    public function requestAction(User $user, Deployment $deployment): bool
    {
        return (int) $deployment->user_id === (int) $user->id
            && $deployment->status === 'active';
    }

    /**
     * Determine whether the user can cancel at period end.
     */
    public function cancelAtPeriodEnd(User $user, Deployment $deployment): bool
    {
        return (int) $deployment->user_id === (int) $user->id;
    }
}
