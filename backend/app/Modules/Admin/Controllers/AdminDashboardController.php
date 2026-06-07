<?php

namespace App\Modules\Admin\Controllers;

use App\Models\User;
use App\Modules\Marketplace\Models\ResourceProduct;
use App\Modules\Provider\Models\Provider;
use App\Models\AdminAuditLog;
use App\Modules\Auth\Models\BetaAccessRequest;
use App\Modules\Order\Models\Order;
use App\Modules\Order\Models\Payment;
use App\Modules\Support\Models\Ticket;
use App\Modules\Deployment\Models\Deployment;
use App\Modules\Deployment\Models\ProvisioningTask;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminDashboardController
{
    /**
     * Get admin dashboard statistics.
     */
    public function stats(Request $request): JsonResponse
    {
        // User stats
        $totalUsers = User::count();
        $adminCount = User::where('role', 'admin')->count();
        $verifiedUsers = User::whereNotNull('email_verified_at')->count();
        $newUsersThisMonth = User::where('created_at', '>=', now()->startOfMonth())->count();

        // Provider stats
        $totalProviders = Provider::count();
        $activeProviders = Provider::where('status', 'active')->count();
        $verifiedProviders = Provider::where('verification_status', 'verified')->count();

        // Listing stats
        $totalListings = ResourceProduct::count();
        $activeListings = ResourceProduct::where('is_active', true)->count();

        // Order stats
        $totalOrders = Order::count();
        $ordersThisMonth = Order::where('created_at', '>=', now()->startOfMonth())->count();
        $ordersPaid = Order::where('status', 'paid')->count();
        $ordersPendingPayment = Order::where('status', 'pending_payment')->count();
        $ordersCompleted = Order::where('status', 'completed')->count();
        $ordersCancelled = Order::where('status', 'cancelled')->count();

        // Revenue stats — amount_minor is in sen (1/100 IDR). Paid payments only.
        $revenueTotalMinor = (int) Payment::where('status', 'paid')->sum('amount_minor');
        $revenueThisMonthMinor = (int) Payment::where('status', 'paid')
            ->where('paid_at', '>=', now()->startOfMonth())
            ->sum('amount_minor');
        $revenuePendingMinor = (int) Payment::where('status', 'pending')->sum('amount_minor');

        // Payment status distribution
        $totalPayments = Payment::count();
        $paymentsPaid = Payment::where('status', 'paid')->count();
        $paymentsPending = Payment::where('status', 'pending')->count();
        $paymentsFailed = Payment::where('status', 'failed')->count();
        $paymentsExpired = Payment::where('status', 'expired')->count();
        $paymentsCancelled = Payment::where('status', 'cancelled')->count();

        // Deployment stats
        $totalDeployments = Deployment::count();
        $activeDeployments = Deployment::where('status', 'active')->count();
        $deploymentsPendingProvisioning = Deployment::where('status', 'pending_provisioning')->count();
        $deploymentsSuspended = Deployment::where('status', 'suspended')->count();
        $deploymentsExpired = Deployment::where('status', 'expired')->count();
        $deploymentsCancelled = Deployment::where('status', 'cancelled')->count();

        // Provisioning pipeline stats
        $totalProvisioning = ProvisioningTask::count();
        $provisioningPending = ProvisioningTask::where('status', 'pending')->count();
        $provisioningInProgress = ProvisioningTask::where('status', 'in_progress')->count();
        $provisioningCompleted = ProvisioningTask::where('status', 'completed')->count();
        $provisioningFailed = ProvisioningTask::where('status', 'failed')->count();
        $provisioningOverdue = ProvisioningTask::whereIn('status', ['pending', 'in_progress'])
            ->whereNotNull('overdue_at')
            ->where('overdue_at', '<', now())
            ->count();

        // Ticket stats
        $openTickets = Ticket::where('status', 'open')->count();
        $inProgressTickets = Ticket::where('status', 'in_progress')->count();
        $resolvedTickets = Ticket::where('status', 'resolved')->count();
        $closedTickets = Ticket::where('status', 'closed')->count();
        $totalTickets = Ticket::count();

        // Beta access requests
        $pendingBetaRequests = BetaAccessRequest::where('status', 'pending')->count();

        // Recent audit logs
        $recentAuditLogs = AdminAuditLog::with('user:id,name,email')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(fn ($log) => [
                'id' => $log->id,
                'action' => $log->action,
                'subject_type' => class_basename($log->subject_type),
                'payload' => $log->payload,
                'user' => $log->user ? ['name' => $log->user->name, 'email' => $log->user->email] : null,
                'created_at' => $log->created_at?->toIso8601String(),
            ]);

        // New users per day for last 30 days
        $usersPerDay = User::select(DB::raw('DATE(created_at) as date'), DB::raw('COUNT(*) as count'))
            ->where('created_at', '>=', now()->subDays(30))
            ->groupBy(DB::raw('DATE(created_at)'))
            ->orderBy('date')
            ->get();

        // Revenue per day for last 30 days (paid payments, in minor units)
        $revenuePerDay = Payment::select(
                DB::raw('DATE(paid_at) as date'),
                DB::raw('SUM(amount_minor) as total_minor')
            )
            ->where('status', 'paid')
            ->whereNotNull('paid_at')
            ->where('paid_at', '>=', now()->subDays(30))
            ->groupBy(DB::raw('DATE(paid_at)'))
            ->orderBy('date')
            ->get()
            ->map(fn ($row) => [
                'date' => $row->date,
                'total_minor' => (int) $row->total_minor,
            ]);

        return response()->json([
            'users' => [
                'total' => $totalUsers,
                'admins' => $adminCount,
                'verified' => $verifiedUsers,
                'new_this_month' => $newUsersThisMonth,
            ],
            'providers' => [
                'total' => $totalProviders,
                'active' => $activeProviders,
                'verified' => $verifiedProviders,
            ],
            'listings' => [
                'total' => $totalListings,
                'active' => $activeListings,
            ],
            'orders' => [
                'total' => $totalOrders,
                'this_month' => $ordersThisMonth,
                'paid' => $ordersPaid,
                'pending_payment' => $ordersPendingPayment,
                'completed' => $ordersCompleted,
                'cancelled' => $ordersCancelled,
            ],
            'revenue' => [
                'currency' => 'IDR',
                'total_minor' => $revenueTotalMinor,
                'this_month_minor' => $revenueThisMonthMinor,
                'pending_minor' => $revenuePendingMinor,
            ],
            'payments' => [
                'total' => $totalPayments,
                'paid' => $paymentsPaid,
                'pending' => $paymentsPending,
                'failed' => $paymentsFailed,
                'expired' => $paymentsExpired,
                'cancelled' => $paymentsCancelled,
            ],
            'deployments' => [
                'total' => $totalDeployments,
                'active' => $activeDeployments,
                'pending_provisioning' => $deploymentsPendingProvisioning,
                'suspended' => $deploymentsSuspended,
                'expired' => $deploymentsExpired,
                'cancelled' => $deploymentsCancelled,
            ],
            'provisioning' => [
                'total' => $totalProvisioning,
                'pending' => $provisioningPending,
                'in_progress' => $provisioningInProgress,
                'completed' => $provisioningCompleted,
                'failed' => $provisioningFailed,
                'overdue' => $provisioningOverdue,
            ],
            'tickets' => [
                'total' => $totalTickets,
                'open' => $openTickets,
                'in_progress' => $inProgressTickets,
                'resolved' => $resolvedTickets,
                'closed' => $closedTickets,
            ],
            'beta_requests' => [
                'pending' => $pendingBetaRequests,
            ],
            'recent_activity' => $recentAuditLogs,
            'users_per_day' => $usersPerDay,
            'revenue_per_day' => $revenuePerDay,
        ]);
    }
}
