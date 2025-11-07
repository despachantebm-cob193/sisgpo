import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { PlusCircle } from 'lucide-react';

import api from '../services/api';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import UserFormModal from '../components/forms/UserFormModal';
import UserRow from '../components/ui/UserRow';
import { useAuthStore } from '../store/authStore';
import { UserRecord } from '../types/entities';
import { useUiStore } from '@/store/uiStore';

export default function Users() {
  const navigate = useNavigate();
  const { user: loggedUser } = useAuthStore();
  const { setPageTitle } = useUiStore();

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [rowActionLoading, setRowActionLoading] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userPendingDelete, setUserPendingDelete] = useState<UserRecord | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);

  useEffect(() => {
    setPageTitle('Usuarios');
  }, [setPageTitle]);

  useEffect(() => {
    if (loggedUser && loggedUser.perfil !== 'admin') {
      toast.error('Acesso restrito aos administradores.');
      navigate('/app/dashboard');
    }
  }, [loggedUser, navigate]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await api.get<{ users: UserRecord[] }>('/api/admin/users');
      const data = response.data.users || [];
      setUsers(data);
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

  const handleApprove = async (item: UserRecord) => {
    setRowActionLoading(item.id);
    try {
      await api.post(`/api/admin/users/${item.id}/approve`);
      toast.success('Usuario aprovado com sucesso!');
      await fetchUsers();
    } catch (err: any) {
      const message = err.response?.data?.message || 'Nao foi possivel aprovar o usuario.';
      toast.error(message);
    } finally {
      setRowActionLoading(null);
    }
  };

  const handleReject = async (item: UserRecord) => {
    setRowActionLoading(item.id);
    try {
      await api.post(`/api/admin/users/${item.id}/reject`);
      toast.success('Usuario rejeitado com sucesso!');
      await fetchUsers();
    } catch (err: any) {
      const message = err.response?.data?.message || 'Nao foi possivel rejeitar o usuario.';
      toast.error(message);
    } finally {
      setRowActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!userPendingDelete) return;

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

  const sortedUsers = useMemo(
    () =>
      [...users].sort((a, b) =>
        (a.nome_completo ?? a.login).localeCompare(b.nome_completo ?? b.login, 'pt-BR'),
      ),
    [users],
  );

  const isOwnAccount = (userId: number) => loggedUser?.id === userId;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-textMain">Usuarios</h2>
        <p className="mt-2 text-textSecondary">
          Cadastre novos acessos, ajuste perfis e bloqueie ou remova contas.
        </p>
      </div>

      <div className="rounded-lg bg-cardSlate p-6 shadow-md">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h3 className="text-xl font-semibold text-textMain">Usuarios cadastrados</h3>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <button
              type="button"
              onClick={fetchUsers}
              disabled={isLoading}
              className="inline-flex items-center justify-center rounded-md border border-borderDark/60 bg-cardSlate px-4 py-2 text-sm font-medium text-textSecondary shadow-sm transition hover:bg-searchbar focus:outline-none focus:ring-2 focus-visible:ring-tagBlue disabled:opacity-60"
            >
              {isLoading ? 'Atualizando...' : 'Atualizar'}
            </button>
            <button
              type="button"
              onClick={startCreate}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-transparent bg-tagBlue px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-tagBlue/80 focus:outline-none focus:ring-2 focus-visible:ring-tagBlue focus:ring-offset-2"
            >
              <PlusCircle className="h-5 w-5" />
              Novo usuario
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {isLoading ? (
            <div className="px-4 py-6 text-center text-textSecondary">Carregando usuarios...</div>
          ) : sortedUsers.length === 0 ? (
            <div className="px-4 py-6 text-center text-textSecondary">
              Nenhum usuario cadastrado ate o momento.
            </div>
          ) : (
            sortedUsers.map((user) => (
              <UserRow
                key={user.id}
                user={user}
                onEdit={startEdit}
                onToggleStatus={handleToggleStatus}
                onDelete={openDeleteModal}
                onApprove={handleApprove}
                onReject={handleReject}
                isOwnAccount={isOwnAccount(user.id)}
                rowActionLoading={rowActionLoading}
                isDeleting={isDeleting}
              />
            ))
          )}
        </div>
      </div>

      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDelete}
        title="Confirmar exclusao"
        message={
          userPendingDelete
            ? `Tem certeza de que deseja excluir o usuario "${userPendingDelete.login}"? Essa acao nao podera ser desfeita.`
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
