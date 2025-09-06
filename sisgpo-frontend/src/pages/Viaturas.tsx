// Arquivo: frontend/src/pages/Viaturas.tsx (Versão Final com Paginação)

import React, { useState, ChangeEvent, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Upload, Edit, Trash2, Car, Building, MapPin } from 'lucide-react';

import api from '../services/api';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import ViaturaForm from '../components/forms/ViaturaForm';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import Pagination from '../components/ui/Pagination';

// Interfaces
interface Viatura { id: number; prefixo: string; cidade: string | null; obm: string | null; ativa: boolean; }
interface PaginationState { currentPage: number; totalPages: number; }
interface ApiResponse<T> { data: T[]; pagination: PaginationState | null; }

export default function Viaturas() {
  const [viaturas, setViaturas] = useState<Viatura[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({ prefixo: '' });
  const [pagination, setPagination] = useState<PaginationState | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Estados de modais e ações
  const [validationErrors, setValidationErrors] = useState<any[]>([]);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<Viatura | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [itemToDeleteId, setItemToDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [lastUpload, setLastUpload] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: '20',
        ...filters,
      });
      const response = await api.get<ApiResponse<Viatura>>(`/api/admin/viaturas?${params.toString()}`);
      setViaturas(response.data.data);
      setPagination(response.data.pagination);
    } catch (err) {
      toast.error('Não foi possível carregar as viaturas.');
    } finally {
      setIsLoading(false);
    }
  }, [filters, currentPage]);

  const fetchLastUpload = useCallback(async () => {
    try {
      const response = await api.get('/api/admin/metadata/viaturas_last_upload');
      setLastUpload(new Date(response.data.value).toLocaleString('pt-BR'));
    } catch (error) {
      setLastUpload(null);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchLastUpload();
  }, [fetchData, fetchLastUpload]);

  const handlePageChange = (page: number) => setCurrentPage(page);
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ prefixo: e.target.value });
    setCurrentPage(1);
  };

  const handleOpenFormModal = (item: Viatura | null = null) => { setItemToEdit(item); setValidationErrors([]); setIsFormModalOpen(true); };
  const handleCloseFormModal = () => setIsFormModalOpen(false);
  const handleDeleteClick = (id: number) => { setItemToDeleteId(id); setIsConfirmModalOpen(true); };
  const handleCloseConfirmModal = () => setIsConfirmModalOpen(false);

  const handleSave = async (data: Omit<Viatura, 'id'> & { id?: number }) => {
    setIsSaving(true);
    setValidationErrors([]);
    const action = data.id ? 'atualizada' : 'criada';
    const { id, ...payload } = data;
    try {
      if (id) {
        await api.put(`/api/admin/viaturas/${id}`, payload);
      } else {
        await api.post('/api/admin/viaturas', payload);
      }
      toast.success(`Viatura ${action} com sucesso!`);
      handleCloseFormModal();
      fetchData();
    } catch (err: any) {
      if (err.response?.status === 400 && err.response.data.errors) {
        setValidationErrors(err.response.data.errors);
        toast.error(err.response.data.errors[0]?.message || 'Por favor, corrija os erros.');
      } else {
        toast.error(err.response?.data?.message || 'Erro ao salvar a viatura.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!itemToDeleteId) return;
    setIsDeleting(true);
    try {
      await api.delete(`/api/admin/viaturas/${itemToDeleteId}`);
      toast.success('Viatura excluída com sucesso!');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao excluir a viatura.');
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
      const response = await api.post('/api/admin/viaturas/upload-csv', formData);
      toast.success(response.data.message || 'Arquivo enviado com sucesso!');
      fetchData();
      fetchLastUpload();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao enviar arquivo.');
    } finally {
      setIsUploading(false);
      setSelectedFile(null);
      const fileInput = document.getElementById('viatura-file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">Viaturas</h2>
        <Button onClick={() => handleOpenFormModal()} className="w-full md:w-auto">Adicionar Viatura</Button>
      </div>
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-2">
          <h3 className="text-lg font-semibold text-gray-800">Importar/Atualizar Viaturas</h3>
          {lastUpload && <p className="text-xs text-gray-500">Última atualização: <span className="font-medium">{lastUpload}</span></p>}
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <label htmlFor="viatura-file-upload" className="flex-1 w-full">
            <div className="flex items-center justify-center w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:bg-gray-100">
              <Upload className="w-5 h-5 text-gray-500 mr-2" />
              <span className="text-sm text-gray-600">{selectedFile ? selectedFile.name : 'Clique para selecionar o arquivo (CSV, XLS, XLSX)'}</span>
            </div>
            <input id="viatura-file-upload" type="file" className="sr-only" accept=".csv,.xls,.xlsx" onChange={handleFileChange} />
          </label>
          <Button onClick={handleUpload} disabled={!selectedFile || isUploading} className="w-full sm:w-auto">
            {isUploading ? <Spinner className="h-5 w-5" /> : 'Enviar'}
          </Button>
        </div>
      </div>
      <Input
        type="text"
        placeholder="Filtrar por prefixo..."
        value={filters.prefixo}
        onChange={handleFilterChange}
        className="w-full md:max-w-xs mb-4"
      />

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prefixo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">OBM</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cidade</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr><td colSpan={5} className="text-center py-10"><Spinner className="h-10 w-10 mx-auto" /></td></tr>
              ) : viaturas.length > 0 ? (
                viaturas.map((viatura) => (
                  <tr key={viatura.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{viatura.prefixo}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{viatura.obm || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{viatura.cidade || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${viatura.ativa ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {viatura.ativa ? 'Ativa' : 'Inativa'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-4">
                      <button onClick={() => handleOpenFormModal(viatura)} className="text-indigo-600 hover:text-indigo-900" title="Editar"><Edit className="w-5 h-5" /></button>
                      <button onClick={() => handleDeleteClick(viatura.id)} className="text-red-600 hover:text-red-900" title="Excluir"><Trash2 className="w-5 h-5" /></button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={5} className="text-center py-10 text-gray-500">Nenhuma viatura encontrada.</td></tr>
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

      <Modal isOpen={isFormModalOpen} onClose={handleCloseFormModal} title={itemToEdit ? 'Editar Viatura' : 'Adicionar Nova Viatura'}>
        <ViaturaForm viaturaToEdit={itemToEdit} onSave={handleSave} onCancel={handleCloseFormModal} isLoading={isSaving} errors={validationErrors} />
      </Modal>
      <ConfirmationModal isOpen={isConfirmModalOpen} onClose={handleCloseConfirmModal} onConfirm={handleConfirmDelete} title="Confirmar Exclusão" message="Tem certeza que deseja excluir esta viatura?" isLoading={isDeleting} />
    </div>
  );
}
