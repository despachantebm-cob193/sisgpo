import { createBrowserRouter, Navigate } from 'react-router-dom';

// Layouts
import AppLayout from '../components/layout/AppLayout';      // <-- CAMINHO CORRIGIDO
import PublicLayout from '../components/layout/PublicLayout';  // <-- CAMINHO CORRIGIDO

// Páginas
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import Obms from '../pages/Obms';
import Viaturas from '../pages/Viaturas';
import Militares from '../pages/Militares';
import EscalaMedicos from '../pages/EscalaMedicos';
import Plantoes from '../pages/Plantoes';
import ServicoDia from '../pages/ServicoDia';
import Profile from '../pages/Profile';
import NotFound from '../pages/NotFound';

export const router = createBrowserRouter([
  // --- ROTAS PÚBLICAS ---
  {
    path: '/',
    element: <PublicLayout />,
    errorElement: <NotFound />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
    ],
  },
  {
    path: '/login',
    element: <Login />,
  },

  // --- ROTAS PRIVADAS (ÁREA RESTRITA) ---
  {
    path: '/app',
    element: <AppLayout />,
    errorElement: <NotFound />,
    children: [
      {
        index: true,
        element: <Navigate to="/app/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <Dashboard />,
      },
      { path: 'obms', element: <Obms /> },
      { path: 'viaturas', element: <Viaturas /> },
      { path: 'militares', element: <Militares /> },
      { path: 'civis', element: <EscalaMedicos /> },
      { path: 'plantoes', element: <Plantoes /> },
      { path: 'servico-dia', element: <ServicoDia /> },
      { path: 'perfil', element: <Profile /> },
    ],
  },

  // Rota de "Não Encontrado" para qualquer outro caminho
  {
    path: '*',
    element: <NotFound />,
  },
]);
