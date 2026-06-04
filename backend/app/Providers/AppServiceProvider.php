<?php

namespace App\Providers;

use App\Listeners\CreateProvisioningOnOrderPaid;
use App\Models\User;
use App\Modules\Deployment\Models\Deployment;
use App\Modules\Deployment\Models\SshKey;
use App\Modules\Order\Models\Order;
use App\Modules\Support\Models\Ticket;
use App\Policies\AdminPolicy;
use App\Policies\DeploymentPolicy;
use App\Policies\OrderPolicy;
use App\Policies\SshKeyPolicy;
use App\Policies\TicketPolicy;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Event::listen('order.paid', CreateProvisioningOnOrderPaid::class);

        // Register model policies
        Gate::policy(Order::class, OrderPolicy::class);
        Gate::policy(Deployment::class, DeploymentPolicy::class);
        Gate::policy(Ticket::class, TicketPolicy::class);
        Gate::policy(SshKey::class, SshKeyPolicy::class);

        // Register admin policy gates
        Gate::define('admin.access', [AdminPolicy::class, 'access']);
        Gate::define('admin.manage-listings', [AdminPolicy::class, 'manageListings']);
        Gate::define('admin.manage-beta-access', [AdminPolicy::class, 'manageBetaAccess']);
        Gate::define('admin.manage-provisioning', [AdminPolicy::class, 'manageProvisioning']);
        Gate::define('admin.manage-payments', [AdminPolicy::class, 'managePayments']);
        Gate::define('admin.manage-tickets', [AdminPolicy::class, 'manageTickets']);
    }
}
