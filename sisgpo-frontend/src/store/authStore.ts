import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: number;
  login: string;
  perfil: 'admin' | 'user';
  ativo: boolean;
  nome_guerra?: string; // opcional, utilizado no Sidebar
}

interface AuthState {
  token: string | null;
  user: User | null;
  setToken: (token: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setToken: (token) => set({ token }),
      setUser: (user) => set({ user }),
      logout: () => set({ token: null, user: null }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
