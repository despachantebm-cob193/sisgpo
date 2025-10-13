import { ChangeEvent, FormEvent, useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Label from '../components/ui/Label';
import FormError from '../components/ui/FormError';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import { Pencil, Ban, RotateCcw, Trash2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

type UserRecord = {
  id: number;
  login: string;
  perfil: 'admin' | 'user';
  ativo: boolean;
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
  const loginInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { user: loggedUser } = useAuthStore();

  const [formData, setFormData] = useState<FormState>(initialForm);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [formErrors, setFormErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [rowActionLoading, setRowActionLoading] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userPendingDelete, setUserPendingDelete] = useState<UserRecord | null>(null);

  useEffect(() => {
    if (loggedUser && loggedUser.perfil !== 'admin') {
      toast.error('Acesso restrito aos administradores.');
      navigate('/app/dashboard');
    }
  }, [loggedUser, navigate]);

  const fetchUsers = async (): Promise<UserRecord[]> => {
    setIsLoading(true);
    try {
      const response = await api.get<{ users: UserRecord[] }>('/api/admin/users');
      const data = response.data.users || [];
      setUsers(data);
      return data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Nao foi possivel carregar os usuarios.';
      toast.error(message);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (editingUser) {
      requestAnimationFrame(() => loginInputRef.current?.focus());
    }
  }, [editingUser]);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const resetForm = () => {
    setFormData(initialForm);
    setFormErrors({});
    setEditingUser(null);
  };

  const startEdit = (user: UserRecord) => {
    setEditingUser(user);
    setFormData({
      login: user.login,
      senha: '',
      confirmarSenha: '',
      perfil: user.perfil,
    });
    setFormErrors({});
    toast.dismiss();
    toast.success(`Editando usuario ${user.login}`);
  };

  const cancelEdit = () => {
    resetForm();
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setFormErrors({});

    try {
      if (editingUser) {
        const payload: Record<string, unknown> = {};

        if (formData.login && formData.login !== editingUser.login) {
          payload.login = formData.login;
        }

        if (formData.perfil && formData.perfil !== editingUser.perfil) {
          payload.perfil = formData.perfil;
        }

        if (formData.senha) {
          payload.senha = formData.senha;
          payload.confirmarSenha = formData.confirmarSenha;
        } else if (formData.confirmarSenha) {
          setFormErrors({ confirmarSenha: 'Informe a nova senha para confirmar.' });
          setIsSubmitting(false);
          return;
        }

        if (Object.keys(payload).length === 0) {
          toast.success('Nenhuma alteracao aplicada.');
          resetForm();
          setIsSubmitting(false);
          return;
        }

        await api.put(`/api/admin/users/${editingUser.id}`, payload);
        toast.success('Usuario atualizado com sucesso!');
      } else {
        await api.post('/api/admin/users', {
          login: formData.login,
          senha: formData.senha,
          confirmarSenha: formData.confirmarSenha,
          perfil: formData.perfil,
        });
        toast.success('Usuario criado com sucesso!');
      }

      await fetchUsers();
      resetForm();
    } catch (err: any) {
      if (err.response?.status === 400 && err.response.data?.errors) {
        const validation = (err.response.data.errors as Array<{ field: string; message: string }>)
          .reduce<ValidationErrors>((acc, item) => {
            acc[item.field] = item.message;
            return acc;
          }, {});
        setFormErrors(validation);
        toast.error('Verifique os campos destacados.');
      } else {
        const message = err.response?.data?.message || 'Ocorreu um erro ao salvar o usuario.';
        toast.error(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (item: UserRecord) => {
    setRowActionLoading(item.id);
    try {
      await api.patch(`/api/admin/users/${item.id}/status`, { ativo: !item.ativo });
      toast.success(!item.ativo ? 'Usuario reativado com sucesso!' : 'Usuario bloqueado com sucesso!');
      const latest = await fetchUsers();
      if (editingUser && editingUser.id === item.id) {
        const refreshed = latest.find((user) => user.id === item.id);
        if (refreshed) {
          setEditingUser(refreshed);
          setFormData({
            login: refreshed.login,
            senha: '',
            confirmarSenha: '',
            perfil: refreshed.perfil,
          });
        } else {
          resetForm();
        }
      }
    } catch (err: any) {
      const message = err.response?.data?.message || 'Nao foi possivel atualizar o status do usuario.';
      toast.error(message);
    } finally {
      setRowActionLoading(null);
    }
  };

  const openDeleteModal = (user: UserRecord) => {
    setUserPendingDelete(user);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setUserPendingDelete(null);
  };

  const handleDelete = async () => {
    if (!userPendingDelete) {
      return;
    }

    setIsDeleting(true);
    try {
      await api.delete(`/api/admin/users/${userPendingDelete.id}`);
      toast.success('Usuario removido com sucesso.');
      await fetchUsers();
      if (editingUser && editingUser.id === userPendingDelete.id) {
        resetForm();
      }
      closeDeleteModal();
    } catch (err: any) {
      const message = err.response?.data?.message || 'Nao foi possivel excluir o usuario.';
      toast.error(message);
    } finally {
      setIsDeleting(false);
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

  const isOwnAccount = (userId: number) => loggedUser?.id === userId;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">Usuarios</h2>
        <p className="text-gray-600 mt-2">Cadastre novos acessos, ajuste perfis e bloqueie ou remova contas.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-800">
              {editingUser ? 'Editar usuario' : 'Novo usuario'}
            </h3>
            {editingUser && (
              <button
                type="button"
                onClick={cancelEdit}
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
                disabled={isSubmitting}
              >
                Cancelar
              </button>
            )}
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="login">Login</Label>
              <Input
                ref={loginInputRef}
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
              <Label htmlFor="senha">Senha {editingUser && <span className="text-sm text-gray-500">(opcional)</span>}</Label>
              <Input
                id="senha"
                name="senha"
                type="password"
                value={formData.senha}
                onChange={handleInputChange}
                placeholder={editingUser ? 'Informe uma nova senha (opcional)' : 'Informe a senha'}
                required={!editingUser}
              />
              {formErrors.senha && <FormError message={formErrors.senha} />}
            </div>

            <div>
              <Label htmlFor="confirmarSenha">Confirmar senha {editingUser && <span className="text-sm text-gray-500">(preencha somente ao trocar a senha)</span>}</Label>
              <Input
                id="confirmarSenha"
                name="confirmarSenha"
                type="password"
                value={formData.confirmarSenha}
                onChange={handleInputChange}
                placeholder={editingUser ? 'Repita a nova senha' : 'Repita a senha'}
                required={!editingUser}
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
                {isSubmitting ? 'Salvando...' : editingUser ? 'Salvar alteracoes' : 'Criar usuario'}
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
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
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
                  <th className="px-4 py-2 text-left font-medium text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600 uppercase tracking-wider">Criado em</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600 uppercase tracking-wider">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-gray-500">Carregando usuarios...</td>
                  </tr>
                ) : sortedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-gray-500">Nenhum usuario cadastrado ate o momento.</td>
                  </tr>
                ) : (
                  sortedUsers.map((item) => (
                    <tr key={item.id} className={!item.ativo ? 'bg-gray-100 text-gray-600' : ''}>
                      <td className="px-4 py-2 font-medium text-gray-900">{item.login}</td>
                      <td className="px-4 py-2 text-gray-700 capitalize">{item.perfil}</td>
                      <td className="px-4 py-2">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${item.ativo ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {item.ativo ? 'Ativo' : 'Bloqueado'}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-gray-500">{formatDate(item.created_at)}</td>
                      <td className="px-4 py-2">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(item)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded border border-indigo-200 bg-white text-indigo-600 hover:bg-indigo-50 disabled:opacity-60"
                            disabled={rowActionLoading === item.id || isDeleting}
                            aria-label={`Editar ${item.login}`}
                            title={`Editar ${item.login}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(item)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded border border-yellow-200 bg-white text-yellow-700 hover:bg-yellow-50 disabled:opacity-60"
                            disabled={rowActionLoading === item.id || isDeleting || (isOwnAccount(item.id) && item.ativo)}
                            aria-label={item.ativo ? `Bloquear ${item.login}` : `Reativar ${item.login}`}
                            title={item.ativo ? `Bloquear ${item.login}` : `Reativar ${item.login}`}
                          >
                            {item.ativo ? <Ban className="h-4 w-4" /> : <RotateCcw className="h-4 w-4" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => openDeleteModal(item)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded border border-red-200 bg-white text-red-600 hover:bg-red-50 disabled:opacity-60"
                            disabled={rowActionLoading === item.id || isDeleting || isOwnAccount(item.id)}
                            aria-label={`Excluir ${item.login}`}
                            title={`Excluir ${item.login}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDelete}
        title="Confirmar exclusao"
        message={userPendingDelete ? `Tem certeza que deseja excluir o usuario "${userPendingDelete.login}"? Essa acao nao podera ser desfeita.` : ''}
        isLoading={isDeleting}
      />
    </div>
  );
}
