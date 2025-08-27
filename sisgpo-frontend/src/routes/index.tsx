import { createBrowserRouter } from 'react-router-dom';

// Importa os componentes
import AppLayout from '../components/layout/AppLayout';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import NotFound from '../pages/NotFound';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />, // Layout para rotas autenticadas
    errorElement: <NotFound />,
    children: [
      {
        index: true, // Rota padrão (/) renderiza o Dashboard
        element: <Dashboard />,
      },
      // Futuras rotas protegidas (militares, viaturas, etc.) virão aqui
    ],
  },
  {
    path: '/login',
    element: <Login />,
  },
]);
