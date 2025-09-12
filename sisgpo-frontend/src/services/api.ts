// Arquivo: frontend/src/services/api.ts
import axios, { InternalAxiosRequestConfig, AxiosError } from 'axios';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast'; // <-- ADICIONE ESTA LINHA

// Define a baseURL a partir das variáveis de ambiente do Vite.
const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3333';

// Cria a instância do Axios.
const api = axios.create({
  baseURL: baseURL,
}  );

// INTERCEPTOR DE REQUISIÇÃO: Adiciona o token de autenticação em cada chamada.
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Pega o token mais recente do store de autenticação.
    const token = useAuthStore.getState().token;

    // Se o token existir, adiciona ao cabeçalho 'Authorization'.
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// INTERCEPTOR DE RESPOSTA: Lida com erros globais, como sessão expirada.
api.interceptors.response.use(
  (response) => response, // Se a resposta for sucesso, apenas a retorna.
  (error: AxiosError) => {
    // Se o erro for 401 (Não Autorizado), o token é inválido ou expirou.
    if (error.response?.status === 401) {
      // Evita o redirecionamento para a própria página de login se o erro ocorrer lá.
      if (window.location.pathname !== '/login') {
        // Limpa os dados de autenticação do storage.
        useAuthStore.getState().logout();
        // Redireciona o usuário para a página de login.
        window.location.href = '/login';
        toast.error('Sua sessão expirou. Por favor, faça login novamente.');
      }
    }
    
    // Para outros erros, apenas os repassa para que o componente que fez a chamada possa tratá-los.
    return Promise.reject(error);
  }
);

export default api;
