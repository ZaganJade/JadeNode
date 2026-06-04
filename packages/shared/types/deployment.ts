/**
 * Deployment-related types for the JadeNode marketplace.
 */

/** Current status of a Deployment. */
export type DeploymentStatus =
  | "pending_provisioning"
  | "provisioning"
  | "active"
  | "stopped"
  | "rebuilding"
  | "grace_period"
  | "suspended"
  | "expired"
  | "failed"
  | "deleted";

/** Provisioning task status. */
export type ProvisioningTaskStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "overdue"
  | "failed";

/** A provisioned or pending customer-owned resource. */
export interface Deployment {
  id: string;
  publicId: string;
  orderId: string;
  customerId: string;
  providerId: string;
  productListingId: string;
  name: string;
  resourceType: string;
  status: DeploymentStatus;
  region: string;
  ipAddress?: string;
  billingCycle: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd: boolean;
  accessCredential?: string;
  sshKeyIds?: string[];
  createdAt: string;
  updatedAt: string;
}

/** Operational work item to create or activate a Deployment. */
export interface ProvisioningTask {
  id: string;
  publicId: string;
  deploymentId: string;
  orderId: string;
  providerId: string;
  status: ProvisioningTaskStatus;
  provisioningSLAHours: number;
  slaDeadline: string;
  startedAt?: string;
  completedAt?: string;
  failureReason?: string;
  createdAt: string;
  updatedAt: string;
}
