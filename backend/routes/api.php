<?php

use App\Http\Controllers\HealthController;
use App\Http\Middleware\EnsureBetaAccess;
use App\Http\Middleware\EnsureEmailIsVerified;
use App\Http\Middleware\EnsureIsAdmin;
use App\Modules\Admin\Controllers\AdminBetaAccessController;
use App\Modules\Admin\Controllers\AdminListingController;
use App\Modules\Admin\Controllers\AdminTicketController;
use App\Modules\Auth\Controllers\AuthenticatedUserController;
use App\Modules\Auth\Controllers\BetaAccessController;
use App\Modules\Auth\Controllers\EmailVerificationController;
use App\Modules\Auth\Controllers\LoginController;
use App\Modules\Auth\Controllers\ProfileController;
use App\Modules\Auth\Controllers\RegisterController;
use App\Modules\Marketplace\Controllers\MarketplaceController;
use App\Modules\Marketplace\Controllers\SimilarProductsController;
use App\Modules\Deployment\Controllers\DeploymentController;
use App\Modules\Deployment\Controllers\ProvisioningController;
use App\Modules\Deployment\Controllers\ResourceActionController;
use App\Modules\Deployment\Controllers\SshKeyController;
use App\Modules\Order\Controllers\AdminPaymentListController;
use App\Modules\Order\Controllers\AdminPaymentSyncController;
use App\Modules\Order\Controllers\CheckoutController;
use App\Modules\Order\Controllers\MidtransWebhookController;
use App\Modules\Order\Controllers\PaymentController;
use App\Modules\Audit\Controllers\AdminAuditController;
use App\Modules\Support\Controllers\TicketController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the provided bootstrap/app.php file and all of
| them will be assigned the "api" middleware group.
|
*/

// Health Check
Route::get('/v1/health', HealthController::class);
Route::get('/v1/ready', [HealthController::class, 'ready']);

// Auth — Public
Route::prefix('v1/auth')->group(function () {
    Route::post('/register', [RegisterController::class, 'register']);
    Route::post('/login', [LoginController::class, 'login']);
});

// Auth — Authenticated
Route::prefix('v1/auth')->middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [LoginController::class, 'logout']);
    Route::get('/user', [AuthenticatedUserController::class, 'show']);
    Route::post('/email/resend', [EmailVerificationController::class, 'send']);
    Route::post('/email/verify', [EmailVerificationController::class, 'verify']);
});

// Profile — Authenticated
Route::prefix('v1/profile')->middleware('auth:sanctum')->group(function () {
    Route::get('/', [ProfileController::class, 'show']);
    Route::put('/', [ProfileController::class, 'update']);
});

// Marketplace — Public
Route::prefix('v1/marketplace')->group(function () {
    Route::get('/listings', [MarketplaceController::class, 'index']);
    Route::get('/listings/{slug}', [MarketplaceController::class, 'show']);
    Route::get('/listings/{productSlug}/similar', [SimilarProductsController::class, 'index']);
});

// Beta Access — Authenticated
Route::prefix('v1/beta-access')->middleware('auth:sanctum')->group(function () {
    Route::post('/request', [BetaAccessController::class, 'request'])->middleware(EnsureEmailIsVerified::class);
    Route::get('/status', [BetaAccessController::class, 'status']);
});

// Orders — Authenticated + Verified + Beta Access
Route::prefix('v1/orders')->middleware(['auth:sanctum', EnsureEmailIsVerified::class, EnsureBetaAccess::class])->group(function () {
    Route::post('/', [CheckoutController::class, 'store']);
    Route::post('/{orderId}/pay', [PaymentController::class, 'create']);
});

// Orders — Authenticated (view own orders)
Route::prefix('v1/orders')->middleware('auth:sanctum')->group(function () {
    Route::get('/', [CheckoutController::class, 'index']);
    Route::get('/{id}', [CheckoutController::class, 'show']);
});

// Payments — Authenticated
Route::prefix('v1/payments')->middleware('auth:sanctum')->group(function () {
    Route::get('/{paymentId}', [PaymentController::class, 'status']);
});

// Webhooks — Public (no auth)
Route::prefix('v1/webhooks')->group(function () {
    Route::post('/midtrans', [MidtransWebhookController::class, 'handle']);
});

// Support Tickets — Authenticated
Route::prefix('v1/tickets')->middleware('auth:sanctum')->group(function () {
    Route::post('/', [TicketController::class, 'store']);
    Route::get('/', [TicketController::class, 'index']);
    Route::get('/{id}', [TicketController::class, 'show']);
    Route::post('/{id}/reply', [TicketController::class, 'reply']);
});

// Admin — Authenticated + Admin only
Route::prefix('v1/admin')->middleware(['auth:sanctum', EnsureIsAdmin::class])->group(function () {
    Route::get('/beta-access', [AdminBetaAccessController::class, 'index']);
    Route::put('/beta-access/{id}', [AdminBetaAccessController::class, 'review']);

    Route::get('/listings', [AdminListingController::class, 'index']);
    Route::put('/listings/{id}', [AdminListingController::class, 'update']);

    Route::get('/payments', [AdminPaymentListController::class, 'index']);
    Route::post('/payments/{paymentId}/sync', [AdminPaymentSyncController::class, 'sync']);

    Route::get('/tickets', [AdminTicketController::class, 'index']);
    Route::get('/tickets/{id}', [AdminTicketController::class, 'show']);
    Route::post('/tickets/{id}/reply', [AdminTicketController::class, 'reply']);
    Route::put('/tickets/{id}/status', [AdminTicketController::class, 'updateStatus']);

    // Provisioning — Admin
    Route::get('/provisioning-tasks', [ProvisioningController::class, 'index']);
    Route::post('/provisioning-tasks/{taskId}/start', [ProvisioningController::class, 'start']);
    Route::post('/provisioning-tasks/{taskId}/complete', [ProvisioningController::class, 'complete']);
    Route::post('/provisioning-tasks/{taskId}/fail', [ProvisioningController::class, 'fail']);

    // Resource Actions — Admin processing
    Route::post('/resource-actions/{actionId}/process', [ResourceActionController::class, 'process']);

    // Audit Logs — Admin
    Route::get('/audit-logs', [AdminAuditController::class, 'index']);
    Route::get('/audit-logs/{id}', [AdminAuditController::class, 'show']);
});

// Deployments — Authenticated (customer)
Route::prefix('v1/deployments')->middleware('auth:sanctum')->group(function () {
    Route::get('/', [DeploymentController::class, 'index']);
    Route::get('/{id}', [DeploymentController::class, 'show']);
    Route::post('/{id}/action', [DeploymentController::class, 'requestAction']);
    Route::post('/{id}/cancel-at-period-end', [DeploymentController::class, 'cancelAtPeriodEnd']);
});

// SSH Keys — Authenticated
Route::prefix('v1/ssh-keys')->middleware('auth:sanctum')->group(function () {
    Route::get('/', [SshKeyController::class, 'index']);
    Route::post('/', [SshKeyController::class, 'store']);
    Route::delete('/{id}', [SshKeyController::class, 'destroy']);
});

// Resource Actions (per deployment) — Authenticated
Route::prefix('v1/deployments/{deploymentId}/actions')->middleware('auth:sanctum')->group(function () {
    Route::get('/', [ResourceActionController::class, 'index']);
});
