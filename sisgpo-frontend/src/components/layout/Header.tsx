
import { useNavigate, Link } from 'react-router-dom';
import { Menu, X, Settings, LogOut } from 'lucide-react';
import { useUiStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../config/supabase';

const Header: React.FC = () => {
  const { pageTitle, isSidebarCollapsed, lastUpdate } = useUiStore();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
    logout();
    navigate('/login');
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-borderDark bg-[#1f2658] px-6 text-white w-full flex-shrink-0 z-30">
      <h1 className="text-lg font-semibold text-white">{pageTitle}</h1>

      <div className="flex items-center gap-6">
        {lastUpdate && (
          <p className="text-sm text-gray-300 hidden sm:block">
            Atualizado {lastUpdate}
          </p>
        )}

        {/* Separator */}
        <div className="h-6 w-px bg-white/20 hidden sm:block"></div>

        <div className="flex items-center gap-4">
          <Link to="/app/perfil" className="flex items-center gap-2 text-sm hover:text-tagBlue transition-colors group">
            <Settings size={18} className="text-gray-300 group-hover:text-tagBlue" />
            <span className="font-medium hidden sm:block">{user?.nome}</span>
          </Link>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-md bg-red-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700"
            title="Sair do sistema"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
