// Arquivo: frontend/src/pages/Login.tsx (VERSÃO CORRIGIDA E ROBUSTA)

import { useState, FormEvent } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import api from '../services/api'; // Nossa instância base do Axios
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Label from '../components/ui/Label';

// Interface para a resposta da API
interface LoginResponse {
  token: string;
  user: { id: number; login: string; perfil: 'Admin' | 'Usuario'; };
}

export default function Login() {
  const navigate = useNavigate();
  const { setToken, setUser, token: authToken } = useAuthStore();

  const [login, setLogin] = useState('');
  const [senha, setSenha] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Se já houver um token, redireciona para o dashboard
  if (authToken) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      // --- PONTO CRÍTICO DE VERIFICAÇÃO ---
      // Garante que a chamada é para a rota de autenticação correta
      const response = await api.post<LoginResponse>('/api/auth/login', { login, senha } );
      
      // Salva o token e os dados do utilizador no estado global (Zustand)
      setToken(response.data.token);
      setUser(response.data.user);

      // Navega para a página principal e mostra uma notificação de sucesso
      navigate('/');
      toast.success('Login bem-sucedido!');

    } catch (err: any) {
      // Exibe a mensagem de erro vinda do backend ou uma mensagem genérica
      const errorMessage = err.response?.data?.message || 'Erro ao tentar fazer login.';
      toast.error(errorMessage);
      console.error("Falha no login:", err.response?.data || err.message); // Log detalhado no console do navegador
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white">SISGPO</h1>
          <p className="text-gray-400">Sistema de Gestão do Poder Operacional</p>
        </div>

        <div className="bg-gray-800 p-8 rounded-xl shadow-2xl">
          <h2 className="text-center text-2xl font-bold text-white mb-6">
            Acesso ao Sistema
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="login" className="text-gray-300">Utilizador</Label>
              <Input
                id="login"
                type="text"
                value={login}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLogin(e.target.value)}
                required
                placeholder="Digite seu utilizador"
                className="bg-gray-700 text-white border-gray-600 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <Label htmlFor="senha" className="text-gray-300">Senha</Label>
              <Input
                id="senha"
                type="password"
                value={senha}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSenha(e.target.value)}
                required
                placeholder="Digite sua senha"
                className="bg-gray-700 text-white border-gray-600 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            <div>
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? 'Entrando...' : 'Entrar'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
