// Arquivo: src/router/index.tsx

import React, { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

import AppLayout from '../components/layout/AppLayout';
import PublicLayout from '../components/layout/PublicLayout';
import NotFound from '../pages/NotFound';
import Spinner from '../components/ui/Spinner';

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

// [INÍCIO DA CORREÇÃO DE INTEGRAÇÃO DE DADOS EXTERNOS]
const EstatisticasExternas = lazy(() => import('../pages/EstatisticasExternas'));
// [FIM DA CORREÇÃO DE INTEGRAÇÃO DE DADOS EXTERNOS]

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

export const router = createBrowserRouter([
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
    element: <AppLayout />,
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
      // [INÍCIO DA CORREÇÃO DE INTEGRAÇÃO DE DADOS EXTERNOS]
      { 
          path: 'estatisticas-externas', 
          element: <Suspended><EstatisticasExternas /></Suspended> 
      }, 
      // [FIM DA CORREÇÃO DE INTEGRAÇÃO DE DADOS EXTERNOS]
      { path: 'obms', element: <Suspended><Obms /></Suspended> },
      { path: 'viaturas', element: <Suspended><Viaturas /></Suspended> },
      { path: 'militares', element: <Suspended><Militares /></Suspended> },
      { path: 'medicos', element: <Suspended><Medicos /></Suspended> },
      { path: 'plantoes', element: <Suspended><Plantoes /></Suspended> },
      { path: 'servico-dia', element: <Suspended><ServicoDia /></Suspended> },
      { path: 'relatorio', element: <Suspended><Relatorio /></Suspended> },
      { path: 'usuarios', element: <Suspended><UsersManagement /></Suspended> },
      { path: 'perfil', element: <Suspended><Profile /></Suspended> },
    ],
  },
  {
    path: '*',
    element: <NotFound />,
  },
]);