import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserRecord } from '../types/entities';

// A interface User está correta com 'login' e 'perfil'
interface User extends UserRecord { }

interface AuthState {
  token: string | null;
  user: User | null;
  isPending: boolean;
  isLoadingProfile: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  setPending: (isPending: boolean) => void;
  setLoadingProfile: (isLoading: boolean) => void;
  isAuthenticated: () => boolean; // Adicionamos este getter
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isPending: false,
      isLoadingProfile: true, // Default to true to block render until initial check
      login: (token, user) => set({ token, user, isPending: false, isLoadingProfile: false }),
      logout: () => set({ token: null, user: null, isPending: false, isLoadingProfile: false }),
      setPending: (isPending) => set({ isPending }),
      setLoadingProfile: (isLoadingProfile) => set({ isLoadingProfile }),
      // A implementação do getter verifica a existência do token
      isAuthenticated: () => !!get().token,
    }),
    {
      name: 'auth-storage',
    },
  ),
);