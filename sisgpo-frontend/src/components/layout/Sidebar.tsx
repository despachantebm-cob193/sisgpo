import { useState, ReactNode, useRef, useEffect } from 'react';
import {
  ClipboardList,
  FileText,
  Home,
  LogOut,

  BellElectric,
  ChevronDown,
  Shield,
  UserCheck,
  Users,
  CheckCircle2,
  Star,
  BarChart3,
} from 'lucide-react';
import { TfiJoomla } from 'react-icons/tfi';
import { GiSiren } from 'react-icons/gi';
import { FaHelicopter } from 'react-icons/fa';
import { MdFireTruck } from 'react-icons/md';
import { IoMedicalSharp } from 'react-icons/io5';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useUiStore } from '../../store/uiStore';
import { supabase } from '../../config/supabase';

interface NavLinkContentProps {
  isCollapsed: boolean;
  icon: ReactNode;
  text: string | null | undefined;
}

const NavLinkContent = ({ isCollapsed, icon, text }: NavLinkContentProps) => (
  <div className="flex items-center">
    {icon}
    {!isCollapsed && <span className="ml-3 tracking-wide">{text}</span>}
  </div>
);

export default function Sidebar() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const {
    sidebarMode,
    setSidebarCollapsed,
    setSidebarMode,
    isMobileMenuOpen,
    toggleMobileMenu,
  } = useUiStore();
  const [isAdminOpen, setIsAdminOpen] = useState(true);
  const timerRef = useRef<number | null>(null);

  const handleNavigation = (path: string) => {
    if (isMobileMenuOpen) {
      toggleMobileMenu(); // This triggers the useEffect cleanup -> history.back()
      // Small delay to ensure "back" completes before "push"
      setTimeout(() => navigate(path), 50);
    } else {
      navigate(path);
    }
  };

  const handleLinkClick = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    handleNavigation(path);
  };

  const handleLogout = async () => {
    logout();
    try {
      localStorage.removeItem('auth-storage');
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('sb-')) keysToRemove.push(key);
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
      await supabase.auth.signOut();
    } catch (e) {
      console.error('Logout error:', e);
    }
    window.location.href = '/login';
  };

  const handleMouseEnter = () => {
    if (sidebarMode !== 'hover') return;
    if (timerRef.current) clearTimeout(timerRef.current);
    setSidebarCollapsed(false);
  };

  const handleMouseLeave = () => {
    if (sidebarMode !== 'hover') return;
    timerRef.current = window.setTimeout(() => {
      setSidebarCollapsed(true);
    }, 20000);
  };

  // Handle Mobile Back Button
  const closedByBackRef = useRef(false);

  useEffect(() => {
    if (isMobileMenuOpen) {
      closedByBackRef.current = false;
      window.history.pushState({ sidebarOpen: true }, '');

      const handlePopState = () => {
        closedByBackRef.current = true;
        toggleMobileMenu();
      };

      window.addEventListener('popstate', handlePopState);

      return () => {
        window.removeEventListener('popstate', handlePopState);
        if (!closedByBackRef.current) {
          window.history.back();
        }
      };
    }
  }, [isMobileMenuOpen, toggleMobileMenu]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Sci-Fi Button Styles
  const navLinkClass =
    'flex items-center gap-3 rounded-md px-3 py-2.5 text-slate-400 transition-all duration-200 hover:text-cyan-300 hover:bg-cyan-500/5 hover:translate-x-1 focus:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/50 relative overflow-hidden group';

  const activeNavLinkClass =
    '!text-cyan-400 !bg-cyan-500/10 font-medium shadow-[inset_2px_0_0_0_#22d3ee] shadow-cyan-500/20';

  const resolvedCollapsed = false; // Always expanded for this design

  const renderSidebarContent = (isCollapsed: boolean) => (
    <div className="flex h-full flex-col bg-[#0a0d14]/95 backdrop-blur-xl border-r border-cyan-500/10 text-slate-300">

      {/* Metallic Header Section */}
      <div className="relative flex h-20 items-center justify-center border-b border-cyan-500/20 bg-gradient-to-b from-white/5 to-transparent">
        {/* Inner Glow Line */}
        <div className="absolute bottom-0 inset-x-0 h-[1px] bg-cyan-500/30 shadow-[0_0_10px_#22d3ee]" />

        {isCollapsed ? (
          <TfiJoomla className="text-cyan-400 text-3xl animate-pulse-slow" />
        ) : (
          <div className="flex flex-col items-center justify-center w-full group cursor-default">
            <h1 className="text-2xl font-black tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 group-hover:to-cyan-200 transition-colors">
              SISGPO
            </h1>
            <div className="h-0.5 w-12 bg-cyan-500/50 mt-1 rounded-full group-hover:w-24 group-hover:bg-cyan-400 transition-all duration-500 shadow-[0_0_8px_cyan]" />
          </div>
        )}
      </div>

      {/* Menu List */}
      <div className="flex-1 px-4 overflow-y-auto custom-scrollbar py-6 space-y-1">
        <p className="px-2 text-[10px] uppercase tracking-[0.2em] text-slate-600 font-bold mb-2">Principal</p>
        <ul className="space-y-1">
          <li>
            <NavLink to="/app/dashboard" onClick={(e) => handleLinkClick(e, '/app/dashboard')} className={({ isActive }) => `${navLinkClass} ${isActive ? activeNavLinkClass : ''}`}>
              <NavLinkContent isCollapsed={isCollapsed} icon={<Home className="w-5 h-5" />} text="Dashboard" />
            </NavLink>
          </li>
          <li>
            <NavLink to="/app/dashboard-ocorrencias" onClick={(e) => handleLinkClick(e, '/app/dashboard-ocorrencias')} className={({ isActive }) => `${navLinkClass} ${isActive ? activeNavLinkClass : ''}`}>
              <NavLinkContent isCollapsed={isCollapsed} icon={<GiSiren className="w-5 h-5" />} text="Ocorrências" />
            </NavLink>
          </li>
        </ul>

        <div className="pt-4 pb-2">
          <div className="h-[1px] bg-gradient-to-r from-transparent via-slate-800 to-transparent" />
        </div>

        <button
          onClick={() => setIsAdminOpen(!isAdminOpen)}
          className="w-full flex justify-between items-center px-2 py-2 text-[10px] uppercase tracking-[0.2em] text-slate-500 hover:text-cyan-400 transition-colors font-bold mb-1"
        >
          Administração
          <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${isAdminOpen ? 'rotate-180' : ''}`} />
        </button>

        <div className={`transition-all duration-300 overflow-hidden ${isAdminOpen ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}>
          <ul className="space-y-1">
            {user?.perfil === 'admin' && (
              <li>
                <NavLink to="/app/servico-dia" onClick={(e) => handleLinkClick(e, '/app/servico-dia')} className={({ isActive }) => `${navLinkClass} ${isActive ? activeNavLinkClass : ''}`}>
                  <NavLinkContent isCollapsed={isCollapsed} icon={<ClipboardList className="w-5 h-5" />} text="Serviço do Dia" />
                </NavLink>
              </li>
            )}
            <li>
              <NavLink to="/app/militares" onClick={(e) => handleLinkClick(e, '/app/militares')} className={({ isActive }) => `${navLinkClass} ${isActive ? activeNavLinkClass : ''}`}>
                <NavLinkContent isCollapsed={isCollapsed} icon={<Users className="w-5 h-5" />} text="Militares" />
              </NavLink>
            </li>
            <li>
              <NavLink to="/app/medicos" onClick={(e) => handleLinkClick(e, '/app/medicos')} className={({ isActive }) => `${navLinkClass} ${isActive ? activeNavLinkClass : ''}`}>
                <NavLinkContent isCollapsed={isCollapsed} icon={<IoMedicalSharp className="w-5 h-5" />} text="Médicos" />
              </NavLink>
            </li>
            <li>
              <NavLink to="/app/viaturas" onClick={(e) => handleLinkClick(e, '/app/viaturas')} className={({ isActive }) => `${navLinkClass} ${isActive ? activeNavLinkClass : ''}`}>
                <NavLinkContent isCollapsed={isCollapsed} icon={<MdFireTruck className="w-5 h-5" />} text="Viaturas" />
              </NavLink>
            </li>
            <li>
              <NavLink to="/app/aeronaves" onClick={(e) => handleLinkClick(e, '/app/aeronaves')} className={({ isActive }) => `${navLinkClass} ${isActive ? activeNavLinkClass : ''}`}>
                <NavLinkContent isCollapsed={isCollapsed} icon={<FaHelicopter className="w-5 h-5" />} text="Aeronaves" />
              </NavLink>
            </li>
            <li>
              <NavLink to="/app/obms" onClick={(e) => handleLinkClick(e, '/app/obms')} className={({ isActive }) => `${navLinkClass} ${isActive ? activeNavLinkClass : ''}`}>
                <NavLinkContent isCollapsed={isCollapsed} icon={<BellElectric className="w-5 h-5" />} text="OBMs" />
              </NavLink>
            </li>
            <li>
              <NavLink to="/app/comandantes-crbm" onClick={(e) => handleLinkClick(e, '/app/comandantes-crbm')} className={({ isActive }) => `${navLinkClass} ${isActive ? activeNavLinkClass : ''}`}>
                <NavLinkContent isCollapsed={isCollapsed} icon={<Star className="w-5 h-5" />} text="Comandantes CRBM" />
              </NavLink>
            </li>
            <li>
              <NavLink to="/app/plantoes" onClick={(e) => handleLinkClick(e, '/app/plantoes')} className={({ isActive }) => `${navLinkClass} ${isActive ? activeNavLinkClass : ''}`}>
                <NavLinkContent isCollapsed={isCollapsed} icon={<Shield className="w-5 h-5" />} text="Plantões" />
              </NavLink>
            </li>
            {user?.perfil === 'admin' && (
              <>
                <div className="pt-2"></div>
                <li>
                  <NavLink to="/app/usuarios" onClick={(e) => handleLinkClick(e, '/app/usuarios')} className={({ isActive }) => `${navLinkClass} ${isActive ? activeNavLinkClass : ''}`}>
                    <NavLinkContent isCollapsed={isCollapsed} icon={<UserCheck className="w-5 h-5" />} text="Usuários" />
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/app/metricas" onClick={(e) => handleLinkClick(e, '/app/metricas')} className={({ isActive }) => `${navLinkClass} ${isActive ? activeNavLinkClass : ''}`}>
                    <NavLinkContent isCollapsed={isCollapsed} icon={<BarChart3 className="w-5 h-5" />} text="Métricas" />
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/app/saude" onClick={(e) => handleLinkClick(e, '/app/saude')} className={({ isActive }) => `${navLinkClass} ${isActive ? activeNavLinkClass : ''}`}>
                    <NavLinkContent isCollapsed={isCollapsed} icon={<CheckCircle2 className="w-5 h-5" />} text="Saúde do Sistema" />
                  </NavLink>
                </li>
              </>
            )}
            {user?.perfil === 'admin' && (
              <>
                <div className="pt-4 pb-2">
                  <div className="h-[1px] bg-gradient-to-r from-transparent via-slate-800 to-transparent" />
                </div>
                <p className="px-2 text-[10px] uppercase tracking-[0.2em] text-slate-600 font-bold mb-2">Relatórios</p>
                <li>
                  <NavLink to="/app/relatorio" onClick={(e) => handleLinkClick(e, '/app/relatorio')} className={({ isActive }) => `${navLinkClass} ${isActive ? activeNavLinkClass : ''}`}>
                    <NavLinkContent isCollapsed={isCollapsed} icon={<FileText className="w-5 h-5" />} text="Escalas" />
                  </NavLink>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>

      {/* User / Footer Section - Mobile Only */}
      <div className="md:hidden p-4 border-t border-cyan-500/10 bg-gradient-to-t from-black/40 to-transparent">
        <NavLink
          to="/app/perfil"
          onClick={(e) => handleLinkClick(e, '/app/perfil')}
          className={({ isActive }) => `${navLinkClass} ${isActive ? activeNavLinkClass : ''} mb-2`}
        >
          <NavLinkContent isCollapsed={false} icon={<UserCheck className="w-5 h-5" />} text="Meu perfil" />
        </NavLink>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-red-400 hover:text-red-200 hover:bg-red-500/10 transition-colors group"
        >
          <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="tracking-wide">Sair</span>
        </button>
      </div>


    </div>
  );

  return (
    <aside
      className={`
        ${isMobileMenuOpen ? 'flex' : 'hidden'} md:flex flex-col 
        fixed left-0 z-50 transition-all duration-300 w-64
        h-full
      `}
      aria-label="Sidebar"
    >
      {renderSidebarContent(resolvedCollapsed)}
    </aside>
  );
}
