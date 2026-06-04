/**
 * Status enums for the JadeNode marketplace.
 *
 * These string-union constants are used across the frontend, backend,
 * and shared packages to maintain consistent status values.
 */

// ---- Order -----------------------------------------------------------------

export const OrderStatus = {
  PENDING_PAYMENT: "pending_payment",
  PAID: "paid",
  PROCESSING: "processing",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  REFUNDED: "refunded",
} as const;

export type OrderStatusType = (typeof OrderStatus)[keyof typeof OrderStatus];

// ---- Payment ----------------------------------------------------------------

export const PaymentStatus = {
  PENDING: "pending",
  REVIEW: "review",
  APPROVED: "approved",
  REJECTED: "rejected",
  FAILED: "failed",
  REFUNDED: "refunded",
  EXPIRED: "expired",
} as const;

export type PaymentStatusType = (typeof PaymentStatus)[keyof typeof PaymentStatus];

// ---- Invoice ----------------------------------------------------------------

export const InvoiceStatus = {
  DRAFT: "draft",
  PENDING: "pending",
  PAID: "paid",
  VOID: "void",
  REFUNDED: "refunded",
} as const;

export type InvoiceStatusType = (typeof InvoiceStatus)[keyof typeof InvoiceStatus];

// ---- Deployment -------------------------------------------------------------

export const DeploymentStatusEnum = {
  PENDING_PROVISIONING: "pending_provisioning",
  PROVISIONING: "provisioning",
  ACTIVE: "active",
  STOPPED: "stopped",
  REBUILDING: "rebuilding",
  GRACE_PERIOD: "grace_period",
  SUSPENDED: "suspended",
  EXPIRED: "expired",
  FAILED: "failed",
  DELETED: "deleted",
} as const;

export type DeploymentStatusEnumType =
  (typeof DeploymentStatusEnum)[keyof typeof DeploymentStatusEnum];

// ---- Provisioning -----------------------------------------------------------

export const ProvisioningStatus = {
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  OVERDUE: "overdue",
  FAILED: "failed",
} as const;

export type ProvisioningStatusType =
  (typeof ProvisioningStatus)[keyof typeof ProvisioningStatus];

// ---- Support Ticket ---------------------------------------------------------

export const TicketStatus = {
  OPEN: "open",
  IN_PROGRESS: "in_progress",
  WAITING_CUSTOMER: "waiting_customer",
  ESCALATED: "escalated",
  RESOLVED: "resolved",
  CLOSED: "closed",
} as const;

export type TicketStatusType = (typeof TicketStatus)[keyof typeof TicketStatus];

// ---- Beta Access ------------------------------------------------------------

export const BetaAccessStatus = {
  NONE: "none",
  REQUESTED: "requested",
  APPROVED: "approved",
  REJECTED: "rejected",
} as const;

export type BetaAccessStatusType =
  (typeof BetaAccessStatus)[keyof typeof BetaAccessStatus];
