// sisgpo-frontend/src/components/layout/AppLayout.tsx

import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

// Layout autenticado com menu lateral fixo e conteúdo principal
const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 font-sans flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="h-16 bg-white border-b flex items-center px-6">
          <h1 className="text-lg font-semibold text-gray-800">Área Administrativa</h1>
        </header>
        <main className="flex-1 py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
