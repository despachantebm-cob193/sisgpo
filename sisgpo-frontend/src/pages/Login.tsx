import { useState, FormEvent, useEffect } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import { supabase } from '../config/supabase';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import Input from '../components/ui/Input';
import { User, Lock, Eye, EyeOff } from 'lucide-react';

interface LoginResponse {
  token: string;
  refreshToken?: string;
  user: any;
}

export default function Login() {
  const navigate = useNavigate();
  const { login: authLogin, token: authToken, setPending } = useAuthStore();

  const [login, setLogin] = useState('');
  const [senha, setSenha] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [bgLoaded, setBgLoaded] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Forçar zoom 100% na página de login para impacto visual máximo
    document.body.style.zoom = "100%";

    // Preload background
    const url = `${import.meta.env.BASE_URL}login-bg.jpg`;
    const img = new Image();
    img.onload = () => setBgLoaded(true);
    img.src = url;
    setTimeout(() => setBgLoaded(true), 1500);

    return () => {
      document.body.style.zoom = "";
    };
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (isLoading || isGoogleLoading) return;
    setIsLoading(true);

    try {
      const response = await api.post<LoginResponse>('/api/auth/login', { login, senha });
      const { token, refreshToken, user } = response.data;

      authLogin(token, user);

      if (refreshToken) {
        supabase.auth.setSession({ access_token: token, refresh_token: refreshToken })
          .catch(err => console.error("Sync session error:", err));
      }

      toast.success('Acesso autorizado.');
      navigate('/app/dashboard');
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Falha na autenticação.';
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (isLoading || isGoogleLoading) return;
    setIsGoogleLoading(true);

    try {
      if (!credentialResponse.credential) {
        throw new Error('Falha ao obter credencial do Google.');
      }

      const response = await api.post<LoginResponse>('/api/auth/google/callback', {
        credential: credentialResponse.credential,
      });

      const { token, refreshToken, user } = response.data;
      authLogin(token, user);

      if (refreshToken) {
        supabase.auth.setSession({ access_token: token, refresh_token: refreshToken })
          .catch(err => console.error("Sync session error:", err));
      }

      toast.success('Acesso autorizado.');
      navigate('/app/dashboard');
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Falha na autenticação com Google.';
      if (String(errorMsg).toLowerCase().includes('pendente')) {
        setPending(true);
        navigate('/pending-approval', { replace: true });
        return;
      }
      toast.error(errorMsg);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGoogleError = () => {
    toast.error('Falha ao autenticar com Google.');
  };

  if (authToken) {
    return <Navigate to="/app/dashboard" replace />;
  }

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden bg-[#050608] flex flex-col items-center justify-center font-sans tracking-wide">
      {/* Background Ambience */}
      <div
        className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${bgLoaded ? 'opacity-30' : 'opacity-0'}`}
        style={{ backgroundImage: `url(${import.meta.env.BASE_URL}login-bg.jpg)` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#050608] via-[#090b13]/90 to-[#0e1121]/80" />

      {/* Decorative Glows */}
      <div className="absolute top-[-20%] left-[-20%] w-[800px] h-[800px] bg-blue-900/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[800px] h-[800px] bg-cyan-900/10 rounded-full blur-[150px] pointer-events-none" />

      {/* CARD PRINCIPAL - FRAME METÁLICO 3D (ATUALIZADO) */}
      <div
        className="relative z-10 w-[90%] max-w-[420px] p-[6px] rounded-[2.5rem] bg-gradient-to-br from-[#c0c5ce] via-[#e2e6eb] to-[#8a929e] shadow-[0_20px_50px_rgba(0,0,0,0.8)] animate-in fade-in zoom-in-95 duration-700"
        style={{ boxShadow: '0 0 0 1px rgba(0,0,0,0.8), 0 30px 60px -10px rgba(0,0,0,1), inset 0 1px 0 rgba(255,255,255,0.8)' }}
      >
        {/* Layer Escuro (Profundidade) */}
        <div className="absolute inset-[2px] rounded-[2.4rem] bg-[#0f1218] shadow-inner" />

        {/* Detalhes de Luz do Frame Laterais */}
        <div className="absolute top-1/4 bottom-1/4 left-[-2px] w-[5px] bg-cyan-400 shadow-[0_0_20px_cyan] z-20 rounded-full opacity-90 mix-blend-screen" />
        <div className="absolute top-1/4 bottom-1/4 right-[-2px] w-[5px] bg-cyan-400 shadow-[0_0_20px_cyan] z-20 rounded-full opacity-90 mix-blend-screen" />

        {/* Interior do Card (Glass Dark) - Relative para ficar acima do layer escuro */}
        <div className="relative z-10 w-full h-full bg-[#0a0d14]/90 backdrop-blur-xl rounded-[2.2rem] p-8 pt-12 overflow-hidden border border-white/5 ring-1 ring-white/5">

          {/* Reflexo Superior (Vidro/Acrílico) */}
          <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

          {/* LOGO & HERO */}
          <div className="flex flex-col items-center mb-10 relative z-10">
            <div className="relative mb-6">
              <div className="absolute inset-x-2 top-2 bottom-2 bg-cyan-500/20 blur-[30px] rounded-full animate-pulse-slow pointer-events-none" />
              <img
                src={`${import.meta.env.BASE_URL}logo-neon-3d.png`}
                alt="SISGPO"
                className="w-48 h-48 object-contain relative z-10 drop-shadow-[0_0_20px_rgba(34,211,238,0.6)] transition-transform duration-500 hover:scale-105"
                style={{ filter: 'url(#remove-black)' }}
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            </div>

            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-200 to-slate-500 uppercase tracking-[0.15em] font-mono drop-shadow-sm select-none">
              SISGPO
            </h1>
            <p className="text-[10px] md:text-xs text-cyan-600/90 tracking-[0.3em] font-semibold mt-3 text-center uppercase drop-shadow-[0_0_5px_rgba(34,211,238,0.3)]">
              Sistema de Gestão do Poder Operacional
            </p>
          </div>

          {/* FORMULÁRIO */}
          <form onSubmit={handleSubmit} className="space-y-5 relative z-10">

            {/* Input USER */}
            <div className="relative group">
              <Input
                id="login"
                type="text"
                placeholder="USUÁRIO"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                required
                startIcon={<User className="w-5 h-5 text-cyan-500" />}
                className="!rounded-full !bg-black/40 !border-cyan-500/40 !text-cyan-50 !py-3.5 !pl-12 !pr-4 placeholder:text-cyan-700/60 focus:!border-cyan-400 focus:!shadow-[0_0_20px_rgba(34,211,238,0.15)] transition-all font-mono text-sm tracking-wider"
              />
            </div>

            {/* Input SENHA */}
            <div className="relative group">
              <Input
                id="senha"
                type={showPassword ? "text" : "password"}
                placeholder="SENHA"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                startIcon={<Lock className="w-5 h-5 text-cyan-500" />}
                endIcon={
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="focus:outline-none text-cyan-600 hover:text-cyan-400 transition-colors">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                }
                className="!rounded-full !bg-black/40 !border-cyan-500/40 !text-cyan-50 !py-3.5 !pl-12 !pr-10 placeholder:text-cyan-700/60 focus:!border-cyan-400 focus:!shadow-[0_0_20px_rgba(34,211,238,0.15)] transition-all font-mono text-sm tracking-wider"
              />
            </div>

            {/* Botão High-End */}
            <Button
              type="submit"
              disabled={isLoading || isGoogleLoading}
              className={`w-full h-14 !rounded-full mt-8 text-sm font-bold tracking-[0.2em] uppercase transition-all duration-300 relative overflow-hidden group border
                ${(isLoading || isGoogleLoading)
                  ? 'bg-slate-900 border-slate-700 text-slate-500'
                  : 'bg-black/80 border-cyan-500/60 text-cyan-400 hover:text-cyan-100 hover:border-cyan-400 hover:shadow-[0_0_25px_rgba(34,211,238,0.3)]'
                }`}
            >
              <div className="absolute inset-0 bg-cyan-500/10 group-hover:bg-cyan-500/20 transition-colors" />
              {/* Fake inner glow */}
              <div className="absolute inset-x-4 bottom-0 h-[1px] bg-cyan-400/50 blur-[2px] opacity-70" />

              <span className="relative z-10 flex items-center justify-center gap-2">
                {isLoading ? <Spinner className="w-4 h-4 text-current" /> : 'ACESSAR SISTEMA'}
              </span>
            </Button>

            <div className="flex justify-center pt-2">
              <div className={`transition-opacity ${isGoogleLoading ? 'opacity-60 pointer-events-none' : ''}`}>
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  theme="outline"
                  size="large"
                  shape="pill"
                  text="signin_with"
                />
              </div>
            </div>

            {/* Link Solicitar Acesso - Restaurado */}
            <div className="pt-2 text-center">
              <Link to="/solicitar-acesso" className="text-[10px] text-slate-500 hover:text-cyan-400 transition-colors uppercase tracking-[0.2em] font-mono group inline-block">
                <span className="border-b border-transparent group-hover:border-cyan-500/50 pb-1 transition-all">Solicitar Acesso</span>
              </Link>
            </div>
          </form>

          <div className="mt-8 flex justify-center opacity-30">
            <div className="h-1 w-16 bg-slate-600 rounded-full" />
          </div>

        </div>
      </div>

      {/* Footer System Status */}
      <div className="fixed bottom-6 text-[9px] text-cyan-900/50 font-mono tracking-[0.4em] uppercase select-none flex gap-4">
        <span>Sistema: Online</span>
        <span>•</span>
        <span>Versão 2.0</span>
      </div>

      {/* SVG Filters Utility - KEEP THIS */}
      <svg className="hidden">
        <filter id="remove-black" colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix"
            values="1 0 0 0 0
                    0 1 0 0 0
                    0 0 1 0 0
                    0.2126 0.7152 0.0722 0 -0.1"
          />
        </filter>
      </svg>
    </div>
  );
}
