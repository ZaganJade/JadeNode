/**
 * Application-level configuration constants for the JadeNode marketplace.
 */

/** Human-readable application name. */
export const APP_NAME = "JadeNode" as const;

/** Default currency used for prices, invoices, and payments. */
export const DEFAULT_CURRENCY = "IDR" as const;

/** Supported billing cycles for Product Listings. */
export const BILLING_CYCLES = ["monthly", "yearly", "hourly"] as const;

/** Grace period duration in hours for metered billing insufficient balance. */
export const METERED_GRACE_PERIOD_HOURS = 1;

/** Grace period duration in days for unpaid recurring renewal. */
export const RECURRING_GRACE_PERIOD_DAYS = 3;

/** Provider earning holdback period in days after Deployment activation. */
export const HOLDBACK_PERIOD_DAYS = 3;

/** Provisioning overdue escalation buffer in hours before auto-refund. */
export const PROVISIONING_OVERDUE_BUFFER_HOURS = 12;
