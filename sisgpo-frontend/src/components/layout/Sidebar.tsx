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
  BellElectric,
  X,
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
  const { isSidebarCollapsed, setSidebarCollapsed, isMobileMenuOpen, toggleMobileMenu } = useUiStore();
  const [isAdminOpen, setIsAdminOpen] = useState(true);
  const timerRef = useRef<number | null>(null);

  const handleMouseEnter = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setSidebarCollapsed(false); // Expand
  };

  const handleMouseLeave = () => {
    timerRef.current = window.setTimeout(() => {
      setSidebarCollapsed(true); // Collapse
    }, 20000);
  };

  useEffect(() => {
    // Limpa o timer quando o componente é desmontado
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleLinkClick = () => {
    if (isMobileMenuOpen) {
      toggleMobileMenu();
    }
  };

const navLinkClass =
  'flex items-center gap-3 rounded-lg px-3 py-2 text-white transition-colors hover:bg-tagBlue/20 hover:text-tagBlue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tagBlue focus-visible:ring-offset-2 focus-visible:ring-offset-background';
const activeNavLinkClass = 'bg-tagBlue/30 text-tagBlue border border-tagBlue/40 shadow-inner';

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
          <button onClick={toggleMobileMenu} className="absolute top-4 right-4 md:hidden p-2">
            <X size={24} className="text-white" />
          </button>
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

      <div className="w-full px-3 pb-4 space-y-2 border-t border-borderDark/60 bg-cardSlate">
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
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black bg-opacity-50 md:hidden"
          onClick={toggleMobileMenu}
        ></div>
      )}

      {/* Sidebar for Mobile */}
      <aside
        id="logo-sidebar-mobile"
        className={`flex flex-col fixed top-0 left-0 z-40 h-screen w-64 border-r border-borderDark/60 bg-transparent backdrop-filter backdrop-blur-strong transition-transform duration-300 md:hidden ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        aria-label="Sidebar"
      >
        {renderSidebarContent(false)}
      </aside>

      {/* Sidebar for Desktop */}
      <aside
        id="logo-sidebar-desktop"
        className={`hidden md:flex flex-col fixed top-0 left-0 z-40 h-screen transition-all duration-300 ${isSidebarCollapsed ? 'w-20' : 'w-64'
          } border-r border-borderDark/60 bg-transparent backdrop-filter backdrop-blur-strong`}
        aria-label="Sidebar"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {renderSidebarContent(isSidebarCollapsed)}
      </aside>
    </>
  );
}
