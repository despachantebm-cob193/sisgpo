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
    <div className="relative min-h-screen bg-[#0b0f1a] text-textMain overflow-hidden">
      {/* Camadas de fundo futuristas */}
      <div className="pointer-events-none absolute inset-0 bg-cyber-grid animate-grid-move opacity-[.22]" />
      <div className="pointer-events-none absolute inset-0 bg-aurora opacity-80" />
      {/* Overlay para fechar o menu no mobile ao clicar fora */}
      <div
        className={`${isMobileMenuOpen ? 'fixed inset-0 z-40 bg-black/50 md:hidden' : 'hidden'}`}
        onClick={toggleMobileMenu}
        role="presentation"
      />

      <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:block`}>
        <Sidebar />
      </div>
      <Header />

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-60">
        <div className="flex items-center justify-between bg-searchbar px-4 py-3 text-textMain border-b border-borderDark">
          <button onClick={toggleMobileMenu} className="p-2">
            <Menu size={24} />
          </button>
          <h1 className="text-xl font-bold">SISGPO</h1>
        </div>
      </div>

      <div
        className={`flex min-h-screen flex-col transition-all duration-300 pt-16 ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'} ${isMobileMenuOpen ? 'backdrop-blur-5' : ''}`}
      >
        <main className="relative z-10 flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          <Outlet />
        </main>
        <OfflineIndicator />
      </div>
    </div>
  );
};

export default AppLayout;
