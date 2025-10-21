
import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useUiStore } from '../../store/uiStore';
import MobileBottomNav from './MobileBottomNav';

const AppLayout: React.FC = () => {
  const { pageTitle, isSidebarCollapsed } = useUiStore();

  return (
    <div className="relative min-h-screen bg-gray-100">
      <Sidebar />
      <MobileBottomNav />
      <div
        className={`flex min-h-screen flex-col transition-all duration-300 pb-16 md:pb-0 ${
          isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'
        }`}
      >
        <header className="sticky top-0 z-20 flex h-16 items-center border-b bg-white px-6">
          <h1 className="text-lg font-semibold text-gray-800">{pageTitle}</h1>
        </header>
        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
