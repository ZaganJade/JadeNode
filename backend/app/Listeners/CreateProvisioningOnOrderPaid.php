<?php

namespace App\Listeners;

use App\Modules\Deployment\Services\DeploymentService;
use App\Modules\Order\Models\Order;
use Illuminate\Support\Facades\Log;

class CreateProvisioningOnOrderPaid
{
    /**
     * Handle the order.paid event.
     *
     * Creates a Deployment and ProvisioningTask when an order is paid.
     */
    public function handle(Order $order): void
    {
        Log::info('CreateProvisioningOnOrderPaid listener fired.', [
            'order_id' => $order->id,
        ]);

        $service = new DeploymentService();
        $service->createFromPaidOrder($order);
    }
}
