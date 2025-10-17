// sisgpo-frontend/src/components/layout/AppLayout.tsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useUiStore } from '../../store/uiStore'; // 1. Importe o store

const AppLayout: React.FC = () => {
  const { pageTitle } = useUiStore(); // 2. Consuma o título do store

  return (
    <div className="app-grid">
      <Sidebar />
      <header className="h-16 bg-white border-b flex items-center px-6">
        {/* 3. Substitua o texto estático pelo título dinâmico */}
        <h1 className="text-lg font-semibold text-gray-800">{pageTitle}</h1>
      </header>
      <main className="overflow-y-auto p-8">
        <div>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AppLayout;