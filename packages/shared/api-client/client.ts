/**
 * Typed fetch wrapper for the JadeNode API.
 *
 * Provides a thin abstraction over the native Fetch API with:
 * - Configurable base URL
 * - JSON request/response handling
 * - Request and response interceptor hooks
 * - Structured error handling via ApiError
 * - Convenience methods: get, post, put, patch, del
 */

import type { ApiResponse, PaginatedResponse, ApiError } from "./types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Configuration options for creating an ApiClient instance. */
export interface ApiClientConfig {
  /** Base URL for all requests (e.g. "https://api.jadenode.com/v1"). */
  baseURL: string;
  /** Default headers applied to every request. */
  defaultHeaders?: Record<string, string>;
  /** Request timeout in milliseconds. Defaults to 30 000 ms. */
  timeout?: number;
}

/** A function that can inspect or modify a request before it is sent. */
export type RequestInterceptor = (
  url: string,
  init: RequestInit,
) => Promise<{ url: string; init: RequestInit }> | { url: string; init: RequestInit };

/** A function that can inspect or transform a raw Response before parsing. */
export type ResponseInterceptor = (
  response: Response,
  requestInit: RequestInit,
) => Promise<Response> | Response;

/** Generic error thrown when the API returns a non-success response. */
export class ApiClientError extends Error {
  public readonly error: ApiError;
  constructor(error: ApiError) {
    super(error.error.message);
    this.name = "ApiClientError";
    this.error = error;
  }
}

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

export class ApiClient {
  private readonly baseURL: string;
  private readonly defaultHeaders: Record<string, string>;
  private readonly timeout: number;
  private readonly requestInterceptors: RequestInterceptor[] = [];
  private readonly responseInterceptors: ResponseInterceptor[] = [];

  constructor(config: ApiClientConfig) {
    this.baseURL = config.baseURL.replace(/\/+$/, "");
    this.defaultHeaders = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...config.defaultHeaders,
    };
    this.timeout = config.timeout ?? 30_000;
  }

  // -------------------------------------------------------------------------
  // Interceptors
  // -------------------------------------------------------------------------

  /** Register a request interceptor. Returns an unsubscribe function. */
  addRequestInterceptor(fn: RequestInterceptor): () => void {
    this.requestInterceptors.push(fn);
    return () => {
      const idx = this.requestInterceptors.indexOf(fn);
      if (idx >= 0) this.requestInterceptors.splice(idx, 1);
    };
  }

  /** Register a response interceptor. Returns an unsubscribe function. */
  addResponseInterceptor(fn: ResponseInterceptor): () => void {
    this.responseInterceptors.push(fn);
    return () => {
      const idx = this.responseInterceptors.indexOf(fn);
      if (idx >= 0) this.responseInterceptors.splice(idx, 1);
    };
  }

  // -------------------------------------------------------------------------
  // Convenience methods
  // -------------------------------------------------------------------------

  /** Perform a GET request. */
  async get<T>(
    path: string,
    params?: Record<string, string | number | boolean | undefined>,
    init?: RequestInit,
  ): Promise<ApiResponse<T> | PaginatedResponse<T>> {
    const url = this.buildURL(path, params);
    return this.request<T>(url, { ...init, method: "GET" });
  }

  /** Perform a POST request. */
  async post<T>(
    path: string,
    body?: unknown,
    init?: RequestInit,
  ): Promise<ApiResponse<T>> {
    const url = this.buildURL(path);
    return this.request<T>(url, {
      ...init,
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  /** Perform a PUT request. */
  async put<T>(
    path: string,
    body?: unknown,
    init?: RequestInit,
  ): Promise<ApiResponse<T>> {
    const url = this.buildURL(path);
    return this.request<T>(url, {
      ...init,
      method: "PUT",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  /** Perform a PATCH request. */
  async patch<T>(
    path: string,
    body?: unknown,
    init?: RequestInit,
  ): Promise<ApiResponse<T>> {
    const url = this.buildURL(path);
    return this.request<T>(url, {
      ...init,
      method: "PATCH",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  /** Perform a DELETE request. */
  async del<T>(
    path: string,
    init?: RequestInit,
  ): Promise<ApiResponse<T>> {
    const url = this.buildURL(path);
    return this.request<T>(url, { ...init, method: "DELETE" });
  }

  // -------------------------------------------------------------------------
  // Core request logic
  // -------------------------------------------------------------------------

  private async request<T>(url: string, init: RequestInit): Promise<ApiResponse<T>> {
    // Merge default headers
    init.headers = {
      ...this.defaultHeaders,
      ...((init.headers as Record<string, string>) ?? {}),
    };

    // Run request interceptors
    let ctx = { url, init };
    for (const interceptor of this.requestInterceptors) {
      ctx = await interceptor(ctx.url, ctx.init);
    }

    // Apply timeout via AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    init.signal = controller.signal;

    try {
      let response = await fetch(ctx.url, ctx.init);

      // Run response interceptors
      for (const interceptor of this.responseInterceptors) {
        response = await interceptor(response, ctx.init);
      }

      return this.handleResponse<T>(response);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // -------------------------------------------------------------------------
  // Response handling
  // -------------------------------------------------------------------------

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const text = await response.text();

    let body: unknown;
    try {
      body = text.length > 0 ? JSON.parse(text) : {};
    } catch {
      throw new Error(
        `API returned non-JSON response (${response.status}): ${text.substring(0, 200)}`,
      );
    }

    if (!response.ok) {
      const apiError: ApiError =
        typeof body === "object" && body !== null && "error" in body
          ? (body as ApiError)
          : {
              success: false,
              error: {
                code: "UNKNOWN_ERROR",
                message: `Request failed with status ${response.status}`,
              },
              statusCode: response.status,
            };
      throw new ApiClientError(apiError);
    }

    return body as ApiResponse<T>;
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  /** Build a full URL from a path, optionally appending query parameters. */
  private buildURL(
    path: string,
    params?: Record<string, string | number | boolean | undefined>,
  ): string {
    const url = new URL(path, this.baseURL + "/");
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      }
    }
    return url.toString();
  }
}

/** Factory helper to create a pre-configured ApiClient. */
export function createApiClient(config: ApiClientConfig): ApiClient {
  return new ApiClient(config);
}
