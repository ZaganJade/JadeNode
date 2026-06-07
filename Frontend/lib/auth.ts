/**
 * Auth utilities for JadeNode Marketplace.
 *
 * MVP uses cookie-based Web Session auth via Sanctum (credentials: include).
 */

import { api, ApiException } from "./api";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface User {
  id: number;
  public_id: string;
  name: string;
  email: string;
  email_verified_at: string | null;
  role: string;
  phone: string | null;
  country: string | null;
  timezone: string | null;
  created_at: string;
}

export interface Session {
  user: User | null;
  capabilities: string[];
  authenticated: boolean;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface UpdateProfileData {
  name?: string;
  phone?: string | null;
  country?: string | null;
  timezone?: string | null;
}

// ─── Auth API calls ─────────────────────────────────────────────────────────

/**
 * Register a new user account.
 */
export async function register(data: RegisterData): Promise<{ message: string; user: User }> {
  return api.post<{ message: string; user: User }>("/api/v1/auth/register", data);
}

/**
 * Log in with email and password.
 */
export async function login(
  email: string,
  password: string,
): Promise<{ message: string; user: User }> {
  return api.post<{ message: string; user: User }>("/api/v1/auth/login", {
    email,
    password,
  });
}

/**
 * Log out the current user.
 */
export async function logout(): Promise<void> {
  await api.post("/api/v1/auth/logout");
}

/**
 * Get the current authenticated user with capabilities.
 */
export async function getSession(): Promise<Session> {
  try {
    const res = await api.get<{ user: User; capabilities: string[] }>(
      "/api/v1/auth/user",
    );
    return {
      user: res.user,
      capabilities: res.capabilities,
      authenticated: true,
    };
  } catch (error) {
    if (error instanceof ApiException && error.status === 401) {
      return { user: null, capabilities: [], authenticated: false };
    }
    throw error;
  }
}

/**
 * Check whether the current user is authenticated.
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return session.authenticated;
}

/**
 * Require authentication — throw if not authenticated.
 */
export async function requireAuth(): Promise<Session> {
  const session = await getSession();
  if (!session.authenticated) {
    throw new Error("Authentication required");
  }
  return session;
}

/**
 * Get the current user's profile.
 */
export async function getProfile(): Promise<{ user: User }> {
  return api.get<{ user: User }>("/api/v1/profile");
}

/**
 * Update the current user's profile.
 */
export async function updateProfile(
  data: UpdateProfileData,
): Promise<{ message: string; user: User }> {
  return api.put<{ message: string; user: User }>("/api/v1/profile", data);
}

/**
 * Verify email with token and email from the verification link.
 */
export async function verifyEmail(
  token: string,
  email: string,
): Promise<{ message: string }> {
  return api.post<{ message: string }>("/api/v1/auth/email/verify", {
    token,
    email,
  });
}

/**
 * Resend email verification notification.
 */
export async function resendVerification(): Promise<{ message: string }> {
  return api.post<{ message: string }>("/api/v1/auth/email/resend");
}

// ─── Beta Access Types ────────────────────────────────────────────────────────

export interface BetaAccessRequestData {
  id: number;
  public_id: string;
  user: { name: string; email: string };
  status: "pending" | "approved" | "rejected";
  reason: string | null;
  admin_reason: string | null;
  reviewed_by: { name: string; email: string } | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface BetaAccessStatus {
  status: "none" | "pending" | "approved" | "rejected";
  request: BetaAccessRequestData | null;
}

export interface BetaAccessListResponse {
  data: BetaAccessRequestData[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

// ─── Beta Access API calls ──────────────────────────────────────────────────

/**
 * Submit a beta access request.
 */
export async function requestBetaAccess(
  reason?: string,
): Promise<{ message: string; request: BetaAccessRequestData }> {
  return api.post<{ message: string; request: BetaAccessRequestData }>(
    "/api/v1/beta-access/request",
    reason ? { reason } : undefined,
  );
}

/**
 * Get the current user's beta access status.
 */
export async function getBetaAccessStatus(): Promise<BetaAccessStatus> {
  return api.get<BetaAccessStatus>("/api/v1/beta-access/status");
}

/**
 * Admin: list beta access requests.
 */
export async function adminListBetaRequests(
  page?: number,
): Promise<BetaAccessListResponse> {
  return api.get<BetaAccessListResponse>("/api/v1/admin/beta-access", {
    params: page ? { page: String(page) } : undefined,
  });
}

/**
 * Admin: approve or reject a beta access request.
 */
export async function adminReviewBetaRequest(
  id: number,
  status: "approved" | "rejected",
  reason?: string,
): Promise<{ message: string; request: BetaAccessRequestData }> {
  return api.put<{ message: string; request: BetaAccessRequestData }>(
    `/api/v1/admin/beta-access/${id}`,
    {
      status,
      ...(status === "rejected" && reason ? { admin_reason: reason } : {}),
    },
  );
}

// ─── Admin Listing Types ──────────────────────────────────────────────────────

export interface AdminListingPrice {
  billing_cycle: string;
  price: number;
  currency: string;
  unit_label: string | null;
  is_default: boolean;
}

export interface AdminListingAudit {
  action: string;
  payload: Record<string, unknown> | null;
  changed_at: string;
  changed_by: { id: number; name: string } | null;
}

export interface AdminListingData {
  id: number;
  public_id: string;
  name: string;
  slug: string;
  description: string | null;
  region: string;
  resource_type: { slug: string; name: string } | null;
  specs: Record<string, string | number> | null;
  specs_summary?: string | null;
  image?: string | null;
  availability_status: string;
  provisioning_sla_hours: number;
  is_active: boolean;
  sort_order: number;
  provider: { public_id: string; name: string } | null;
  category: { public_id: string; slug: string; name: string } | null;
  prices: AdminListingPrice[];
  last_audit: AdminListingAudit | null;
  created_at: string;
  updated_at: string;
}

export interface AdminListingListResponse {
  data: AdminListingData[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

// ─── Admin Listing API calls ────────────────────────────────────────────────

/**
 * Admin: list all product listings.
 */
export async function adminListListings(
  params?: Record<string, string>,
): Promise<AdminListingListResponse> {
  return api.get<AdminListingListResponse>("/api/v1/admin/listings", {
    params,
  });
}

/**
 * Admin: update a product listing.
 */
export async function adminUpdateListing(
  id: number,
  data: {
    name?: string;
    description?: string | null;
    resource_type?: string;
    region?: string;
    display_priority?: number;
    specs?: Record<string, string | number>;
    availability_status?: string;
    provisioning_sla_hours?: number;
    is_active?: boolean;
    prices?: Array<{ billing_cycle: string; gross_price_minor: number }>;
  },
): Promise<{ message: string; data: AdminListingData }> {
  return api.put<{ message: string; data: AdminListingData }>(
    `/api/v1/admin/listings/${id}`,
    data,
  );
}

// ─── Listing form options + create/delete ─────────────────────────────────────

export interface ListingFormOptions {
  providers: Array<{ id: number; public_id: string; name: string }>;
  categories: Array<{ id: number; public_id: string; name: string; slug: string }>;
  resource_types: string[];
  regions: string[];
  availability_options: string[];
  billing_cycles: string[];
}

export interface CreateListingData {
  provider_id: number;
  category_id: number;
  name: string;
  slug: string;
  description?: string | null;
  resource_type: string;
  region: string;
  availability_status: string;
  provisioning_sla_hours: number;
  display_priority?: number;
  is_active?: boolean;
  specs?: Record<string, string | number>;
  prices: Array<{ billing_cycle: string; gross_price_minor: number }>;
}

/**
 * Admin: fetch the providers/categories/suggestions needed to build the
 * create/edit product form.
 */
export async function adminGetListingFormOptions(): Promise<ListingFormOptions> {
  return api.get<ListingFormOptions>("/api/v1/admin/listings/form-options");
}

/**
 * Admin: create a new product listing.
 */
export async function adminCreateListing(
  data: CreateListingData,
): Promise<{ message: string; data: AdminListingData }> {
  return api.post<{ message: string; data: AdminListingData }>(
    "/api/v1/admin/listings",
    data,
  );
}

/**
 * Admin: delete (soft) a product listing.
 */
export async function adminDeleteListing(
  id: number,
): Promise<{ message: string }> {
  return api.delete<{ message: string }>(`/api/v1/admin/listings/${id}`);
}
