import { useState, ReactNode, useRef, useEffect } from 'react';
import {
  ClipboardList,
  FileText,
  Home,
  LogOut,
  Settings,
  Shield,
  UserCheck,
  Users,
  ChevronDown,
  ChevronsLeftRight,
  BellElectric,
} from 'lucide-react';
import { TfiJoomla } from 'react-icons/tfi';
import { GiSiren } from 'react-icons/gi';
import { FaHelicopter } from 'react-icons/fa';
import { MdFireTruck } from 'react-icons/md';
import { IoMedicalSharp } from 'react-icons/io5';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useUiStore } from '../../store/uiStore';

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
  const [isControlOpen, setIsControlOpen] = useState(false);
  const timerRef = useRef<number | null>(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleLinkClick = () => {
    // fechar popover de controle ao navegar
    setIsControlOpen(false);
    if (isMobileMenuOpen) {
      toggleMobileMenu();
    }
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
    }, 20000);
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

  const resolvedCollapsed =
    isMobileMenuOpen
      ? false
      : sidebarMode === 'expanded'
        ? false
        : sidebarMode === 'collapsed'
          ? true
          : isSidebarCollapsed;

  const modeOptions: { value: 'expanded' | 'collapsed' | 'hover'; label: string }[] = [
    { value: 'expanded', label: 'Expandido' },
    { value: 'collapsed', label: 'Recolhido' },
    { value: 'hover', label: 'Expandir ao passar' },
  ];

  const handleModeChange = (mode: 'expanded' | 'collapsed' | 'hover') => {
    setSidebarMode(mode);
    // setSidebarMode já sincroniza isSidebarCollapsed, mas garantimos o estado imediato.
    if (mode === 'expanded') {
      setSidebarCollapsed(false);
    } else {
      setSidebarCollapsed(true);
    }
  };

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

          {user?.perfil === 'admin' && (
            <>
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
            </>
          )}

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

      <div className="relative w-full px-3 pb-4 space-y-2 border-t border-borderDark/60 bg-cardSlate">
        <div className="relative rounded-lg border border-borderDark/60 bg-cardSlate/80 p-2 shadow-sm">
          <button
            type="button"
            onClick={() => setIsControlOpen((open) => !open)}
            className={`flex w-full items-center justify-between rounded-md px-2 py-1 text-xs text-gray-200 hover:bg-borderDark/40 transition ${
              isCollapsed ? 'justify-center' : ''
            }`}
            aria-expanded={isControlOpen}
            aria-controls="sidebar-control-panel"
            title="Controle do menu"
          >
            <div className="flex items-center gap-2">
              <ChevronsLeftRight size={16} className="text-tagBlue" />
              {!isCollapsed && <span className="font-semibold">Controle do menu</span>}
            </div>
            {!isCollapsed && (
              <ChevronDown
                size={16}
                className={`transition-transform ${isControlOpen ? 'rotate-180' : ''}`}
              />
            )}
          </button>

          {isControlOpen && (
            <div
              id="sidebar-control-panel"
              className="absolute bottom-full left-0 mb-2 w-full rounded-lg border border-borderDark/60 bg-cardSlate/95 p-2 shadow-2xl z-20"
            >
              {modeOptions.map((option) => {
                const isActive = sidebarMode === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      handleModeChange(option.value);
                      setIsControlOpen(false);
                    }}
                    className={`flex w-full items-center gap-2 rounded-md px-2 py-1 text-xs transition ${
                      isActive
                        ? 'bg-tagBlue/20 text-tagBlue border border-tagBlue/30'
                        : 'text-gray-300 hover:bg-borderDark/40'
                    }`}
                  >
                    <span
                      className={`h-2.5 w-2.5 rounded-full border ${
                        isActive ? 'border-tagBlue bg-tagBlue' : 'border-gray-500'
                      }`}
                    />
                    {!isCollapsed && <span className="truncate">{option.label}</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex flex-col space-y-2 pt-2">
          <NavLink
            to="/app/perfil"
            onClick={handleLinkClick}
            className={({ isActive }) =>
              `${navLinkClass} ${isActive ? activeNavLinkClass : ''}`
            }
          >
            <NavLinkContent
              isCollapsed={isCollapsed}
              icon={<Settings className="mr-3 h-6 w-6" />}
              text={user?.nome}
            />
          </NavLink>
          <button
            onClick={handleLogout}
            className={`w-full rounded-lg bg-red-600 text-white font-semibold shadow-sm transition hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 ${isCollapsed ? 'px-0 py-2.5 flex justify-center' : 'px-3 py-2.5 flex items-center justify-center'}`}
          >
            <LogOut className={`${isCollapsed ? '' : 'mr-3'} h-6 w-6`} />
            {!isCollapsed && "Sair"}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside
        className={`${isMobileMenuOpen ? 'flex' : 'hidden'} md:flex flex-col fixed top-0 left-0 z-50 h-screen transition-all duration-300 ${resolvedCollapsed ? 'w-20' : 'w-64'
          } border-r border-borderDark/60 bg-transparent backdrop-filter backdrop-blur-strong`}
        aria-label="Sidebar"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {renderSidebarContent(resolvedCollapsed)}
      </aside>
    </>
  );
}
