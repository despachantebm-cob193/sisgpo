import axios from 'axios';
import { useAuthStore } from '../store/authStore';

// Usa a variável de ambiente ou um valor padrão para desenvolvimento
const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3333/api/admin';

const api = axios.create({
  baseURL: baseURL,
} );

api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
