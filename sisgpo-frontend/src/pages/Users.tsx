import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { PlusCircle, Pencil, Ban, RotateCcw, Trash2, Check, X } from 'lucide-react';

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
  const isAdmin = loggedUser?.perfil === 'admin';

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
      await api.post(`/api/admin/users/${item.id}/toggle-active`);
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
        <p className="mt-2 text-textSecondary">
          Cadastre novos acessos, ajuste perfis e bloqueie ou remova contas.
        </p>
      </div>

      <div className="rounded-lg bg-cardSlate p-6 shadow-md">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h3 className="text-xl font-semibold text-textMain">Usuarios cadastrados</h3>
          {isAdmin && (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <button
                type="button"
                onClick={fetchUsers}
                disabled={isLoading}
                className="inline-flex items-center justify-center rounded-md border border-transparent bg-emerald-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-600 focus:outline-none focus:ring-2 focus-visible:ring-emerald-500 disabled:opacity-60"
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
          )}
        </div>

        <div className="space-y-3">
          {isLoading ? (
            <div className="px-4 py-6 text-center text-textSecondary">Carregando usuarios...</div>
          ) : sortedUsers.length === 0 ? (
            <div className="px-4 py-6 text-center text-textSecondary">
              Nenhum usuario cadastrado ate o momento.
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="space-y-3 md:hidden">
                {sortedUsers.map((user) => (
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
                    isAdmin={isAdmin}
                  />
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block">
                <table className="min-w-full divide-y divide-borderDark/60">
                  <thead className="bg-searchbar">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">Usuário</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">Email</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">Perfil</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">Status</th>
                      {isAdmin && <th scope="col" className="relative px-6 py-3"><span className="sr-only">Ações</span></th>}
                    </tr>
                  </thead>
                  <tbody className="bg-cardSlate divide-y divide-borderDark/60">
                    {sortedUsers.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-textMain">{user.nome_completo || user.login}</div>
                          <div className="text-sm text-textSecondary">{user.login}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-textSecondary">{user.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-textSecondary">{user.perfil}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {/* Status logic from UserRow */}
                          {user.status === 'pending' || user.status === 'pendente' ? (
                            <span className="inline-flex items-center rounded-full bg-yellow-500/15 px-2.5 py-0.5 text-xs font-semibold text-yellow-300 ring-1 ring-yellow-500/40">
                              Pendente
                            </span>
                          ) : user.ativo ? (
                            <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-500/40">
                              Ativo
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-premiumOrange/20 px-2.5 py-0.5 text-xs font-semibold text-premiumOrange">
                              Bloqueado
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {/* Action buttons logic from UserRow */}
                          {isAdmin && (
                            <div className="flex items-center justify-end gap-2">
                              {user.status === 'pending' || user.status === 'pendente' ? (
                                <>
                                  <button onClick={() => handleApprove(user)} title="Aprovar" className="text-green-400 hover:text-green-300 disabled:opacity-50" disabled={rowActionLoading === user.id}><Check className="h-5 w-5" /></button>
                                  <button onClick={() => handleReject(user)} title="Rejeitar" className="text-red-400 hover:text-red-300 disabled:opacity-50" disabled={rowActionLoading === user.id}><X className="h-5 w-5" /></button>
                                </>
                              ) : (
                                <>
                                  <button onClick={() => startEdit(user)} title="Editar" className="text-sky-400 hover:text-sky-300 disabled:opacity-50" disabled={rowActionLoading === user.id}><Pencil className="h-5 w-5" /></button>
                                  <button onClick={() => handleToggleStatus(user)} title={user.ativo ? 'Bloquear' : 'Reativar'} className="text-amber-400 hover:text-amber-300 disabled:opacity-50" disabled={rowActionLoading === user.id || isOwnAccount(user.id)}>{user.ativo ? <Ban className="h-5 w-5" /> : <RotateCcw className="h-5 w-5" />}</button>
                                  <button onClick={() => openDeleteModal(user)} title="Excluir" className="text-rose-400 hover:text-rose-300 disabled:opacity-50" disabled={rowActionLoading === user.id || isOwnAccount(user.id)}><Trash2 className="h-5 w-5" /></button>
                                </>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
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
