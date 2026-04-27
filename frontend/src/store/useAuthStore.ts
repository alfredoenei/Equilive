import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';


interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  setToken: (token: string) => void;
  updateUser: (user: Partial<User>) => void;

  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (user, token) => set({ user, token }),
      setToken: (token) => set({ token }),
      updateUser: (updatedUser) => set((state) => ({

        user: state.user ? { ...state.user, ...updatedUser } : null
      })),
      logout: () => set({ user: null, token: null }),
    }),
    {
      name: 'equilive-auth',
    }
  )
);

