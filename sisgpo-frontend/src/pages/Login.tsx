import { useState, FormEvent, ChangeEvent } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Label from '../components/ui/Label';

interface User {
  id: number;
  login: string;
  perfil: 'admin' | 'user';
  ativo: boolean;
}

interface LoginResponse {
  token: string;
  user: User;
}

export default function Login() {
  const navigate = useNavigate();
  const { login: authLogin, token: authToken } = useAuthStore();

  const [login, setLogin] = useState('');
  const [senha, setSenha] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (authToken) {
    return <Navigate to="/app/dashboard" replace />;
  }

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    setIsLoading(true);
    try {
      const response = await api.post<LoginResponse>('/api/auth/google/callback', {
        credential: credentialResponse.credential,
      });
      authLogin(response.data.token, response.data.user);
      toast.success('Login com Google bem-sucedido!');
      navigate('/app/dashboard');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao tentar fazer login com Google.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const response = await api.post<LoginResponse>('/api/auth/login', { login, senha });
      authLogin(response.data.token, response.data.user);
      toast.success('Login bem-sucedido!');
      navigate('/app/dashboard');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao tentar fazer login.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white">SISGPO</h1>
          <p className="text-gray-400">Sistema de Gestao do Poder Operacional</p>
        </div>
        <div className="bg-gray-800 p-8 rounded-xl shadow-2xl">
          <h2 className="text-center text-2xl font-bold text-white mb-6">Acesso ao Sistema</h2>
          
          <div className="flex flex-col items-center justify-center mb-6">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => {
                toast.error('Falha no login com Google. Tente novamente.');
              }}
              useOneTap
            />
          </div>

          <div className="flex items-center my-6">
            <div className="flex-grow border-t border-gray-600"></div>
            <span className="mx-4 text-gray-400 text-sm">OU</span>
            <div className="flex-grow border-t border-gray-600"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="login-field" className="text-gray-300">Usuario</Label>
              <Input
                id="login-field"
                type="text"
                value={login}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setLogin(e.target.value)}
                required
                placeholder="Digite seu usuario"
                className="bg-gray-700 text-white border-gray-600 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <Label htmlFor="senha" className="text-gray-300">Senha</Label>
              <Input
                id="senha"
                type="password"
                value={senha}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setSenha(e.target.value)}
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