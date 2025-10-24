import { useState, ReactNode } from 'react';
import {
  ClipboardList,
  FileStack,
  FileText,
  Home,
  LogOut,
  Pyramid,
  Settings,
  Shield,
  Plane,
  Truck,
  UserCheck,
  UserPlus,
  Users,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  GaugeCircle, // Adicionado
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
  const { isSidebarCollapsed, toggleSidebar } = useUiStore();
  const [isAdminOpen, setIsAdminOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinkClass =
    'flex items-center p-2 text-gray-100 rounded-lg dark:text-white hover:bg-gray-700 dark:hover:bg-gray-700';
  const activeNavLinkClass = 'bg-gray-700 dark:bg-gray-700';

  return (
        <aside
          id="logo-sidebar"
          className={`flex flex-col fixed top-0 left-0 z-40 h-screen transition-all duration-300 ${isSidebarCollapsed ? 'w-0 md:w-20' : 'w-64'} bg-gray-800 border-r dark:bg-gray-800 dark:border-gray-700`}
          aria-label="Sidebar"
        >
      <div className="h-full px-3 pb-4 overflow-y-auto bg-gray-800 dark:bg-gray-800">
        <div
          className={`relative flex h-16 items-center border-b border-gray-700 px-6 ${
            isSidebarCollapsed ? 'justify-center' : 'justify-between'
          }`}
        >
          {isSidebarCollapsed ? (
            <TfiJoomla className="text-white text-3xl" />
          ) : (
            <div className="flex items-center">
              <TfiJoomla className="text-white mr-2 text-2xl" />
              <div>
                <h1 className="text-xl font-bold text-white">SISGPO</h1>
              </div>
            </div>
          )}
        </div>

        <ul className="space-y-2 pt-4 font-medium">
          <li>
            <NavLink
              to="/app/dashboard"
              className={({ isActive }) =>
                `${navLinkClass} ${isActive ? activeNavLinkClass : ''}`
              }
            >
              <NavLinkContent
                isCollapsed={isSidebarCollapsed}
                icon={<Home className="mr-3 h-6 w-6" />}
                text="Dashboard"
              />
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/app/dashboard-ocorrencias"
              className={({ isActive }) =>
                `${navLinkClass} ${isActive ? activeNavLinkClass : ''}`
              }
            >
              <NavLinkContent
                isCollapsed={isSidebarCollapsed}
                icon={<GiSiren className="mr-3 h-6 w-6" />}
                text="Ocorrências"
              />
            </NavLink>
          </li>

          {user?.perfil === 'admin' && (
            <>
              <button
                onClick={() => setIsAdminOpen(!isAdminOpen)}
                className={`w-full flex justify-between items-center p-2 text-xs text-gray-400 ${
                  isSidebarCollapsed ? 'hidden' : ''
                }`}
              >
                ADMINISTRAÇÃO
                <ChevronDown
                  className={`transition-transform duration-200 ${
                    isAdminOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
              <div
                className={`transition-all duration-300 overflow-hidden ${
                  !isSidebarCollapsed
                    ? isAdminOpen
                      ? 'max-h-screen'
                      : 'max-h-0'
                    : 'max-h-screen'
                }`}
              >
                <ul
                  className={`space-y-2 font-medium ${
                    !isSidebarCollapsed ? 'pl-4' : ''
                  }`}
                >
                  <li>
                    <NavLink
                      to="/app/servico-dia"
                      className={({ isActive }) =>
                        `${navLinkClass} ${isActive ? activeNavLinkClass : ''}`
                      }
                    >
                      <NavLinkContent
                        isCollapsed={isSidebarCollapsed}
                        icon={<ClipboardList className="mr-3 h-6 w-6" />}
                        text="Serviço do Dia"
                      />
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/app/militares"
                      className={({ isActive }) =>
                        `${navLinkClass} ${isActive ? activeNavLinkClass : ''}`
                      }
                    >
                      <NavLinkContent
                        isCollapsed={isSidebarCollapsed}
                        icon={<Users className="mr-3 h-6 w-6" />}
                        text="Militares"
                      />
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/app/medicos"
                      className={({ isActive }) =>
                        `${navLinkClass} ${isActive ? activeNavLinkClass : ''}`
                      }
                    >
                      <NavLinkContent
                        isCollapsed={isSidebarCollapsed}
                        icon={<IoMedicalSharp className="mr-3 h-6 w-6" />}
                        text="Médicos"
                      />
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/app/viaturas"
                      className={({ isActive }) =>
                        `${navLinkClass} ${isActive ? activeNavLinkClass : ''}`
                      }
                    >
                      <NavLinkContent
                        isCollapsed={isSidebarCollapsed}
                        icon={<MdFireTruck className="mr-3 h-6 w-6" />}
                        text="Viaturas"
                      />
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/app/aeronaves"
                      className={({ isActive }) =>
                        `${navLinkClass} ${isActive ? activeNavLinkClass : ''}`
                      }
                    >
                      <NavLinkContent
                        isCollapsed={isSidebarCollapsed}
                        icon={<FaHelicopter className="mr-3 h-6 w-6" />}
                        text="Aeronaves"
                      />
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/app/obms"
                      className={({ isActive }) =>
                        `${navLinkClass} ${isActive ? activeNavLinkClass : ''}`
                      }
                    >
                      <NavLinkContent
                        isCollapsed={isSidebarCollapsed}
                        icon={<BellElectric className="mr-3 h-6 w-6" />}
                        text="OBMs"
                      />
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/app/plantoes"
                      className={({ isActive }) =>
                        `${navLinkClass} ${isActive ? activeNavLinkClass : ''}`
                      }
                    >
                      <NavLinkContent
                        isCollapsed={isSidebarCollapsed}
                        icon={<Shield className="mr-3 h-6 w-6" />}
                        text="Plantões"
                      />
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/app/usuarios"
                      className={({ isActive }) =>
                        `${navLinkClass} ${isActive ? activeNavLinkClass : ''}`
                      }
                    >
                      <NavLinkContent
                        isCollapsed={isSidebarCollapsed}
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
            className={`px-2 pt-2 text-xs text-gray-400 ${
              isSidebarCollapsed ? 'hidden' : ''
            }`}
          >
            RELATÓRIOS
          </p>
          <li>
            <NavLink
              to="/app/relatorio"
              className={({ isActive }) =>
                `${navLinkClass} ${isActive ? activeNavLinkClass : ''}`
              }
            >
              <NavLinkContent
                isCollapsed={isSidebarCollapsed}
                icon={<FileText className="mr-3 h-6 w-6" />}
                text="Relatório de Escala"
              />
            </NavLink>
          </li>
        </ul>

        <div className="absolute bottom-0 left-0 justify-center p-4 space-y-2 w-full bg-gray-800 dark:bg-gray-800">
          <button onClick={toggleSidebar} className={`${navLinkClass} w-full`}>
            <NavLinkContent
              isCollapsed={isSidebarCollapsed}
              icon={isSidebarCollapsed ? <ChevronsRight className="mr-3 h-6 w-6" /> : <ChevronsLeft className="mr-3 h-6 w-6" />}
              text="Recolher"
            />
          </button>
          <div className="p-2 border-t border-gray-700">
            <NavLink
              to="/app/perfil"
              className={({ isActive }) =>
                `${navLinkClass} ${isActive ? activeNavLinkClass : ''}`
              }
            >
              <NavLinkContent
                isCollapsed={isSidebarCollapsed}
                icon={<Settings className="mr-3 h-6 w-6" />}
                text={user?.login}
              />
            </NavLink>
            <button onClick={handleLogout} className={`${navLinkClass} w-full`}>
              <NavLinkContent
                isCollapsed={isSidebarCollapsed}
                icon={<LogOut className="mr-3 h-6 w-6" />}
                text="Sair"
              />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
