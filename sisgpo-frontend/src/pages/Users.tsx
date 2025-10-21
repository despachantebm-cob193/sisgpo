import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Pencil, Ban, RotateCcw, Trash2, PlusCircle } from 'lucide-react';

import api from '../services/api';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import UserFormModal from '../components/forms/UserFormModal';
import { useAuthStore } from '../store/authStore';
import { UserRecord } from '../types/entities';
import { useUiStore } from '@/store/uiStore';

export default function Users() {
  const navigate = useNavigate();
  const { user: loggedUser } = useAuthStore();
  const { setPageTitle } = useUiStore();

  useEffect(() => {
    setPageTitle('Usuários');
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
      const message = error.response?.data?.message || 'Não foi possível carregar os usuários.';
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
      toast.success(!item.ativo ? 'Usuário reativado com sucesso!' : 'Usuário bloqueado com sucesso!');
      await fetchUsers();
    } catch (err: any) {
      const message = err.response?.data?.message || 'Não foi possível atualizar o status do usuário.';
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
      toast.success('Usuário removido com sucesso.');
      await fetchUsers();
      if (editingUser && editingUser.id === userPendingDelete.id) {
        handleCancel();
      }
      closeDeleteModal();
    } catch (err: any) {
      const message = err.response?.data?.message || 'Não foi possível excluir o usuário.';
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const sortedUsers = useMemo(
    () => [...users].sort((a, b) => a.login.localeCompare(b.login, 'pt-BR')),
    [users],
  );

  const formatDate = (value?: string) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleString('pt-BR');
  };

  const isOwnAccount = (userId: number) => loggedUser?.id === userId;

  const responsiveCellClass =
    'block px-4 py-2 text-sm text-gray-900 md:table-cell md:px-4 md:py-3 md:align-middle before:block before:text-xs before:font-semibold before:uppercase before:text-gray-500 before:content-[attr(data-label)] md:before:hidden';

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">Usuários</h2>
        <p className="mt-2 text-gray-600">
          Cadastre novos acessos, ajuste perfis e bloqueie ou remova contas.
        </p>
      </div>

      <div className="rounded-lg bg-white p-6 shadow-md">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h3 className="text-xl font-semibold text-gray-800">Usuários cadastrados</h3>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <button
              type="button"
              onClick={fetchUsers}
              disabled={isLoading}
              className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
            >
              {isLoading ? 'Atualizando...' : 'Atualizar'}
            </button>
            <button
              type="button"
              onClick={startCreate}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              <PlusCircle className="h-5 w-5" />
              Novo usuário
            </button>
          </div>
        </div>

        <div className="md:overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="hidden bg-gray-50 md:table-header-group">
              <tr>
                <th className="px-4 py-2 text-left font-medium uppercase tracking-wider text-gray-600">
                  Login
                </th>
                <th className="px-4 py-2 text-left font-medium uppercase tracking-wider text-gray-600">
                  Nome completo
                </th>
                <th className="px-4 py-2 text-left font-medium uppercase tracking-wider text-gray-600">
                  Email
                </th>
                <th className="px-4 py-2 text-left font-medium uppercase tracking-wider text-gray-600">
                  Perfil
                </th>
                <th className="px-4 py-2 text-left font-medium uppercase tracking-wider text-gray-600">
                  Status
                </th>
                <th className="px-4 py-2 text-left font-medium uppercase tracking-wider text-gray-600">
                  Criado em
                </th>
                <th className="px-4 py-2 text-left font-medium uppercase tracking-wider text-gray-600">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="space-y-4 md:space-y-0 md:divide-y md:divide-gray-100">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-6 text-center text-gray-500"
                  >
                    Carregando usuários...
                  </td>
                </tr>
              ) : sortedUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-6 text-center text-gray-500"
                  >
                    Nenhum usuário cadastrado até o momento.
                  </td>
                </tr>
              ) : (
                sortedUsers.map((item) => (
                  <tr
                    key={item.id}
                    className={`block rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition md:table-row md:rounded-none md:border-0 md:bg-transparent md:p-0 md:shadow-none md:hover:bg-gray-50 ${
                      item.ativo ? '' : 'md:bg-gray-100'
                    }`}
                  >
                    <td
                      className={`${responsiveCellClass} font-medium text-gray-900 ${
                        item.ativo ? '' : 'md:text-gray-600'
                      }`}
                      data-label="Login"
                    >
                      {item.login}
                    </td>
                    <td
                      className={`${responsiveCellClass} text-gray-900 ${
                        item.ativo ? '' : 'md:text-gray-600'
                      }`}
                      data-label="Nome completo"
                    >
                      {item.nome_completo ?? '-'}
                    </td>
                    <td
                      className={`${responsiveCellClass} text-gray-700 ${
                        item.ativo ? '' : 'md:text-gray-500'
                      }`}
                      data-label="Email"
                    >
                      {item.email ?? '-'}
                    </td>
                    <td
                      className={`${responsiveCellClass} capitalize text-gray-700 ${
                        item.ativo ? '' : 'md:text-gray-500'
                      }`}
                      data-label="Perfil"
                    >
                      {item.perfil}
                    </td>
                    <td
                      className={responsiveCellClass}
                      data-label="Status"
                    >
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          item.ativo
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {item.ativo ? 'Ativo' : 'Bloqueado'}
                      </span>
                    </td>
                    <td
                      className={`${responsiveCellClass} text-gray-500`}
                      data-label="Criado em"
                    >
                      {formatDate(item.created_at)}
                    </td>
                    <td
                      className={`${responsiveCellClass} md:text-left`}
                      data-label="Ações"
                    >
                      <div className="mt-3 flex flex-wrap gap-3 md:mt-0">
                        <button
                          type="button"
                          onClick={() => startEdit(item)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded border border-indigo-200 bg-white text-indigo-600 transition hover:bg-indigo-50 disabled:opacity-60"
                          disabled={rowActionLoading === item.id || isDeleting}
                          aria-label={`Editar ${item.login}`}
                          title={`Editar ${item.login}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(item)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded border border-yellow-200 bg-white text-yellow-700 transition hover:bg-yellow-50 disabled:opacity-60"
                          disabled={
                            rowActionLoading === item.id ||
                            isDeleting ||
                            (isOwnAccount(item.id) && item.ativo)
                          }
                          aria-label={item.ativo ? `Bloquear ${item.login}` : `Reativar ${item.login}`}
                          title={item.ativo ? `Bloquear ${item.login}` : `Reativar ${item.login}`}
                        >
                          {item.ativo ? <Ban className="h-4 w-4" /> : <RotateCcw className="h-4 w-4" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => openDeleteModal(item)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded border border-red-200 bg-white text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                          disabled={
                            rowActionLoading === item.id ||
                            isDeleting ||
                            isOwnAccount(item.id)
                          }
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
        title="Confirmar exclusão"
        message={
          userPendingDelete
            ? `Tem certeza de que deseja excluir o usuário "${userPendingDelete.login}"? Essa ação não poderá ser desfeita.`
            : ''
        }
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
