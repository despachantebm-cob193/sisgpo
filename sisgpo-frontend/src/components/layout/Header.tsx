import { useNavigate, Link } from 'react-router-dom';
import { Menu, X, Settings, LogOut, UserCheck } from 'lucide-react';
import { useUiStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../config/supabase';
import api from '../../services/api';
import React, { useState, useEffect } from 'react';

const Header: React.FC = () => {
  const { pageTitle, isSidebarCollapsed, lastUpdate } = useUiStore();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState(0);

  const isAdmin = user?.perfil === 'admin';

  useEffect(() => {
    if (!isAdmin) return;

    const fetchPending = async () => {
      try {
        const response = await api.get('/api/admin/users/pending');
        setPendingCount(response.data.users?.length || 0);
      } catch (err) {
        console.error('Erro ao buscar solicitações pendentes:', err);
      }
    };

    fetchPending();
    const interval = setInterval(fetchPending, 60000); // Atualiza a cada minuto

    return () => clearInterval(interval);
  }, [isAdmin]);

  const handleLogout = async () => {
    console.log('Logout iniciado...');

    // Limpa o store local primeiro
    logout();
    console.log('Store local limpo');

    // Força limpeza COMPLETA do localStorage
    try {
      // Remove auth-storage do Zustand
      localStorage.removeItem('auth-storage');

      // Remove TODAS as chaves do Supabase
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('sb-')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));

      console.log('localStorage completamente limpo:', keysToRemove);
    } catch (e) {
      console.error('Erro ao limpar localStorage:', e);
    }

    // Aguarda o signOut do Supabase completar
    try {
      await supabase.auth.signOut();
      console.log('Supabase signOut completo');
    } catch (err) {
      console.error('Erro ao desconectar do Supabase:', err);
    }

    // Força reload completo da página para /login
    console.log('Redirecionando para /login com reload completo');
    window.location.href = '/login';
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
          {isAdmin && pendingCount > 0 && (
            <Link
              to="/app/usuarios"
              className="relative flex items-center justify-center rounded-full bg-premiumOrange/10 p-2 text-premiumOrange transition hover:bg-premiumOrange/20 active:scale-95"
              title={`${pendingCount} solicitações pendentes`}
            >
              <UserCheck size={20} />
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-premiumOrange text-[10px] font-bold text-white shadow-sm ring-2 ring-background">
                {pendingCount}
              </span>
            </Link>
          )}

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
