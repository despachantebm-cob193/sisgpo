
import React from 'react';
import { Menu, X } from 'lucide-react';
import { useUiStore } from '../../store/uiStore';

const Header: React.FC = () => {
  const { pageTitle, isSidebarCollapsed, toggleSidebar } = useUiStore();

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center border-b bg-white px-6">
      <button onClick={toggleSidebar} className="mr-4 md:hidden">
        {isSidebarCollapsed ? <Menu /> : <X />}
      </button>
      <h1 className="text-lg font-semibold text-gray-800">{pageTitle}</h1>
    </header>
  );
};

export default Header;
