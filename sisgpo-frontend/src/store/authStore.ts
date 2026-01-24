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
  signOut: () => Promise<void>; // Added centralized signOut
}

import { supabase } from '../config/supabase';

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
      isAuthenticated: () => !!get().token,
      signOut: async () => {
        // 1. Clear State
        set({ token: null, user: null, isPending: false, isLoadingProfile: false });

        // 2. Clear Local Storage
        try {
          localStorage.removeItem('auth-storage');
          const keysToRemove: string[] = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('sb-')) keysToRemove.push(key);
          }
          keysToRemove.forEach((k) => localStorage.removeItem(k));
        } catch (e) { console.error('Error clearing local storage:', e); }

        // 3. Sign Out from Supabase
        try {
          await supabase.auth.signOut();
        } catch (e) { console.error('Error signing out from supabase:', e); }

        // 4. Force Redirect
        window.location.href = '/login';
      }
    }),
    {
      name: 'auth-storage',
    },
  ),
);