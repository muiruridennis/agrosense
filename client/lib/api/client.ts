import axios, {
  AxiosInstance,
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';

// ── Types ──────────────────────────────────────────────────────────────────────

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// AgroSense API always wraps responses in this envelope
export interface ApiEnvelope<T = unknown> {
  success: boolean;
  data: T;
  timestamp: string;
}

type QueueItem = {
  resolve: () => void;
  reject: (err: unknown) => void;
  config: CustomAxiosRequestConfig;
};

// ── Auth-skip list ─────────────────────────────────────────────────────────────

const SKIP_REFRESH = ['/auth/login', '/auth/register', '/auth/refresh'];

const shouldSkipRefresh = (url = '') =>
  SKIP_REFRESH.some((ep) => url.includes(ep));

// ── Client ────────────────────────────────────────────────────────────────────

class ApiClient {
  private http: AxiosInstance;
  private isRefreshing = false;
  private queue: QueueItem[] = [];

  constructor() {
    this.http = axios.create({
      baseURL:
        process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1',
      timeout: 30000,
      withCredentials: true, // send HttpOnly cookies on every request
      headers: { 'Content-Type': 'application/json' },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // ── Request: no-op for now, extendable (e.g. add X-Request-Id) ────────────
    this.http.interceptors.request.use(
      (config) => config,
      (err) => Promise.reject(err),
    );

    // ── Response: DO NOT unwrap here — callers get the envelope ───────────────
    // Unwrapping in the interceptor forces every caller to know the shape
    // changed, and makes it impossible to read headers/status codes.
    // Callers use response.data which is the ApiEnvelope<T>.
    this.http.interceptors.response.use(
      (res: AxiosResponse) => res,
      async (err: AxiosError) => {
        const original = err.config as CustomAxiosRequestConfig;

        if (
          err.response?.status === 401 &&
          !original?._retry &&
          !shouldSkipRefresh(original?.url)
        ) {
          original._retry = true;
          return this.handleRefresh(original);
        }

        return Promise.reject(err);
      },
    );
  }

  private handleRefresh(failedRequest: CustomAxiosRequestConfig) {
    if (this.isRefreshing) {
      // Queue this request — replay it after refresh completes
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
      .get<ApiEnvelope<{ id: string; role: string }>>('/auth/refresh')
      .then(() => {
        // Flush queue — replay all failed requests with the new cookie
        this.queue.forEach((item) => item.resolve());
        this.queue = [];
        return this.http(failedRequest);
      })
      .catch((refreshErr) => {
        this.queue.forEach((item) => item.reject(refreshErr));
        this.queue = [];
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshErr);
      })
      .finally(() => {
        this.isRefreshing = false;
      });
  }

  // ── Typed request methods ─────────────────────────────────────────────────

  async get<T>(url: string, params?: Record<string, unknown>) {
    const res = await this.http.get<ApiEnvelope<T>>(url, { params });
    return res.data; // ApiEnvelope<T>
  }

  async post<T>(url: string, data?: unknown) {
    const res = await this.http.post<ApiEnvelope<T>>(url, data);
    return res.data;
  }

  async patch<T>(url: string, data?: unknown) {
    const res = await this.http.patch<ApiEnvelope<T>>(url, data);
    return res.data;
  }

  async put<T>(url: string, data?: unknown) {
    const res = await this.http.put<ApiEnvelope<T>>(url, data);
    return res.data;
  }

  async delete<T>(url: string) {
    const res = await this.http.delete<ApiEnvelope<T>>(url);
    return res.data;
  }

  async upload<T>(url: string, file: File, fieldName = 'file') {
    const form = new FormData();
    form.append(fieldName, file);
    const res = await this.http.post<ApiEnvelope<T>>(url, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  }
}

export const apiClient = new ApiClient();