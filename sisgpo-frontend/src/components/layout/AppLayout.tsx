import React from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import { useUiStore } from '../../store/uiStore';
import Header from './Header';

const AppLayout: React.FC = () => {
  const { isSidebarCollapsed, toggleMobileMenu, isMobileMenuOpen } = useUiStore();

  return (
    <div className="relative min-h-screen bg-gray-100">
      <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:block`}>
        <Sidebar />
      </div>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30">
        <div className="flex items-center justify-between bg-gray-800 px-4 py-3 text-white">
          <button onClick={toggleMobileMenu} className="p-2">
            <Menu size={24} />
          </button>
          <h1 className="text-xl font-bold">SISGPO</h1>
        </div>
      </div>

      <div
        className={`flex min-h-screen flex-col transition-all duration-300 pt-16 md:pt-0 ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>
        <Header />
        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;