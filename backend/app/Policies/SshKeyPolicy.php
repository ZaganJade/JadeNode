<?php

namespace App\Policies;

use App\Models\User;
use App\Modules\Deployment\Models\SshKey;

class SshKeyPolicy
{
    /**
     * Determine whether the user can view the SSH key.
     */
    public function view(User $user, SshKey $sshKey): bool
    {
        return (int) $sshKey->user_id === (int) $user->id;
    }

    /**
     * Determine whether the user can delete the SSH key.
     */
    public function delete(User $user, SshKey $sshKey): bool
    {
        return (int) $sshKey->user_id === (int) $user->id;
    }
}
