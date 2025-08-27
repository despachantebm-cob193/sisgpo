import React, { useState, FormEvent } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';

// CORREÇÃO: Usando caminhos relativos
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Label from '../components/ui/Label';

// O restante do arquivo permanece exatamente o mesmo...

interface LoginResponse {
  token: string;
  user: {
    id: number;
    login: string;
    perfil: 'Admin' | 'Usuario';
  };
}

export default function Login() {
  const navigate = useNavigate();
  const { setToken, setUser, token: authToken } = useAuthStore();

  const [login, setLogin] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (authToken) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post<LoginResponse>('/login', { login, senha });
      
      setToken(response.data.token);
      setUser(response.data.user);

      navigate('/');

    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao tentar fazer login. Verifique suas credenciais.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
      <Card className="w-full max-w-md">
        <h2 className="text-center text-2xl font-bold text-gray-900 mb-6">
          SISGPO - Acesso ao Sistema
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="login">Usuário</Label>
            <Input
              id="login"
              type="text"
              value={login}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLogin(e.target.value)}
              required
              placeholder="Digite seu usuário"
            />
          </div>
          <div>
            <Label htmlFor="senha">Senha</Label>
            <Input
              id="senha"
              type="password"
              value={senha}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSenha(e.target.value)}
              required
              placeholder="Digite sua senha"
            />
          </div>
          
          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}

          <div>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
