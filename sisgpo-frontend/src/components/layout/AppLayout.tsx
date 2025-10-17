import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const AppLayout: React.FC = () => {
  return (
    <div className="app-grid">
      <Sidebar />
      <header className="h-16 bg-white border-b flex items-center px-6">
        <h1 className="text-lg font-semibold text-gray-800">Área Administrativa</h1>
      </header>
        <main className="overflow-y-auto p-8">
          <div>
            <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AppLayout;