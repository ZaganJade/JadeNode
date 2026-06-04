/**
 * Base API response types used across the JadeNode marketplace.
 */

/** Standard API envelope wrapping every successful response. */
export interface ApiResponse<T> {
  success: true;
  data: T;
  message?: string;
}

/** Paginated list response with metadata. */
export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: PaginationMeta;
}

/** Metadata describing the current page of a paginated result set. */
export interface PaginationMeta {
  page: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/** Structured error returned by the API on failure. */
export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  statusCode: number;
}
