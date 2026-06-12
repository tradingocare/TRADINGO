import { create } from 'zustand';

export interface UserDto {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthStore {
  user: UserDto | null;
  accessToken: string | null;
  setAuth: (user: UserDto, accessToken: string) => void;
  setAccessToken: (token: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  accessToken: null,
  setAuth: (user, accessToken) => set({ user, accessToken }),
  setAccessToken: (accessToken) => set({ accessToken }),
  clearAuth: () => set({ user: null, accessToken: null }),
}));
