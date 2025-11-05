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

import { Edit, Trash2, UserPlus, Search } from 'lucide-react';
import MilitarCard from '@/components/cards/MilitarCard';

export default function Militares() {
  const { setPageTitle } = useUiStore();
  const [isUploading, setIsUploading] = useState(false);

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

  const [obms, setObms] = useState<Obm[]>([]);

  useEffect(() => {
    setPageTitle('Efetivo (Militares)');
  }, [setPageTitle]);

  useEffect(() => {
    const fetchObms = async () => {
      try {
        const response = await api.get('/api/admin/obms?limit=500');
        setObms(response.data.data);
      } catch (err) {
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
      toast.success('Arquivo enviado com sucesso! A atualização será processada em segundo plano.');
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
      (a.nome_completo || '').localeCompare(b.nome_completo || '', 'pt-BR')
    );
  }, [militares]);

  const responsiveCellClass =
    'block px-4 py-2 text-sm text-textMain md:table-cell md:px-6 md:py-4 md:align-middle before:block before:text-xs before:font-semibold before:uppercase before:text-textSecondary before:content-[attr(data-label)] md:before:hidden';

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
                placeholder="Buscar por nome, matrícula ou posto..."
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
            <div className="md:overflow-x-auto">
              <table className="min-w-full divide-y divide-borderDark/60">
                <thead className="hidden bg-searchbar md:table-header-group">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">Posto/Grad.</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">Nome Completo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">Nome de Guerra</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">Matrícula</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">Lotação (OBM)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">Telefone</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-textSecondary uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="space-y-4 md:space-y-0 md:divide-y md:divide-borderDark/60">
                  {sortedMilitares.map((militar) => (
                    <tr
                      key={militar.id}
                      className="block rounded-lg border border-borderDark/60 bg-cardSlate p-4 shadow-sm transition md:table-row md:rounded-none md:border-0 md:bg-transparent md:p-0 md:shadow-none md:hover:bg-searchbar"
                    >
                      <td className={`${responsiveCellClass} md:whitespace-nowrap`} data-label="Posto/Grad.">
                        {militar.posto_graduacao}
                      </td>
                      <td className={responsiveCellClass} data-label="Nome Completo">
                        {militar.nome_completo}
                      </td>
                      <td className={`${responsiveCellClass} md:whitespace-nowrap`} data-label="Nome de Guerra">
                        {militar.nome_guerra || 'Não informado'}
                      </td>
                      <td className={`${responsiveCellClass} text-textSecondary md:whitespace-nowrap`} data-label="Matr��cula">
                        {militar.matricula}
                      </td>
                      <td className={`${responsiveCellClass} text-textSecondary`} data-label="Lota��ǜo (OBM)">
                        {militar.obm_nome || 'N/A'}
                      </td>
                      <td className={responsiveCellClass} data-label="Status">
                        <span
                          className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                            militar.ativo ? 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/40' : 'bg-premiumOrange/20 text-premiumOrange'
                          }`}
                        >
                          {militar.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className={`${responsiveCellClass} text-textSecondary`} data-label="Telefone">
                        {militar.telefone || 'Não informado'}
                      </td>
                      <td className={`${responsiveCellClass} md:text-right`} data-label="Ações">
                        <div className="mt-2 flex items-center gap-4 md:mt-0 md:justify-end">
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
        title="Confirmar Exclusão"
        message="Tem certeza de que deseja excluir este militar? Esta ação não pode ser desfeita."
        onConfirm={handleConfirmDelete}
        onClose={handleCloseConfirmModal}
        isLoading={isDeleting}
      />
    </div>
  );
}

