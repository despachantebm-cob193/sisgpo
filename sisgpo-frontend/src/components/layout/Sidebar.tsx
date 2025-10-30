import { useState, ReactNode } from 'react';
import {
  ClipboardList,
  FileText,
  Home,
  LogOut,
  Settings,
  Shield,
  Truck,
  UserCheck,
  Users,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
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
  const { isSidebarCollapsed, toggleSidebar, isMobileMenuOpen, toggleMobileMenu } = useUiStore();
  const [isAdminOpen, setIsAdminOpen] = useState(true);

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
    'flex items-center p-2 text-gray-100 rounded-lg dark:text-white hover:bg-gray-700 dark:hover:bg-gray-700';
  const activeNavLinkClass = 'bg-gray-700 dark:bg-gray-700';

  const renderSidebarContent = (isCollapsed: boolean) => (
    <div className="h-full flex flex-col bg-gray-800 dark:bg-gray-800">
    <div className="px-3">
      <div
        className={`relative flex h-16 items-center border-b border-gray-700 ${isCollapsed ? 'justify-center' : 'justify-between'
          }`}>
        {isCollapsed ? (
          <TfiJoomla className="text-white text-3xl" />
        ) : (
          <div className="flex items-center">
            <TfiJoomla className="text-white mr-2 text-2xl" />
            <div>
              <h1 className="text-xl font-bold text-white">SISGPO</h1>
            </div>
          </div>
        )}
        <button onClick={toggleMobileMenu} className="absolute top-4 right-4 md:hidden p-2">
            <X size={24} className="text-white" />
        </button>
      </div>
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
                className={`w-full flex justify-between items-center p-2 text-xs text-gray-400 ${isCollapsed ? 'hidden' : ''
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
            className={`px-2 pt-2 text-xs text-gray-400 ${isCollapsed ? 'hidden' : ''
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

      <div className="px-3 pb-4 justify-center space-y-2 w-full bg-gray-800 dark:bg-gray-800 border-t border-gray-700">
        <button onClick={toggleSidebar} className={`${navLinkClass} w-full hidden md:flex`}>
          <NavLinkContent
            isCollapsed={isCollapsed}
            icon={isCollapsed ? <ChevronsRight className="mr-3 h-6 w-6" /> : <ChevronsLeft className="mr-3 h-6 w-6" />}
            text="Recolher"
          />
        </button>
        <div className="p-2 border-t border-gray-700 flex flex-col space-y-2">
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
              text={user?.login}
            />
          </NavLink>
          <button onClick={handleLogout} className={`${navLinkClass} w-full`}>
            <NavLinkContent
              isCollapsed={isCollapsed}
              icon={<LogOut className="mr-3 h-6 w-6" />}
              text="Sair"
            />
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
        className={`flex flex-col fixed top-0 left-0 z-40 h-screen w-64 bg-gray-800 transition-transform duration-300 md:hidden ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        aria-label="Sidebar"
      >
        {renderSidebarContent(false)}
      </aside>

      {/* Sidebar for Desktop */}
      <aside
        id="logo-sidebar-desktop"
        className={`hidden md:flex flex-col fixed top-0 left-0 z-40 h-screen transition-all duration-300 ${isSidebarCollapsed ? 'w-20' : 'w-64'
          } bg-gray-800 border-r dark:bg-gray-800 dark:border-gray-700`}
        aria-label="Sidebar"
      >
        {renderSidebarContent(isSidebarCollapsed)}
      </aside>
    </>
  );
}
