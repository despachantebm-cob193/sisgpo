// sisgpo-frontend/src/store/uiStore.ts
import { create } from 'zustand';

interface UiState {
  pageTitle: string;
  isSidebarCollapsed: boolean;
  setPageTitle: (title: string) => void;
  toggleSidebar: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  pageTitle: 'Página Inicial',
  isSidebarCollapsed: false,
  setPageTitle: (title) => set({ pageTitle: title }),
  toggleSidebar: () =>
    set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
}));