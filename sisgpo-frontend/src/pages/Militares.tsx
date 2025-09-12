// Arquivo: frontend/src/pages/Militares.tsx (VERSÃO FINAL COM BOTÕES DE AÇÃO CORRIGIDOS)

import React, { useState, ChangeEvent, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Edit, Trash2 } from 'lucide-react';

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
      const params = new URLSearchParams({ page: String(currentPage), limit: '20', ...filters });
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
        <div className="overflow-x-auto">
          <table className="min-w-full table-fixed">
            <thead className="bg-gray-50 hidden md:table-header-group">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-[30%]">Nome Completo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-[15%]">Nome de Guerra</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-[15%]">Posto/Grad.</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-[10%]">Matrícula</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-[15%]">OBM</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase w-[8%]">Status</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase w-[7%]">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 md:divide-y-0">
              {isLoading ? (
                <tr><td colSpan={7} className="text-center py-10"><Spinner className="h-10 w-10 mx-auto" /></td></tr>
              ) : militares.length > 0 ? (
                militares.map((militar) => (
                  <tr key={militar.id} className="flex flex-col p-4 border-b md:table-row md:p-0 md:border-none">
                    <td className="py-1 md:px-6 md:py-4 md:font-medium md:text-gray-900 truncate" title={militar.nome_completo}>
                      <span className="font-bold md:hidden">Nome: </span>{militar.nome_completo}
                    </td>
                    <td className="py-1 md:px-6 md:py-4 text-gray-500">
                      <span className="font-bold md:hidden">Guerra: </span>{militar.nome_guerra || '-'}
                    </td>
                    <td className="py-1 md:px-6 md:py-4 text-gray-500">
                      <span className="font-bold md:hidden">Posto/Grad: </span>{militar.posto_graduacao}
                    </td>
                    <td className="py-1 md:px-6 md:py-4 text-gray-500">
                      <span className="font-bold md:hidden">Matrícula: </span>{militar.matricula}
                    </td>
                    <td className="py-1 md:px-6 md:py-4 text-gray-500 truncate" title={militar.obm_nome || ''}>
                      <span className="font-bold md:hidden">OBM: </span>{militar.obm_nome || 'N/A'}
                    </td>
                    <td className="py-1 md:px-6 md:py-4 md:text-center">
                      <span className="font-bold md:hidden">Status: </span>
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${militar.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{militar.ativo ? 'Ativo' : 'Inativo'}</span>
                    </td>
                    {/* --- INÍCIO DA CORREÇÃO DOS BOTÕES --- */}
                    <td className="py-2 md:px-6 md:py-4 whitespace-nowrap text-sm font-medium text-right md:text-center">
                      <button onClick={() => handleOpenFormModal(militar)} className="text-indigo-600 hover:text-indigo-900 inline-block mr-4" title="Editar"><Edit className="w-5 h-5" /></button>
                      <button onClick={() => handleDeleteClick(militar.id)} className="text-red-600 hover:text-red-900 inline-block" title="Excluir"><Trash2 className="w-5 h-5" /></button>
                    </td>
                    {/* --- FIM DA CORREÇÃO DOS BOTÕES --- */}
                  </tr>
                ))
              ) : (
                <tr><td colSpan={7} className="text-center py-10 text-gray-500">Nenhum militar encontrado.</td></tr>
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

      <Modal isOpen={isFormModalOpen} onClose={handleCloseFormModal} title={itemToEdit ? 'Editar Militar' : 'Adicionar Novo Militar'}>
        <MilitarForm militarToEdit={itemToEdit} onSave={handleSave} onCancel={handleCloseFormModal} isLoading={isSaving} errors={validationErrors} />
      </Modal>
      <ConfirmationModal isOpen={isConfirmModalOpen} onClose={handleCloseConfirmModal} onConfirm={handleConfirmDelete} title="Confirmar Exclusão" message="Tem certeza que deseja excluir este militar?" isLoading={isDeleting} />
    </div>
  );
}
