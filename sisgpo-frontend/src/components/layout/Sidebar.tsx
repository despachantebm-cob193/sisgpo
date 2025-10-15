  import { Link, NavLink } from 'react-router-dom';
  import { useAuthStore } from '../../store/authStore';
  import {
    LayoutDashboard,
    Users,
    Building,
    Calendar,
    Car,
    FileText,
    User,
    LogOut,
    BarChart2,
    Stethoscope,
    Sun,
    Shield,
  } from 'lucide-react';

  const Sidebar = () => {
    const logout = useAuthStore(state => state.logout);
    const user = useAuthStore(state => state.user);

    const navLinkClass =
      'flex items-center px-4 py-2 text-gray-400 rounded-md hover:bg-gray-700 hover:text-white';
    const activeNavLinkClass = 'bg-gray-700 text-white';

    return (
      <aside className="w-64 bg-gray-800 text-white flex flex-col">
        <div className="h-16 flex items-center justify-center text-2xl font-bold border-b border-gray-700">
          <Link to="/">SISGPO</Link>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `${navLinkClass} ${isActive ? activeNavLinkClass : ''}`
            }
          >
            <LayoutDashboard className="mr-3" />
            Dashboard
          </NavLink>

          <NavLink
            to="/app/dashboard-ocorrencias"
            className={({ isActive }) =>
              `${navLinkClass} ${isActive ? activeNavLinkClass : ''}`
            }
          >
            <Shield className="mr-3" />
            Ocorrências
          </NavLink>

          <NavLink
            to="/servico-dia"
            className={({ isActive }) =>
              `${navLinkClass} ${isActive ? activeNavLinkClass : ''}`
            }
          >
            <Sun className="mr-3" />
            Serviço do Dia
          </NavLink>
          <NavLink
            to="/estatisticas"
            className={({ isActive }) =>
              `${navLinkClass} ${isActive ? activeNavLinkClass : ''}`
            }
          >
            <BarChart2 className="mr-3" />
            Estatísticas
          </NavLink>
          {/* CORREÇÃO: Usando user.perfil em vez de user.role */}
          {user?.perfil === 'admin' && (
            <>
              <h3 className="px-4 pt-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Administração
              </h3>
              <NavLink
                to="/app/militares"
                className={({ isActive }) =>
                  `${navLinkClass} ${isActive ? activeNavLinkClass : ''}`
                }
              >
                <Users className="mr-3" />
                Militares
              </NavLink>
              <NavLink
                to="/app/medicos"
                className={({ isActive }) =>
                  `${navLinkClass} ${isActive ? activeNavLinkClass : ''}`
                }
              >
                <Stethoscope className="mr-3" />
                Médicos
              </NavLink>
              <NavLink
                to="/app/obms"
                className={({ isActive }) =>
                  `${navLinkClass} ${isActive ? activeNavLinkClass : ''}`
                }
              >
                <Building className="mr-3" />
                OBMs
              </NavLink>
              <NavLink
                to="/app/viaturas"
                className={({ isActive }) =>
                  `${navLinkClass} ${isActive ? activeNavLinkClass : ''}`
                }
              >
                <Car className="mr-3" />
                Viaturas
              </NavLink>
              <NavLink
                to="/app/plantoes"
                className={({ isActive }) =>
                  `${navLinkClass} ${isActive ? activeNavLinkClass : ''}`
                }
              >
                <Calendar className="mr-3" />
                Plantões
              </NavLink>
              <NavLink
                to="/app/relatorio"
                className={({ isActive }) =>
                  `${navLinkClass} ${isActive ? activeNavLinkClass : ''}`
                }
              >
                <FileText className="mr-3" />
                Relatório
              </NavLink>
              <NavLink
                to="/app/usuarios"
                className={({ isActive }) =>
                  `${navLinkClass} ${isActive ? activeNavLinkClass : ''}`
                }
              >
                <Users className="mr-3" />
                Usuários
              </NavLink>
            </>
          )}
        </nav>
        <div className="p-4 border-t border-gray-700">
          <NavLink
            to="/app/perfil"
            className={({ isActive }) =>
              `flex items-center px-4 py-2 text-gray-400 rounded-md hover:bg-gray-700 hover:text-white ${
                isActive ? activeNavLinkClass : ''
              }`
            }
          >
            <User className="mr-3" />
            {/* CORREÇÃO: Usando user.nome_guerra em vez de user.nome */}
            {user?.nome_guerra || 'Meu Perfil'}
          </NavLink>
          <button onClick={logout} className={`${navLinkClass} w-full`}>
            <LogOut className="mr-3" />
            Sair
          </button>
        </div>
      </aside>
    );
  };

  export default Sidebar;