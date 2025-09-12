import React, { useState, ChangeEvent, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { Upload, Edit, Trash2 } from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';

import api from '../services/api';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import MilitarForm from '../components/forms/MilitarForm';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import Pagination from '../components/ui/Pagination';

// Interfaces (sem alteração)
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
  // Estados e Handlers (sem alteração)
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: '50',
        ...filters,
      });
      const response = await api.get<ApiResponse<Militar>>(`/api/admin/militares?${params.toString()}`);
      setMilitares(response.data.data);
      setPagination(response.data.pagination);
    } catch (err) {
      toast.error('Não foi possível carregar os militares.');
    } finally {
      setIsLoading(false);
    }
  }, [filters, currentPage]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handlePageChange = (page: number) => setCurrentPage(page);
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ nome_completo: e.target.value });
    setCurrentPage(1);
  };
  const handleOpenFormModal = (item: Militar | null = null) => { setItemToEdit(item); setValidationErrors([]); setIsFormModalOpen(true); };
  const handleCloseFormModal = () => setIsFormModalOpen(false);
  const handleDeleteClick = (id: number) => { setItemToDeleteId(id); setIsConfirmModalOpen(true); };
  const handleCloseConfirmModal = () => setIsConfirmModalOpen(false);
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => { if (event.target.files) setSelectedFile(event.target.files[0]); };

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

  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    try {
      const response = await api.post('/api/admin/militares/upload', formData);
      toast.success(response.data.message || 'Arquivo enviado com sucesso!');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao enviar arquivo.');
    } finally {
      setIsUploading(false);
      setSelectedFile(null);
      const fileInput = document.getElementById('militar-file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    }
  };

  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: militares.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 65,
    overscan: 5,
  });
  const virtualItems = rowVirtualizer.getVirtualItems();

  return (
    <div>
      {/* Cabeçalho e Upload (sem alteração) */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">Efetivo (Militares)</h2>
          <p className="text-gray-600 mt-2">Gerencie os militares do efetivo.</p>
        </div>
        <Button onClick={() => handleOpenFormModal()}>Adicionar Militar</Button>
      </div>
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Importar/Atualizar Militares via Planilha</h3>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <label htmlFor="militar-file-upload" className="flex-1 w-full">
            <div className="flex items-center justify-center w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:bg-gray-100">
              <Upload className="w-5 h-5 text-gray-500 mr-2" />
              <span className="text-sm text-gray-600">{selectedFile ? selectedFile.name : 'Clique para selecionar o arquivo (XLSX)'}</span>
            </div>
            <input id="militar-file-upload" type="file" className="sr-only" accept=".xlsx" onChange={handleFileChange} />
          </label>
          <Button onClick={handleUpload} disabled={!selectedFile || isUploading}>{isUploading ? <Spinner className="h-5 w-5" /> : 'Enviar'}</Button>
        </div>
      </div>
      <Input type="text" placeholder="Filtrar por nome..." value={filters.nome_completo} onChange={handleFilterChange} className="max-w-xs mb-4" />

      {/* --- CORREÇÃO APLICADA AQUI: Estrutura de Tabela com Larguras Fixas --- */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div ref={parentRef} className="overflow-auto" style={{ height: '60vh' }}>
          <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
            <table className="min-w-full" style={{ tableLayout: 'fixed' }}>
              <thead className="bg-gray-50" style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase" style={{ width: '30%' }}>Nome Completo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase" style={{ width: '15%' }}>Nome de Guerra</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase" style={{ width: '15%' }}>Posto/Grad.</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase" style={{ width: '10%' }}>Matrícula</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase" style={{ width: '15%' }}>OBM</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase" style={{ width: '8%' }}>Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase" style={{ width: '7%' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                    <td><Spinner className="h-10 w-10" /></td>
                  </tr>
                ) : virtualItems.length > 0 ? (
                  virtualItems.map((virtualRow) => {
                    const militar = militares[virtualRow.index];
                    return (
                      <tr
                        key={militar.id}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: `${virtualRow.size}px`,
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                        className="border-b border-gray-200"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 truncate" style={{ width: '30%' }}>{militar.nome_completo}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" style={{ width: '15%' }}>{militar.nome_guerra}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" style={{ width: '15%' }}>{militar.posto_graduacao}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" style={{ width: '10%' }}>{militar.matricula}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate" style={{ width: '15%' }}>{militar.obm_nome || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ width: '8%' }}>
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${militar.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{militar.ativo ? 'Ativo' : 'Inativo'}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-4" style={{ width: '7%' }}>
                          <button onClick={() => handleOpenFormModal(militar)} className="text-indigo-600 hover:text-indigo-900" title="Editar"><Edit className="w-5 h-5" /></button>
                          <button onClick={() => handleDeleteClick(militar.id)} className="text-red-600 hover:text-red-900" title="Excluir"><Trash2 className="w-5 h-5" /></button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                    <td><p className="text-gray-500">Nenhum militar encontrado.</p></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        {pagination && <Pagination currentPage={pagination.currentPage} totalPages={pagination.totalPages} onPageChange={handlePageChange} />}
      </div>

      {/* Modais (sem alteração) */}
      <Modal isOpen={isFormModalOpen} onClose={handleCloseFormModal} title={itemToEdit ? 'Editar Militar' : 'Adicionar Novo Militar'}>
        <MilitarForm militarToEdit={itemToEdit} onSave={handleSave} onCancel={handleCloseFormModal} isLoading={isSaving} errors={validationErrors} />
      </Modal>
      <ConfirmationModal isOpen={isConfirmModalOpen} onClose={handleCloseConfirmModal} onConfirm={handleConfirmDelete} title="Confirmar Exclusão" message="Tem certeza que deseja excluir este militar?" isLoading={isDeleting} />
    </div>
  );
}
