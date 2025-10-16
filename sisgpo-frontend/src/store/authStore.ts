import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// A interface User está correta com 'login' e 'perfil'
interface User {
  id: number;
  login: string;
  perfil: 'admin' | 'user'; 
  ativo: boolean;
}

interface AuthState {
  token: string | null;
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: () => boolean; // Adicionamos este getter
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      login: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
      // A implementação do getter verifica a existência do token
      isAuthenticated: () => !!get().token, 
    }),
    {
      name: 'auth-storage',
    },
  ),
);