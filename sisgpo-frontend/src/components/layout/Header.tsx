import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Menu, X, Settings, LogOut, UserCheck, Bell, ShieldAlert } from 'lucide-react';
import { useUiStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../config/supabase';
import api from '../../services/api';

const Header: React.FC = () => {
  const { pageTitle, lastUpdate } = useUiStore();
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
    const interval = setInterval(fetchPending, 60000);

    return () => clearInterval(interval);
  }, [isAdmin]);

  const handleLogout = async () => {
    logout();
    try {
      localStorage.removeItem('auth-storage');
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('sb-')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (e) { console.error(e); }

    try {
      await supabase.auth.signOut();
    } catch (err) { console.error(err); }

    window.location.href = '/login';
  };

  return (
    <header className="flex h-20 items-center justify-between border-b border-cyan-500/10 bg-[#0a0d14]/80 backdrop-blur-md px-8 w-full flex-shrink-0 z-30 shadow-[0_4px_30px_rgba(0,0,0,0.3)] relative">

      {/* Top subtle highlight */}
      <div className="absolute top-0 inset-x-0 h-[1px] bg-white/5 pointer-events-none" />

      {/* Title Section */}
      <div className="flex flex-col">
        <h1 className="text-xl font-bold text-white tracking-wide uppercase font-mono drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]">
          {pageTitle}
        </h1>
        {lastUpdate && (
          <p className="text-[10px] text-cyan-500/60 uppercase tracking-widest mt-0.5 font-bold animate-pulse-slow">
            • SISTEMA ONLINE • {lastUpdate}
          </p>
        )}
      </div>

      <div className="flex items-center gap-6">

        {/* Admin Alerts */}
        {isAdmin && pendingCount > 0 && (
          <Link
            to="/app/usuarios"
            className="relative group flex items-center justify-center p-2 rounded-lg bg-orange-500/10 border border-orange-500/30 hover:bg-orange-500/20 hover:border-orange-500 transition-all duration-300"
            title={`${pendingCount} solicitações pendentes`}
          >
            <ShieldAlert size={20} className="text-orange-400 group-hover:text-orange-200 transition-colors animate-pulse" />
            <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[9px] font-bold text-black shadow ring-2 ring-[#0a0d14]">
              {pendingCount}
            </span>
            {/* Glow effect */}
            <div className="absolute inset-0 bg-orange-500/20 blur-[10px] opacity-0 group-hover:opacity-100 transition-opacity rounded-lg" />
          </Link>
        )}

        {/* Separator */}
        <div className="h-8 w-[1px] bg-gradient-to-b from-transparent via-slate-700 to-transparent mx-2 hidden sm:block"></div>

        {/* User Actions */}
        <div className="flex items-center gap-5">
          <Link to="/app/perfil" className="flex items-center gap-3 group">
            <div className="p-2 rounded-full bg-slate-800/50 border border-slate-700 group-hover:border-cyan-500/50 transition-colors">
              <Settings size={18} className="text-slate-400 group-hover:text-cyan-300 transition-colors" />
            </div>
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-medium text-slate-200">{user?.nome?.split(' ')[0]}</span>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">{user?.perfil}</span>
            </div>
          </Link>

          <button
            onClick={handleLogout}
            className="flex items-center justify-center p-2 rounded-lg text-red-400 hover:text-red-200 hover:bg-red-500/10 hover:shadow-[0_0_15px_rgba(239,68,68,0.2)] transition-all duration-300 border border-transparent hover:border-red-500/30"
            title="Sair do sistema"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
