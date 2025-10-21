// Arquivo: frontend/src/pages/Obms.tsx (CORRIGIDO)

import React, { useState, ChangeEvent, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Edit, Trash2 } from 'lucide-react';

import api from '../services/api';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import ObmForm from '../components/forms/ObmForm';
import Input from '../components/ui/Input';
import Spinner from '../components/ui/Spinner';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import Pagination from '../components/ui/Pagination';
import { formatarTelefone } from '../utils/formatters';
import FileUpload from '../components/ui/FileUpload';
import { useUiStore } from '@/store/uiStore';

interface Obm { id: number; nome: string; abreviatura: string; cidade: string | null; telefone: string | null; }
export interface ObmOption { value: string; label: string; cidade: string; }
interface PaginationState { currentPage: number; totalPages: number; }
interface ApiResponse<T> { data: T[]; pagination: PaginationState | null; }

export default function Obms() {
  const { setPageTitle } = useUiStore();

  useEffect(() => {
    setPageTitle("OBMs");
  }, [setPageTitle]);

  // Todos os hooks e funções (useState, useCallback, useEffect, handlers) permanecem os mesmos.
  // ... (código dos hooks e handlers que já estava aqui) ...
  const [obms, setObms] = useState<Obm[]>([]);
  const [obmOptions, setObmOptions] = useState<ObmOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({ nome: '' });
  const [pagination, setPagination] = useState<PaginationState | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [validationErrors, setValidationErrors] = useState<any[]>([]);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<Obm | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [itemToDeleteId, setItemToDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(currentPage), limit: '20', ...filters });
      const [obmsRes, optionsRes] = await Promise.all([
        api.get<ApiResponse<Obm>>(`/api/admin/obms?${params.toString()}`),
        api.get<ObmOption[]>('/api/admin/viaturas/distinct-obms')
      ]);
      setObms(obmsRes.data.data);
      setPagination(obmsRes.data.pagination);
      setObmOptions(optionsRes.data);
    } catch (err) { toast.error('Não foi possível carregar os dados das OBMs.'); }
    finally { setIsLoading(false); }
  }, [filters, currentPage]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handlePageChange = (page: number) => setCurrentPage(page);
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => { setFilters({ nome: e.target.value }); setCurrentPage(1); };
  const handleOpenFormModal = (item: Obm | null = null) => { setItemToEdit(item); setValidationErrors([]); setIsFormModalOpen(true); };
  const handleCloseFormModal = () => setIsFormModalOpen(false);
  const handleDeleteClick = (id: number) => { setItemToDeleteId(id); setIsConfirmModalOpen(true); };
  const handleCloseConfirmModal = () => setIsConfirmModalOpen(false);

  const handleSave = async (data: Omit<Obm, 'id'> & { id?: number }) => {
    setIsSaving(true);
    setValidationErrors([]);
    const action = data.id ? 'atualizada' : 'criada';
    const { id, ...payload } = data;
    try {
      if (id) await api.put(`/api/admin/obms/${id}`, payload);
      else await api.post('/api/admin/obms', payload);
      toast.success(`OBM ${action} com sucesso!`);
      handleCloseFormModal();
      fetchData();
    } catch (err: any) {
      if (err.response?.status === 400 && err.response.data.errors) {
        setValidationErrors(err.response.data.errors);
        toast.error('Por favor, corrija os erros no formulário.');
      } else { toast.error(err.response?.data?.message || 'Erro ao salvar OBM.'); }
    } finally { setIsSaving(false); }
  };

  const handleConfirmDelete = async () => {
    if (!itemToDeleteId) return;
    setIsDeleting(true);
    try {
      await api.delete(`/api/admin/obms/${itemToDeleteId}`);
      toast.success('OBM excluída com sucesso!');
      fetchData();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Erro ao excluir OBM.'); }
    finally { setIsDeleting(false); handleCloseConfirmModal(); }
  };

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await api.post('/api/admin/obms/upload-csv', formData);
      toast.success(response.data.message || 'Arquivo processado com sucesso!');
      fetchData();
    } catch (error: any) { toast.error(error.response?.data?.message || 'Erro ao enviar o arquivo.'); }
    finally { setIsUploading(false); }
  };


  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">OBMs</h2>
        <Button onClick={() => handleOpenFormModal()}>Adicionar Nova OBM</Button>
      </div>

      <FileUpload
        title="Atualizar Cidades/Telefones via Planilha"
        onUpload={handleUpload}
        isLoading={isUploading}
      />

      <Input type="text" placeholder="Filtrar por nome..." value={filters.nome || ''} onChange={handleFilterChange} className="max-w-xs mb-4" />

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {/* --- INÍCIO DA CORREÇÃO DE LAYOUT --- */}
        <div className="overflow-x-auto">
          <table className="min-w-full table-fixed">
            <thead className="bg-gray-50 hidden md:table-header-group">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase" style={{ width: '40%' }}>Nome</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase" style={{ width: '20%' }}>Abreviatura</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase" style={{ width: '15%' }}>Cidade</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase" style={{ width: '15%' }}>Telefone</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase" style={{ width: '10%' }}>Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 md:divide-y-0">
              {isLoading ? (
                <tr><td colSpan={5} className="text-center py-10"><Spinner className="h-10 w-10 mx-auto" /></td></tr>
              ) : obms.length > 0 ? (
                obms.map((obm) => (
                  <tr key={obm.id} className="block md:table-row border-b md:border-none p-4 md:p-0">
                    <td className="block md:table-cell px-6 py-2 md:py-4 text-sm font-medium text-gray-900 break-words" data-label="Nome:">{obm.nome}</td>
                    <td className="block md:table-cell px-6 py-2 md:py-4 whitespace-nowrap text-sm text-gray-500" data-label="Abreviatura:">{obm.abreviatura}</td>
                    <td className="block md:table-cell px-6 py-2 md:py-4 whitespace-nowrap text-sm text-gray-500" data-label="Cidade:">{obm.cidade || 'N/A'}</td>
                    <td className="block md:table-cell px-6 py-2 md:py-4 whitespace-nowrap text-sm text-gray-500" data-label="Telefone:">{formatarTelefone(obm.telefone)}</td>
                    <td className="block md:table-cell px-6 py-2 md:py-4 whitespace-nowrap text-center text-sm font-medium space-x-4 mt-2 md:mt-0">
                      <button onClick={() => handleOpenFormModal(obm)} className="text-indigo-600 hover:text-indigo-900" title="Editar"><Edit className="w-5 h-5 inline-block" /></button>
                      <button onClick={() => handleDeleteClick(obm.id)} className="text-red-600 hover:text-red-900" title="Excluir"><Trash2 className="w-5 h-5 inline-block" /></button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={5} className="text-center py-10 text-gray-500">Nenhuma OBM encontrada.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {/* --- FIM DA CORREÇÃO DE LAYOUT --- */}
        
        {pagination && <Pagination currentPage={pagination.currentPage} totalPages={pagination.totalPages} onPageChange={handlePageChange} />}
      </div>

      <Modal isOpen={isFormModalOpen} onClose={handleCloseFormModal} title={itemToEdit ? 'Editar OBM' : 'Adicionar Nova OBM'}>
        <ObmForm obmToEdit={itemToEdit} obmOptions={obmOptions} onSave={handleSave} onCancel={handleCloseFormModal} isLoading={isSaving} errors={validationErrors} />
      </Modal>
      <ConfirmationModal isOpen={isConfirmModalOpen} onClose={handleCloseConfirmModal} onConfirm={handleConfirmDelete} title="Confirmar Exclusão" message="Tem certeza que deseja excluir esta OBM?" isLoading={isDeleting} />
    </div>
  );
}