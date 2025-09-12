// Arquivo: frontend/src/pages/Militares.tsx (VERSÃO FINAL COMPLETA)

import React, { useState, ChangeEvent, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { Edit, Trash2 } from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';

import api from '../services/api';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import MilitarForm from '../components/forms/MilitarForm';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import Pagination from '../components/ui/Pagination';
import FileUpload from '../components/ui/FileUpload';

// Interfaces
interface Militar {
  id: number;
  matricula: string;
  nome_completo: string;
  nome_guerra: string | null;
  posto_graduacao: string;
  ativo: boolean;
  obm_nome: string | null;
}
interface PaginationState {
  currentPage: number;
  totalPages: number;
}
interface ApiResponse<T> {
  data: T[];
  pagination: PaginationState | null;
}

export default function Militares() {
  const [militares, setMilitares] = useState<Militar[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({ nome_completo: '' });
  const [pagination, setPagination] = useState<PaginationState | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [validationErrors, setValidationErrors] = useState<any[]>([]);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<Militar | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [itemToDeleteId, setItemToDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(currentPage), limit: '50', ...filters });
      const response = await api.get<ApiResponse<Militar>>(`/api/admin/militares?${params.toString()}`);
      setMilitares(response.data.data);
      setPagination(response.data.pagination);
    } catch (err) {
      toast.error('Não foi possível carregar os militares.');
    } finally {
      setIsLoading(false);
    }
  }, [filters, currentPage]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePageChange = (page: number) => setCurrentPage(page);
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ nome_completo: e.target.value });
    setCurrentPage(1);
  };
  const handleOpenFormModal = (item: Militar | null = null) => {
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

  const handleSave = async (data: Omit<Militar, 'id'> & { id?: number }) => {
    setIsSaving(true);
    setValidationErrors([]);
    const action = data.id ? 'atualizado' : 'criado';
    const { id, ...payload } = data;
    try {
      if (id) {
        await api.put(`/api/admin/militares/${id}`, payload);
      } else {
        await api.post('/api/admin/militares', payload);
      }
      toast.success(`Militar ${action} com sucesso!`);
      handleCloseFormModal();
      fetchData();
    } catch (err: any) {
      if (err.response?.status === 400 && err.response.data.errors) {
        setValidationErrors(err.response.data.errors);
        toast.error(err.response.data.errors[0]?.message || 'Por favor, corrija os erros.');
      } else {
        toast.error(err.response?.data?.message || 'Erro ao salvar o militar.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!itemToDeleteId) return;
    setIsDeleting(true);
    try {
      await api.delete(`/api/admin/militares/${itemToDeleteId}`);
      toast.success('Militar excluído com sucesso!');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao excluir o militar.');
    } finally {
      setIsDeleting(false);
      handleCloseConfirmModal();
    }
  };

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await api.post('/api/admin/militares/upload', formData);
      toast.success(response.data.message || 'Arquivo enviado com sucesso!');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao enviar arquivo.');
    } finally {
      setIsUploading(false);
    }
  };

  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: militares.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 65, // Altura estimada de cada linha
    overscan: 5,
  });
  const virtualItems = rowVirtualizer.getVirtualItems();

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">Efetivo (Militares)</h2>
        <Button onClick={() => handleOpenFormModal()}>Adicionar Militar</Button>
      </div>
      
      <FileUpload
        title="Importar/Atualizar Militares via Planilha"
        onUpload={handleUpload}
        isLoading={isUploading}
        acceptedFileTypes=".xlsx"
      />
      <Input
        type="text"
        placeholder="Filtrar por nome..."
        value={filters.nome_completo}
        onChange={handleFilterChange}
        className="max-w-xs mb-4"
      />

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {/* Cabeçalho Fixo para Desktop */}
        <div className="hidden md:grid grid-cols-[30%_15%_15%_10%_15%_8%_7%] bg-gray-50 border-b sticky top-0 z-10">
          <div className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome Completo</div>
          <div className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome de Guerra</div>
          <div className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Posto/Grad.</div>
          <div className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Matrícula</div>
          <div className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">OBM</div>
          <div className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</div>
          <div className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Ações</div>
        </div>

        {/* Container da Lista Virtualizada */}
        <div ref={parentRef} className="overflow-auto" style={{ height: '60vh' }}>
          {isLoading ? (
            <div className="flex justify-center items-center h-full"><Spinner className="h-10 w-10" /></div>
          ) : militares.length > 0 ? (
            <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
              {virtualItems.map((virtualRow) => {
                const militar = militares[virtualRow.index];
                return (
                  <div
                    key={militar.id}
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: `${virtualRow.size}px`, transform: `translateY(${virtualRow.start}px)` }}
                    className="p-4 border-b md:p-0 md:border-b md:grid md:grid-cols-[30%_15%_15%_10%_15%_8%_7%] md:items-center"
                  >
                    <div className="px-0 md:px-6 py-1 md:py-4 text-sm font-medium text-gray-900 truncate" data-label="Nome:" title={militar.nome_completo}>{militar.nome_completo}</div>
                    <div className="px-0 md:px-6 py-1 md:py-4 text-sm text-gray-500" data-label="Guerra:">{militar.nome_guerra || '-'}</div>
                    <div className="px-0 md:px-6 py-1 md:py-4 text-sm text-gray-500" data-label="Posto/Grad:">{militar.posto_graduacao}</div>
                    <div className="px-0 md:px-6 py-1 md:py-4 text-sm text-gray-500" data-label="Matrícula:">{militar.matricula}</div>
                    <div className="px-0 md:px-6 py-1 md:py-4 text-sm text-gray-500 truncate" data-label="OBM:" title={militar.obm_nome || ''}>{militar.obm_nome || 'N/A'}</div>
                    <div className="px-0 md:px-6 py-1 md:py-4 text-sm" data-label="Status:">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${militar.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{militar.ativo ? 'Ativo' : 'Inativo'}</span>
                    </div>
                    <div className="px-0 md:px-6 py-1 md:py-4 text-sm font-medium space-x-4 mt-2 md:mt-0 text-center">
                      <button onClick={() => handleOpenFormModal(militar)} className="text-indigo-600 hover:text-indigo-900" title="Editar"><Edit className="w-5 h-5 inline-block" /></button>
                      <button onClick={() => handleDeleteClick(militar.id)} className="text-red-600 hover:text-red-900" title="Excluir"><Trash2 className="w-5 h-5 inline-block" /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex justify-center items-center h-full"><p className="text-gray-500">Nenhum militar encontrado.</p></div>
          )}
        </div>
        {pagination && <Pagination currentPage={pagination.currentPage} totalPages={pagination.totalPages} onPageChange={handlePageChange} />}
      </div>

      <Modal isOpen={isFormModalOpen} onClose={handleCloseFormModal} title={itemToEdit ? 'Editar Militar' : 'Adicionar Novo Militar'}>
        <MilitarForm militarToEdit={itemToEdit} onSave={handleSave} onCancel={handleCloseFormModal} isLoading={isSaving} errors={validationErrors} />
      </Modal>
      <ConfirmationModal isOpen={isConfirmModalOpen} onClose={handleCloseConfirmModal} onConfirm={handleConfirmDelete} title="Confirmar Exclusão" message="Tem certeza que deseja excluir este militar?" isLoading={isDeleting} />
    </div>
  );
}
