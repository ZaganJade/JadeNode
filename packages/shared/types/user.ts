/**
 * User-related types for the JadeNode marketplace.
 */

/** Roles a User can hold in the marketplace. */
export type UserRole =
  | "customer"
  | "provider_member"
  | "provider_owner"
  | "admin"
  | "finance_admin"
  | "support_admin"
  | "super_admin";

/** Core user identity. */
export interface User {
  id: string;
  publicId: string;
  email: string;
  displayName: string;
  roles: UserRole[];
  emailVerified: boolean;
  betaAccess: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Extended profile information for a User. */
export interface UserProfile {
  userId: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
  language: string;
  timezone: string;
}
