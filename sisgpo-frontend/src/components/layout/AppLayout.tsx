import React from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import { useUiStore } from '../../store/uiStore';
import Header from './Header';

import OfflineIndicator from '../ui/OfflineIndicator';
import ChatWidget from '../ui/ChatWidget';

const AppLayout: React.FC = () => {
  const { toggleMobileMenu, isMobileMenuOpen } = useUiStore();

  return (
    <div className="relative h-full bg-[#050608] text-slate-300 overflow-hidden flex font-sans selection:bg-cyan-500/30">
      {/* Background System - Unified with Login "Sci-Fi Industrial" */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#131722] via-[#050608] to-[#000000] z-0" />

      {/* Grid Pattern Sutil */}
      <div
        className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:40px_40px] opacity-20 pointer-events-none z-0"
        style={{ maskImage: 'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)' }}
      />

      {/* Ambient Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-cyan-900/10 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-[100px] pointer-events-none z-0" />

      {/* Overlay Mobile */}
      <div
        className={`${isMobileMenuOpen ? 'fixed inset-0 z-40 bg-black/80 backdrop-blur-sm md:hidden transition-opacity duration-300' : 'hidden'}`}
        onClick={toggleMobileMenu}
        role="presentation"
      />

      {/* Sidebar Container */}
      <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:block fixed inset-y-0 left-0 z-50 h-full shadow-[10px_0_30px_rgba(0,0,0,0.5)]`}>
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col gap-0 h-full md:ml-64 ${isMobileMenuOpen ? 'backdrop-blur-[2px]' : ''} relative z-10`}
      >
        {/* Desktop Header */}
        <div className="hidden md:block flex-shrink-0 z-30">
          <Header />
        </div>

        {/* Mobile Header */}
        <div className="md:hidden flex-shrink-0 fixed top-0 left-0 right-0 z-50">
          <div
            className="flex items-center justify-between bg-[#0a0d14]/90 backdrop-blur-xl px-4 py-3 text-white border-b border-cyan-500/20 shadow-lg"
            style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)' }}
          >
            <button onClick={toggleMobileMenu} className="p-2 text-cyan-400 active:text-white">
              <Menu size={24} />
            </button>
            <h1 className="text-xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">SISGPO</h1>
          </div>
        </div>

        {/* Scrollable Content */}
        <main
          className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden px-3 py-6 md:p-8 space-y-6 pt-20 pb-24 md:pt-6 md:pb-10 w-full custom-scrollbar mobile-safe-insets mx-auto max-w-full"
        >
          <Outlet />
        </main>

        <OfflineIndicator />
        <ChatWidget />
      </div>
    </div>
  );
};

export default AppLayout;
