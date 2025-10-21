import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import { Pencil, Ban, RotateCcw, Trash2, PlusCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { UserRecord } from '../types/entities';
import UserFormModal from '../components/forms/UserFormModal';
import { useUiStore } from '@/store/uiStore';

export default function Users() {
  const navigate = useNavigate();
  const { user: loggedUser } = useAuthStore();
  const { setPageTitle } = useUiStore();

  useEffect(() => {
    setPageTitle("Usuários");
  }, [setPageTitle]);

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [rowActionLoading, setRowActionLoading] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userPendingDelete, setUserPendingDelete] = useState<UserRecord | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);

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

  const handleSave = async () => {
    setIsFormModalOpen(false);
    setEditingUser(null);
    await fetchUsers();
  };

  const handleCancel = () => {
    setIsFormModalOpen(false);
    setEditingUser(null);
  };

  const startEdit = (user: UserRecord) => {
    setEditingUser(user);
    setIsFormModalOpen(true);
  };
  
  const startCreate = () => {
    setEditingUser(null);
    setIsFormModalOpen(true);
  };

  const handleToggleStatus = async (item: UserRecord) => {
    setRowActionLoading(item.id);
    try {
      await api.patch(`/api/admin/users/${item.id}/status`, { ativo: !item.ativo });
      toast.success(!item.ativo ? 'Usuario reativado com sucesso!' : 'Usuario bloqueado com sucesso!');
      await fetchUsers();
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
        handleCancel();
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

      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-800">Usuarios cadastrados</h3>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={fetchUsers}
              disabled={isLoading}
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
            >
              {isLoading ? 'Atualizando...' : 'Atualizar'}
            </button>
            <button
                type="button"
                onClick={startCreate}
                className="inline-flex items-center gap-2 rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                <PlusCircle className="h-5 w-5" />
                Novo usuário
              </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-600 uppercase tracking-wider">Login</th>
                <th className="px-4 py-2 text-left font-medium text-gray-600 uppercase tracking-wider">Nome completo</th>
                <th className="px-4 py-2 text-left font-medium text-gray-600 uppercase tracking-wider">Email</th>
                <th className="px-4 py-2 text-left font-medium text-gray-600 uppercase tracking-wider">Perfil</th>
                <th className="px-4 py-2 text-left font-medium text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-4 py-2 text-left font-medium text-gray-600 uppercase tracking-wider">Criado em</th>
                <th className="px-4 py-2 text-left font-medium text-gray-600 uppercase tracking-wider">Acoes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-gray-500">Carregando usuarios...</td>
                </tr>
              ) : sortedUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-gray-500">Nenhum usuario cadastrado ate o momento.</td>
                </tr>
              ) : (
                sortedUsers.map((item) => (
                  <tr key={item.id} className={!item.ativo ? 'bg-gray-100 text-gray-600' : ''}>
                    <td className="px-4 py-2 font-medium text-gray-900">{item.login}</td>
                    <td className="px-4 py-2 text-gray-900">{item.nome_completo ?? '-'}</td>
                    <td className="px-4 py-2 text-gray-700">{item.email ?? '-'}</td>
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

      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDelete}
        title="Confirmar exclusao"
        message={userPendingDelete ? `Tem certeza que deseja excluir o usuario "${userPendingDelete.login}"? Essa acao nao podera ser desfeita.` : ''}
        isLoading={isDeleting}
      />

      <UserFormModal
        isOpen={isFormModalOpen}
        onClose={handleCancel}
        onSave={handleSave}
        editingUser={editingUser}
      />
    </div>
  );
}