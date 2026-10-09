'use client';

import { useEffect } from 'react';
import { useAuthStore } from '../store/auth-store';
import { apiClient } from '../lib/api-client';
import { getAccessToken } from '../lib/auth';
import { persistSession, clearSession } from '../lib/auth/session';

export function useAuth() {
  const { user, accessToken, setAuth, clearAuth } = useAuthStore();

  useEffect(() => {
    if (!getAccessToken() || user) return;
    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    // Only a confirmed authentication failure may clear stored state.
    // ApiError carries statusCode; other client error shapes are probed
    // defensively. Network failures, timeouts and 5xx responses must never
    // wipe a potentially still-valid session.
    const isAuthFailure = (err: unknown): boolean => {
      const status =
        (err as { statusCode?: number })?.statusCode ??
        (err as { status?: number })?.status ??
        (err as { response?: { status?: number } })?.response?.status;
      return status === 401 || status === 403;
    };

    const attempt = async (retriesLeft: number): Promise<void> => {
      try {
        const res = await apiClient.get<{ data: { id: string; email: string; name: string; role: 'SELLER' | 'BUYER' | 'ADMIN' | 'SUPER_ADMIN'; isVerified: boolean; createdAt: string } }>('/users/me');
        if (!cancelled) setAuth(res.data, getAccessToken()!);
      } catch (err) {
        if (cancelled) return;
        if (isAuthFailure(err)) {
          clearSession();
          clearAuth();
          return;
        }
        // Transient failure: keep the stored session and retry once after a
        // short backoff. If the retry also fails, stop without clearing —
        // the next mount re-attempts restoration.
        if (retriesLeft > 0) {
          retryTimer = setTimeout(() => {
            void attempt(retriesLeft - 1);
          }, 800);
        }
      }
    };

    void attempt(1);
    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [user, setAuth, clearAuth]);

  // NOTE: login()/register()/signout() below are the legacy hook clients —
  // no page consumes them (usage-grep verified R3; dashboards read `user`
  // only). Retained for API compatibility; persisted through the SAME
  // canonical session writer as the active surfaces.
  const login = async (email: string, password: string) => {
    const res = await apiClient.post<{
      user: { id: string; email: string; name: string; role: 'SELLER' | 'BUYER' | 'ADMIN' | 'SUPER_ADMIN'; isVerified: boolean; createdAt: string };
      accessToken: string;
      refreshToken: string;
    }>('/auth/login', { email, password });

    persistSession({ user: res.user, accessToken: res.accessToken });
    setAuth(res.user, res.accessToken);
  };

  const register = async (name: string, email: string, password: string) => {
    const res = await apiClient.post<{
      user: { id: string; email: string; name: string; role: 'SELLER' | 'BUYER' | 'ADMIN' | 'SUPER_ADMIN'; isVerified: boolean; createdAt: string };
      accessToken: string;
      refreshToken: string;
    }>('/auth/register', { name, email, password });

    persistSession({ user: res.user, accessToken: res.accessToken });
    setAuth(res.user, res.accessToken);
  };

  const signout = () => {
    clearSession();
    clearAuth();
  };

  return { user, accessToken, login, register, signout };
}
