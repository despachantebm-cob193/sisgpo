import { useState, ReactNode, useRef, useEffect } from 'react';
import {
  ClipboardList,
  FileText,
  Home,
  LogOut,
  BellElectric,
  ChevronDown,
  ChevronsLeftRight,
  Shield,
  UserCheck,
  Users,
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
    {!isCollapsed && <span className="ml-3">{text}</span>}
  </div>
);

export default function Sidebar() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const {
    isSidebarCollapsed,
    sidebarMode,
    setSidebarCollapsed,
    setSidebarMode,
    isMobileMenuOpen,
    toggleMobileMenu,
  } = useUiStore();
  const [isAdminOpen, setIsAdminOpen] = useState(true);
  /* Removed useState isControlOpen */
  /* Removed useState isControlOpen */
  const timerRef = useRef<number | null>(null);

  /* Simple toggle function */
  const handleToggleMode = () => {
    if (sidebarMode === 'expanded') {
      setSidebarMode('hover');
    } else {
      setSidebarMode('expanded');
    }
  };

  const handleLinkClick = () => {
    if (isMobileMenuOpen) {
      toggleMobileMenu();
    }
  };

  const handleLogout = async () => {
    // Limpa store e storage local
    logout();
    try {
      localStorage.removeItem('auth-storage');
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('sb-')) keysToRemove.push(key);
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch (e) {
      console.error('Erro ao limpar localStorage:', e);
    }

    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error('Erro ao fazer signOut no Supabase:', e);
    }

    handleLinkClick();
    window.location.href = '/login';
  };

  const handleMouseEnter = () => {
    if (sidebarMode !== 'hover') return;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setSidebarCollapsed(false);
  };

  const handleMouseLeave = () => {
    if (sidebarMode !== 'hover') return;
    timerRef.current = window.setTimeout(() => {
      setSidebarCollapsed(true);
    }, 20000); // 20 seconds delay
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const navLinkClass =
    'flex items-center gap-3 rounded-lg px-3 py-2 text-white transition-colors hover:bg-tagBlue/20 hover:text-tagBlue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tagBlue focus-visible:ring-offset-2 focus-visible:ring-offset-background';
  const activeNavLinkClass = 'bg-tagBlue/30 text-tagBlue border border-tagBlue/40 shadow-inner';

  // Always expanded, except on mobile when menu is closed
  const resolvedCollapsed = isMobileMenuOpen ? false : false;

  const renderSidebarContent = (isCollapsed: boolean) => (
    <div className="flex h-full flex-col bg-transparent text-white border-r border-borderDark/60 backdrop-filter backdrop-blur-sm">
      <div className="px-3">
        <div
          className={`relative flex h-16 items-center ${isCollapsed ? 'justify-center' : 'justify-center'
            }`}>
          {isCollapsed ? (
            <TfiJoomla className="text-white text-3xl" />
          ) : (
            <div className="flex items-center justify-center w-full">
              <h1 className="text-xl font-bold text-white">SISGPO</h1>
            </div>
          )}
        </div>
      </div>

      <div className="px-3">
        <div className="border-t border-gray-600"></div>
      </div>

      <div className="flex-1 px-3 overflow-y-auto">
        <ul className="space-y-2 pt-4 font-medium pb-24">
          <li>
            <NavLink
              to="/app/dashboard"
              onClick={handleLinkClick}
              className={({ isActive }) =>
                `${navLinkClass} ${isActive ? activeNavLinkClass : ''}`
              }
            >
              <NavLinkContent
                isCollapsed={isCollapsed}
                icon={<Home className="mr-3 h-6 w-6" />}
                text="Dashboard"
              />
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/app/dashboard-ocorrencias"
              onClick={handleLinkClick}
              className={({ isActive }) =>
                `${navLinkClass} ${isActive ? activeNavLinkClass : ''}`
              }
            >
              <NavLinkContent
                isCollapsed={isCollapsed}
                icon={<GiSiren className="mr-3 h-6 w-6" />}
                text="Ocorrências"
              />
            </NavLink>
          </li>


          <button
            onClick={() => setIsAdminOpen(!isAdminOpen)}
            className={`w-full flex justify-between items-center p-2 text-xs text-white ${isCollapsed ? 'hidden' : ''
              }`}
          >
            ADMINISTRAÇÃO
            <ChevronDown
              className={`transition-transform duration-200 ${isAdminOpen ? 'rotate-180' : ''
                }`}
            />
          </button>
          <div
            className={`transition-all duration-300 overflow-hidden ${!isCollapsed
              ? isAdminOpen
                ? 'max-h-screen'
                : 'max-h-0'
              : 'max-h-screen'
              }`}
          >
            <ul
              className={`space-y-2 font-medium ${!isCollapsed ? 'pl-4' : ''
                }`}
            >
              <li>
                <NavLink
                  to="/app/servico-dia"
                  onClick={handleLinkClick}
                  className={({ isActive }) =>
                    `${navLinkClass} ${isActive ? activeNavLinkClass : ''}`
                  }
                >
                  <NavLinkContent
                    isCollapsed={isCollapsed}
                    icon={<ClipboardList className="mr-3 h-6 w-6" />}
                    text="Serviço do Dia"
                  />
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/app/militares"
                  onClick={handleLinkClick}
                  className={({ isActive }) =>
                    `${navLinkClass} ${isActive ? activeNavLinkClass : ''}`
                  }
                >
                  <NavLinkContent
                    isCollapsed={isCollapsed}
                    icon={<Users className="mr-3 h-6 w-6" />}
                    text="Militares"
                  />
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/app/medicos"
                  onClick={handleLinkClick}
                  className={({ isActive }) =>
                    `${navLinkClass} ${isActive ? activeNavLinkClass : ''}`
                  }
                >
                  <NavLinkContent
                    isCollapsed={isCollapsed}
                    icon={<IoMedicalSharp className="mr-3 h-6 w-6" />}
                    text="Médicos"
                  />
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/app/viaturas"
                  onClick={handleLinkClick}
                  className={({ isActive }) =>
                    `${navLinkClass} ${isActive ? activeNavLinkClass : ''}`
                  }
                >
                  <NavLinkContent
                    isCollapsed={isCollapsed}
                    icon={<MdFireTruck className="mr-3 h-6 w-6" />}
                    text="Viaturas"
                  />
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/app/aeronaves"
                  onClick={handleLinkClick}
                  className={({ isActive }) =>
                    `${navLinkClass} ${isActive ? activeNavLinkClass : ''}`
                  }
                >
                  <NavLinkContent
                    isCollapsed={isCollapsed}
                    icon={<FaHelicopter className="mr-3 h-6 w-6" />}
                    text="Aeronaves"
                  />
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/app/obms"
                  onClick={handleLinkClick}
                  className={({ isActive }) =>
                    `${navLinkClass} ${isActive ? activeNavLinkClass : ''}`
                  }
                >
                  <NavLinkContent
                    isCollapsed={isCollapsed}
                    icon={<BellElectric className="mr-3 h-6 w-6" />}
                    text="OBMs"
                  />
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/app/comandantes-crbm"
                  onClick={handleLinkClick}
                  className={({ isActive }) =>
                    `${navLinkClass} ${isActive ? activeNavLinkClass : ''}`
                  }
                >
                  <NavLinkContent
                    isCollapsed={isCollapsed}
                    icon={<Shield className="mr-3 h-6 w-6" />}
                    text="Comandantes CRBM"
                  />
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/app/plantoes"
                  onClick={handleLinkClick}
                  className={({ isActive }) =>
                    `${navLinkClass} ${isActive ? activeNavLinkClass : ''}`
                  }
                >
                  <NavLinkContent
                    isCollapsed={isCollapsed}
                    icon={<Shield className="mr-3 h-6 w-6" />}
                    text="Plantões"
                  />
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/app/usuarios"
                  onClick={handleLinkClick}
                  className={({ isActive }) =>
                    `${navLinkClass} ${isActive ? activeNavLinkClass : ''}`
                  }
                >
                  <NavLinkContent
                    isCollapsed={isCollapsed}
                    icon={<UserCheck className="mr-3 h-6 w-6" />}
                    text="Usuários"
                  />
                </NavLink>
              </li>
            </ul>
          </div>


          <p
            className={`px-2 pt-2 text-white ${isCollapsed ? 'hidden' : ''
              }`}
          >
            RELATÓRIOS
          </p>
          <li>
            <NavLink
              to="/app/relatorio"
              onClick={handleLinkClick}
              className={({ isActive }) =>
                `${navLinkClass} ${isActive ? activeNavLinkClass : ''}`
              }
            >
              <NavLinkContent
                isCollapsed={isCollapsed}
                icon={<FileText className="mr-3 h-6 w-6" />}
                text="Relatório de Escala"
              />
            </NavLink>
          </li>
        </ul>
      </div>


      {/* Ações rápidas (mobile) */}
      <div className="px-3 pb-4 md:hidden border-t border-borderDark/60">
        <div className="mt-3 space-y-2">
          <NavLink
            to="/app/perfil"
            onClick={handleLinkClick}
            className={({ isActive }) =>
              `${navLinkClass} ${isActive ? activeNavLinkClass : ''}`
            }
          >
            <NavLinkContent
              isCollapsed={false}
              icon={<UserCheck className="mr-3 h-6 w-6" />}
              text="Meu perfil"
            />
          </NavLink>
          <button
            onClick={handleLogout}
            className={`${navLinkClass} justify-start w-full bg-red-600/10 hover:bg-red-600/20 text-red-200 border border-red-600/30`}
          >
            <LogOut className="mr-3 h-6 w-6" />
            <span>Sair</span>
          </button>
        </div>
      </div>

    </div>
  );

  return (
    <>
      <aside
        className={`${isMobileMenuOpen ? 'flex' : 'hidden'} md:flex flex-col fixed left-0 z-50 transition-all duration-300 ${resolvedCollapsed ? 'w-20' : 'w-64'
          } border-r border-borderDark/60 bg-[#0b0f1a]/95 backdrop-filter backdrop-blur-strong top-16 md:top-0 bottom-0`}
        aria-label="Sidebar"
      >
        {renderSidebarContent(resolvedCollapsed)}
      </aside>
    </>
  );
}
