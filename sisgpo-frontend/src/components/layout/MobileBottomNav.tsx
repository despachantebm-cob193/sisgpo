import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  ClipboardList,
  UserCheck,
  Truck,
  Users,
} from 'lucide-react';

const navItems = [
  { to: '/app/dashboard', icon: Home, label: 'Dashboard' },
  { to: '/app/dashboard-ocorrencias', icon: ClipboardList, label: 'Ocorrências' },
  { to: '/app/militares', icon: UserCheck, label: 'Militares' },
  { to: '/app/viaturas', icon: Truck, label: 'Viaturas' },
  { to: '/app/usuarios', icon: Users, label: 'Usuários' },
];

const MobileBottomNav: React.FC = () => {
  return (
    <nav className="fixed bottom-0 left-0 z-50 w-full border-t border-gray-200 bg-white shadow-md md:hidden">
      <ul className="flex items-center justify-around px-4 py-2">
        {navItems.map(({ to, icon: Icon, label }) => (
          <li key={to}>
            <NavLink
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center text-xs font-medium transition-colors ${
                  isActive ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'
                }`
              }
            >
              <Icon className="h-6 w-6" aria-hidden="true" />
              <span className="sr-only">{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default MobileBottomNav;
