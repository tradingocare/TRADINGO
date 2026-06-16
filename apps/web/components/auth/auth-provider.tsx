'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import { getAccessToken, setAccessToken, clearTokens } from '@/lib/auth';
import type { User } from '@/lib/api/types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  role?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setIsLoading(false);
      return;
    }
    try {
      const res = await apiClient.get<{ user: User }>('/auth/me');
      setUser(res.data.user);
      localStorage.setItem('userRole', res.data.user.role);
      document.cookie = `userRole=${res.data.user.role}; path=/; max-age=86400; SameSite=Lax`;
    } catch {
      // session expired
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string, rememberMe = false) => {
    const res = await apiClient.post<{ user: User; accessToken: string; refreshToken: string }>(
      '/auth/login',
      { email, password },
    );
    setAccessToken(res.data.accessToken);
    localStorage.setItem('refreshToken', res.data.refreshToken);
    localStorage.setItem('userRole', res.data.user.role);
    document.cookie = `accessToken=${res.data.accessToken}; path=/; max-age=${rememberMe ? 604800 : 3600}; SameSite=Lax`;
    document.cookie = `userRole=${res.data.user.role}; path=/; max-age=86400; SameSite=Lax`;
    if (rememberMe) {
      localStorage.setItem('rememberMe', 'true');
    }
    setUser(res.data.user);
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    const res = await apiClient.post<{ user: User; accessToken: string; refreshToken: string }>(
      '/auth/register',
      data,
    );
    setAccessToken(res.data.accessToken);
    localStorage.setItem('refreshToken', res.data.refreshToken);
    localStorage.setItem('userRole', res.data.user.role);
    document.cookie = `accessToken=${res.data.accessToken}; path=/; max-age=3600; SameSite=Lax`;
    document.cookie = `userRole=${res.data.user.role}; path=/; max-age=86400; SameSite=Lax`;
    setUser(res.data.user);
  }, []);

  const logout = useCallback(() => {
    clearTokens();
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('rememberMe');
    document.cookie = 'accessToken=; path=/; max-age=0';
    document.cookie = 'userRole=; path=/; max-age=0';
    setUser(null);
    router.push('/login');
  }, [router]);

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, isLoading, login, register, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
