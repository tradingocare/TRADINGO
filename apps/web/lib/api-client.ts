import { getAccessToken, setAccessToken, clearTokens } from './auth';

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public errors?: string[],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
};

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
  }

  private async refreshAccessToken(): Promise<boolean> {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) return false;

      const res = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) return false;

      const data = await res.json();
      setAccessToken(data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      return true;
    } catch {
      return false;
    }
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body, headers = {} } = options;

    const config: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    if (body) {
      config.body = JSON.stringify(body);
    }

    const token = getAccessToken();
    if (token) {
      (config.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    let response = await fetch(`${this.baseUrl}${endpoint}`, config);

    // Auto-refresh on 401
    if (response.status === 401 && token) {
      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = this.refreshAccessToken();
      }

      const refreshed = await refreshPromise;
      isRefreshing = false;
      refreshPromise = null;

      if (refreshed) {
        const newToken = getAccessToken();
        if (newToken) {
          (config.headers as Record<string, string>)['Authorization'] = `Bearer ${newToken}`;
        }
        response = await fetch(`${this.baseUrl}${endpoint}`, config);
      } else {
        clearTokens();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        throw new ApiError(401, 'Session expired');
      }
    }

    if (!response.ok) {
      let errorBody: any;
      try {
        errorBody = await response.json();
      } catch {
        throw new ApiError(response.status, `HTTP ${response.status}`);
      }
      throw new ApiError(
        response.status,
        errorBody.message || 'Request failed',
        errorBody.errors,
      );
    }

    // For 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  get<T>(endpoint: string, options?: RequestOptions) {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  post<T>(endpoint: string, body: unknown, options?: RequestOptions) {
    return this.request<T>(endpoint, { ...options, method: 'POST', body });
  }

  patch<T>(endpoint: string, body: unknown, options?: RequestOptions) {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body });
  }

  delete<T>(endpoint: string, options?: RequestOptions) {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
