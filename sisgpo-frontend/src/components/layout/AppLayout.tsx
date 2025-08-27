import { Outlet, Navigate, NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

/**
 * AppLayout é o componente de layout principal para seções autenticadas da aplicação.
 * Ele envolve as páginas que exigem que o usuário esteja logado.
 */
export default function AppLayout() {
  // Obtém o token e a função de logout do nosso store de autenticação (Zustand).
  const { token, logout } = useAuthStore();

  // 1. Lógica de Proteção de Rota
  // Se não houver token no estado, o usuário não está autenticado.
  // O componente <Navigate> do React Router o redirecionará para a página de login.
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // 2. Função de Logout
  const handleLogout = () => {
    logout();
  };

  // 3. Estilo para Links Ativos
  // Função que retorna um objeto de estilo para o NavLink ativo,
  // melhorando a experiência do usuário ao destacar a página atual.
  const getActiveLinkStyle = ({ isActive }: { isActive: boolean }) => {
    return isActive
      ? {
          color: '#4f46e5', // Cor índigo-600 do Tailwind
          fontWeight: '600',
          borderBottom: '2px solid #4f46e5',
          paddingBottom: '4px', // Adiciona um pequeno espaço para o sublinhado
        }
      : {
          color: '#4b5563', // Cor gray-600 do Tailwind
          paddingBottom: '4px',
        };
  };

  // 4. Estrutura do Layout
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Cabeçalho fixo da aplicação */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          
          {/* Seção Esquerda: Título e Navegação */}
          <div className="flex items-center gap-8">
            <h1 className="text-xl font-bold leading-6 text-gray-900">
              SISGPO
            </h1>
            <nav className="flex gap-6 items-center">
              <NavLink to="/" style={getActiveLinkStyle}>
                Dashboard
              </NavLink>
              <NavLink to="/obms" style={getActiveLinkStyle}>
                OBMs
              </NavLink>
              <NavLink to="/viaturas" style={getActiveLinkStyle}>
                Viaturas
              </NavLink>
              <NavLink to="/militares" style={getActiveLinkStyle}>
                Militares
              </NavLink>
              {/* Futuramente, o link para Plantões virá aqui */}
            </nav>
          </div>

          {/* Seção Direita: Botão de Sair */}
          <button
            onClick={handleLogout}
            className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
          >
            Sair
          </button>
        </div>
      </header>
      
      {/* Conteúdo Principal */}
      <main>
        <div className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
          {/* O <Outlet> renderiza o componente da rota filha (Dashboard, Obms, etc.) */}
          <Outlet />
        </div>
      </main>
    </div>
  );
}
