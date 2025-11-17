import { create } from 'zustand'; // Forcing recompile

interface UiState {
  pageTitle: string;
  isSidebarCollapsed: boolean;
  isMobileMenuOpen: boolean;
  lastUpdate: string | null;
  setPageTitle: (title: string) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (isCollapsed: boolean) => void;
  toggleMobileMenu: () => void;
  setLastUpdate: (updateTime: string | null) => void;
}

export const useUiStore = create<UiState>((set) => ({
  pageTitle: 'Página Inicial',
  isSidebarCollapsed: true,
  isMobileMenuOpen: false,
  lastUpdate: null,
  setPageTitle: (title) => set({ pageTitle: title }),
  toggleSidebar: () =>
    set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  setSidebarCollapsed: (isCollapsed) => set({ isSidebarCollapsed: isCollapsed }),
  toggleMobileMenu: () =>
    set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
  setLastUpdate: (updateTime) => set({ lastUpdate: updateTime }),
}));
