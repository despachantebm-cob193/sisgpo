// Arquivo: frontend/src/router/index.tsx (Atualizado)

import { createBrowserRouter } from 'react-router-dom';

import AppLayout from '../components/layout/AppLayout';

import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import NotFound from '../pages/NotFound';
import Obms from '../pages/Obms';
import Viaturas from '../pages/Viaturas';
import Militares from '../pages/Militares';
import Plantoes from '../pages/Plantoes';
import Profile from '../pages/Profile';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    errorElement: <NotFound />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'obms', element: <Obms /> },
      { path: 'viaturas', element: <Viaturas /> },
      { path: 'militares', element: <Militares /> },
      { path: 'plantoes', element: <Plantoes /> },
      { path: 'perfil', element: <Profile /> },
    ],
  },
  {
    path: '/login',
    element: <Login />,
  },
]);
