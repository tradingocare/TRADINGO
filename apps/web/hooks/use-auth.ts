'use client';

import { useEffect } from 'react';
import { useAuthStore } from '../store/auth-store';
import { apiClient } from '../lib/api-client';
import { getAccessToken } from '../lib/auth';
import { persistSession, clearSession } from '../lib/auth/session';

export function useAuth() {
  const { user, accessToken, setAuth, clearAuth } = useAuthStore();

  useEffect(() => {
    if (getAccessToken() && !user) {
      apiClient.get<{ id: string; email: string; name: string; role: 'SELLER' | 'BUYER' | 'ADMIN' | 'SUPER_ADMIN'; isVerified: boolean; createdAt: string }>('/users/me')
        .then((res) => {
          setAuth(res, getAccessToken()!);
        })
        .catch(() => {
          clearSession();
          clearAuth();
        });
    }
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
