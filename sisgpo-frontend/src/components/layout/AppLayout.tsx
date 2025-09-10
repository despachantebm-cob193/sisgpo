import { useState } from 'react';
import { Outlet, Navigate, NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import {
  LayoutDashboard,
  Building,
  Car,
  Users,
  Clipboard,
  Calendar,
  LogOut,
  UserCircle,
  Menu,
  X,
} from 'lucide-react';

// --- CORREÇÃO APLICADA AQUI ---
// O 'to' agora é o caminho completo, sem lógicas complexas.
const NavItem = ({ to, icon: Icon, label, onClick }: { to: string; icon: React.ElementType; label: string; onClick?: () => void; }) => (
  <NavLink
    to={to} // Usamos o caminho completo diretamente
    end // A propriedade 'end' garante a correspondência exata para o dashboard
    onClick={onClick}
    className={({ isActive }) =>
      `flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
        isActive
          ? 'bg-indigo-700 text-white'
          : 'text-gray-300 hover:bg-indigo-600 hover:text-white'
      }`
    }
  >
    <Icon className="w-5 h-5 mr-3" />
    {label}
  </NavLink>
);
// --- FIM DA CORREÇÃO ---

export default function AppLayout() {
  const { token, logout, user } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="relative md:flex h-screen bg-gray-100 font-sans">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={closeSidebar}
        ></div>
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-gray-800 text-white flex flex-col
          transform transition-transform duration-300 ease-in-out z-30
          md:relative md:translate-x-0
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-700">
          <h1 className="text-xl font-bold text-white">SISGPO</h1>
          <button onClick={closeSidebar} className="md:hidden text-gray-300 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2">
          {/* --- CORREÇÃO APLICADA AQUI --- */}
          {/* Os 'to' props agora contêm o caminho completo, incluindo /app */}
          <NavItem to="/app/dashboard" icon={LayoutDashboard} label="Dashboard" onClick={closeSidebar} />
          <NavItem to="/app/obms" icon={Building} label="OBMs" onClick={closeSidebar} />
          <NavItem to="/app/viaturas" icon={Car} label="Viaturas" onClick={closeSidebar} />
          <NavItem to="/app/militares" icon={Users} label="Militares" onClick={closeSidebar} />
          <NavItem to="/app/civis" icon={Clipboard} label="Escala de Médicos" onClick={closeSidebar} />
          <NavItem to="/app/plantoes" icon={Calendar} label="Plantões" onClick={closeSidebar} />
          <NavItem to="/app/servico-dia" icon={Clipboard} label="Serviço de Dia" onClick={closeSidebar} />
          <NavItem to="/app/perfil" icon={UserCircle} label="Meu Perfil" onClick={closeSidebar} />
        </nav>

        <div className="px-4 py-4 border-t border-gray-700">
           <button
            onClick={() => { closeSidebar(); logout(); }}
            className="flex items-center w-full px-4 py-2.5 text-sm font-medium rounded-lg text-gray-300 hover:bg-red-600 hover:text-white transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Sair
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col relative">
        <header
          className="
            sticky top-0 h-16 bg-white border-b border-gray-200
            flex items-center justify-between px-6 z-10
          "
        >
          <button onClick={() => setIsSidebarOpen(true)} className="md:hidden text-gray-600">
            <Menu size={24} />
          </button>

          <div className="flex items-center ml-auto">
            <span className="text-sm text-gray-600">
              Bem-vindo, <span className="font-semibold">{user?.login}</span>
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-gray-100 p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
