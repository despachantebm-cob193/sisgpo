
import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useUiStore } from '../../store/uiStore';

const AppLayout: React.FC = () => {
  const { pageTitle, isSidebarCollapsed } = useUiStore();

  return (
    <div className="relative min-h-screen bg-gray-100">
      <Sidebar />
      <div
        className={`transition-all duration-300 ${
          isSidebarCollapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        <header className="h-16 bg-white border-b flex items-center px-6">
          <h1 className="text-lg font-semibold text-gray-800">{pageTitle}</h1>
        </header>
        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
