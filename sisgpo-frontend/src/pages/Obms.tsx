﻿import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Edit, Trash2, Trash, Plus } from 'lucide-react';

import { Obm, ObmOption } from '@/types/entities';
import api from '@/services/api';
import { useUiStore } from '@/store/uiStore';

import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import Modal from '@/components/ui/Modal';
import ObmForm from '@/components/forms/ObmForm';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import Pagination from '@/components/ui/Pagination';
import FileUpload from '@/components/ui/FileUpload';
import Input from '@/components/ui/Input';

interface PaginationState {
  currentPage: number;
  totalPages: number;
}

interface ApiResponse<T> {
  data: T[];
  pagination: PaginationState | null;
}

interface ApiErrorDetail {
  field: string;
  message: string;
}

export default function Obms() {
  const { setPageTitle } = useUiStore();

  const [obms, setObms] = useState<Obm[]>([]);
  const [obmOptions, setObmOptions] = useState<ObmOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({ nome: '' });
  const [pagination, setPagination] = useState<PaginationState | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [validationErrors, setValidationErrors] = useState<ApiErrorDetail[]>([]);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<Obm | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [itemToDeleteId, setItemToDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isConfirmDeleteAllModalOpen, setIsConfirmDeleteAllModalOpen] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [lastUpload, setLastUpload] = useState<string | null>(null);

  useEffect(() => {
    setPageTitle('Gerenciar OBMs');
  }, [setPageTitle]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(currentPage), limit: '15' });
      if (filters.nome) params.append('nome', filters.nome);

      const [obmsRes, optionsRes, metadataRes] = await Promise.all([
        api.get<ApiResponse<Obm>>(`/api/admin/obms?${params.toString()}`),
        api.get('/api/admin/viaturas/distinct-obms'),
        api.get('/api/admin/metadata/viaturas_last_upload').catch(() => null),
      ]);

      setObms(obmsRes.data.data);
      setPagination(obmsRes.data.pagination);

      const options = Array.isArray(optionsRes.data)
        ? optionsRes.data.map((option: any) => ({
            value: option.value || option.obm || option.nome,
            label: option.label || option.value || option.obm,
            cidade: option.cidade ? String(option.cidade) : '',
          }))
        : [];
      setObmOptions(options);

      if (metadataRes && metadataRes.data?.value) {
        setLastUpload(new Date(metadataRes.data.value).toLocaleString('pt-BR'));
      } else {
        setLastUpload(null);
      }
    } catch (error) {
      toast.error('Não foi possível carregar os dados das OBMs.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [filters.nome, currentPage]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePageChange = (page: number) => setCurrentPage(page);
  const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ nome: event.target.value });
    setCurrentPage(1);
  };

  const handleOpenFormModal = (item: Obm | null = null) => {
    setItemToEdit(item);
    setValidationErrors([]);
    setIsFormModalOpen(true);
  };
  const handleCloseFormModal = () => setIsFormModalOpen(false);

  const handleDeleteClick = (id: number) => {
    setItemToDeleteId(id);
    setIsConfirmModalOpen(true);
  };
  const handleCloseConfirmModal = () => setIsConfirmModalOpen(false);

  const handleSave = async (data: Omit<Obm, 'id' | 'obm_id'> & { id?: number }) => {
    setIsSaving(true);
    setValidationErrors([]);
    const action = data.id ? 'atualizada' : 'criada';
    const { id, ...payload } = data;
    try {
      if (id) {
        await api.put(`/api/admin/obms/${id}`, payload);
      } else {
        await api.post('/api/admin/obms', payload);
      }
      toast.success(`OBM ${action} com sucesso!`);
      handleCloseFormModal();
      fetchData();
    } catch (err: any) {
      if (err.response?.status === 400 && err.response.data?.errors) {
        setValidationErrors(err.response.data.errors);
        toast.error('Por favor, corrija os erros no formulário.');
      } else {
        toast.error(err.response?.data?.message || 'Erro ao salvar OBM.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!itemToDeleteId) return;
    setIsDeleting(true);
    try {
      await api.delete(`/api/admin/obms/${itemToDeleteId}`);
      toast.success('OBM excluída com sucesso!');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao excluir OBM.');
    } finally {
      setIsDeleting(false);
      handleCloseConfirmModal();
    }
  };

  const handleConfirmDeleteAll = async () => {
    setIsDeletingAll(true);
    try {
      await api.delete('/api/admin/obms');
      toast.success('Todas as OBMs foram removidas.');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao excluir todas as OBMs.');
    } finally {
      setIsDeletingAll(false);
      setIsConfirmDeleteAllModalOpen(false);
    }
  };

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await api.post('/api/admin/obms/upload-csv', formData);
      toast.success(response.data?.message || 'Arquivo processado com sucesso!');
      if (response.data?.errors?.length) {
        const preview = response.data.errors.slice(0, 3).join(' | ');
        const remaining = response.data.errors.length > 3 ? ` ... (+${response.data.errors.length - 3} linhas)` : '';
        toast.error(`Algumas linhas foram ignoradas: ${preview}${remaining}`);
        console.warn('Linhas ignoradas durante a importação:', response.data.errors);
      }
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao enviar o arquivo.');
    } finally {
      setIsUploading(false);
    }
  };

  const obmOptionsNormalized: ObmOption[] = obmOptions.map((option) => ({
    value: option.value,
    label: option.label,
    cidade: option.cidade ?? '',
  }));

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">Gerenciar OBMs</h2>
          <p className="text-gray-600 mt-2">Adicione, edite ou remova organizações militares.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button
            onClick={() => setIsConfirmDeleteAllModalOpen(true)}
            variant="danger"
            disabled={obms.length === 0 || isDeletingAll}
          >
            <Trash className="w-4 h-4 mr-2" />
            {isDeletingAll ? 'Excluindo...' : 'Excluir Todas as OBMs'}
          </Button>
          <Button onClick={() => handleOpenFormModal()}>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Nova OBM
          </Button>
        </div>
      </div>

      <FileUpload
        title="Atualizar Cidades/Telefones via Planilha"
        onUpload={handleUpload}
        isLoading={isUploading}
        acceptedFileTypes=".csv"
        lastUpload={lastUpload}
      />

      <Input
        type="text"
        placeholder="Filtrar por nome..."
        value={filters.nome}
        onChange={handleFilterChange}
        className="max-w-xs mb-4"
      />

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full table-fixed">
            <thead className="bg-gray-50 hidden md:table-header-group">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase" style={{ width: '35%' }}>Nome</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase" style={{ width: '15%' }}>Sigla</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase" style={{ width: '15%' }}>CRBM</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase" style={{ width: '15%' }}>Cidade</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase" style={{ width: '15%' }}>Telefone</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase" style={{ width: '10%' }}>Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 md:divide-y-0">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10">
                    <Spinner className="h-10 w-10 mx-auto" />
                  </td>
                </tr>
              ) : obms.length > 0 ? (
                obms.map((obm) => (
                  <tr key={obm.id} className="block md:table-row border-b md:border-none p-4 md:p-0">
                    <td className="block md:table-cell px-6 py-2 md:py-4 text-sm font-medium text-gray-900 break-words" data-label="Nome:">{obm.nome}</td>
                    <td className="block md:table-cell px-6 py-2 md:py-4 whitespace-nowrap text-sm text-gray-500" data-label="Abreviatura:">{obm.abreviatura}</td>
                    <td className="block md:table-cell px-6 py-2 md:py-4 whitespace-nowrap text-sm text-gray-500" data-label="CRBM:">{obm.crbm || 'N/A'}</td>
                    <td className="block md:table-cell px-6 py-2 md:py-4 whitespace-nowrap text-sm text-gray-500" data-label="Cidade:">{obm.cidade || 'N/A'}</td>
                    <td className="block md:table-cell px-6 py-2 md:py-4 whitespace-nowrap text-sm text-gray-500" data-label="Telefone:">{obm.telefone || 'N/A'}</td>
                    <td className="block md:table-cell px-6 py-2 md:py-4 whitespace-nowrap text-center text-sm font-medium space-x-4 mt-2 md:mt-0">
                      <button onClick={() => handleOpenFormModal(obm)} className="text-indigo-600 hover:text-indigo-900" title="Editar">
                        <Edit className="w-5 h-5 inline-block" />
                      </button>
                      <button onClick={() => handleDeleteClick(obm.id)} className="text-red-600 hover:text-red-900" title="Excluir">
                        <Trash2 className="w-5 h-5 inline-block" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-500">Nenhuma OBM encontrada.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {pagination && (
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
          />
        )}
      </div>

      <Modal
        isOpen={isFormModalOpen}
        onClose={handleCloseFormModal}
        title={itemToEdit ? 'Editar OBM' : 'Adicionar Nova OBM'}
      >
        <ObmForm
          obmToEdit={itemToEdit}
          obmOptions={obmOptionsNormalized}
          onSave={handleSave}
          onCancel={handleCloseFormModal}
          isLoading={isSaving}
          errors={validationErrors}
        />
      </Modal>

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={handleCloseConfirmModal}
        onConfirm={handleConfirmDelete}
        title="Confirmar Exclusão"
        message="Tem certeza que deseja excluir esta OBM?"
        isLoading={isDeleting}
      />

      <ConfirmationModal
        isOpen={isConfirmDeleteAllModalOpen}
        onClose={() => setIsConfirmDeleteAllModalOpen(false)}
        onConfirm={handleConfirmDeleteAll}
        title="Confirmar limpeza"
        message="Esta ação removerá todas as OBMs cadastradas. Deseja continuar?"
        isLoading={isDeletingAll}
      />
    </div>
  );
}

