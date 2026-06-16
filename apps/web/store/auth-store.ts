import { create } from 'zustand';
import type { User } from '@/lib/api/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  rememberMe: boolean;
  twoFactorEnabled: boolean;
  setAuth: (user: User, accessToken: string) => void;
  setUser: (user: User) => void;
  clearAuth: () => void;
  setRememberMe: (value: boolean) => void;
  setTwoFactorEnabled: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  rememberMe: typeof window !== 'undefined' ? localStorage.getItem('rememberMe') === 'true' : false,
  twoFactorEnabled: false,
  setAuth: (user, accessToken) =>
    set({ user, accessToken, isAuthenticated: true }),
  setUser: (user) => set({ user }),
  clearAuth: () =>
    set({ user: null, accessToken: null, isAuthenticated: false }),
  setRememberMe: (value) => {
    localStorage.setItem('rememberMe', value ? 'true' : '');
    set({ rememberMe: value });
  },
  setTwoFactorEnabled: (value) => set({ twoFactorEnabled: value }),
}));
