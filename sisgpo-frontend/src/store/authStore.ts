import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Define a interface para os dados do usuário
interface User {
  id: number;
  login: string;
  perfil: 'Admin' | 'Usuario'; // Pode ser expandido com outros perfis
}

// Define a interface para o estado do nosso store
interface AuthState {
  token: string | null;
  user: User | null;
  setToken: (token: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
}

// Cria o store com persistência no localStorage
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
      name: 'auth-storage', // Nome da chave no localStorage
    }
  )
);
