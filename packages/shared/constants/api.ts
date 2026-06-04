/**
 * API route constants for the JadeNode marketplace.
 *
 * All endpoint paths are derived from the OpenAPI spec and organized
 * by domain: auth, marketplace, orders, deployments, admin, and support.
 */
export const API_ROUTES = {
  // ---- Auth ----------------------------------------------------------------
  auth: {
    register: "/auth/register",
    login: "/auth/login",
    logout: "/auth/logout",
    me: "/auth/me",
    verifyEmail: "/auth/verify-email",
    resendVerification: "/auth/resend-verification",
    forgotPassword: "/auth/forgot-password",
    resetPassword: "/auth/reset-password",
  },

  // ---- Marketplace (Product Listings) --------------------------------------
  marketplace: {
    listings: "/marketplace/listings",
    listingBySlug: (slug: string) => `/marketplace/listings/${slug}`,
    listingById: (id: string) => `/marketplace/listings/${id}`,
    categories: "/marketplace/categories",
    categoryBySlug: (slug: string) => `/marketplace/categories/${slug}`,
    compare: "/marketplace/compare",
    search: "/marketplace/search",
  },

  // ---- Orders --------------------------------------------------------------
  orders: {
    list: "/orders",
    create: "/orders",
    byId: (id: string) => `/orders/${id}`,
    cancel: (id: string) => `/orders/${id}/cancel`,
    items: (orderId: string) => `/orders/${orderId}/items`,
  },

  // ---- Invoices & Payments -------------------------------------------------
  billing: {
    invoices: "/billing/invoices",
    invoiceById: (id: string) => `/billing/invoices/${id}`,
    invoicePdf: (id: string) => `/billing/invoices/${id}/pdf`,
    payments: "/billing/payments",
    paymentById: (id: string) => `/billing/payments/${id}`,
    payInvoice: (invoiceId: string) => `/billing/invoices/${invoiceId}/pay`,
    wallet: "/billing/wallet",
    walletTopUp: "/billing/wallet/top-up",
    walletTransactions: "/billing/wallet/transactions",
  },

  // ---- Deployments ---------------------------------------------------------
  deployments: {
    list: "/deployments",
    byId: (id: string) => `/deployments/${id}`,
    action: (id: string, action: string) => `/deployments/${id}/actions/${action}`,
    credentials: (id: string) => `/deployments/${id}/credentials`,
    cancelAtPeriodEnd: (id: string) => `/deployments/${id}/cancel-at-period-end`,
  },

  // ---- Provisioning Tasks --------------------------------------------------
  provisioning: {
    tasks: "/provisioning/tasks",
    taskById: (id: string) => `/provisioning/tasks/${id}`,
  },

  // ---- Admin ---------------------------------------------------------------
  admin: {
    users: "/admin/users",
    userById: (id: string) => `/admin/users/${id}`,
    orders: "/admin/orders",
    orderById: (id: string) => `/admin/orders/${id}`,
    payments: "/admin/payments",
    paymentById: (id: string) => `/admin/payments/${id}`,
    syncPayment: (id: string) => `/admin/payments/${id}/sync`,
    listings: "/admin/listings",
    listingById: (id: string) => `/admin/listings/${id}`,
    providers: "/admin/providers",
    providerById: (id: string) => `/admin/providers/${id}`,
    provisioningTasks: "/admin/provisioning/tasks",
    provisioningTaskById: (id: string) => `/admin/provisioning/tasks/${id}`,
    betaAccessRequests: "/admin/beta-access",
    betaAccessAction: (id: string) => `/admin/beta-access/${id}`,
    webhookEvents: "/admin/webhooks/events",
  },

  // ---- Support -------------------------------------------------------------
  support: {
    tickets: "/support/tickets",
    ticketById: (id: string) => `/support/tickets/${id}`,
    ticketMessages: (id: string) => `/support/tickets/${id}/messages`,
  },
} as const;
