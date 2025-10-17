// sisgpo-frontend/src/store/uiStore.ts
import { create } from 'zustand';

interface UiState {
  pageTitle: string;
  setPageTitle: (title: string) => void;
}

export const useUiStore = create<UiState>((set) => ({
  pageTitle: 'Página Inicial', // Um título padrão
  setPageTitle: (title) => set({ pageTitle: title }),
}));