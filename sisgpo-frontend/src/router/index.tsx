import React, { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

import AppLayout from '../components/layout/AppLayout';
import PublicLayout from '../components/layout/PublicLayout';
import NotFound from '../pages/NotFound';
import Spinner from '../components/ui/Spinner';
import { SupabaseAuthStateListener } from '../components/auth/SupabaseAuthStateListener';
import { SessionTimeoutHandler } from '../components/auth/SessionTimeoutHandler';

// Importações das páginas
const Login = lazy(() => import('../pages/Login'));
const Dashboard = lazy(() => import('../pages/Dashboard'));
const Obms = lazy(() => import('../pages/Obms'));
const ComandantesCrbm = lazy(() => import('../pages/ComandantesCrbmPage'));
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
const SubjectPendingPage = lazy(() => import('../pages/SubjectPendingPage'));
const Metrics = lazy(() => import('../pages/Metrics'));
const RequestAccess = lazy(() => import('../pages/RequestAccess'));
const SystemHealth = lazy(() => import('../pages/SystemHealth'));

const RootLayout = () => (
  <>
    <SupabaseAuthStateListener />
    {/* Monitora inatividade e faz logout automatico */}
    <SessionTimeoutHandler />
    <Outlet />
  </>
);

const PublicOnlyLayout = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
  const isPending = useAuthStore((state) => state.isPending);
  const isLoadingProfile = useAuthStore((state) => state.isLoadingProfile);

  if (isLoadingProfile) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Spinner className="h-12 w-12 text-primary" />
      </div>
    );
  }

  if (isAuthenticated) {
    if (isPending) {
      return <Navigate to="/pending-approval" replace />;
    }
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
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
  const isPending = useAuthStore((state) => state.isPending);
  const isLoadingProfile = useAuthStore((state) => state.isLoadingProfile);
  const user = useAuthStore((state) => state.user);

  if (isLoadingProfile) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Spinner className="h-12 w-12 text-primary" />
      </div>
    );
  }

  // Verificação de Integridade de Sessão:
  // Se tem token (isAuthenticated) mas o objeto user está inválido/corrompido, força logout.
  if (isAuthenticated && (!user || !user.id)) {
    useAuthStore.getState().logout();
    return <Navigate to="/login" replace />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (isPending) {
    return <Navigate to="/pending-approval" replace />;
  }

  return <>{children}</>;
};

// Componente para rotas de administrador
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.perfil === 'admin';
  return isAdmin ? <>{children}</> : <Navigate to="/app/dashboard" replace />;
};

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        path: '/',
        element: <Navigate to="/login" replace />,
      },
      {
        path: '/login',
        element: <Suspended><Login /></Suspended>,
      },
      {
        path: '/solicitar-acesso',
        element: <Suspended><RequestAccess /></Suspended>,
      },
      {
        path: '/pending-approval',
        element: <Suspended><SubjectPendingPage /></Suspended>,
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
          { path: 'comandantes-crbm', element: <Suspended><ComandantesCrbm /></Suspended> },
          { path: 'viaturas', element: <Suspended><Viaturas /></Suspended> },
          { path: 'aeronaves', element: <Suspended><Aeronaves /></Suspended> },
          { path: 'militares', element: <Suspended><Militares /></Suspended> },
          { path: 'medicos', element: <Suspended><Medicos /></Suspended> },
          { path: 'plantoes', element: <Suspended><Plantoes /></Suspended> },
          { path: 'servico-dia', element: <Suspended><ServicoDia /></Suspended> },
          { path: 'usuarios', element: <Suspended><UsersManagement /></Suspended> },

          // Rotas comuns
          { path: 'relatorio', element: <Suspended><Relatorio /></Suspended> },
          { path: 'perfil', element: <Suspended><Profile /></Suspended> },
          { path: 'metricas', element: <Suspended><Metrics /></Suspended> },
          { path: 'saude', element: <Suspended><SystemHealth /></Suspended> },
        ],
      },
      {
        path: '*',
        element: <NotFound />,
      },
    ]
  }
]);
