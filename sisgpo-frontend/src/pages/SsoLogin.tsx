import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import Spinner from '../components/ui/Spinner';
import type { UserRecord } from '../types/entities';

interface SsoLoginResponse {
  token: string;
  user: UserRecord;
}

const DEFAULT_REDIRECT = '/app/plantoes';

const SsoLogin = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuthStore();
  const [statusMessage, setStatusMessage] = useState('Conectando ao SISGPO...');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = searchParams.get('token');
    const redirectTarget = searchParams.get('redirect') || DEFAULT_REDIRECT;

    const authenticate = async () => {
      if (!token) {
        setStatusMessage('Token SSO inexistente. Solicite um novo acesso pelo sistema de ocorrências.');
        setIsLoading(false);
        return;
      }

      try {
        const response = await api.post<SsoLoginResponse>(
          '/api/auth/sso-login',
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        login(response.data.token, response.data.user);
        setStatusMessage('Acesso concedido. Redirecionando...');
        navigate(redirectTarget, { replace: true });
      } catch (error: any) {
        const message =
          error?.response?.data?.message ||
          'Não foi possível validar o acesso. Tente solicitar o plantão novamente.';
        setStatusMessage(message);
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    };

    authenticate();
  }, [login, navigate, searchParams]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
      <div className="bg-cardSlate w-full max-w-lg rounded-xl shadow-2xl p-10 flex flex-col items-center gap-4">
        <h1 className="text-3xl font-bold text-textMain">SISGPO</h1>
        <p className="text-textSecondary">Validando acesso seguro...</p>
        {isLoading && <Spinner className="h-12 w-12 text-tagBlue" />}
        {!isLoading && (
          <button
            type="button"
            className="rounded-md bg-tagBlue px-6 py-3 font-semibold text-white hover:bg-tagBlue/90 transition"
            onClick={() => navigate('/login', { replace: true })}
          >
            Ir para a tela de login
          </button>
        )}
        <p className="text-sm text-textSecondary">{statusMessage}</p>
      </div>
    </div>
  );
};

export default SsoLogin;
