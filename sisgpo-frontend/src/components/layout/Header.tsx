
import React from 'react';
import { Menu, X } from 'lucide-react';
import { useUiStore } from '../../store/uiStore';

const Header: React.FC = () => {
  const { pageTitle, isSidebarCollapsed, toggleSidebar, lastUpdate } = useUiStore();

  return (
    <header className={`fixed top-0 z-30 flex h-16 items-center justify-between border-b border-borderDark bg-[#1f2658] px-6 text-white transition-all duration-300 ${isSidebarCollapsed ? 'md:left-20' : 'md:left-64'} right-0`}>
      <h1 className="text-lg font-semibold text-white">{pageTitle}</h1>
      {lastUpdate && (
        <p className="text-sm text-gray-300">
          Atualizado {lastUpdate}
        </p>
      )}
    </header>
  );
};

export default Header;
