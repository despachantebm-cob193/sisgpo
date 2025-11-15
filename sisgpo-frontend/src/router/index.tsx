import React, { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

import AppLayout from '../components/layout/AppLayout';
import PublicLayout from '../components/layout/PublicLayout';
import NotFound from '../pages/NotFound';
import Spinner from '../components/ui/Spinner';

// Importações das páginas
const Login = lazy(() => import('../pages/Login'));
const Dashboard = lazy(() => import('../pages/Dashboard'));
const Obms = lazy(() => import('../pages/Obms'));
const Viaturas = lazy(() => import('../pages/Viaturas'));
const Aeronaves = lazy(() => import('../pages/Aeronaves'));
const Militares = lazy(() => import('../pages/Militares'));
const Medicos = lazy(() => import('../pages/Medicos'));
const Plantoes = lazy(() => import('../pages/Plantoes'));
const ServicoDia = lazy(() => import('../pages/ServicoDia'));
const Profile = lazy(() => import('../pages/Profile'));
const Relatorio = lazy(() => import('../pages/Relatorio'));
const UsersManagement = lazy(() => import('../pages/Users'));
const DashboardOcorrencias = lazy(() => import('../pages/DashboardOcorrencias'));
const SsoLogin = lazy(() => import('../pages/SsoLogin'));

const PublicOnlyLayout = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
  if (isAuthenticated) {
    return <Navigate to="/app/dashboard" replace />;
  }
  return <PublicLayout />;
};

const PublicDashboardOcorrencias = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
  if (isAuthenticated) {
    return <Navigate to="/app/dashboard-ocorrencias" replace />;
  }
  return (
    <Suspended>
      <DashboardOcorrencias />
    </Suspended>
  );
};

const Suspended = ({ children }: { children: React.ReactNode }) => (
  <Suspense
    fallback={
      <div className="flex h-full min-h-[400px] w-full items-center justify-center">
        <Spinner className="h-12 w-12 text-tagBlue" />
      </div>
    }
  >
    {children}
  </Suspense>
);

// Componente para rotas privadas
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  // --- CORREÇÃO APLICADA AQUI ---
  const isAuthenticated = useAuthStore.getState().isAuthenticated();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

// Componente para rotas de administrador
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuthStore.getState();
  // --- CORREÇÃO APLICADA AQUI ---
  const isAdmin = user?.perfil === 'admin';
  return isAdmin ? <>{children}</> : <Navigate to="/app/dashboard" replace />;
};

export const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicOnlyLayout />,
    errorElement: <NotFound />,
    children: [
      {
        index: true,
        element: <Suspended><Dashboard /></Suspended>,
      },
      {
        path: 'dashboard-ocorrencias',
        element: <PublicDashboardOcorrencias />,
      },
    ],
  },
  {
    path: '/login',
    element: <Suspended><Login /></Suspended>,
  },
  {
    path: '/sso/login',
    element: <Suspended><SsoLogin /></Suspended>,
  },
  {
    path: '/app',
    element: <PrivateRoute><AppLayout /></PrivateRoute>,
    errorElement: <NotFound />,
    children: [
      {
        index: true,
        element: <Navigate to="/app/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <Suspended><Dashboard /></Suspended>,
      },
      {
        path: 'dashboard-ocorrencias',
        element: <Suspended><DashboardOcorrencias /></Suspended>,
      },

      // Rotas de Administração protegidas com AdminRoute
      { path: 'obms', element: <Suspended><Obms /></Suspended> },
      { path: 'viaturas', element: <Suspended><Viaturas /></Suspended> },
      { path: 'aeronaves', element: <Suspended><Aeronaves /></Suspended> },
      { path: 'militares', element: <Suspended><Militares /></Suspended> },
      { path: 'medicos', element: <Suspended><Medicos /></Suspended> },
      { path: 'plantoes', element: <Suspended><Plantoes /></Suspended> },
      { path: 'servico-dia', element: <Suspended><ServicoDia /></Suspended> },
      { path: 'usuarios', element: <AdminRoute><Suspended><UsersManagement /></Suspended></AdminRoute> },
      
      // Rotas comuns
      { path: 'relatorio', element: <Suspended><Relatorio /></Suspended> },
      { path: 'perfil', element: <Suspended><Profile /></Suspended> },
    ],
  },
  {
    path: '*',
    element: <NotFound />,
  },
]);
