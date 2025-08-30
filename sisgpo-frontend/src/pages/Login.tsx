import { useState, FormEvent } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import api from '../services/api'; // Nossa instância base do Axios
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Label from '../components/ui/Label';

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

  if (authToken) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      // AQUI ESTÁ A MUDANÇA: Fornecemos o caminho completo da rota de login
      const response = await api.post<LoginResponse>('/api/admin/login', { login, senha });
      
      setToken(response.data.token);
      setUser(response.data.user);
      navigate('/');
      toast.success('Login bem-sucedido!');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao tentar fazer login.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // O restante do JSX permanece o mesmo...
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
              <Label htmlFor="login" className="text-gray-300">Usuário</Label>
              <Input
                id="login"
                type="text"
                value={login}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLogin(e.target.value)}
                required
                placeholder="Digite seu usuário"
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
