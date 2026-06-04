/**
 * @jadenode/api-client
 *
 * Re-exports the typed fetch client and base API types.
 */

export { ApiClient, ApiClientError, createApiClient } from "./client";
export type {
  ApiClientConfig,
  RequestInterceptor,
  ResponseInterceptor,
} from "./client";
export type {
  ApiResponse,
  PaginatedResponse,
  PaginationMeta,
  ApiError,
} from "./types";
