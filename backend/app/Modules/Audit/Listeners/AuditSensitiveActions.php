<?php

namespace App\Modules\Audit\Listeners;

use App\Modules\Audit\Services\AuditService;

class AuditSensitiveActions
{
    /**
     * Handle beta access decision events.
     */
    public function handleBetaAccessDecision(string $decision, int $userId, int $targetId, array $metadata = []): void
    {
        AuditService::audit(
            "beta_access.{$decision}",
            'beta_access_request',
            (string) $targetId,
            array_merge(['user_id' => $userId], $metadata),
        );
    }

    /**
     * Handle listing update events.
     */
    public function handleListingUpdate(int $listingId, array $changes, array $metadata = []): void
    {
        AuditService::audit(
            'listing.updated',
            'product_listing',
            (string) $listingId,
            array_merge(['changes' => $changes], $metadata),
        );
    }

    /**
     * Handle payment sync events.
     */
    public function handlePaymentSync(string $paymentId, string $status, array $metadata = []): void
    {
        AuditService::audit(
            "payment.synced.{$status}",
            'payment',
            $paymentId,
            $metadata,
        );
    }

    /**
     * Handle provisioning transition events.
     */
    public function handleProvisioningTransition(int $taskId, string $from, string $to, array $metadata = []): void
    {
        AuditService::audit(
            "provisioning.{$to}",
            'provisioning_task',
            (string) $taskId,
            array_merge(['from' => $from, 'to' => $to], $metadata),
        );
    }

    /**
     * Handle credential reveal events.
     */
    public function handleCredentialReveal(int $deploymentId, array $metadata = []): void
    {
        AuditService::audit(
            'credential.revealed',
            'deployment',
            (string) $deploymentId,
            $metadata,
        );
    }

    /**
     * Handle resource action processed events.
     */
    public function handleResourceActionProcessed(int $actionId, string $actionType, int $deploymentId, array $metadata = []): void
    {
        AuditService::audit(
            "resource_action.{$actionType}",
            'resource_action',
            (string) $actionId,
            array_merge(['deployment_id' => $deploymentId], $metadata),
        );
    }
}
