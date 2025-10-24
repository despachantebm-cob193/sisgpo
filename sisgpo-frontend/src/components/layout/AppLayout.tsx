


import React from 'react';

import { Outlet } from 'react-router-dom';

import Sidebar from './Sidebar';

import { useUiStore } from '../../store/uiStore';

import MobileBottomNav from './MobileBottomNav';

import Header from './Header'; // Import the new Header component



const AppLayout: React.FC = () => {

  const { isSidebarCollapsed } = useUiStore();



  return (

    <div className="relative min-h-screen bg-gray-100">

      <Sidebar />

      <MobileBottomNav />

      <div

        className={`flex min-h-screen flex-col transition-all duration-300 pb-16 md:pb-0 ${isSidebarCollapsed ? 'ml-0 md:ml-20' : 'ml-64'}`}>

        <Header />

        <main className="flex-1 overflow-y-auto p-8">

          <Outlet />

        </main>

      </div>

    </div>

  );

};



export default AppLayout;


