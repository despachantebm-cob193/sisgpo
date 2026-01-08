import React from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import { useUiStore } from '../../store/uiStore';
import Header from './Header';

import OfflineIndicator from '../ui/OfflineIndicator';

const AppLayout: React.FC = () => {
  const { isSidebarCollapsed, toggleMobileMenu, isMobileMenuOpen } = useUiStore();

  return (
    <div className="relative h-full bg-[#0b0f1a] text-textMain overflow-hidden flex">
      {/* Camadas de fundo futuristas */}
      <div className="pointer-events-none absolute inset-0 bg-cyber-grid animate-grid-move opacity-[.22] z-0" />
      <div className="pointer-events-none absolute inset-0 bg-aurora opacity-80 z-0" />

      {/* Overlay para fechar o menu no mobile ao clicar fora */}
      <div
        className={`${isMobileMenuOpen ? 'fixed inset-0 z-40 bg-black/50 md:hidden' : 'hidden'}`}
        onClick={toggleMobileMenu}
        role="presentation"
      />

      {/* Sidebar Container */}
      <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:block fixed inset-y-0 left-0 z-50 h-full`}>
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col gap-6 h-full transition-all duration-300 ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'} ${isMobileMenuOpen ? 'backdrop-blur-5' : ''} relative z-10`}
      >
        {/* Desktop Header */}
        <div className="hidden md:block flex-shrink-0">
          <Header />
        </div>

        {/* Mobile Header */}
        <div className="md:hidden flex-shrink-0 fixed top-0 left-0 right-0 z-60">
          <div className="flex items-center justify-between bg-searchbar px-4 py-3 text-textMain border-b border-borderDark shadow-md">
            <button onClick={toggleMobileMenu} className="p-2">
              <Menu size={24} />
            </button>
            <h1 className="text-xl font-bold">SISGPO</h1>
          </div>
        </div>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 pt-16 md:pt-0 pb-8 w-full">
          <Outlet />
        </main>

        <OfflineIndicator />
      </div>
    </div>
  );
};

export default AppLayout;
