// lib/api/client.ts

import axios, {
  AxiosInstance,
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
  isAxiosError,
} from "axios";
import { isProtectedPath } from "./route-config";

// ── Types ──────────────────────────────────────────────────────────────────────

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// Success response envelope
export interface ApiSuccess<T = unknown> {
  success: true;
  data: T;
  timestamp: string;
}

// Error response envelope
export interface ApiErrorEnvelope {
  success: false;
  statusCode: number;
  message: string;
  details?: {
    message?: string;
    error?: string;
    statusCode?: number;
  };
  path?: string;
  timestamp: string;
}

// Union type for API responses
export type ApiResponse<T> = ApiSuccess<T> | ApiErrorEnvelope;

type QueueItem = {
  resolve: () => void;
  reject: (err: unknown) => void;
  config: CustomAxiosRequestConfig;
};

// ── Custom Error Class ──────────────────────────────────────────────────────

export class ApiError extends Error {
  statusCode?: number;
  details?: ApiErrorEnvelope["details"];
  path?: string;
  timestamp?: string;

  constructor(envelope: ApiErrorEnvelope) {
    super(envelope.message);
    this.name = "ApiError";
    this.statusCode = envelope.statusCode;
    this.details = envelope.details;
    this.path = envelope.path;
    this.timestamp = envelope.timestamp;

    // Maintains proper stack trace
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

// ── Error Normalizer ──────────────────────────────────────────────────────

const normalizeError = (error: unknown): unknown => {
  // If it's not an Axios error, return as-is
  if (!isAxiosError(error)) {
    return error;
  }

  const response = error.response;

  // If no response data, return the original error
  if (!response?.data) {
    return error;
  }

  const data = response.data as ApiErrorEnvelope;

  // If it's our API error format, create an ApiError instance
  if (data.success === false && data.message) {
    return new ApiError(data);
  }

  // If it's some other format, return the original error
  return error;
};

// ── Auth-skip list ─────────────────────────────────────────────────────────

const SKIP_REFRESH = ["/auth/login", "/auth/register", "/auth/refresh"];

const shouldSkipRefresh = (url = "") =>
  SKIP_REFRESH.some((ep) => url.includes(ep));

// ── Client ──────────────────────────────────────────────────────────────────

class ApiClient {
  private http: AxiosInstance;
  private isRefreshing = false;
  private queue: QueueItem[] = [];

  constructor() {
    this.http = axios.create({
      baseURL:
        process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1",
      timeout: 30000,
      withCredentials: true,
      headers: { "Content-Type": "application/json" },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // ── Request ──────────────────────────────────────────────────────────────
    this.http.interceptors.request.use(
      (config) => config,
      (err) => Promise.reject(err),
    );

    // ── Response ─────────────────────────────────────────────────────────────
    this.http.interceptors.response.use(
      (res: AxiosResponse) => res,
      async (err: AxiosError) => {
        const original = err.config as CustomAxiosRequestConfig;

        // Handle 401 refresh
        if (
          err.response?.status === 401 &&
          !original?._retry &&
          !shouldSkipRefresh(original?.url)
        ) {
          original._retry = true;
          return this.handleRefresh(original);
        }

        // ✅ Normalize the error before rejecting
        return Promise.reject(normalizeError(err));
      },
    );
  }

  private handleRefresh(failedRequest: CustomAxiosRequestConfig) {
    if (this.isRefreshing) {
      return new Promise<AxiosResponse>((resolve, reject) => {
        this.queue.push({
          resolve: () => resolve(this.http(failedRequest)),
          reject,
          config: failedRequest,
        });
      });
    }

    this.isRefreshing = true;

    return this.http
      .get<ApiSuccess<{ id: string; role: string }>>("/auth/refresh")
      .then(() => {
        this.queue.forEach((item) => item.resolve());
        this.queue = [];
        return this.http(failedRequest);
      })
      .catch((refreshErr) => {
        this.queue.forEach((item) => item.reject(refreshErr));
        this.queue = [];

        // Only redirect on auth failure
        if (
          isAxiosError(refreshErr) &&
          (refreshErr.response?.status === 401 ||
            refreshErr.response?.status === 403)
        ) {
          if (
            typeof window !== "undefined" &&
            isProtectedPath(window.location.pathname)
          ) {
            window.location.href = "/login";
          }
        }

        return Promise.reject(normalizeError(refreshErr));
      })
      .finally(() => {
        this.isRefreshing = false;
      });
  }

  // ── Typed request methods ─────────────────────────────────────────────────

  async get<T>(url: string, params?: Record<string, unknown>) {
    const res = await this.http.get<ApiSuccess<T>>(url, { params });
    return res.data;
  }

  async post<T>(url: string, data?: unknown) {
    const res = await this.http.post<ApiSuccess<T>>(url, data);
    return res.data;
  }

  async patch<T>(url: string, data?: unknown) {
    const res = await this.http.patch<ApiSuccess<T>>(url, data);
    return res.data;
  }

  async put<T>(url: string, data?: unknown) {
    const res = await this.http.put<ApiSuccess<T>>(url, data);
    return res.data;
  }

  async delete<T>(url: string) {
    const res = await this.http.delete<ApiSuccess<T>>(url);
    return res.data;
  }

  async upload<T>(url: string, file: File, fieldName = "file") {
    const form = new FormData();
    form.append(fieldName, file);
    const res = await this.http.post<ApiSuccess<T>>(url, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  }
}

export const apiClient = new ApiClient();
