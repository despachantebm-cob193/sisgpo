// Arquivo: frontend/src/pages/Obms.tsx (Versão Final com Paginação)

import React, { useState, ChangeEvent, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Upload, Edit, Trash2, Building, MapPin, Phone } from 'lucide-react';

import api from '../services/api';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import ObmForm from '../components/forms/ObmForm';
import Input from '../components/ui/Input';
import Spinner from '../components/ui/Spinner';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import Pagination from '../components/ui/Pagination';

// Interfaces
interface Obm { id: number; nome: string; abreviatura: string; cidade: string | null; telefone: string | null; }
export interface ObmOption { value: string; label: string; cidade: string; }
interface PaginationState { currentPage: number; totalPages: number; }
interface ApiResponse<T> { data: T[]; pagination: PaginationState | null; }

export default function Obms() {
  const [obms, setObms] = useState<Obm[]>([]);
  const [obmOptions, setObmOptions] = useState<ObmOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({ nome: '' });
  const [pagination, setPagination] = useState<PaginationState | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Estados de modais e ações
  const [validationErrors, setValidationErrors] = useState<any[]>([]);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<Obm | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [itemToDeleteId, setItemToDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: '20',
        ...filters
      });
      const [obmsRes, optionsRes] = await Promise.all([
        api.get<ApiResponse<Obm>>(`/api/admin/obms?${params.toString()}`),
        api.get<ObmOption[]>('/api/admin/viaturas/distinct-obms')
      ]);
      
      setObms(obmsRes.data.data);
      setPagination(obmsRes.data.pagination);
      setObmOptions(optionsRes.data);

    } catch (err) {
      toast.error('Não foi possível carregar os dados das OBMs.');
    } finally {
      setIsLoading(false);
    }
  }, [filters, currentPage]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handlePageChange = (page: number) => setCurrentPage(page);
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ nome: e.target.value });
    setCurrentPage(1);
  };

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
      if (id) {
        await api.put(`/api/admin/obms/${id}`, payload);
      } else {
        await api.post('/api/admin/obms', payload);
      }
      toast.success(`OBM ${action} com sucesso!`);
      handleCloseFormModal();
      await fetchData();
    } catch (err: any) {
      if (err.response?.status === 400 && err.response.data.errors) {
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
      await fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao excluir OBM.');
    } finally {
      setIsDeleting(false);
      handleCloseConfirmModal();
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => { if (event.target.files) setSelectedFile(event.target.files[0]); };
  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    try {
      const response = await api.post('/api/admin/obms/upload', formData);
      toast.success(response.data.message || 'Arquivo processado com sucesso!');
      await fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao enviar o arquivo.');
    } finally {
      setIsUploading(false);
      setSelectedFile(null);
      const fileInput = document.getElementById('obm-file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">OBMs</h2>
          <p className="text-gray-600 mt-2">Gerencie as Organizações Bombeiro Militar.</p>
        </div>
        <Button onClick={() => handleOpenFormModal()}>Adicionar Nova OBM</Button>
      </div>
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Atualizar Cidades/Telefones via Planilha</h3>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <label htmlFor="obm-file-upload" className="flex-1 w-full">
            <div className="flex items-center justify-center w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:bg-gray-100">
              <Upload className="w-5 h-5 text-gray-500 mr-2" />
              <span className="text-sm text-gray-600">{selectedFile ? selectedFile.name : 'Clique para selecionar o arquivo (XLS, XLSX)'}</span>
            </div>
            <input id="obm-file-upload" name="obm-file-upload" type="file" className="sr-only" accept=".xls, .xlsx" onChange={handleFileChange} />
          </label>
          <Button onClick={handleUpload} disabled={!selectedFile || isUploading} className="w-full sm:w-auto">
            {isUploading ? <Spinner className="h-5 w-5" /> : 'Enviar Arquivo'}
          </Button>
        </div>
      </div>
      <div className="mb-4">
        <Input
          type="text"
          placeholder="Filtrar por nome..."
          value={filters.nome || ''}
          onChange={handleFilterChange}
          className="max-w-xs"
        />
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Abreviatura</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cidade</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Telefone</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr><td colSpan={5} className="text-center py-10"><Spinner className="h-10 w-10 mx-auto" /></td></tr>
              ) : obms.length > 0 ? (
                obms.map((obm) => (
                  <tr key={obm.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{obm.nome}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{obm.abreviatura}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{obm.cidade || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{obm.telefone || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-4">
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
        
        {pagination && (
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
          />
        )}
      </div>

      <Modal isOpen={isFormModalOpen} onClose={handleCloseFormModal} title={itemToEdit ? 'Editar OBM' : 'Adicionar Nova OBM'}>
        <ObmForm 
          obmToEdit={itemToEdit} 
          obmOptions={obmOptions}
          onSave={handleSave} 
          onCancel={handleCloseFormModal} 
          isLoading={isSaving} 
          errors={validationErrors} 
        />
      </Modal>
      <ConfirmationModal isOpen={isConfirmModalOpen} onClose={handleCloseConfirmModal} onConfirm={handleConfirmDelete} title="Confirmar Exclusão" message="Tem certeza que deseja excluir esta OBM?" isLoading={isDeleting} />
    </div>
  );
}
