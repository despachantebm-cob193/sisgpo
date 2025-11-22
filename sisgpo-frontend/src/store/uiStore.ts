import { create } from "zustand";

type SidebarMode = 'expanded' | 'collapsed' | 'hover';

interface UiState {
  pageTitle: string;
  sidebarMode: SidebarMode;
  isSidebarCollapsed: boolean;
  isMobileMenuOpen: boolean;
  lastUpdate: string | null;
  setPageTitle: (title: string) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (isCollapsed: boolean) => void;
  setSidebarMode: (mode: SidebarMode) => void;
  toggleMobileMenu: () => void;
  setLastUpdate: (updateTime: string | null) => void;
}

export const useUiStore = create<UiState>((set) => ({
  pageTitle: 'Pagina Inicial',
  sidebarMode: 'hover',
  isSidebarCollapsed: true,
  isMobileMenuOpen: false,
  lastUpdate: null,
  setPageTitle: (title) => set({ pageTitle: title }),
  toggleSidebar: () =>
    set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  setSidebarCollapsed: (isCollapsed) => set({ isSidebarCollapsed: isCollapsed }),
  setSidebarMode: (mode) =>
    set(() => ({
      sidebarMode: mode,
      isSidebarCollapsed: mode === 'expanded' ? false : true,
    })),
  toggleMobileMenu: () =>
    set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
  setLastUpdate: (updateTime) => set({ lastUpdate: updateTime }),
}));
