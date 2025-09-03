// Arquivo: frontend/src/components/layout/AppLayout.tsx

import { Outlet, Navigate, NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { 
  LayoutDashboard, 
  Building, 
  Car, 
  Users, 
  Calendar, 
  LogOut, 
  Contact, 
  UserCircle // Ícone para a página de perfil
} from 'lucide-react';

// Componente reutilizável para os itens da navegação
const NavItem = ({ to, icon: Icon, label }: { to: string; icon: React.ElementType; label: string }) => (
  <NavLink
    to={to}
    end // Garante que o link só fica ativo na rota exata (ex: / não fica ativo em /obms)
    className={({ isActive }) =>
      `flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
        isActive
          ? 'bg-indigo-700 text-white' // Estilo do link ativo
          : 'text-gray-300 hover:bg-indigo-600 hover:text-white' // Estilo do link inativo
      }`
    }
  >
    <Icon className="w-5 h-5 mr-3" />
    {label}
  </NavLink>
);

export default function AppLayout() {
  const { token, logout, user } = useAuthStore();

  // Se não houver token, redireciona para a página de login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* --- Barra Lateral (Sidebar) --- */}
      <aside className="w-64 flex-shrink-0 bg-gray-800 text-white flex flex-col">
        <div className="h-16 flex items-center justify-center px-4 border-b border-gray-700">
          <h1 className="text-xl font-bold text-white">SISGPO</h1>
        </div>
        
        {/* Navegação Principal */}
        <nav className="flex-1 px-4 py-4 space-y-2">
          <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
          <NavItem to="/obms" icon={Building} label="OBMs" />
          <NavItem to="/viaturas" icon={Car} label="Viaturas" />
          <NavItem to="/militares" icon={Users} label="Militares" />
          <NavItem to="/plantoes" icon={Calendar} label="Plantões" />
          <NavItem to="/lista-telefonica" icon={Contact} label="Lista Telefônica" />
          <NavItem to="/perfil" icon={UserCircle} label="Meu Perfil" />
        </nav>
        
        {/* Rodapé da Sidebar */}
        <div className="px-4 py-4 border-t border-gray-700">
           <button
            onClick={logout}
            className="flex items-center w-full px-4 py-2.5 text-sm font-medium rounded-lg text-gray-300 hover:bg-red-600 hover:text-white transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Sair
          </button>
        </div>
      </aside>

      {/* --- Área de Conteúdo Principal --- */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Cabeçalho da Área de Conteúdo */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-end px-6">
          <div className="flex items-center">
            <span className="text-sm text-gray-600">
              Bem-vindo, <span className="font-semibold">{user?.login}</span>
            </span>
          </div>
        </header>

        {/* Conteúdo da Página (Renderizado pelo React Router) */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
