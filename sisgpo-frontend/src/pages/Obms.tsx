// Arquivo: frontend/src/pages/Obms.tsx (Código Completo e Responsivo)

import React, { useState, ChangeEvent, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { Upload, Edit, Trash2, Building, MapPin, Phone } from 'lucide-react'; // Ícones adicionados
import { useVirtualizer } from '@tanstack/react-virtual';

import api from '../services/api';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import ObmForm from '../components/forms/ObmForm';
import Input from '../components/ui/Input';
import Spinner from '../components/ui/Spinner';
import ConfirmationModal from '../components/ui/ConfirmationModal';

// Interfaces (sem alteração)
interface Obm {
  id: number;
  nome: string;
  abreviatura: string;
  cidade: string | null;
  telefone: string | null;
}
interface ApiResponse<T> { data: T[]; }

export default function Obms() {
  // Hooks de estado (sem alteração)
  const [obms, setObms] = useState<Obm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({ nome: '' });
  const [validationErrors, setValidationErrors] = useState<any[]>([]);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<Obm | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [itemToDeleteId, setItemToDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Funções de busca e salvamento (sem alteração)
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ ...filters, all: 'true' });
      const response = await api.get<ApiResponse<Obm>>(`/api/admin/obms?${params.toString()}`);
      setObms(response.data.data);
    } catch (err) {
      toast.error('Não foi possível carregar as OBMs.');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

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
      fetchData();
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
      fetchData();
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
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao enviar o arquivo.');
    } finally {
      setIsUploading(false);
      setSelectedFile(null);
      const fileInput = document.getElementById('obm-file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    }
  };

  // Virtualização (sem alteração)
  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: obms.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120, // Aumenta a estimativa para comportar o card
    overscan: 10,
  });

  const gridTemplateColumns = "2.5fr 1fr 1fr 1fr 0.5fr";

  return (
    <div>
      {/* Cabeçalho e área de upload (sem alteração) */}
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
          onChange={(e) => setFilters({ nome: e.target.value })}
          className="max-w-xs"
        />
      </div>

      {/* --- ÁREA DE RENDERIZAÇÃO RESPONSIVA --- */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {/* Cabeçalho da Tabela (visível apenas em telas médias ou maiores) */}
        <div style={{ display: 'grid', gridTemplateColumns }} className="hidden md:grid bg-gray-50 sticky top-0 z-10 border-b border-gray-200">
          <div className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</div>
          <div className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Abreviatura</div>
          <div className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cidade</div>
          <div className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Telefone</div>
          <div className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Ações</div>
        </div>

        {/* Contêiner da Lista Virtualizada */}
        <div ref={parentRef} className="overflow-y-auto" style={{ height: '60vh' }}>
          {isLoading ? (
            <div className="flex justify-center items-center h-full"><Spinner className="h-10 w-10" /></div>
          ) : (
            <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
              {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                const obm = obms[virtualItem.index];
                if (!obm) return null;
                return (
                  <div
                    key={obm.id}
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', transform: `translateY(${virtualItem.start}px)`, padding: '0.5rem' }}
                    className="md:p-0" // Remove o padding em telas maiores
                  >
                    {/* Layout de Card para Mobile (visível apenas em telas pequenas) */}
                    <div className="md:hidden bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                      <div className="flex justify-between items-start">
                        <p className="text-lg font-bold text-gray-800 flex items-center">
                          <Building size={20} className="mr-2 text-red-600" /> {obm.abreviatura}
                        </p>
                      </div>
                      <p className="text-sm text-gray-500 mt-1 ml-7">{obm.nome}</p>
                      <div className="mt-3 space-y-1 text-sm text-gray-600">
                        <p className="flex items-center"><MapPin size={14} className="mr-2" /> {obm.cidade || 'Não informado'}</p>
                        <p className="flex items-center"><Phone size={14} className="mr-2" /> {obm.telefone || 'Não informado'}</p>
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end items-center">
                        <div className="flex items-center space-x-3">
                          <button onClick={() => handleOpenFormModal(obm)} className="p-2 text-indigo-600 hover:text-indigo-900" title="Editar"><Edit size={20} /></button>
                          <button onClick={() => handleDeleteClick(obm.id)} className="p-2 text-red-600 hover:text-red-900" title="Excluir"><Trash2 size={20} /></button>
                        </div>
                      </div>
                    </div>

                    {/* Layout de Tabela para Desktop (oculto em telas pequenas) */}
                    <div style={{ gridTemplateColumns }} className="hidden md:grid items-center border-b border-gray-200 h-full">
                      <div className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 truncate" title={obm.nome}>{obm.nome}</div>
                      <div className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{obm.abreviatura}</div>
                      <div className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{obm.cidade || 'N/A'}</div>
                      <div className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{obm.telefone || 'N/A'}</div>
                      <div className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <button onClick={() => handleOpenFormModal(obm)} className="text-indigo-600 hover:text-indigo-900" title="Editar"><Edit className="w-5 h-5 inline-block" /></button>
                        <button onClick={() => handleDeleteClick(obm.id)} className="ml-4 text-red-600 hover:text-red-900" title="Excluir"><Trash2 className="w-5 h-5 inline-block" /></button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modais (sem alteração) */}
      <Modal isOpen={isFormModalOpen} onClose={handleCloseFormModal} title={itemToEdit ? 'Editar OBM' : 'Adicionar Nova OBM'}>
        <ObmForm obmToEdit={itemToEdit} onSave={handleSave} onCancel={handleCloseFormModal} isLoading={isSaving} errors={validationErrors} />
      </Modal>
      <ConfirmationModal isOpen={isConfirmModalOpen} onClose={handleCloseConfirmModal} onConfirm={handleConfirmDelete} title="Confirmar Exclusão" message="Tem certeza que deseja excluir esta OBM?" isLoading={isDeleting} />
    </div>
  );
}
