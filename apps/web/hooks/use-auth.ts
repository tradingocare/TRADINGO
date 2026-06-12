'use client';

import { useEffect } from 'react';
import { useAuthStore } from '../store/auth-store';
import { apiClient } from '../lib/api-client';
import { getAccessToken, setAccessToken, clearTokens } from '../lib/auth';

export function useAuth() {
  const { user, accessToken, setAuth, clearAuth } = useAuthStore();

  useEffect(() => {
    if (getAccessToken() && !user) {
      apiClient.get<{ data: { id: string; email: string; name: string; role: string } }>('/users/me')
        .then((res) => {
          const data = res.data || res;
          setAuth(data, getAccessToken()!);
        })
        .catch(() => {
          clearTokens();
          clearAuth();
        });
    }
  }, [user, setAuth, clearAuth]);

  const login = async (email: string, password: string) => {
    const res = await apiClient.post<{
      user: { id: string; email: string; name: string; role: string };
      accessToken: string;
      refreshToken: string;
    }>('/auth/login', { email, password });

    setAccessToken(res.accessToken);

    await fetch('/api/auth/set-cookie', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: res.refreshToken }),
    });

    setAuth(res.user, res.accessToken);
  };

  const register = async (name: string, email: string, password: string) => {
    const res = await apiClient.post<{
      user: { id: string; email: string; name: string; role: string };
      accessToken: string;
      refreshToken: string;
    }>('/auth/register', { name, email, password });

    setAccessToken(res.accessToken);

    await fetch('/api/auth/set-cookie', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: res.refreshToken }),
    });

    setAuth(res.user, res.accessToken);
  };

  const signout = () => {
    clearTokens();
    clearAuth();
  };

  return { user, accessToken, login, register, signout };
}
