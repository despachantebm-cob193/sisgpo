// Arquivo: frontend/src/services/api.ts (VERSÃO CORRIGIDA E ROBUSTA)

import axios, { InternalAxiosRequestConfig, AxiosError } from 'axios';
import { useAuthStore } from '../store/authStore';

// 1. Tenta ler a baseURL do ambiente Vite.
// 2. Se for indefinida (como pode acontecer em alguns ambientes de teste),
//    usa um valor padrão explícito para o servidor de desenvolvimento/teste.
const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3333';

// Adiciona um log no console para depuração, que aparecerá no console do navegador
// durante os testes do Playwright, nos ajudando a confirmar qual URL está sendo usada.
console.log(`[API Service] Configurando Axios com baseURL: ${baseURL}`  );

const api = axios.create({
  baseURL: baseURL,
});

// Interceptor que adiciona o token JWT em todas as requisições (sem alterações)
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().token;
    if (token && config.url !== '/api/auth/login') {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

export default api;
