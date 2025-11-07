import React, { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';

import { useUiStore } from '@/store/uiStore';
import { useCrud } from '@/hooks/useCrud';
import api from '@/services/api';

import type { Militar, Obm } from '@/types/entities';

import FileUpload from '@/components/ui/FileUpload';
import MilitarForm from '@/components/forms/MilitarForm';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Pagination from '@/components/ui/Pagination';
import Spinner from '@/components/ui/Spinner';
import MilitarCard from '@/components/cards/MilitarCard';

import { Edit, Trash2, UserPlus, Search } from 'lucide-react';

export default function Militares() {
  const { setPageTitle } = useUiStore();
  const [isUploading, setIsUploading] = useState(false);
  const [obms, setObms] = useState<Obm[]>([]);
  const [expandedCards, setExpandedCards] = useState<Set<number>>(() => new Set());

  const {
    data: militares,
    pagination,
    isLoading,
    isFormModalOpen,
    itemToEdit,
    isConfirmModalOpen,
    isSaving,
    isDeleting,
    validationErrors,
    handlePageChange,
    handleFilterChange,
    handleOpenFormModal,
    handleCloseFormModal,
    handleDeleteClick,
    handleCloseConfirmModal,
    handleSave,
    handleConfirmDelete,
    fetchData,
  } = useCrud<Militar>({
    entityName: 'militares',
  });

  useEffect(() => {
    setPageTitle('Efetivo (Militares)');
  }, [setPageTitle]);

  useEffect(() => {
    const fetchObms = async () => {
      try {
        const response = await api.get('/api/admin/obms?limit=500');
        setObms(response.data.data);
      } catch {
        toast.error('Falha ao carregar OBMs.');
      }
    };
    fetchObms();
  }, []);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const searchInput = e.currentTarget.elements.namedItem('search') as HTMLInputElement;
    handleFilterChange('nome_completo', searchInput.value);
  };

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post('/api/admin/militares/upload-csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Arquivo enviado com sucesso! A atualizacao sera processada em segundo plano.');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Falha no upload do arquivo.');
    } finally {
      setIsUploading(false);
    }
  };

  const sortedMilitares = useMemo(() => {
    if (!militares) return [];
    return [...militares].sort((a, b) =>
      (a.nome_completo || '').localeCompare(b.nome_completo || '', 'pt-BR'),
    );
  }, [militares]);

  const handleToggleCard = (id: number) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <FileUpload
        title="Importar/Atualizar Militares via Planilha"
        onUpload={handleFileUpload}
        isLoading={isUploading}
      />

      <div className="bg-cardSlate p-6 rounded-lg shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
          <form onSubmit={handleSearch} className="flex-grow w-full md:w-auto">
            <div className="relative">
              <input
                type="text"
                name="search"
                placeholder="Buscar por nome, matricula ou posto..."
                className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus-visible:ring-tagBlue"
                onChange={(e) => handleFilterChange('nome_completo', e.target.value)}
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-textSecondary" />
            </div>
          </form>
          <Button onClick={() => handleOpenFormModal()} variant="primary" className="w-full md:w-auto">
            <UserPlus className="w-4 h-4 mr-2" />
            Adicionar Militar
          </Button>
        </div>

        {isLoading && <Spinner />}

        {!isLoading && (
          <>
            <div className="hidden md:block">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-borderDark/60">
                  <thead className="bg-searchbar">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">
                        Posto/Grad.
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">
                        Nome Completo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">
                        Nome de Guerra
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">
                        Matricula
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">
                        Lotacao (OBM)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">
                        Telefone
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-textSecondary uppercase tracking-wider">
                        Acoes
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-cardSlate divide-y divide-borderDark/60">
                    {sortedMilitares.map((militar) => (
                      <tr key={militar.id} className="hover:bg-searchbar transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-textMain">
                          {militar.posto_graduacao}
                        </td>
                        <td className="px-6 py-4 text-sm text-textMain">{militar.nome_completo}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-textSecondary">
                          {militar.nome_guerra || 'Nao informado'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-textSecondary">
                          {militar.matricula}
                        </td>
                        <td className="px-6 py-4 text-sm text-textSecondary">{militar.obm_nome || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                              militar.ativo
                                ? 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/40'
                                : 'bg-premiumOrange/20 text-premiumOrange'
                            }`}
                          >
                            {militar.ativo ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-textSecondary">
                          {militar.telefone || 'Nao informado'}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex items-center justify-end gap-4">
                            <button
                              onClick={() => handleOpenFormModal(militar)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded bg-sky-500 text-white shadow hover:bg-sky-600 transition disabled:opacity-60"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(militar.id)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded bg-rose-500 text-white shadow hover:bg-rose-600 transition disabled:opacity-60"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-4 md:hidden">
              {sortedMilitares.map((militar) => (
                <MilitarCard
                  key={militar.id}
                  militar={militar}
                  isExpanded={expandedCards.has(militar.id)}
                  onToggle={() => handleToggleCard(militar.id)}
                  onEdit={() => handleOpenFormModal(militar)}
                  onDelete={() => handleDeleteClick(militar.id)}
                />
              ))}
            </div>

            {pagination && pagination.totalPages > 1 && (
              <div className="mt-4">
                <Pagination
                  currentPage={pagination.currentPage}
                  totalPages={pagination.totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </>
        )}
      </div>

      <Modal
        isOpen={isFormModalOpen}
        title={itemToEdit ? 'Editar Militar' : 'Adicionar Militar'}
        onClose={handleCloseFormModal}
      >
        <MilitarForm
          initialData={itemToEdit}
          onSuccess={handleCloseFormModal}
          obms={obms}
          isSaving={isSaving}
          errors={validationErrors}
          onSave={handleSave}
        />
      </Modal>

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        title="Confirmar Exclusao"
        message="Tem certeza de que deseja excluir este militar? Esta acao nao pode ser desfeita."
        onConfirm={handleConfirmDelete}
        onClose={handleCloseConfirmModal}
        isLoading={isDeleting}
      />
    </div>
  );
}
