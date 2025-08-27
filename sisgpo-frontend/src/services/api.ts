import axios from 'axios';
import { useAuthStore } from '../store/authStore';

// Cria uma instância do Axios com a URL base da nossa API
const api = axios.create({
  baseURL: 'http://localhost:3333/api/admin', // URL do nosso backend
} );

// Interceptor de Requisição: executado antes de cada chamada à API
api.interceptors.request.use(
  (config) => {
    // Pega o token do nosso store Zustand
    const token = useAuthStore.getState().token;

    // Se o token existir, adiciona ao cabeçalho de autorização
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    // Em caso de erro na configuração da requisição
    return Promise.reject(error);
  }
);

export default api;
