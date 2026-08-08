import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getAccessToken, setAccessToken, clearTokens } from '@/lib/auth';
import { captureError, addBreadcrumb } from '@/lib/monitoring/sentry';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

let csrfToken: string | null = null;
let csrfPromise: Promise<string | null> | null = null;

async function fetchCsrfToken(): Promise<string | null> {
  try {
    const res = await axios.get(`${BASE_URL}/auth/csrf`, { withCredentials: true, timeout: 5000 });
    csrfToken = res.data?.token ?? null;
  } catch {
    csrfToken = null;
  }
  return csrfToken;
}

function ensureCsrfToken(): Promise<string | null> {
  if (csrfToken) return Promise.resolve(csrfToken);
  if (!csrfPromise) csrfPromise = fetchCsrfToken();
  return csrfPromise;
}

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
  withCredentials: true,
});

apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const method = (config.method ?? 'get').toUpperCase();
  if (method !== 'GET' && config.headers && !config.headers.Authorization) {
    config.headers['x-csrf-token'] = (await ensureCsrfToken()) ?? '';
  }
  return config;
});

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

const AUTH_ENDPOINTS = [
  '/auth/login',
  '/auth/register',
  '/auth/refresh',
  '/auth/login-otp',
  '/auth/send-login-otp',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/change-password',
  '/auth/social-login',
];

function isAuthRequest(url: string | undefined): boolean {
  if (!url) return false;
  return AUTH_ENDPOINTS.some((ep) => url.includes(ep));
}

apiClient.interceptors.response.use(
  (response) => {
    if (
      response.data &&
      typeof response.data === 'object' &&
      'statusCode' in response.data &&
      'message' in response.data &&
      'data' in response.data &&
      'timestamp' in response.data
    ) {
      response.data = (response.data as any).data;
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const status = error.response?.status;
    const url = originalRequest?.url;

    if (status && status !== 401) {
      addBreadcrumb(`API ${status}`, 'api', { url, method: originalRequest?.method });
      if (status >= 500) {
        captureError(error, { url, status, method: originalRequest?.method });
      }
    }

    if (status === 401 && !originalRequest._retry && !isAuthRequest(url)) {
      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = refreshAccessToken();
      }

      const refreshed = await refreshPromise;
      isRefreshing = false;
      refreshPromise = null;

      if (refreshed) {
        originalRequest._retry = true;
        const newToken = getAccessToken();
        if (newToken && originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }
        return apiClient(originalRequest);
      } else {
        clearTokens();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  },
);

async function refreshAccessToken(): Promise<boolean> {
  try {
    const res = await axios.post(`${BASE_URL}/auth/refresh`, {}, {
      withCredentials: true,
      headers: { 'x-csrf-token': (await ensureCsrfToken()) ?? '' },
    });
    setAccessToken(res.data.accessToken);
    return true;
  } catch {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return false;
    try {
      const res = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken }, {
        headers: { 'x-csrf-token': (await ensureCsrfToken()) ?? '' },
      });
      setAccessToken(res.data.accessToken);
      return true;
    } catch {
      return false;
    }
  }
}

export { apiClient };
export default apiClient;
