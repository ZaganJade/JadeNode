<?php

use App\Http\Controllers\HealthController;
use App\Http\Middleware\EnsureBetaAccess;
use App\Http\Middleware\EnsureEmailIsVerified;
use App\Http\Middleware\EnsureIsAdmin;
use App\Modules\Admin\Controllers\AdminBetaAccessController;
use App\Modules\Admin\Controllers\AdminDashboardController;
use App\Modules\Admin\Controllers\AdminListingController;
use App\Modules\Admin\Controllers\AdminProviderController;
use App\Modules\Admin\Controllers\AdminTicketController;
use App\Modules\Admin\Controllers\AdminUserController;
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
use App\Modules\Order\Controllers\InvoiceController;
use App\Modules\Order\Controllers\AdminPaymentListController;
use App\Modules\Order\Controllers\AdminPaymentSyncController;
use App\Modules\Order\Controllers\CartCheckoutController;
use App\Modules\Order\Controllers\CheckoutController;
use App\Modules\Order\Controllers\MidtransWebhookController;
use App\Modules\Order\Controllers\PaymentController;
use App\Modules\Article\Controllers\ArticleController;
use App\Modules\Article\Controllers\AdminArticleController;
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
// Login & logout need the `web` middleware so the session store is available
// (Auth::attempt + session()->regenerate() both require an active session).
Route::prefix('v1/auth')->middleware('web')->group(function () {
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

// Cart checkout — Authenticated + Verified + Beta Access (multi-item)
Route::prefix('v1/cart')->middleware(['auth:sanctum', EnsureEmailIsVerified::class, EnsureBetaAccess::class])->group(function () {
    Route::post('/checkout', [CartCheckoutController::class, 'store']);
});

// Orders — Authenticated (view own orders)
Route::prefix('v1/orders')->middleware('auth:sanctum')->group(function () {
    Route::get('/', [CheckoutController::class, 'index']);
    Route::get('/{public_id}', [CheckoutController::class, 'show']);
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
    Route::get('/stats', [AdminDashboardController::class, 'stats']);

    Route::get('/beta-access', [AdminBetaAccessController::class, 'index']);
    Route::put('/beta-access/{id}', [AdminBetaAccessController::class, 'review']);

    Route::get('/listings', [AdminListingController::class, 'index']);
    Route::get('/listings/form-options', [AdminListingController::class, 'formOptions']);
    Route::post('/listings', [AdminListingController::class, 'store']);
    Route::put('/listings/{id}', [AdminListingController::class, 'update']);
    Route::delete('/listings/{id}', [AdminListingController::class, 'destroy']);

    Route::get('/providers', [AdminProviderController::class, 'index']);

    Route::get('/payments', [AdminPaymentListController::class, 'index']);
    Route::post('/payments/{paymentId}/sync', [AdminPaymentSyncController::class, 'sync']);

    Route::get('/tickets', [AdminTicketController::class, 'index']);
    Route::get('/tickets/{public_id}', [AdminTicketController::class, 'show']);
    Route::post('/tickets/{public_id}/reply', [AdminTicketController::class, 'reply']);
    Route::put('/tickets/{public_id}/status', [AdminTicketController::class, 'updateStatus']);

    // Provisioning — Admin
    Route::get('/provisioning-tasks', [ProvisioningController::class, 'index']);
    Route::post('/provisioning-tasks/{taskId}/start', [ProvisioningController::class, 'start']);
    Route::post('/provisioning-tasks/{taskId}/complete', [ProvisioningController::class, 'complete']);
    Route::post('/provisioning-tasks/{taskId}/fail', [ProvisioningController::class, 'fail']);

    // Resource Actions — Admin
    Route::get('/resource-actions', [ResourceActionController::class, 'adminIndex']);
    Route::post('/resource-actions/{actionId}/process', [ResourceActionController::class, 'process']);

    // Users — Admin
    Route::get('/users', [AdminUserController::class, 'index']);
    Route::post('/users', [AdminUserController::class, 'store']);
    Route::get('/users/{id}', [AdminUserController::class, 'show']);
    Route::put('/users/{id}', [AdminUserController::class, 'update']);
    Route::delete('/users/{id}', [AdminUserController::class, 'destroy']);
    Route::post('/users/{id}/restore', [AdminUserController::class, 'restore']);
    Route::post('/users/{id}/verify-email', [AdminUserController::class, 'verifyEmail']);

    // Audit Logs — Admin
    Route::get('/audit-logs', [AdminAuditController::class, 'index']);
    Route::get('/audit-logs/{id}', [AdminAuditController::class, 'show']);

    // Articles — Admin
    Route::get('/articles', [AdminArticleController::class, 'index']);
    Route::post('/articles', [AdminArticleController::class, 'store']);
    Route::get('/articles/archive', [AdminArticleController::class, 'archived']);
    Route::get('/articles/{id}', [AdminArticleController::class, 'show']);
    Route::put('/articles/{id}', [AdminArticleController::class, 'update']);
    Route::delete('/articles/{id}', [AdminArticleController::class, 'destroy']);
    Route::put('/articles/{id}/archive', [AdminArticleController::class, 'archive']);
    Route::put('/articles/{id}/unarchive', [AdminArticleController::class, 'unarchive']);
});

// Deployments — Authenticated (customer)
Route::prefix('v1/deployments')->middleware('auth:sanctum')->group(function () {
    Route::get('/', [DeploymentController::class, 'index']);
    Route::get('/{public_id}', [DeploymentController::class, 'show']);
    Route::post('/{public_id}/action', [DeploymentController::class, 'requestAction']);
    Route::post('/{public_id}/cancel-at-period-end', [DeploymentController::class, 'cancelAtPeriodEnd']);
    Route::get('/{public_id}/credential', [DeploymentController::class, 'credential']);
    Route::get('/{public_id}/ssh-keys', [DeploymentController::class, 'sshKeys']);
});

// Articles — Public
Route::prefix('v1/articles')->group(function () {
    Route::get('/', [ArticleController::class, 'index']);
    Route::get('/categories', [ArticleController::class, 'categories']);
    Route::get('/{slug}', [ArticleController::class, 'show']);
});

// Invoices — Authenticated
Route::prefix('v1/invoices')->middleware('auth:sanctum')->group(function () {
    Route::get('/', [InvoiceController::class, 'index']);
    Route::get('/{public_id}', [InvoiceController::class, 'show']);
    Route::post('/{public_id}/pay', [InvoiceController::class, 'pay']);
});

// SSH Keys — Authenticated
Route::prefix('v1/ssh-keys')->middleware('auth:sanctum')->group(function () {
    Route::get('/', [SshKeyController::class, 'index']);
    Route::post('/', [SshKeyController::class, 'store']);
    Route::delete('/{id}', [SshKeyController::class, 'destroy']);
});

// Resource Actions (per deployment) — Authenticated
Route::prefix('v1/deployments/{public_id}/actions')->middleware('auth:sanctum')->group(function () {
    Route::get('/', [ResourceActionController::class, 'index']);
});
