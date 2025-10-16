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
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const navLinkClass =
  'flex items-center p-2 text-gray-100 rounded-lg dark:text-white hover:bg-gray-700 dark:hover:bg-gray-700';
const activeNavLinkClass = 'bg-gray-700 dark:bg-gray-700';

function Sidebar() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside
      id="logo-sidebar"
      className="fixed top-0 left-0 z-40 w-64 h-screen pt-5 transition-transform -translate-x-full bg-gray-800 border-r sm:translate-x-0 dark:bg-gray-800 dark:border-gray-700"
      aria-label="Sidebar"
    >
      <div className="h-full px-3 pb-4 overflow-y-auto bg-gray-800 dark:bg-gray-800">
        <div className="p-4 mb-5 border-b border-gray-700">
          <h1 className="text-xl font-bold">SISGPO</h1>
          <p className="text-sm text-gray-400">
            Sistema de Gerenciamento de Pessoal Operacional
          </p>
        </div>

        <ul className="space-y-2 font-medium">
          <li>
            <NavLink
              to="/app/dashboard"
              className={({ isActive }) =>
                `${navLinkClass} ${isActive ? activeNavLinkClass : ''}`
              }
            >
              <Home className="mr-3" />
              Dashboard
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/app/dashboard-ocorrencias"
              className={({ isActive }) =>
                `${navLinkClass} ${isActive ? activeNavLinkClass : ''}`
              }
            >
              <FileStack className="mr-3" />
              Ocorrências
            </NavLink>
          </li>
          
          {/* Agora 'user.perfil' será reconhecido pelo TypeScript */}
          {user?.perfil === 'admin' && (
            <>
              <p className="px-2 pt-2 text-xs text-gray-400">ADMINISTRAÇÃO</p>
              <li>
                <NavLink
                  to="/app/servico-dia"
                  className={({ isActive }) =>
                    `${navLinkClass} ${isActive ? activeNavLinkClass : ''}`
                  }
                >
                  <ClipboardList className="mr-3" />
                  Serviço do Dia
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/app/militares"
                  className={({ isActive }) =>
                    `${navLinkClass} ${isActive ? activeNavLinkClass : ''}`
                  }
                >
                  <Users className="mr-3" />
                  Militares
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/app/medicos"
                  className={({ isActive }) =>
                    `${navLinkClass} ${isActive ? activeNavLinkClass : ''}`
                  }
                >
                  <UserPlus className="mr-3" />
                  Médicos
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/app/viaturas"
                  className={({ isActive }) =>
                    `${navLinkClass} ${isActive ? activeNavLinkClass : ''}`
                  }
                >
                  <Truck className="mr-3" />
                  Viaturas
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/app/aeronaves"
                  className={({ isActive }) =>
                    `${navLinkClass} ${isActive ? activeNavLinkClass : ''}`
                  }
                >
                  <Ship className="mr-3" />
                  Aeronaves
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/app/obms"
                  className={({ isActive }) =>
                    `${navLinkClass} ${isActive ? activeNavLinkClass : ''}`
                  }
                >
                  <Pyramid className="mr-3" />
                  OBMs
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/app/plantoes"
                  className={({ isActive }) =>
                    `${navLinkClass} ${isActive ? activeNavLinkClass : ''}`
                  }
                >
                  <Shield className="mr-3" />
                  Plantões
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/app/usuarios"
                  className={({ isActive }) =>
                    `${navLinkClass} ${isActive ? activeNavLinkClass : ''}`
                  }
                >
                  <UserCheck className="mr-3" />
                  Usuários
                </NavLink>
              </li>
            </>
          )}
          <p className="px-2 pt-2 text-xs text-gray-400">RELATÓRIOS</p>
          <li>
            <NavLink
              to="/app/relatorio"
              className={({ isActive }) =>
                `${navLinkClass} ${isActive ? activeNavLinkClass : ''}`
              }
            >
              <FileText className="mr-3" />
              Relatório de Escala
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
              <Settings className="mr-3" />
              {/* Agora 'user.login' será reconhecido pelo TypeScript */}
              {user?.login}
            </NavLink>
            <button onClick={handleLogout} className={`${navLinkClass} w-full`}>
              <LogOut className="mr-3" />
              Sair
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;