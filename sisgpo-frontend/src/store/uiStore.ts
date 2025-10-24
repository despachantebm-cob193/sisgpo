// sisgpo-frontend/src/store/uiStore.ts
import { create } from 'zustand';

interface UiState {
  pageTitle: string;
  isSidebarCollapsed: boolean;
  isMobileMenuOpen: boolean;
  setPageTitle: (title: string) => void;
  toggleSidebar: () => void;
  toggleMobileMenu: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  pageTitle: 'Página Inicial',
  isSidebarCollapsed: false,
  isMobileMenuOpen: false,
  setPageTitle: (title) => set({ pageTitle: title }),
  toggleSidebar: () =>
    set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  toggleMobileMenu: () =>
    set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
}));
