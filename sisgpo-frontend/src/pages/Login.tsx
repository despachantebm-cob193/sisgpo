import { useState, FormEvent, ChangeEvent, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import Input from '../components/ui/Input';
import Label from '../components/ui/Label';
import { UserRecord } from '../types/entities';

interface LoginResponse {
  token: string;
  user: UserRecord;
}

export default function Login() {
  const navigate = useNavigate();
  const { login: authLogin, token: authToken } = useAuthStore();

  const [login, setLogin] = useState('');
  const [senha, setSenha] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [bgLoaded, setBgLoaded] = useState(false);
  const [intro, setIntro] = useState(false);

  // Preload background image and show splash until it loads
  useEffect(() => {
    let cancelled = false;
    const url = `${import.meta.env.BASE_URL}login-bg.jpg`;
    const img = new Image();
    const onDone = () => {
      if (!cancelled) setBgLoaded(true);
    };
    img.onload = onDone;
    img.onerror = onDone; // if fail, still proceed
    img.src = url;
    // Safety timeout in case onload doesn't fire
    const t = window.setTimeout(onDone, 3000);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, []);

  // Dispara a animação de entrada após o fundo estar pronto
  useEffect(() => {
    if (bgLoaded) {
      const id = window.setTimeout(() => setIntro(true), 80);
      return () => window.clearTimeout(id);
    }
  }, [bgLoaded]);

  if (authToken) {
    return <Navigate to="/app/dashboard" replace />;
  }

  const googleLogin = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: () => {
      toast.error('Falha no login com Google. Tente novamente.');
    },
    flow: 'auth-code', // Specify authorization code flow
  });

  const handleGoogleSuccess = async (tokenResponse: { code: string }) => {
    setIsLoading(true);
    try {
      const response = await api.post<LoginResponse>('/api/auth/google/callback', {
        code: tokenResponse.code, // Send the authorization code
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
    <div className="min-h-screen relative">
      {/* Background image */}
      <div
        className={`absolute inset-0 bg-cover bg-center transition-opacity duration-700 ${bgLoaded ? 'opacity-100' : 'opacity-0'}`}
        // Usa BASE_URL para funcionar em dev e build com base não raiz
        style={{ backgroundImage: `url(${import.meta.env.BASE_URL}login-bg.jpg)` }}
      />
      {/* Splash overlay while background loads */}
      <div className={`absolute inset-0 z-30 flex items-center justify-center transition-opacity duration-700 ${bgLoaded ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <div className="flex flex-col items-center gap-4 bg-black/60 rounded-xl px-6 py-5">
          <h1 className="text-2xl font-semibold text-white tracking-wide">Carregando...</h1>
          <Spinner className="h-10 w-10 text-white" />
        </div>
      </div>
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md">
          <div
            className={`text-center mb-8 transform transition-all duration-700 ease-out ${
              intro ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-2'
            }`}
          >
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white">SISGPO</h1>
            <p className="mt-2 text-sm md:text-base text-gray-200">Sistema de Gestão do Poder Operacional</p>
          </div>
          <div
            className={`bg-cardSlate/90 backdrop-blur p-8 rounded-xl shadow-2xl transform transition-all duration-700 ease-out ${
              intro ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-2'
            }`}
            style={{ transitionDelay: intro ? '120ms' : '0ms' }}
          >
            <h2 className="text-center text-2xl font-bold text-textMain mb-6">Acesso ao Sistema</h2>
          
          <div
            className={`flex flex-col items-center justify-center mb-6 transform transition-all duration-700 ease-out ${
              intro ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
            }`}
            style={{ transitionDelay: intro ? '700ms' : '0ms' }}
          >
            <Button
              onClick={() => googleLogin()}
              disabled={isLoading}
              className="w-full bg-cardSlate text-white hover:bg-cardSlate/80"
            >
              {isLoading ? 'Carregando...' : 'Iniciar sessão com o Google'}
            </Button>
          </div>

          <div
            className={`flex items-center my-6 transform transition-all duration-700 ease-out ${
              intro ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
            }`}
            style={{ transitionDelay: intro ? '850ms' : '0ms' }}
          >
            <div className="flex-grow border-t border-borderDark/60"></div>
            <span className="mx-4 text-textSecondary text-sm">OU</span>
            <div className="flex-grow border-t border-borderDark/60"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div
              className={`transform transition-all duration-700 ease-out ${
                intro ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
              }`}
              style={{ transitionDelay: intro ? '1000ms' : '0ms' }}
            >
              <Label htmlFor="login-field" className="text-textSecondary">Usuário</Label>
              <Input
                id="login-field"
                type="text"
                value={login}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setLogin(e.target.value)}
                required
                placeholder="Digite seu usuário"
              />
            </div>
            <div
              className={`transform transition-all duration-700 ease-out ${
                intro ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
              }`}
              style={{ transitionDelay: intro ? '1150ms' : '0ms' }}
            >
              <Label htmlFor="senha" className="text-textSecondary">Senha</Label>
              <Input
                id="senha"
                type="password"
                value={senha}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setSenha(e.target.value)}
                required
                placeholder="Digite sua senha"
              />
            </div>
            <div
              className={`transform transition-all duration-700 ease-out ${
                intro ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
              }`}
              style={{ transitionDelay: intro ? '1300ms' : '0ms' }}
            >
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



