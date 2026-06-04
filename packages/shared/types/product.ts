/**
 * Product-related types for the JadeNode marketplace.
 */

/** Resource categories available in the marketplace. */
export type ResourceType =
  | "vps"
  | "dedicated_server"
  | "backup_plan"
  | "public_ip";

/** Billing periods offered for a Product Listing. */
export type BillingCycle = "monthly" | "yearly" | "hourly";

/** Provisioning mode for a Product Listing. */
export type ProvisioningMode = "manual" | "automated";

/** Pricing information for a specific billing cycle. */
export interface ProductPrice {
  billingCycle: BillingCycle;
  amount: number;
  currency: string;
  setupFee?: number;
}

/** Technical specification of a Product Listing. */
export interface ProductSpec {
  cpu: number;
  ramGB: number;
  diskGB: number;
  bandwidthTB?: number;
  additionalSpecs?: Record<string, string | number>;
}

/** Category grouping for Product Listings. */
export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  resourceType: ResourceType;
  description?: string;
}

/** A Provider's marketplace offer for a specific resource. */
export interface ProductListing {
  id: string;
  publicId: string;
  providerId: string;
  resourceType: ResourceType;
  category: ProductCategory;
  name: string;
  slug: string;
  description: string;
  specs: ProductSpec;
  prices: ProductPrice[];
  region: string;
  provisioningMode: ProvisioningMode;
  provisioningSLAHours: number;
  available: boolean;
  displayStatus: string;
  trustIndicators: string[];
  createdAt: string;
  updatedAt: string;
}
