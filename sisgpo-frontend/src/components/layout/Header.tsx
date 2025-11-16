
import React from 'react';
import { Menu, X } from 'lucide-react';
import { useUiStore } from '../../store/uiStore';

const Header: React.FC = () => {
  const { pageTitle, isSidebarCollapsed, toggleSidebar } = useUiStore();

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center border-b border-borderDark bg-spamRed px-6 text-white">
      <h1 className="text-lg font-semibold text-white">{pageTitle}</h1>
    </header>
  );
};

export default Header;
