// frontend/src/components/layout/AppLayout.tsx (Otimizado para Responsividade)
import { useState } from 'react';
import { Outlet, Navigate, NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { 
  LayoutDashboard, Building, Car, Users, Calendar, LogOut, UserCircle, Menu, X 
} from 'lucide-react';

// NavItem continua o mesmo...
const NavItem = ({ to, icon: Icon, label }: { to: string; icon: React.ElementType; label: string }) => (
  <NavLink to={to} end className={({ isActive }) => `flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${ isActive ? 'bg-indigo-700 text-white' : 'text-gray-300 hover:bg-indigo-600 hover:text-white' }`}>
    <Icon className="w-5 h-5 mr-3" />
    {label}
  </NavLink>
);

export default function AppLayout() {
  const { token, logout, user } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Estado para controlar a sidebar

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="relative flex h-screen bg-gray-100 font-sans">
      {/* --- Overlay para telas pequenas --- */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* --- Barra Lateral (Sidebar) --- */}
      <aside className={`w-64 bg-gray-800 text-white flex flex-col fixed inset-y-0 left-0 z-30 transform transition-transform duration-300 ease-in-out 
                         md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 flex items-center justify-center px-4 border-b border-gray-700">
          <h1 className="text-xl font-bold text-white">SISGPO</h1>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-2">
          {/* ... Seus NavItems aqui ... */}
          <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
          <NavItem to="/obms" icon={Building} label="OBMs" />
          <NavItem to="/viaturas" icon={Car} label="Viaturas" />
          <NavItem to="/militares" icon={Users} label="Militares" />
          <NavItem to="/plantoes" icon={Calendar} label="Plantões" />
          <NavItem to="/perfil" icon={UserCircle} label="Meu Perfil" />
        </nav>
        <div className="px-4 py-4 border-t border-gray-700">
          <button onClick={logout} className="flex items-center w-full px-4 py-2.5 text-sm font-medium rounded-lg text-gray-300 hover:bg-red-600 hover:text-white transition-colors">
            <LogOut className="w-5 h-5 mr-3" />
            Sair
          </button>
        </div>
      </aside>

      {/* --- Área de Conteúdo Principal --- */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          {/* Botão Hambúrguer (visível apenas em mobile) */}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden text-gray-600">
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          
          <div className="flex items-center ml-auto">
            <span className="text-sm text-gray-600">
              Bem-vindo, <span className="font-semibold">{user?.login}</span>
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
