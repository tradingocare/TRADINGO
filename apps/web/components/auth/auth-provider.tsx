'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import { getAccessToken } from '@/lib/auth';
import { persistSession, persistSessionRole, clearSession } from '@/lib/auth/session';
import type { User } from '@/lib/api/types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
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
      persistSessionRole(res.data.user.role);
    } catch {
      // session expired
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // NOTE: login()/register() below are the legacy context clients. No page
  // consumes them (usage-grep verified R3; the active login/register surfaces
  // are LoginClient + buyer wizard + vendor wizard, all of which persist
  // via lib/auth/session). They are retained for context API compatibility
  // and now delegate to the SAME canonical session writer so the F-20
  // role-divergence (register previously sent role + 1h cookie) cannot recur.
  const login = useCallback(async (email: string, password: string, rememberMe = false) => {
    const res = await apiClient.post<{ user: User; accessToken: string; refreshToken: string }>(
      '/auth/login',
      { email, password },
    );
    persistSession({ user: res.data.user, accessToken: res.data.accessToken });
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
    persistSession({ user: res.data.user, accessToken: res.data.accessToken });
    setUser(res.data.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // ignore server logout failure — still clear local state
    }
    clearSession();
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
