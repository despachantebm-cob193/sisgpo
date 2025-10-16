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
const Militares = lazy(() => import('../pages/Militares'));
const Medicos = lazy(() => import('../pages/Medicos'));
const Plantoes = lazy(() => import('../pages/Plantoes'));
const ServicoDia = lazy(() => import('../pages/ServicoDia'));
const Profile = lazy(() => import('../pages/Profile'));
const Relatorio = lazy(() => import('../pages/Relatorio'));
const UsersManagement = lazy(() => import('../pages/Users'));
const DashboardOcorrencias = lazy(() => import('../pages/DashboardOcorrencias'));

const Suspended = ({ children }: { children: React.ReactNode }) => (
  <Suspense
    fallback={
      <div className="flex h-full min-h-[400px] w-full items-center justify-center">
        <Spinner className="h-12 w-12 text-indigo-600" />
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

const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicLayout />,
    errorElement: <NotFound />,
    children: [
      {
        index: true,
        element: <Suspended><Dashboard /></Suspended>,
      },
    ],
  },
  {
    path: '/login',
    element: <Suspended><Login /></Suspended>,
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
        element: <Suspended><DashboardOcorrencias /></Suspended> 
      },
      // Rotas de Administração protegidas com AdminRoute
      { path: 'obms', element: <AdminRoute><Suspended><Obms /></Suspended></AdminRoute> },
      { path: 'viaturas', element: <AdminRoute><Suspended><Viaturas /></Suspended></AdminRoute> },
      { path: 'militares', element: <AdminRoute><Suspended><Militares /></Suspended></AdminRoute> },
      { path: 'medicos', element: <AdminRoute><Suspended><Medicos /></Suspended></AdminRoute> },
      { path: 'plantoes', element: <AdminRoute><Suspended><Plantoes /></Suspended></AdminRoute> },
      { path: 'servico-dia', element: <AdminRoute><Suspended><ServicoDia /></Suspended></AdminRoute> },
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

export default router;