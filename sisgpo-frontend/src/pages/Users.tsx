import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Label from '../components/ui/Label';
import FormError from '../components/ui/FormError';
import { useAuthStore } from '../store/authStore';

type UserRecord = {
  id: number;
  login: string;
  perfil: 'admin' | 'user';
  created_at?: string;
  updated_at?: string;
};

type FormState = {
  login: string;
  senha: string;
  confirmarSenha: string;
  perfil: 'admin' | 'user';
};

type ValidationErrors = Record<string, string>;

const initialForm: FormState = {
  login: '',
  senha: '',
  confirmarSenha: '',
  perfil: 'user',
};

export default function Users() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [formData, setFormData] = useState<FormState>(initialForm);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [formErrors, setFormErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user && user.perfil !== 'admin') {
      toast.error('Acesso restrito aos administradores.');
      navigate('/app/dashboard');
    }
  }, [user, navigate]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await api.get<{ users: UserRecord[] }>('/api/admin/users');
      setUsers(response.data.users || []);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Nao foi possivel carregar os usuarios.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const resetForm = () => {
    setFormData(initialForm);
    setFormErrors({});
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setFormErrors({});

    try {
      await api.post('/api/admin/users', formData);
      toast.success('Usuario criado com sucesso!');
      resetForm();
      await fetchUsers();
    } catch (error: any) {
      if (error.response?.status === 400 && error.response.data?.errors) {
        const validation = (error.response.data.errors as Array<{ field: string; message: string }>)
          .reduce<ValidationErrors>((acc, item) => {
            acc[item.field] = item.message;
            return acc;
          }, {});
        setFormErrors(validation);
        toast.error('Verifique os campos destacados.');
      } else if (error.response?.status === 409) {
        toast.error(error.response.data?.message || 'Login ja esta em uso.');
      } else if (error.response?.status === 403) {
        toast.error('Acesso restrito aos administradores.');
      } else {
        const message = error.response?.data?.message || 'Nao foi possivel criar o usuario.';
        toast.error(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => a.login.localeCompare(b.login));
  }, [users]);

  const formatDate = (value?: string) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleString('pt-BR');
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">Usuarios</h2>
        <p className="text-gray-600 mt-2">Cadastre novos acessos e defina o perfil de permissao.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="bg-white shadow-md rounded-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Novo usuario</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="login">Login</Label>
              <Input
                id="login"
                name="login"
                value={formData.login}
                onChange={handleInputChange}
                placeholder="Digite o login"
                required
              />
              {formErrors.login && <FormError message={formErrors.login} />}
            </div>

            <div>
              <Label htmlFor="senha">Senha</Label>
              <Input
                id="senha"
                name="senha"
                type="password"
                value={formData.senha}
                onChange={handleInputChange}
                placeholder="Informe a senha"
                required
              />
              {formErrors.senha && <FormError message={formErrors.senha} />}
            </div>

            <div>
              <Label htmlFor="confirmarSenha">Confirmar senha</Label>
              <Input
                id="confirmarSenha"
                name="confirmarSenha"
                type="password"
                value={formData.confirmarSenha}
                onChange={handleInputChange}
                placeholder="Repita a senha"
                required
              />
              {formErrors.confirmarSenha && <FormError message={formErrors.confirmarSenha} />}
            </div>

            <div>
              <Label htmlFor="perfil">Perfil</Label>
              <select
                id="perfil"
                name="perfil"
                value={formData.perfil}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="user">Usuario</option>
                <option value="admin">Administrador</option>
              </select>
              {formErrors.perfil && <FormError message={formErrors.perfil} />}
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : 'Criar usuario'}
              </Button>
            </div>
          </form>
        </div>

        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-800">Usuarios cadastrados</h3>
            <button
              type="button"
              onClick={fetchUsers}
              disabled={isLoading}
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? 'Atualizando...' : 'Atualizar'}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-600 uppercase tracking-wider">Login</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600 uppercase tracking-wider">Perfil</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600 uppercase tracking-wider">Criado em</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-gray-500">
                      Carregando usuarios...
                    </td>
                  </tr>
                ) : sortedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-gray-500">
                      Nenhum usuario cadastrado ate o momento.
                    </td>
                  </tr>
                ) : (
                  sortedUsers.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-2 text-gray-700">{item.login}</td>
                      <td className="px-4 py-2 text-gray-700 capitalize">{item.perfil}</td>
                      <td className="px-4 py-2 text-gray-500">{formatDate(item.created_at)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
