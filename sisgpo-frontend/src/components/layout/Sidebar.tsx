
import { useState } from 'react';
import {
  ClipboardList,
  FileStack,
  FileText,
  Home,
  LogOut,
  Pyramid,
  Settings,
  Shield,
  Ship,
  Truck,
  UserCheck,
  UserPlus,
  Users,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useUiStore } from '../../store/uiStore'; // Importe o store da UI

const NavLinkContent = ({ isCollapsed, icon, text }) => (
  <div className="flex items-center">
    {icon}
    {!isCollapsed && <span className="ml-3">{text}</span>}
  </div>
);

function Sidebar() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { isSidebarCollapsed, toggleSidebar } = useUiStore(); // Use o estado global
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
      className={`fixed top-0 left-0 z-40 h-screen pt-5 transition-all duration-300 ${
        isSidebarCollapsed ? 'w-20' : 'w-64'
      } bg-gray-800 border-r dark:bg-gray-800 dark:border-gray-700`}
      aria-label="Sidebar"
    >
      <div className="h-full px-3 pb-4 overflow-y-auto bg-gray-800 dark:bg-gray-800">
        <div
          className={`p-4 mb-5 border-b border-gray-700 ${
            isSidebarCollapsed ? 'text-center' : ''
          }`}
        >
          <h1 className={`text-xl font-bold ${isSidebarCollapsed ? 'hidden' : ''}`}>
            SISGPO
          </h1>
          <p
            className={`text-sm text-gray-400 ${
              isSidebarCollapsed ? 'hidden' : ''
            }`}
          >
            Sistema de Gerenciamento
          </p>
          <button
            onClick={toggleSidebar} // Use a função do store
            className="absolute top-4 right-[-12px] bg-gray-700 text-white p-1 rounded-full"
          >
            <ChevronRight
              className={`transition-transform duration-300 ${
                isSidebarCollapsed ? '' : 'rotate-180'
              }`}
            />
          </button>
        </div>

        <ul className="space-y-2 font-medium">
          <li>
            <NavLink
              to="/app/dashboard"
              className={({ isActive }) =>
                `${navLinkClass} ${isActive ? activeNavLinkClass : ''}`
              }
            >
              <NavLinkContent
                isCollapsed={isSidebarCollapsed}
                icon={<Home className="mr-3" />}
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
                icon={<FileStack className="mr-3" />}
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
                  isAdminOpen && !isSidebarCollapsed ? 'max-h-screen' : 'max-h-0'
                }`}
              >
                <ul className="space-y-2 font-medium pl-4">
                  <li>
                    <NavLink
                      to="/app/servico-dia"
                      className={({ isActive }) =>
                        `${navLinkClass} ${isActive ? activeNavLinkClass : ''}`
                      }
                    >
                      <NavLinkContent
                        isCollapsed={isSidebarCollapsed}
                        icon={<ClipboardList className="mr-3" />}
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
                        icon={<Users className="mr-3" />}
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
                        icon={<UserPlus className="mr-3" />}
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
                        icon={<Truck className="mr-3" />}
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
                        icon={<Ship className="mr-3" />}
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
                        icon={<Pyramid className="mr-3" />}
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
                        icon={<Shield className="mr-3" />}
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
                        icon={<UserCheck className="mr-3" />}
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
                icon={<FileText className="mr-3" />}
                text="Relatório de Escala"
              />
            </NavLink>
          </li>
        </ul>

        <div className="absolute bottom-0 left-0 justify-center p-4 space-y-2 w-full bg-gray-800 dark:bg-gray-800 dark:border-gray-700">
          <div className="p-2 border-t border-gray-700">
            <NavLink
              to="/app/perfil"
              className={({ isActive }) =>
                `${navLinkClass} ${isActive ? activeNavLinkClass : ''}`
              }
            >
              <NavLinkContent
                isCollapsed={isSidebarCollapsed}
                icon={<Settings className="mr-3" />}
                text={user?.login}
              />
            </NavLink>
            <button onClick={handleLogout} className={`${navLinkClass} w-full`}>
              <NavLinkContent
                isCollapsed={isSidebarCollapsed}
                icon={<LogOut className="mr-3" />}
                text="Sair"
              />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
