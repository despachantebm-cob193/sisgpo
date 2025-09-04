// ... (importações e início do componente permanecem os mesmos) ...
import React, { useState, ChangeEvent, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { Upload, Edit, Trash2, Car, Building, MapPin } from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';

import api from '../services/api';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import ViaturaForm from '../components/forms/ViaturaForm';
import ConfirmationModal from '../components/ui/ConfirmationModal';

interface Viatura { id: number; prefixo: string; cidade: string | null; obm: string | null; ativa: boolean; }
interface ApiResponse<T> { data: T[]; }

export default function Viaturas() {
  const [viaturas, setViaturas] = useState<Viatura[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({ prefixo: '' });
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
      const params = new URLSearchParams({ ...filters, all: 'true' });
      const response = await api.get<ApiResponse<Viatura>>(`/api/admin/viaturas?${params.toString()}`);
      setViaturas(response.data.data);
    } catch (err) {
      toast.error('Não foi possível carregar as viaturas.');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

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

  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: viaturas.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 110,
    overscan: 10,
  });

  const handleOpenFormModal = (item: Viatura | null = null) => { setItemToEdit(item); setValidationErrors([]); setIsFormModalOpen(true); };
  const handleCloseFormModal = () => setIsFormModalOpen(false);
  const handleDeleteClick = (id: number) => { setItemToDeleteId(id); setIsConfirmModalOpen(true); };
  const handleCloseConfirmModal = () => setIsConfirmModalOpen(false);

  const handleSave = async (data: Omit<Viatura, 'id'> & { id?: number }) => {
    setIsSaving(true);
    setValidationErrors([]);
    const action = data.id ? 'atualizada' : 'criada';

    // --- CORREÇÃO PRINCIPAL AQUI ---
    // Cria um payload limpo, contendo apenas os campos que a API deve receber.
    const payload = {
      prefixo: data.prefixo,
      ativa: data.ativa,
      cidade: data.cidade,
      obm: data.obm,
      // O campo 'telefone' não está no formulário, então não o incluímos.
    };
    // --- FIM DA CORREÇÃO ---

    try {
      if (data.id) {
        // Envia o payload limpo para a rota de atualização.
        await api.put(`/api/admin/viaturas/${data.id}`, payload);
      } else {
        // Para criação, o payload já está correto.
        await api.post('/api/admin/viaturas', payload);
      }
      toast.success(`Viatura ${action} com sucesso!`);
      handleCloseFormModal();
      fetchData();
    } catch (err: any) {
      console.log('Erro ao salvar:', err.response);
      if (err.response?.status === 400 && err.response.data.errors) {
        setValidationErrors(err.response.data.errors);
        const firstErrorMessage = err.response.data.errors[0]?.message || 'Por favor, corrija os erros no formulário.';
        toast.error(firstErrorMessage);
      } else {
        const errorMessage = err.response?.data?.message || 'Erro ao salvar a viatura.';
        toast.error(errorMessage);
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

  const gridTemplateColumns = "1.5fr 2fr 1.5fr 1fr 1fr";

  // O JSX do return permanece o mesmo
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
        onChange={(e) => setFilters({ prefixo: e.target.value })}
        className="w-full md:max-w-xs mb-4"
      />

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div style={{ display: 'grid', gridTemplateColumns }} className="hidden md:grid bg-gray-50 sticky top-0 z-10 border-b border-gray-200">
          <div className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prefixo</div>
          <div className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">OBM</div>
          <div className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cidade</div>
          <div className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</div>
          <div className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</div>
        </div>

        <div ref={parentRef} className="overflow-y-auto" style={{ height: '65vh' }}>
          {isLoading ? (
            <div className="flex justify-center items-center h-full"><Spinner className="h-10 w-10" /></div>
          ) : (
            <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
              {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                const viatura = viaturas[virtualItem.index];
                if (!viatura) return null;
                return (
                  <div
                    key={viatura.id}
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', transform: `translateY(${virtualItem.start}px)`, padding: '0.5rem' }}
                    className="md:p-0"
                  >
                    {/* Layout de Cartão para Mobile */}
                    <div className="md:hidden bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                      <div className="flex justify-between items-start">
                        <p className="text-lg font-bold text-gray-800 flex items-center"><Car size={20} className="mr-2 text-red-600" /> {viatura.prefixo}</p>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${viatura.ativa ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {viatura.ativa ? 'Ativa' : 'Inativa'}
                        </span>
                      </div>
                      <div className="mt-3 space-y-1 text-sm text-gray-600">
                        <p className="flex items-center"><Building size={14} className="mr-2" /> {viatura.obm || 'OBM não informada'}</p>
                        <p className="flex items-center"><MapPin size={14} className="mr-2" /> {viatura.cidade || 'Cidade não informada'}</p>
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end items-center">
                        <div className="flex items-center space-x-3">
                          <button onClick={() => handleOpenFormModal(viatura)} className="p-2 text-indigo-600 hover:text-indigo-900" title="Editar"><Edit size={20} /></button>
                          <button onClick={() => handleDeleteClick(viatura.id)} className="p-2 text-red-600 hover:text-red-900" title="Excluir"><Trash2 size={20} /></button>
                        </div>
                      </div>
                    </div>

                    {/* Layout de Grid para Desktop */}
                    <div style={{ gridTemplateColumns }} className="hidden md:grid items-center border-b border-gray-200 h-full">
                      <div className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{viatura.prefixo}</div>
                      <div className="px-6 py-4 text-sm text-gray-500">{viatura.obm || 'N/A'}</div>
                      <div className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{viatura.cidade || 'N/A'}</div>
                      <div className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${viatura.ativa ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {viatura.ativa ? 'Ativa' : 'Inativa'}
                        </span>
                      </div>
                      <div className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-4">
                        <button onClick={() => handleOpenFormModal(viatura)} className="text-indigo-600 hover:text-indigo-900" title="Editar"><Edit className="w-5 h-5" /></button>
                        <button onClick={() => handleDeleteClick(viatura.id)} className="text-red-600 hover:text-red-900" title="Excluir"><Trash2 className="w-5 h-5" /></button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modais */}
      <Modal isOpen={isFormModalOpen} onClose={handleCloseFormModal} title={itemToEdit ? 'Editar Viatura' : 'Adicionar Nova Viatura'}>
        <ViaturaForm viaturaToEdit={itemToEdit} onSave={handleSave} onCancel={handleCloseFormModal} isLoading={isSaving} errors={validationErrors} />
      </Modal>
      <ConfirmationModal isOpen={isConfirmModalOpen} onClose={handleCloseConfirmModal} onConfirm={handleConfirmDelete} title="Confirmar Exclusão" message="Tem certeza que deseja excluir esta viatura?" isLoading={isDeleting} />
    </div>
  );
}
